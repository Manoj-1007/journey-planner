import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import SeatMap from '@/components/SeatMap';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Bus, ArrowLeft } from 'lucide-react';

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

  const [expandedBus, setExpandedBus] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<string, number[]>>({});

  const toggleSeat = (busId: string, seat: number) => {
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
    navigate(`/passenger-details?busId=${bus.id}&seats=${seats.join(',')}`);
  };

  const toBusProp = (bus: BusRow) => ({
    totalSeats: bus.total_seats,
    availableSeats: bus.available_seats,
    bookedSeats: bus.booked_seats,
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

        {!isLoading && results.length === 0 ? (
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
                          bus={toBusProp(bus)}
                          selectedSeats={busSeats}
                          onToggleSeat={(seat) => toggleSeat(bus.id, seat)}
                        />
                        <div className="glass rounded-xl p-5 space-y-3 h-fit">
                          <h3 className="font-heading font-semibold text-sm">Booking Summary</h3>
                          {busSeats.length > 0 ? (
                            <>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Seats</span>
                                  <span className="font-mono">{busSeats.join(', ')}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Price per seat</span>
                                  <span>₹{bus.price}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-2 mt-2">
                                  <span>Total</span>
                                  <span className="gradient-text font-heading">₹{busSeats.length * bus.price}</span>
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
    </div>
  );
};

export default SearchResultsPage;
