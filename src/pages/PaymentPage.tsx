import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId') || '';
  const seats = (searchParams.get('seats') || '').split(',').map(Number);
  const [processing, setProcessing] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bus } = useQuery({
    queryKey: ['bus', busId],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*').eq('id', busId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!busId,
  });

  const handlePayment = async () => {
    if (!bus || !user) return;
    setProcessing(true);

    try {
      const total = seats.length * bus.price;

      // 1. Create Razorpay order via edge function
      const { data: { session } } = await supabase.auth.getSession();
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`;
      const orderRes = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `bus_${bus.id}_${Date.now()}`,
          notes: { bus_id: bus.id, user_id: user.id, seats: seats.join(',') },
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData?.order_id) {
        throw new Error(orderData?.error || 'Failed to create order');
      }

      // 2. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Bus Booking',
        description: `${bus.route_from} → ${bus.route_to} | Seats: ${seats.join(', ')}`,
        order_id: orderData.order_id,
        prefill: {
          name: profile?.name || '',
          email: user.email || '',
          contact: profile?.phone || '',
        },
        theme: { color: '#f59e0b' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // 3. Verify payment & create booking via edge function
            const newAvailable = bus.available_seats.filter((s: number) => !seats.includes(s));
            const newBooked = [...bus.booked_seats, ...seats];

            const verifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-razorpay-payment`;
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const verifyRes = await fetch(verifyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentSession?.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_data: {
                  user_id: user.id,
                  bus_id: bus.id,
                  bus_name: bus.name,
                  route_from: bus.route_from,
                  route_to: bus.route_to,
                  date: bus.date,
                  departure_time: bus.departure_time,
                  arrival_time: bus.arrival_time,
                  seats,
                  total_amount: total,
                  new_available_seats: newAvailable,
                  new_booked_seats: newBooked,
                },
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData?.success) {
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            toast.success('Payment successful!');
            queryClient.invalidateQueries({ queryKey: ['buses'] });
            navigate(`/confirmation/${verifyData.booking.id}`);
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setProcessing(false);
        toast.error(response.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err: any) {
      setProcessing(false);
      toast.error(err.message || 'Something went wrong');
    }
  };

  if (!bus || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  const total = seats.length * bus.price;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="text-xl font-heading font-bold mb-6">Payment</h1>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="font-heading font-semibold text-sm mb-3">Pay with Razorpay</h2>
              <p className="text-sm text-muted-foreground">
                You'll be redirected to Razorpay's secure checkout to complete payment via UPI, cards, wallets, or net banking.
              </p>
            </div>
            <Button variant="amber" className="w-full" size="lg" onClick={handlePayment} disabled={processing}>
              {processing ? 'Processing...' : `Pay ₹${total}`}
            </Button>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 h-fit">
            <h3 className="font-heading font-semibold text-sm">Trip Summary</h3>
            <div className="text-sm space-y-1.5 text-muted-foreground">
              <p className="text-foreground font-medium">{bus.name}</p>
              <p>{bus.route_from} → {bus.route_to}</p>
              <p>{bus.date}</p>
              <p className="font-mono">{bus.departure_time} – {bus.arrival_time}</p>
              <p>Seats: <span className="font-mono text-foreground">{seats.join(', ')}</span></p>
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-foreground font-semibold">
                <span>Total</span>
                <span className="text-primary font-heading">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
