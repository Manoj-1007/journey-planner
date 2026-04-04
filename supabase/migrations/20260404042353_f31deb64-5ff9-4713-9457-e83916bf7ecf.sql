
-- Add passenger_details to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS passenger_details jsonb DEFAULT '[]'::jsonb;

-- Create seat_locks table for temporary locking
CREATE TABLE public.seat_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL,
  seat_number integer NOT NULL,
  locked_by uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(bus_id, seat_number)
);

ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read locks (needed to show locked seats)
CREATE POLICY "Authenticated users can read seat locks"
ON public.seat_locks FOR SELECT TO authenticated
USING (true);

-- Users can insert their own locks
CREATE POLICY "Users can insert own locks"
ON public.seat_locks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = locked_by);

-- Users can delete their own locks
CREATE POLICY "Users can delete own locks"
ON public.seat_locks FOR DELETE TO authenticated
USING (auth.uid() = locked_by);

-- Function to clean expired locks
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.seat_locks WHERE expires_at < now();
END;
$$;

-- Enable realtime for seat_locks
ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_locks;
