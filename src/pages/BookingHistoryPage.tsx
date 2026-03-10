import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';

const BookingHistoryPage = () => {
  const currentUser = useStore(s => s.currentUser);
  const bookings = useStore(s => s.bookings);
  const cancelBooking = useStore(s => s.cancelBooking);
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const userBookings = bookings
    .filter(b => b.userId === currentUser.id)
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="text-xl font-heading font-bold mb-6">My Bookings</h1>

        {userBookings.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No bookings yet.</p>
            <Button variant="amber" onClick={() => navigate('/')}>Search Buses</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {userBookings.map(booking => (
              <div key={booking.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold">{booking.busName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        booking.status === 'confirmed'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.from} → {booking.to} · {booking.date}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {booking.departureTime} – {booking.arrivalTime} · Seats: {booking.seats.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-primary">₹{booking.totalAmount}</span>
                    {booking.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelBooking(booking.id)}
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
