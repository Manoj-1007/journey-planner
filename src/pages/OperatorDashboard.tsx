import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow'];
const BUS_TYPES = ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater'];

const OperatorDashboard = () => {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newBus, setNewBus] = useState({
    name: '', route_from: '', route_to: '', departure_time: '', arrival_time: '',
    date: '2026-03-15', price: 0, total_seats: 36, type: 'AC Seater',
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['operator-buses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*').eq('operator_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['operator-bookings', user?.id],
    queryFn: async () => {
      const busIds = buses.map(b => b.id);
      if (busIds.length === 0) return [];
      const { data, error } = await supabase.from('bookings').select('*').in('bus_id', busIds);
      if (error) throw error;
      return data;
    },
    enabled: buses.length > 0,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const seats = Array.from({ length: newBus.total_seats }, (_, i) => i + 1);
      const { error } = await supabase.from('buses').insert({
        ...newBus,
        operator_id: user!.id,
        operator_name: profile?.name || 'Operator',
        available_seats: seats,
        booked_seats: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator-buses'] });
      setShowAddForm(false);
      setNewBus({ name: '', route_from: '', route_to: '', departure_time: '', arrival_time: '', date: '2026-03-15', price: 0, total_seats: 36, type: 'AC Seater' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (busId: string) => {
      const { error } = await supabase.from('buses').delete().eq('id', busId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operator-buses'] }),
  });

  if (!user || role !== 'operator') { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-xl font-heading font-bold mb-6">Operator Dashboard</h1>
        <Tabs defaultValue="buses">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="buses" className="font-heading data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Manage Buses</TabsTrigger>
            <TabsTrigger value="reservations" className="font-heading data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reservations</TabsTrigger>
          </TabsList>

          <TabsContent value="buses" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{buses.length} bus{buses.length !== 1 ? 'es' : ''}</p>
              <Button variant="amber" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Bus
              </Button>
            </div>

            {showAddForm && (
              <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Bus Name</Label>
                    <Input value={newBus.name} onChange={e => setNewBus(p => ({ ...p, name: e.target.value }))} required className="bg-input" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={newBus.type} onValueChange={v => setNewBus(p => ({ ...p, type: v }))}>
                      <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
                      <SelectContent>{BUS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <Select value={newBus.route_from} onValueChange={v => setNewBus(p => ({ ...p, route_from: v }))}>
                      <SelectTrigger className="bg-input"><SelectValue placeholder="Origin" /></SelectTrigger>
                      <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Select value={newBus.route_to} onValueChange={v => setNewBus(p => ({ ...p, route_to: v }))}>
                      <SelectTrigger className="bg-input"><SelectValue placeholder="Destination" /></SelectTrigger>
                      <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Departure</Label>
                    <Input type="time" value={newBus.departure_time} onChange={e => setNewBus(p => ({ ...p, departure_time: e.target.value }))} required className="bg-input" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arrival</Label>
                    <Input type="time" value={newBus.arrival_time} onChange={e => setNewBus(p => ({ ...p, arrival_time: e.target.value }))} required className="bg-input" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={newBus.date} onChange={e => setNewBus(p => ({ ...p, date: e.target.value }))} required className="bg-input" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price (₹)</Label>
                    <Input type="number" value={newBus.price} onChange={e => setNewBus(p => ({ ...p, price: Number(e.target.value) }))} required className="bg-input" min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total Seats</Label>
                    <Input type="number" value={newBus.total_seats} onChange={e => setNewBus(p => ({ ...p, total_seats: Number(e.target.value) }))} required className="bg-input" min={10} max={60} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="amber" size="sm" disabled={addMutation.isPending}>
                    {addMutation.isPending ? 'Saving...' : 'Save Bus'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {buses.map(bus => (
              <div key={bus.id} className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold">{bus.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{bus.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{bus.route_from} → {bus.route_to} · {bus.date}</p>
                  <p className="text-xs text-muted-foreground font-mono">{bus.departure_time} – {bus.arrival_time} · ₹{bus.price} · {bus.available_seats.length}/{bus.total_seats} available</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(bus.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-8 text-center">No reservations yet.</p>
            ) : (
              bookings.map(booking => (
                <div key={booking.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary">{booking.id.slice(0, 8)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          booking.status === 'confirmed' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                        }`}>{booking.status}</span>
                      </div>
                      <p className="text-sm">{booking.bus_name} · {booking.route_from} → {booking.route_to}</p>
                      <p className="text-xs text-muted-foreground">Seats: {booking.seats.join(', ')} · ₹{booking.total_amount} · {booking.payment_method}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OperatorDashboard;
