import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Printer } from 'lucide-react';

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

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
              <span className="font-mono font-semibold text-primary text-xs">{booking.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bus</span>
              <span>{booking.bus_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span>{booking.route_from} → {booking.route_to}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{booking.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-mono">{booking.departure_time} – {booking.arrival_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seats</span>
              <span className="font-mono">{booking.seats.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <span>{booking.payment_method}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2 font-semibold">
              <span>Total Paid</span>
              <span className="text-primary font-heading">₹{booking.total_amount}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => {
              const ticketHtml = `<html><head><title>Ticket-${booking.id.slice(0,8)}</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:480px;margin:auto}h1{font-size:1.25rem;margin-bottom:.5rem}.row{display:flex;justify-content:space-between;padding:.35rem 0;font-size:.875rem;border-bottom:1px solid #eee}.label{color:#888}.total{font-weight:700;border-top:2px solid #333;margin-top:.5rem;padding-top:.5rem}</style></head><body><h1>🎫 Bus Ticket</h1><p style="color:#888;font-size:.8rem">Ticket ID: ${booking.id.slice(0,8)}</p><div class="row"><span class="label">Bus</span><span>${booking.bus_name}</span></div><div class="row"><span class="label">Route</span><span>${booking.route_from} → ${booking.route_to}</span></div><div class="row"><span class="label">Date</span><span>${booking.date}</span></div><div class="row"><span class="label">Time</span><span>${booking.departure_time} – ${booking.arrival_time}</span></div><div class="row"><span class="label">Seats</span><span>${booking.seats.join(', ')}</span></div><div class="row"><span class="label">Payment</span><span>${booking.payment_method}</span></div><div class="row total"><span>Total Paid</span><span>₹${booking.total_amount}</span></div></body></html>`;
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              printWindow.document.write(ticketHtml);
              printWindow.document.close();
              printWindow.print();
            }} className="gap-1.5">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const ticketHtml = `<html><head><title>Ticket-${booking.id.slice(0,8)}</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:480px;margin:auto}h1{font-size:1.25rem;margin-bottom:.5rem}.row{display:flex;justify-content:space-between;padding:.35rem 0;font-size:.875rem;border-bottom:1px solid #eee}.label{color:#888}.total{font-weight:700;border-top:2px solid #333;margin-top:.5rem;padding-top:.5rem}</style></head><body><h1>🎫 Bus Ticket</h1><p style="color:#888;font-size:.8rem">Ticket ID: ${booking.id.slice(0,8)}</p><div class="row"><span class="label">Bus</span><span>${booking.bus_name}</span></div><div class="row"><span class="label">Route</span><span>${booking.route_from} → ${booking.route_to}</span></div><div class="row"><span class="label">Date</span><span>${booking.date}</span></div><div class="row"><span class="label">Time</span><span>${booking.departure_time} – ${booking.arrival_time}</span></div><div class="row"><span class="label">Seats</span><span>${booking.seats.join(', ')}</span></div><div class="row"><span class="label">Payment</span><span>${booking.payment_method}</span></div><div class="row total"><span>Total Paid</span><span>₹${booking.total_amount}</span></div></body></html>`;
              const blob = new Blob([ticketHtml], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Ticket-${booking.id.slice(0, 8)}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }} className="gap-1.5">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/bookings')}>View Bookings</Button>
            <Button variant="amber" className="flex-1" onClick={() => navigate('/')}>Book Another</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfirmationPage;
