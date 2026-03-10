import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId') || '';
  const seats = (searchParams.get('seats') || '').split(',').map(Number);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const { user } = useAuth();
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

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!bus || !user) throw new Error('Missing data');
      const pmLabel = paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'credit' ? 'Credit Card' : 'Debit Card';

      // Insert booking
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
        total_amount: seats.length * bus.price,
        payment_method: pmLabel,
      }).select().single();
      if (bookError) throw bookError;

      // Update bus seats
      const newAvailable = bus.available_seats.filter((s: number) => !seats.includes(s));
      const newBooked = [...bus.booked_seats, ...seats];
      const { error: busError } = await supabase.from('buses')
        .update({ available_seats: newAvailable, booked_seats: newBooked })
        .eq('id', bus.id);
      if (busError) throw busError;

      return booking;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      navigate(`/confirmation/${booking.id}`);
    },
  });

  if (!bus || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  const total = seats.length * bus.price;
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
            <Button variant="amber" className="w-full" size="lg" onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}>
              {bookMutation.isPending ? 'Processing Payment...' : `Pay ₹${total}`}
            </Button>
            {bookMutation.isError && <p className="text-destructive text-sm">{(bookMutation.error as Error).message}</p>}
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
