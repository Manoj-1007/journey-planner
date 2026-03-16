
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.auto_update_bus_dates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE buses SET date = CURRENT_DATE WHERE date < CURRENT_DATE;
END;
$$;

SELECT cron.schedule(
  'auto-update-bus-dates',
  '0 0 * * *',
  $$SELECT public.auto_update_bus_dates();$$
);
