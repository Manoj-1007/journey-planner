import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SeatMapProps {
  busId: string;
  bus: {
    totalSeats: number;
    availableSeats: number[];
    bookedSeats: number[];
    date: string;
  };
  selectedSeats: number[];
  onToggleSeat: (seat: number) => void;
}

const SeatMap = ({ busId, bus, selectedSeats, onToggleSeat }: SeatMapProps) => {
  const rows = Math.ceil(bus.totalSeats / 4);
  const { user } = useAuth();
  const [lockedSeats, setLockedSeats] = useState<Record<number, string>>({});
  const [bookedSeats24h, setBookedSeats24h] = useState<number[]>([]);

  // Fetch 24-hour booked seats from database
  useEffect(() => {
    if (!busId || !bus.date) return;

    const fetchBookedSeats = async () => {
      const { data, error } = await supabase.rpc('get_booked_seats_24h', {
        _bus_id: busId,
        _date: bus.date,
      });
      if (!error && data) {
        setBookedSeats24h(data as number[]);
      }
    };

    fetchBookedSeats();

    // Re-fetch when bookings change
    const channel = supabase
      .channel(`bookings-${busId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
        fetchBookedSeats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [busId, bus.date]);

  // Fetch seat locks and subscribe to realtime changes
  useEffect(() => {
    if (!busId) return;

    const fetchLocks = async () => {
      const { data } = await supabase
        .from('seat_locks')
        .select('seat_number, locked_by, expires_at')
        .eq('bus_id', busId);
      if (data) {
        const now = new Date();
        const active: Record<number, string> = {};
        data.forEach(lock => {
          if (new Date(lock.expires_at) > now) {
            active[lock.seat_number] = lock.locked_by;
          }
        });
        setLockedSeats(active);
      }
    };

    fetchLocks();

    const channel = supabase
      .channel(`seat-locks-${busId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_locks', filter: `bus_id=eq.${busId}` }, () => {
        fetchLocks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [busId]);

  // Combine booked seats from bus data AND 24-hour bookings
  const allBookedSeats = Array.from(new Set([...bus.bookedSeats, ...bookedSeats24h]));

  const handleSeatClick = async (seatNum: number) => {
    if (!user) return;

    // Double-check against 24h booked seats
    if (allBookedSeats.includes(seatNum)) {
      toast.error('This seat is already booked. Please select another seat.');
      return;
    }

    const isSelected = selectedSeats.includes(seatNum);

    if (isSelected) {
      await supabase.from('seat_locks').delete().eq('bus_id', busId).eq('seat_number', seatNum).eq('locked_by', user.id);
      onToggleSeat(seatNum);
      return;
    }

    // Check if locked by someone else
    const lockedBy = lockedSeats[seatNum];
    if (lockedBy && lockedBy !== user.id) {
      toast.error('This seat is temporarily reserved by another user. Please select another seat.');
      return;
    }

    // Try to lock
    const { error } = await supabase.from('seat_locks').upsert({
      bus_id: busId,
      seat_number: seatNum,
      locked_by: user.id,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }, { onConflict: 'bus_id,seat_number' });

    if (error) {
      toast.error('This seat is temporarily reserved. Please select another seat.');
      return;
    }

    onToggleSeat(seatNum);
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md" style={{ background: 'hsl(145, 70%, 42%)' }} />
          <span style={{ color: 'hsl(145, 70%, 42%)' }}>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md" style={{ background: 'hsl(217, 91%, 60%)' }} />
          <span style={{ color: 'hsl(217, 91%, 60%)' }}>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-destructive/80 rounded-md flex items-center justify-center text-destructive-foreground font-mono text-[10px]">✕</div>
          <span className="text-destructive">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md" style={{ background: 'hsl(45, 93%, 47%)' }} />
          <span style={{ color: 'hsl(45, 93%, 47%)' }}>Reserved</span>
        </div>
      </div>

      <div className="glass rounded-xl p-5 max-w-xs mx-auto">
        {/* Driver */}
        <div className="flex justify-end mb-4 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center text-xs text-muted-foreground font-heading">D</div>
        </div>

        {/* Seats */}
        <div className="space-y-2">
          {Array.from({ length: rows }, (_, row) => {
            const seatsInRow = [row * 4 + 1, row * 4 + 2, row * 4 + 3, row * 4 + 4].filter(s => s <= bus.totalSeats);
            return (
              <div key={row} className="flex justify-center gap-2">
                {seatsInRow.map((seatNum, idx) => {
                  const isBooked = allBookedSeats.includes(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);
                  const isAvailable = bus.availableSeats.includes(seatNum) && !isBooked;
                  const lockedBy = lockedSeats[seatNum];
                  const isLockedByOther = !!(lockedBy && user && lockedBy !== user.id);
                  const isDisabled = isBooked || isLockedByOther;

                  return (
                    <div key={seatNum} className="contents">
                      <button
                        disabled={isDisabled}
                        onClick={() => isAvailable && !isLockedByOther && handleSeatClick(seatNum)}
                        className={`w-9 h-9 rounded-md font-mono text-xs transition-all duration-200 flex items-center justify-center font-medium
                          ${isBooked ? 'bg-destructive/80 text-destructive-foreground cursor-not-allowed' : ''}
                          ${isSelected ? 'text-white shadow-lg shadow-blue-500/30' : ''}
                          ${isLockedByOther ? 'cursor-not-allowed opacity-80 text-white' : ''}
                          ${isAvailable && !isSelected && !isLockedByOther ? 'text-white cursor-pointer hover:shadow-[0_0_12px_hsl(145,70%,42%,0.4)]' : ''}
                        `}
                        style={
                          isBooked ? undefined
                          : isSelected ? { background: 'hsl(217, 91%, 60%)' }
                          : isLockedByOther ? { background: 'hsl(45, 93%, 47%)' }
                          : isAvailable ? { background: 'hsl(145, 70%, 42%)' }
                          : undefined
                        }
                        title={
                          isBooked ? `Seat ${seatNum} - Booked (24hr lock)`
                          : isLockedByOther ? `Seat ${seatNum} - Temporarily Reserved`
                          : `Seat ${seatNum}`
                        }
                      >
                        {isBooked ? '✕' : isLockedByOther ? '⏳' : seatNum}
                      </button>
                      {idx === 1 && <div className="w-5" />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
