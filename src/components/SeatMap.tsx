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
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-foreground/30 rounded-sm" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-muted rounded-sm flex items-center justify-center text-muted-foreground font-mono text-[10px]">✕</div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-sm" />
          <span>Selected</span>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-4 max-w-xs mx-auto">
        <div className="flex justify-end mb-4 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-full border border-muted-foreground flex items-center justify-center text-[10px] text-muted-foreground font-mono">D</div>
        </div>

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
                        className={`w-8 h-8 rounded-sm font-mono text-xs transition-colors flex items-center justify-center
                          ${isBooked ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          ${isAvailable && !isSelected ? 'border border-foreground/30 hover:border-primary hover:shadow-[0_0_8px_hsl(43,100%,50%,0.3)] cursor-pointer' : ''}
                        `}
                        title={`Seat ${seatNum}`}
                      >
                        {isBooked ? '✕' : seatNum}
                      </button>
                      {idx === 1 && <div className="w-4" />}
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
