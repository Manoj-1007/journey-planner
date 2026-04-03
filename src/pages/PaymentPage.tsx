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
import { CreditCard, Smartphone, ArrowLeft, Loader2 } from 'lucide-react';
import { type Passenger, calculateFare, getTicketLabel } from '@/pages/PassengerDetailsPage';

declare global {
  interface Window { Razorpay: any; }
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

  const [method, setMethod] = useState<'razorpay' | 'card' | 'upi'>('razorpay');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  useEffect(() => {
    const otpVerified = sessionStorage.getItem('otpVerified');
    if (otpVerified !== 'true') {
      toast.error('Please complete OTP verification first');
      navigate(`/otp-verify?busId=${busId}&seats=${seats.join(',')}`);
      return;
    }
    const stored = sessionStorage.getItem('passengerData');
    if (stored) setPassengers(JSON.parse(stored));
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
    if (!/^\d{16}$/.test(num)) { toast.error('Card number must be 16 digits'); return false; }
    if (!cardName.trim()) { toast.error('Please enter cardholder name'); return false; }
    if (!/^\d{3}$/.test(cardCvv)) { toast.error('CVV must be 3 digits'); return false; }
    const match = cardExpiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) { toast.error('Expiry must be in MM/YY format'); return false; }
    const month = parseInt(match[1]);
    const year = parseInt('20' + match[2]);
    if (month < 1 || month > 12) { toast.error('Invalid expiry month'); return false; }
    const now = new Date();
    if (new Date(year, month) <= now) { toast.error('Card has expired'); return false; }
    return true;
  };

  const saveBooking = async (paymentRef: string) => {
    if (!bus || !user) return;

    // Re-fetch latest bus data to prevent double booking
    const { data: latestBus, error: fetchErr } = await supabase
      .from('buses').select('available_seats, booked_seats').eq('id', bus.id).single();
    if (fetchErr) throw fetchErr;

    const alreadyBooked = seats.filter(s => latestBus.booked_seats.includes(s));
    if (alreadyBooked.length > 0) {
      throw new Error(`Seat(s) ${alreadyBooked.join(', ')} already booked. Please select different seats.`);
    }

    const newAvailable = latestBus.available_seats.filter((s: number) => !seats.includes(s));
    const newBooked = [...latestBus.booked_seats, ...seats];

    const { data: booking, error: bookError } = await supabase.from('bookings').insert({
      user_id: user.id, bus_id: bus.id, bus_name: bus.name,
      route_from: bus.route_from, route_to: bus.route_to, date: bus.date,
      departure_time: bus.departure_time, arrival_time: bus.arrival_time,
      seats, total_amount: total, payment_method: paymentRef,
    }).select().single();
    if (bookError) throw bookError;

    const { error: busError } = await supabase.from('buses')
      .update({ available_seats: newAvailable, booked_seats: newBooked })
      .eq('id', bus.id);
    if (busError) throw busError;

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
      await new Promise(res => setTimeout(res, 1500));
      await saveBooking(`Card (****${cardNumber.replace(/\s/g, '').slice(-4)})`);
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally { setProcessing(false); }
  };

  const handleUpiPayment = async () => {
    setProcessing(true);
    try {
      await new Promise(res => setTimeout(res, 2000));
      await saveBooking('UPI Payment');
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally { setProcessing(false); }
  };

  const handleRazorpayPayment = async () => {
    if (!bus || !user) return;
    setProcessing(true);
    try {
      const options = {
        key: RAZORPAY_KEY_ID, amount: total * 100, currency: 'INR',
        name: 'BusGo', description: `${bus.route_from} → ${bus.route_to} | Seats: ${seats.join(', ')}`,
        prefill: { name: profile?.name || '', email: user.email || '', contact: profile?.phone || '' },
        theme: { color: '#7c3aed' },
        handler: async (response: { razorpay_payment_id: string }) => {
          try { await saveBooking(`Razorpay (${response.razorpay_payment_id})`); }
          catch (err: any) { toast.error(err.message || 'Booking failed'); }
          finally { setProcessing(false); }
        },
        modal: { ondismiss: () => { setProcessing(false); toast.info('Payment cancelled'); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => { setProcessing(false); toast.error(response.error?.description || 'Payment failed'); });
      rzp.open();
    } catch (err: any) { setProcessing(false); toast.error(err.message || 'Something went wrong'); }
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <Header />
      <main className="container max-w-3xl py-8 relative z-10">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-heading font-bold mb-6 animate-slide-up">Payment</h1>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4 animate-slide-up">
            {/* Method Selector */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'razorpay' as const, label: 'Razorpay', icon: null },
                { key: 'card' as const, label: 'Card', icon: CreditCard },
                { key: 'upi' as const, label: 'UPI', icon: Smartphone },
              ].map(m => (
                <Button
                  key={m.key}
                  variant={method === m.key ? 'amber' : 'outline'}
                  size="sm"
                  onClick={() => setMethod(m.key)}
                  className="gap-1.5"
                >
                  {m.icon && <m.icon className="h-3.5 w-3.5" />}
                  {m.label}
                </Button>
              ))}
            </div>

            {method === 'razorpay' && (
              <div className="glass rounded-xl p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Secure checkout via Razorpay — supports UPI, cards, wallets, and net banking.
                </p>
                <Button variant="amber" className="w-full" size="lg" onClick={handleRazorpayPayment} disabled={processing}>
                  {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Pay ₹${total}`}
                </Button>
              </div>
            )}

            {method === 'card' && (
              <div className="glass rounded-xl p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Card Number</Label>
                  <Input placeholder="1234 5678 9012 3456" maxLength={19} value={cardNumber} className="bg-input/50 h-12"
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 16); setCardNumber(v.replace(/(\d{4})(?=\d)/g, '$1 ')); }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cardholder Name</Label>
                  <Input placeholder="John Doe" value={cardName} onChange={e => setCardName(e.target.value)} className="bg-input/50 h-12" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Expiry</Label>
                    <Input placeholder="MM/YY" maxLength={5} value={cardExpiry} className="bg-input/50 h-12"
                      onChange={e => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); setCardExpiry(v); }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">CVV</Label>
                    <Input type="password" placeholder="•••" maxLength={3} value={cardCvv} className="bg-input/50 h-12"
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} />
                  </div>
                </div>
                <Button variant="amber" className="w-full" size="lg" onClick={handleCardPayment} disabled={processing}>
                  {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Pay ₹${total}`}
                </Button>
              </div>
            )}

            {method === 'upi' && (
              <div className="glass rounded-xl p-6 space-y-4 text-center">
                <p className="text-sm text-muted-foreground">Scan the QR code below to pay via UPI</p>
                {/* Simulated QR code */}
                <div className="mx-auto w-48 h-48 bg-white rounded-xl p-3 flex items-center justify-center">
                  <div className="w-full h-full border-2 border-black rounded-lg flex flex-col items-center justify-center gap-2">
                    <div className="grid grid-cols-5 gap-0.5">
                      {Array.from({ length: 25 }, (_, i) => (
                        <div key={i} className={`w-3 h-3 ${Math.random() > 0.4 ? 'bg-black' : 'bg-white'}`} />
                      ))}
                    </div>
                    <span className="text-black text-xs font-bold">₹{total}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Or click below to simulate UPI payment</p>
                <Button variant="amber" className="w-full" size="lg" onClick={handleUpiPayment} disabled={processing}>
                  {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Pay ₹${total} via UPI`}
                </Button>
              </div>
            )}
          </div>

          {/* Trip Summary */}
          <div className="glass rounded-xl p-5 space-y-3 h-fit animate-fade-in">
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
                <span className="gradient-text font-heading">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
