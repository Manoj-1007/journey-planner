import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, UserPlus, ArrowLeft } from 'lucide-react';

export interface Passenger {
  name: string;
  age: string;
  gender: string;
}

export type TicketType = 'free' | 'half' | 'full';

export function getTicketType(age: number): TicketType {
  if (age < 5) return 'free';
  if (age < 10) return 'half';
  return 'full';
}

export function getTicketLabel(type: TicketType): string {
  if (type === 'free') return 'Free (Under 5)';
  if (type === 'half') return 'Half Ticket';
  return 'Full Ticket';
}

export function calculateFare(passengers: Passenger[], pricePerSeat: number) {
  let total = 0;
  const breakdown: { name: string; age: number; gender: string; type: TicketType; fare: number }[] = [];

  for (const p of passengers) {
    const age = parseInt(p.age, 10);
    if (isNaN(age) || age < 0) continue;
    const type = getTicketType(age);
    const fare = type === 'free' ? 0 : type === 'half' ? Math.round(pricePerSeat / 2) : pricePerSeat;
    total += fare;
    breakdown.push({ name: p.name, age, gender: p.gender || 'Other', type, fare });
  }

  return { total, breakdown };
}

const PassengerDetailsPage = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId') || '';
  const seats = (searchParams.get('seats') || '').split(',').map(Number);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [passengers, setPassengers] = useState<Passenger[]>(
    seats.map(() => ({ name: '', age: '', gender: '' }))
  );

  const { data: bus } = useQuery({
    queryKey: ['bus', busId],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*').eq('id', busId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!busId,
  });

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addPassenger = () => {
    if (passengers.length >= seats.length) {
      toast.error(`Maximum ${seats.length} passengers for ${seats.length} seat(s).`);
      return;
    }
    setPassengers(prev => [...prev, { name: '', age: '', gender: '' }]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setPassengers(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim()) {
        toast.error(`Please enter name for Passenger ${i + 1}`);
        return false;
      }
      const age = parseInt(p.age, 10);
      if (isNaN(age) || age < 0 || age > 150) {
        toast.error(`Please enter a valid age for Passenger ${i + 1}`);
        return false;
      }
      if (!p.gender) {
        toast.error(`Please select gender for Passenger ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleProceed = () => {
    if (!validate()) return;
    sessionStorage.setItem('passengerData', JSON.stringify(passengers));
    navigate(`/otp-verify?busId=${busId}&seats=${seats.join(',')}`);
  };

  if (!bus || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  const { total, breakdown } = calculateFare(passengers.filter(p => p.name && p.age), bus.price);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-40 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
      <Header />
      <main className="container max-w-3xl py-8 relative z-10">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-heading font-bold mb-6 animate-slide-up">Passenger Details</h1>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            {passengers.map((p, i) => (
              <div key={i} className="glass rounded-xl p-5 space-y-3 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-heading font-semibold text-foreground">
                    Passenger {i + 1} — Seat {seats[i]}
                  </span>
                  {passengers.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removePassenger(i)} className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input
                      placeholder="Enter name"
                      value={p.name}
                      onChange={e => updatePassenger(i, 'name', e.target.value)}
                      className="bg-input/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Age</Label>
                    <Input
                      type="number"
                      min={0}
                      max={150}
                      placeholder="Age"
                      value={p.age}
                      onChange={e => updatePassenger(i, 'age', e.target.value)}
                      className="bg-input/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Gender</Label>
                    <Select value={p.gender} onValueChange={v => updatePassenger(i, 'gender', v)}>
                      <SelectTrigger className="bg-input/50">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {p.age && !isNaN(parseInt(p.age)) && parseInt(p.age) >= 0 && (
                  <div className="text-xs">
                    <span className={`inline-flex px-2.5 py-1 rounded-full font-medium ${
                      getTicketType(parseInt(p.age)) === 'free'
                        ? 'bg-accent/20 text-accent'
                        : getTicketType(parseInt(p.age)) === 'half'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-foreground'
                    }`}>
                      {getTicketLabel(getTicketType(parseInt(p.age)))}
                      {getTicketType(parseInt(p.age)) !== 'free' && ` — ₹${getTicketType(parseInt(p.age)) === 'half' ? Math.round(bus.price / 2) : bus.price}`}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {passengers.length < seats.length && (
              <Button variant="outline" className="gap-2" onClick={addPassenger}>
                <Plus className="h-4 w-4" /> Add Passenger
              </Button>
            )}
          </div>

          {/* Fare Summary */}
          <div className="glass rounded-xl p-5 space-y-3 h-fit animate-fade-in">
            <h3 className="font-heading font-semibold text-sm">Fare Summary</h3>
            <div className="text-sm space-y-1.5 text-muted-foreground">
              <p className="text-foreground font-medium">{bus.name}</p>
              <p>{bus.route_from} → {bus.route_to}</p>
              <p>{bus.date}</p>
              <p className="font-mono text-xs">{bus.departure_time} – {bus.arrival_time}</p>

              {breakdown.length > 0 && (
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  {breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate mr-2">{b.name} ({b.gender}, {getTicketLabel(b.type)})</span>
                      <span className="font-mono whitespace-nowrap">₹{b.fare}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-2 mt-2 flex justify-between text-foreground font-semibold">
                <span>Total</span>
                <span className="gradient-text font-heading">₹{total}</span>
              </div>
            </div>

            <Button variant="amber" className="w-full" size="lg" onClick={handleProceed}>
              <UserPlus className="h-4 w-4 mr-2" /> Verify & Proceed
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PassengerDetailsPage;
