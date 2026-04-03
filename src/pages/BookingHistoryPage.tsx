import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bus, Calendar, MapPin, Ticket, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const BookingHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

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
      toast.success('Booking cancelled. Seats are now available again.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to cancel'),
  });

  if (!user) { navigate('/login'); return null; }

  const filtered = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch = !searchTerm || b.bus_name.toLowerCase().includes(searchTerm.toLowerCase()) || b.route_from.toLowerCase().includes(searchTerm.toLowerCase()) || b.route_to.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-20 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <Header />
      <main className="container max-w-2xl py-8 relative z-10">
        <h1 className="text-2xl font-heading font-bold mb-6 animate-slide-up">My Bookings</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search bookings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-input/50" />
          </div>
          <div className="flex gap-2">
            {(['all', 'confirmed', 'cancelled'] as const).map(f => (
              <Button key={f} variant={filter === f ? 'amber' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
                {f}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center animate-fade-in">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{bookings.length === 0 ? 'No bookings yet.' : 'No matching bookings found.'}</p>
            <Button variant="amber" onClick={() => navigate('/')}>Search Buses</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking, i) => (
              <div key={booking.id} className="glass rounded-xl p-5 animate-slide-up hover:border-primary/30 transition-all duration-300" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-primary" />
                      <span className="font-heading font-semibold">{booking.bus_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        booking.status === 'confirmed' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                      }`}>{booking.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{booking.route_from} → {booking.route_to}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{booking.date} · {booking.departure_time} – {booking.arrival_time} · Seats: {booking.seats.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold gradient-text text-lg">₹{booking.total_amount}</span>
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
      <Footer />
    </div>
  );
};

export default BookingHistoryPage;
