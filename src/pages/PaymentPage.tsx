import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { type Passenger, calculateFare, getTicketLabel } from '@/pages/PassengerDetailsPage';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = 'rzp_test_SQFrMtY8e9LTOh';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId') || '';
  const seats = (searchParams.get('seats') || '').split(',').map(Number);
  const [processing, setProcessing] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Payment method: 'razorpay' or 'card'
  const [method, setMethod] = useState<'razorpay' | 'card'>('razorpay');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Get passenger data
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  useEffect(() => {
    const otpVerified = sessionStorage.getItem('otpVerified');
    if (otpVerified !== 'true') {
      toast.error('Please complete OTP verification first');
      navigate(`/otp-verify?busId=${busId}&seats=${seats.join(',')}`);
      return;
    }
    const stored = sessionStorage.getItem('passengerData');
    if (stored) {
      setPassengers(JSON.parse(stored));
    }
  }, []);

  const { data: bus } = useQuery({
    queryKey: ['bus', busId],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*').eq('id', busId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!busId,
  });

  const total = bus ? calculateFare(passengers, bus.price).total : 0;
  const breakdown = bus ? calculateFare(passengers, bus.price).breakdown : [];

  const validateCard = (): boolean => {
    const num = cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(num)) {
      toast.error('Card number must be 16 digits');
      return false;
    }
    if (!/^\d{3}$/.test(cardCvv)) {
      toast.error('CVV must be 3 digits');
      return false;
    }
    // Validate expiry MM/YY
    const match = cardExpiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) {
      toast.error('Expiry must be in MM/YY format');
      return false;
    }
    const month = parseInt(match[1]);
    const year = parseInt('20' + match[2]);
    if (month < 1 || month > 12) {
      toast.error('Invalid expiry month');
      return false;
    }
    const now = new Date();
    const expDate = new Date(year, month);
    if (expDate <= now) {
      toast.error('Card has expired');
      return false;
    }
    return true;
  };

  const saveBooking = async (paymentRef: string) => {
    if (!bus || !user) return;
    const newAvailable = bus.available_seats.filter((s: number) => !seats.includes(s));
    const newBooked = [...bus.booked_seats, ...seats];

    const { data: booking, error: bookError } = await supabase.from('bookings').insert({
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
      payment_method: paymentRef,
    }).select().single();

    if (bookError) throw bookError;

    const { error: busError } = await supabase.from('buses')
      .update({ available_seats: newAvailable, booked_seats: newBooked })
      .eq('id', bus.id);

    if (busError) throw busError;

    // Store passenger info for confirmation page
    sessionStorage.setItem('bookingPassengers', JSON.stringify(breakdown));
    sessionStorage.removeItem('otpVerified');
    sessionStorage.removeItem('passengerData');

    toast.success('Payment Successful – Ticket Booked!');
    queryClient.invalidateQueries({ queryKey: ['buses'] });
    navigate(`/confirmation/${booking.id}`);
  };

  const handleCardPayment = async () => {
    if (!validateCard()) return;
    setProcessing(true);
    try {
      // Simulate successful card payment
      await new Promise(res => setTimeout(res, 1200));
      const cardRef = `Card (****${cardNumber.replace(/\s/g, '').slice(-4)})`;
      await saveBooking(cardRef);
    } catch (err: any) {
      toast.error(err.message || 'Booking save failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!bus || !user) return;
    setProcessing(true);

    try {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: 'INR',
        name: 'Bus Ticket Booking',
        description: `${bus.route_from} → ${bus.route_to} | Seats: ${seats.join(', ')}`,
        prefill: {
          name: profile?.name || '',
          email: user.email || '',
          contact: profile?.phone || '',
        },
        theme: { color: '#f59e0b' },
        handler: async (response: { razorpay_payment_id: string }) => {
          try {
            await saveBooking(`Razorpay (${response.razorpay_payment_id})`);
          } catch (err: any) {
            toast.error(err.message || 'Booking save failed');
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-8">
        <h1 className="text-xl font-heading font-bold mb-6">Payment</h1>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            {/* Method Selector */}
            <div className="flex gap-2">
              <Button
                variant={method === 'razorpay' ? 'amber' : 'outline'}
                size="sm"
                onClick={() => setMethod('razorpay')}
              >
                Razorpay (UPI/Wallets)
              </Button>
              <Button
                variant={method === 'card' ? 'amber' : 'outline'}
                size="sm"
                onClick={() => setMethod('card')}
                className="gap-1.5"
              >
                <CreditCard className="h-3.5 w-3.5" /> Card
              </Button>
            </div>

            {method === 'razorpay' && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to Razorpay's secure checkout for UPI, cards, wallets, or net banking.
                </p>
                <Button variant="amber" className="w-full" size="lg" onClick={handleRazorpayPayment} disabled={processing}>
                  {processing ? 'Processing...' : `Pay ₹${total}`}
                </Button>
              </div>
            )}

            {method === 'card' && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Card Number</Label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={cardNumber}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                      setCardNumber(v.replace(/(\d{4})(?=\d)/g, '$1 '));
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expiry (MM/YY)</Label>
                    <Input
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                        setCardExpiry(v);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CVV</Label>
                    <Input
                      type="password"
                      placeholder="•••"
                      maxLength={3}
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    />
                  </div>
                </div>
                <Button variant="amber" className="w-full" size="lg" onClick={handleCardPayment} disabled={processing}>
                  {processing ? 'Processing...' : `Pay ₹${total}`}
                </Button>
              </div>
            )}
          </div>

          {/* Trip Summary */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 h-fit">
            <h3 className="font-heading font-semibold text-sm">Trip Summary</h3>
            <div className="text-sm space-y-1.5 text-muted-foreground">
              <p className="text-foreground font-medium">{bus.name}</p>
              <p>{bus.route_from} → {bus.route_to}</p>
              <p>{bus.date}</p>
              <p className="font-mono text-xs">{bus.departure_time} – {bus.arrival_time}</p>
              <p>Seats: <span className="font-mono text-foreground">{seats.join(', ')}</span></p>

              {breakdown.length > 0 && (
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  {breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate mr-2">{b.name} ({getTicketLabel(b.type)})</span>
                      <span className="font-mono">₹{b.fare}</span>
                    </div>
                  ))}
                </div>
              )}

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
