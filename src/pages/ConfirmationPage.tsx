import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Printer, Bus, Calendar, MapPin, Users } from 'lucide-react';
import { type TicketType, getTicketLabel } from '@/pages/PassengerDetailsPage';

interface PassengerBreakdown {
  name: string;
  age: number;
  gender: string;
  type: TicketType;
  fare: number;
}

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState<PassengerBreakdown[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('bookingPassengers');
    if (stored) {
      setPassengers(JSON.parse(stored));
      sessionStorage.removeItem('bookingPassengers');
    }
  }, []);

  // Also load from DB if sessionStorage was cleared (e.g. page refresh)
  useEffect(() => {
    if (passengers.length === 0 && booking) {
      const details = (booking as any).passenger_details;
      if (Array.isArray(details) && details.length > 0) {
        setPassengers(details);
      }
    }
  }, [booking]);

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
        <main className="container py-16 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="skeleton h-20 w-20 rounded-full mx-auto" />
            <div className="skeleton h-6 w-48 mx-auto" />
            <div className="skeleton h-40 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!booking) { navigate('/'); return null; }

  const passengerRows = passengers.map(
    (p) => `<tr><td style="padding:6px 12px">${p.name}</td><td style="padding:6px 12px">${p.age}</td><td style="padding:6px 12px">${p.gender}</td><td style="padding:6px 12px">${getTicketLabel(p.type)}</td><td style="padding:6px 12px;text-align:right">₹${p.fare}</td></tr>`
  ).join('');

  const ticketHtml = `<html><head><title>MANO Ticket - ${booking.id.slice(0, 8)}</title>
<style>
  body{font-family:'Segoe UI',system-ui,sans-serif;padding:2rem;max-width:520px;margin:auto;color:#1a1a2e}
  .header{background:linear-gradient(135deg,#7c3aed,#0ea5e9);color:white;padding:1.5rem;border-radius:12px 12px 0 0;text-align:center}
  .header h1{margin:0;font-size:1.5rem}
  .header p{margin:4px 0 0;opacity:0.9;font-size:0.85rem}
  .body{border:2px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:1.5rem}
  .row{display:flex;justify-content:space-between;padding:8px 0;font-size:0.9rem;border-bottom:1px solid #f0f0f5}
  .row .label{color:#6b7280}
  .total{font-weight:700;border-top:2px solid #1a1a2e;border-bottom:none;margin-top:8px;padding-top:10px;font-size:1rem}
  table{width:100%;border-collapse:collapse;font-size:0.8rem;margin:8px 0}
  th{text-align:left;padding:6px 12px;background:#f5f3ff;color:#7c3aed;font-weight:600}
  td{border-bottom:1px solid #f0f0f5}
  .footer{text-align:center;margin-top:1rem;font-size:0.75rem;color:#9ca3af}
</style></head><body>
<div class="header"><h1>🚌 MANO Ticket</h1><p>Booking ID: ${booking.id.slice(0, 8)}</p></div>
<div class="body">
<div class="row"><span class="label">Bus</span><span>${booking.bus_name}</span></div>
<div class="row"><span class="label">Route</span><span>${booking.route_from} → ${booking.route_to}</span></div>
<div class="row"><span class="label">Date</span><span>${booking.date}</span></div>
<div class="row"><span class="label">Time</span><span>${booking.departure_time} – ${booking.arrival_time}</span></div>
<div class="row"><span class="label">Seats</span><span>${booking.seats.join(', ')}</span></div>
${passengerRows ? `<table><thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Type</th><th style="text-align:right">Fare</th></tr></thead><tbody>${passengerRows}</tbody></table>` : ''}
<div class="row"><span class="label">Payment</span><span>${booking.payment_method}</span></div>
<div class="row total"><span>Total Paid</span><span>₹${booking.total_amount}</span></div>
</div>
<p class="footer">Thank you for choosing MANO! Have a safe journey.</p>
</body></html>`;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[120px] pointer-events-none" />
      <Header />
      <main className="container max-w-md py-12 relative z-10">
        <div className="glass rounded-2xl p-8 text-center space-y-6 animate-slide-up">
          <div className="relative">
            <div className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center animate-fade-in">
              <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold mb-1">Payment Successful!</h1>
            <p className="text-sm text-muted-foreground">Your MANO ticket has been booked successfully.</p>
          </div>

          <div className="bg-background/50 border border-border rounded-xl p-5 text-left space-y-3 text-sm">
            <div className="flex items-center gap-2 text-xs text-primary font-heading font-semibold">
              <span>Booking ID:</span>
              <span className="font-mono">{booking.id.slice(0, 8)}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Bus className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{booking.bus_name}</p>
                  <p className="text-xs text-muted-foreground">{booking.route_from} → {booking.route_to}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{booking.date} · <span className="font-mono">{booking.departure_time} – {booking.arrival_time}</span></span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Seats: <span className="font-mono text-foreground">{booking.seats.join(', ')}</span></span>
              </div>
            </div>

            {passengers.length > 0 && (
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-heading font-semibold">Passengers</span>
                </div>
                {passengers.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs py-1">
                    <span className="text-muted-foreground">{p.name} ({p.gender}, Age {p.age})</span>
                    <span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full mr-1.5 text-[10px] font-medium ${
                        p.type === 'free' ? 'bg-accent/20 text-accent'
                        : p.type === 'half' ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-foreground'
                      }`}>{getTicketLabel(p.type)}</span>
                      ₹{p.fare}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between border-t border-border pt-3 mt-3 font-semibold text-base">
              <span>Total Paid</span>
              <span className="gradient-text font-heading">₹{booking.total_amount}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              printWindow.document.write(ticketHtml);
              printWindow.document.close();
              printWindow.print();
            }}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="amber" size="sm" className="flex-1 gap-1.5" onClick={() => {
              const blob = new Blob([ticketHtml], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `MANO-Ticket-${booking.id.slice(0, 8)}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/bookings')}>View Bookings</Button>
            <Button variant="amber" className="flex-1" onClick={() => navigate('/')}>Book Another</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConfirmationPage;
