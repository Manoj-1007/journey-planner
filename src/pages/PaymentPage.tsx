import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId') || '';
  const seats = (searchParams.get('seats') || '').split(',').map(Number);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  const buses = useStore(s => s.buses);
  const currentUser = useStore(s => s.currentUser);
  const bookTicket = useStore(s => s.bookTicket);
  const navigate = useNavigate();

  const bus = buses.find(b => b.id === busId);

  if (!bus || !currentUser) {
    navigate('/');
    return null;
  }

  const total = seats.length * bus.price;

  const handlePay = () => {
    setProcessing(true);
    // Simulate payment delay
    setTimeout(() => {
      const booking = bookTicket({
        userId: currentUser.id,
        busId: bus.id,
        busName: bus.name,
        from: bus.from,
        to: bus.to,
        date: bus.date,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        seats,
        totalAmount: total,
        paymentMethod: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'credit' ? 'Credit Card' : 'Debit Card',
      });
      navigate(`/confirmation/${booking.id}`);
    }, 1500);
  };

  const methods = [
    { value: 'upi', label: 'UPI' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'debit', label: 'Debit Card' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="text-xl font-heading font-bold mb-6">Payment</h1>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="font-heading font-semibold text-sm mb-3">Select Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                {methods.map(m => (
                  <div key={m.value} className="flex items-center space-x-3 bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={m.value} id={m.value} />
                    <Label htmlFor={m.value} className="cursor-pointer">{m.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button
              variant="amber"
              className="w-full"
              size="lg"
              onClick={handlePay}
              disabled={processing}
            >
              {processing ? 'Processing Payment...' : `Pay ₹${total}`}
            </Button>
          </div>

          {/* Summary */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 h-fit">
            <h3 className="font-heading font-semibold text-sm">Trip Summary</h3>
            <div className="text-sm space-y-1.5 text-muted-foreground">
              <p className="text-foreground font-medium">{bus.name}</p>
              <p>{bus.from} → {bus.to}</p>
              <p>{bus.date}</p>
              <p className="font-mono">{bus.departureTime} – {bus.arrivalTime}</p>
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
