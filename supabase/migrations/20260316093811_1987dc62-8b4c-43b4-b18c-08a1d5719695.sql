
CREATE OR REPLACE FUNCTION public.auto_update_bus_dates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE buses
  SET date = CURRENT_DATE,
      booked_seats = '{}',
      available_seats = ARRAY(SELECT generate_series(1, total_seats))
  WHERE date < CURRENT_DATE;
END;
$$;
