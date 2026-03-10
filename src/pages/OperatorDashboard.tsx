import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useStore, Bus, CITIES_LIST } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const OperatorDashboard = () => {
  const currentUser = useStore(s => s.currentUser);
  const buses = useStore(s => s.buses);
  const bookings = useStore(s => s.bookings);
  const addBus = useStore(s => s.addBus);
  const deleteBus = useStore(s => s.deleteBus);
  const navigate = useNavigate();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newBus, setNewBus] = useState({
    name: '', from: '', to: '', departureTime: '', arrivalTime: '',
    date: '2026-03-15', price: 0, totalSeats: 36,
    type: 'AC Seater' as Bus['type'],
  });

  if (!currentUser || currentUser.role !== 'operator') {
    navigate('/login');
    return null;
  }

  const handleAddBus = (e: React.FormEvent) => {
    e.preventDefault();
    const seats = Array.from({ length: newBus.totalSeats }, (_, i) => i + 1);
    addBus({
      ...newBus,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      availableSeats: seats,
      bookedSeats: [],
    });
    setShowAddForm(false);
    setNewBus({ name: '', from: '', to: '', departureTime: '', arrivalTime: '', date: '2026-03-15', price: 0, totalSeats: 36, type: 'AC Seater' });
  };

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
              <p className="text-sm text-muted-foreground">{operatorBuses.length} bus{operatorBuses.length !== 1 ? 'es' : ''}</p>
              <Button variant="amber" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Bus
              </Button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddBus} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Bus Name</Label>
                    <Input value={newBus.name} onChange={e => setNewBus(p => ({ ...p, name: e.target.value }))} required className="bg-input" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={newBus.type} onValueChange={v => setNewBus(p => ({ ...p, type: v as Bus['type'] }))}>
                      <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <Select value={newBus.from} onValueChange={v => setNewBus(p => ({ ...p, from: v }))}>
                      <SelectTrigger className="bg-input"><SelectValue placeholder="Origin" /></SelectTrigger>
                      <SelectContent>
                        {CITIES_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Select value={newBus.to} onValueChange={v => setNewBus(p => ({ ...p, to: v }))}>
                      <SelectTrigger className="bg-input"><SelectValue placeholder="Destination" /></SelectTrigger>
                      <SelectContent>
                        {CITIES_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Departure</Label>
                    <Input type="time" value={newBus.departureTime} onChange={e => setNewBus(p => ({ ...p, departureTime: e.target.value }))} required className="bg-input" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arrival</Label>
                    <Input type="time" value={newBus.arrivalTime} onChange={e => setNewBus(p => ({ ...p, arrivalTime: e.target.value }))} required className="bg-input" />
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
                    <Input type="number" value={newBus.totalSeats} onChange={e => setNewBus(p => ({ ...p, totalSeats: Number(e.target.value) }))} required className="bg-input" min={10} max={60} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="amber" size="sm">Save Bus</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {operatorBuses.map(bus => (
              <div key={bus.id} className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold">{bus.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{bus.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{bus.from} → {bus.to} · {bus.date}</p>
                  <p className="text-xs text-muted-foreground font-mono">{bus.departureTime} – {bus.arrivalTime} · ₹{bus.price} · {bus.availableSeats.length}/{bus.totalSeats} available</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteBus(bus.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-3">
            {operatorBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-8 text-center">No reservations yet.</p>
            ) : (
              operatorBookings.map(booking => (
                <div key={booking.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary">{booking.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          booking.status === 'confirmed' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                        }`}>{booking.status}</span>
                      </div>
                      <p className="text-sm">{booking.busName} · {booking.from} → {booking.to}</p>
                      <p className="text-xs text-muted-foreground">Seats: {booking.seats.join(', ')} · ₹{booking.totalAmount} · {booking.paymentMethod}</p>
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
