import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const BookingHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      if (error) throw error;

      // Restore seats
      const { data: bus } = await supabase.from('buses').select('available_seats, booked_seats').eq('id', booking.bus_id).single();
      if (bus) {
        await supabase.from('buses').update({
          available_seats: [...bus.available_seats, ...booking.seats].sort((a, b) => a - b),
          booked_seats: bus.booked_seats.filter((s: number) => !booking.seats.includes(s)),
        }).eq('id', booking.bus_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="text-xl font-heading font-bold mb-6">My Bookings</h1>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No bookings yet.</p>
            <Button variant="amber" onClick={() => navigate('/')}>Search Buses</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold">{booking.bus_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        booking.status === 'confirmed' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                      }`}>{booking.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{booking.route_from} → {booking.route_to} · {booking.date}</p>
                    <p className="text-xs text-muted-foreground font-mono">{booking.departure_time} – {booking.arrival_time} · Seats: {booking.seats.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-primary">₹{booking.total_amount}</span>
                    {booking.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingHistoryPage;
