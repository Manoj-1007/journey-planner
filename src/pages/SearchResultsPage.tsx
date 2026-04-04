import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SeatMap from '@/components/SeatMap';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Bus, ArrowLeft, Star } from 'lucide-react';
import { toast } from 'sonner';

interface BusRow {
  id: string;
  name: string;
  operator_name: string;
  route_from: string;
  route_to: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  price: number;
  total_seats: number;
  available_seats: number[];
  booked_seats: number[];
  type: string;
  operator_id: string;
}

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['buses', from, to, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .ilike('route_from', from)
        .ilike('route_to', to)
        .eq('date', date);
      if (error) throw error;
      return (data || []) as BusRow[];
    },
    enabled: !!from && !!to && !!date,
  });

  // Realtime subscription
  useEffect(() => {
    if (!from || !to || !date) return;
    const channel = supabase
      .channel('buses-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'buses' }, (payload) => {
        const updated = payload.new as BusRow;
        queryClient.setQueryData(['buses', from, to, date], (old: BusRow[] | undefined) => {
          if (!old) return old;
          return old.map(bus => bus.id === updated.id ? { ...bus, ...updated } : bus);
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [from, to, date, queryClient]);

  const [expandedBus, setExpandedBus] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<string, number[]>>({});

  const toggleSeat = (busId: string, seat: number) => {
    const bus = results.find(b => b.id === busId);
    if (bus && bus.booked_seats.includes(seat)) {
      toast.error('This seat is already booked. Please select another seat.');
      return;
    }
    setSelectedSeats(prev => {
      const current = prev[busId] || [];
      if (current.includes(seat)) return { ...prev, [busId]: current.filter(s => s !== seat) };
      return { ...prev, [busId]: [...current, seat] };
    });
  };

  const handleBook = (bus: BusRow) => {
    if (!user) { navigate('/login'); return; }
    const seats = selectedSeats[bus.id] || [];
    if (seats.length === 0) return;
    const nowBooked = seats.filter(s => bus.booked_seats.includes(s));
    if (nowBooked.length > 0) {
      toast.error(`Seat(s) ${nowBooked.join(', ')} already booked. Please select different seats.`);
      setSelectedSeats(prev => ({ ...prev, [bus.id]: prev[bus.id]?.filter(s => !nowBooked.includes(s)) || [] }));
      return;
    }
    navigate(`/passenger-details?busId=${bus.id}&seats=${seats.join(',')}`);
  };

  const toBusProp = (bus: BusRow) => ({
    totalSeats: bus.total_seats,
    availableSeats: bus.available_seats,
    bookedSeats: bus.booked_seats,
    date: bus.date,
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <Header />
      <main className="container py-8 relative z-10">
        <div className="mb-6 animate-slide-up">
          <Button variant="ghost" size="sm" className="mb-3 gap-1.5" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-heading font-bold">
            {from} <span className="text-primary">→</span> {to}
          </h1>
          <p className="text-sm text-muted-foreground">{date} · {isLoading ? 'Searching...' : `${results.length} bus${results.length !== 1 ? 'es' : ''} found`}</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-xl p-5 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="skeleton h-5 w-40" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="skeleton h-4 w-28" />
                    <div className="skeleton h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="glass rounded-xl p-16 text-center animate-fade-in">
            <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No buses found for this route and date.</p>
            <Button variant="outline" onClick={() => navigate('/')}>Search Again</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((bus, i) => {
              const isExpanded = expandedBus === bus.id;
              const busSeats = selectedSeats[bus.id] || [];
              const validSeats = busSeats.filter(s => !bus.booked_seats.includes(s));
              if (validSeats.length !== busSeats.length) {
                setTimeout(() => setSelectedSeats(prev => ({ ...prev, [bus.id]: validSeats })), 0);
              }
              return (
                <div
                  key={bus.id}
                  className="glass rounded-xl overflow-hidden animate-slide-up hover:border-primary/30 transition-all duration-300"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <button
                    onClick={() => setExpandedBus(isExpanded ? null : bus.id)}
                    className="w-full p-5 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-heading font-semibold text-foreground">{bus.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full gradient-primary text-primary-foreground font-medium">{bus.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{bus.operator_name}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono">{bus.departure_time}</span>
                          <span className="text-primary mx-1">→</span>
                          <span className="font-mono">{bus.arrival_time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{bus.available_seats.length} seats</span>
                        </div>
                        <span className="font-heading font-bold gradient-text text-lg">₹{bus.price}</span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-5 animate-fade-in">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                        <SeatMap
                          busId={bus.id}
                          bus={toBusProp(bus)}
                          selectedSeats={validSeats}
                          onToggleSeat={(seat) => toggleSeat(bus.id, seat)}
                        />
                        <div className="glass rounded-xl p-5 space-y-3 h-fit">
                          <h3 className="font-heading font-semibold text-sm">Booking Summary</h3>
                          {validSeats.length > 0 ? (
                            <>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Seats</span>
                                  <span className="font-mono">{validSeats.join(', ')}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Price per seat</span>
                                  <span>₹{bus.price}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-2 mt-2">
                                  <span>Total</span>
                                  <span className="gradient-text font-heading">₹{validSeats.length * bus.price}</span>
                                </div>
                              </div>
                              <Button variant="amber" className="w-full" onClick={() => handleBook(bus)}>
                                {user ? 'Continue Booking' : 'Login to Book'}
                              </Button>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">Select seats to continue.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchResultsPage;
