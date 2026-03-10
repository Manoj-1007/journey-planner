import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const bookings = useStore(s => s.bookings);
  const navigate = useNavigate();

  const booking = bookings.find(b => b.id === bookingId);

  if (!booking) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-md py-16">
        <div className="bg-card border border-border rounded-lg p-8 text-center space-y-6">
          <CheckCircle2 className="h-16 w-16 text-accent mx-auto" />
          <div>
            <h1 className="text-2xl font-heading font-bold mb-1">Booking Confirmed</h1>
            <p className="text-sm text-muted-foreground">Your ticket has been booked successfully.</p>
          </div>

          <div className="bg-background border border-border rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket ID</span>
              <span className="font-mono font-semibold text-primary">{booking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bus</span>
              <span>{booking.busName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span>{booking.from} → {booking.to}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{booking.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-mono">{booking.departureTime} – {booking.arrivalTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seats</span>
              <span className="font-mono">{booking.seats.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <span>{booking.paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2 font-semibold">
              <span>Total Paid</span>
              <span className="text-primary font-heading">₹{booking.totalAmount}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/bookings')}>
              View Bookings
            </Button>
            <Button variant="amber" className="flex-1" onClick={() => navigate('/')}>
              Book Another
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfirmationPage;
