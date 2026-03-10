import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SeatMap from '@/components/SeatMap';
import { useStore, Bus } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Clock, MapPin } from 'lucide-react';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const searchBuses = useStore(s => s.searchBuses);
  const currentUser = useStore(s => s.currentUser);
  const navigate = useNavigate();

  const results = searchBuses(from, to, date);
  const [expandedBus, setExpandedBus] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<string, number[]>>({});

  const toggleSeat = (busId: string, seat: number) => {
    setSelectedSeats(prev => {
      const current = prev[busId] || [];
      if (current.includes(seat)) return { ...prev, [busId]: current.filter(s => s !== seat) };
      return { ...prev, [busId]: [...current, seat] };
    });
  };

  const handleBook = (bus: Bus) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const seats = selectedSeats[bus.id] || [];
    if (seats.length === 0) return;
    navigate(`/payment?busId=${bus.id}&seats=${seats.join(',')}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-xl font-heading font-bold">
            {from} → {to}
          </h1>
          <p className="text-sm text-muted-foreground">{date} · {results.length} bus{results.length !== 1 ? 'es' : ''} found</p>
        </div>

        {results.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">No buses found for this route and date.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>Search Again</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(bus => {
              const isExpanded = expandedBus === bus.id;
              const busSeats = selectedSeats[bus.id] || [];
              return (
                <div key={bus.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Bus card header */}
                  <button
                    onClick={() => setExpandedBus(isExpanded ? null : bus.id)}
                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-heading font-semibold text-foreground">{bus.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{bus.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{bus.operatorName}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono">{bus.departureTime}</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="font-mono">{bus.arrivalTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{bus.availableSeats.length} seats</span>
                        </div>
                        <span className="font-heading font-bold text-primary text-lg">₹{bus.price}</span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded: seat map */}
                  {isExpanded && (
                    <div className="border-t border-border p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                        <SeatMap
                          bus={bus}
                          selectedSeats={busSeats}
                          onToggleSeat={(seat) => toggleSeat(bus.id, seat)}
                        />
                        {/* Summary panel */}
                        <div className="bg-background border border-border rounded-lg p-4 space-y-3 h-fit">
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
                                  <span className="text-primary font-heading">₹{busSeats.length * bus.price}</span>
                                </div>
                              </div>
                              <Button variant="amber" className="w-full" onClick={() => handleBook(bus)}>
                                {currentUser ? 'Proceed to Pay' : 'Login to Book'}
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
