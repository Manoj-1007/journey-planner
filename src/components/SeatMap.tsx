interface SeatMapProps {
  bus: {
    totalSeats: number;
    availableSeats: number[];
    bookedSeats: number[];
  };
  selectedSeats: number[];
  onToggleSeat: (seat: number) => void;
}

const SeatMap = ({ bus, selectedSeats, onToggleSeat }: SeatMapProps) => {
  const rows = Math.ceil(bus.totalSeats / 4);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground">
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
                  const isBooked = bus.bookedSeats.includes(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);
                  const isAvailable = bus.availableSeats.includes(seatNum);
                  return (
                    <div key={seatNum} className="contents">
                      <button
                        disabled={isBooked}
                        onClick={() => isAvailable && onToggleSeat(seatNum)}
                        className={`w-9 h-9 rounded-md font-mono text-xs transition-all duration-200 flex items-center justify-center font-medium
                          ${isBooked ? 'bg-destructive/80 text-destructive-foreground cursor-not-allowed' : ''}
                          ${isSelected ? 'text-white shadow-lg shadow-blue-500/30' : ''}
                          ${isAvailable && !isSelected ? 'text-white cursor-pointer hover:shadow-[0_0_12px_hsl(145,70%,42%,0.4)]' : ''}
                        `}
                        style={
                          isBooked ? undefined
                          : isSelected ? { background: 'hsl(217, 91%, 60%)' }
                          : isAvailable ? { background: 'hsl(145, 70%, 42%)' }
                          : undefined
                        }
                        title={isBooked ? `Seat ${seatNum} - Already Booked` : `Seat ${seatNum}`}
                      >
                        {isBooked ? '✕' : seatNum}
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
