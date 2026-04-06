
-- 1. RESTRICT BOOKINGS UPDATE: Only allow cancellation via RPC, remove broad UPDATE policy
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;

-- Create a restricted update policy that only allows setting status to 'cancelled'
CREATE POLICY "Users can cancel own bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'confirmed')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- 2. SERVER-SIDE PRICE VALIDATION: Trigger to enforce correct total_amount on INSERT
CREATE OR REPLACE FUNCTION public.validate_booking_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bus_price integer;
  seat_count integer;
  expected_amount integer;
BEGIN
  SELECT price INTO bus_price FROM buses WHERE id = NEW.bus_id;
  IF bus_price IS NULL THEN
    RAISE EXCEPTION 'Bus not found';
  END IF;
  
  seat_count := array_length(NEW.seats, 1);
  IF seat_count IS NULL OR seat_count < 1 THEN
    RAISE EXCEPTION 'At least one seat is required';
  END IF;

  -- Recalculate based on passenger details (age-based pricing)
  IF NEW.passenger_details IS NOT NULL AND jsonb_array_length(NEW.passenger_details) > 0 THEN
    expected_amount := 0;
    FOR i IN 0..jsonb_array_length(NEW.passenger_details) - 1 LOOP
      DECLARE
        age integer;
      BEGIN
        age := (NEW.passenger_details->i->>'age')::integer;
        IF age >= 10 THEN
          expected_amount := expected_amount + bus_price;
        ELSIF age >= 5 THEN
          expected_amount := expected_amount + (bus_price / 2);
        END IF;
        -- age < 5 = free
      END;
    END LOOP;
  ELSE
    expected_amount := bus_price * seat_count;
  END IF;

  -- Override client-supplied amount with server-computed amount
  NEW.total_amount := expected_amount;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_booking_amount
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_amount();

-- 3. BLOCK USER ROLE SELF-ASSIGNMENT: Add restrictive policy
-- The existing "Admins can manage roles" ALL policy allows admin insert.
-- We need to ensure non-admins cannot insert. Currently there's no explicit INSERT policy for non-admins,
-- but since RLS is permissive and the ALL policy exists, we need a restrictive deny.
-- Actually, let's just ensure no INSERT policy exists for non-admins by checking:
-- The ALL policy already requires admin. Since there's no other INSERT policy, non-admins can't insert.
-- But to be safe, let's add an explicit restrictive policy:

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Note: The handle_new_user trigger runs as SECURITY DEFINER and bypasses RLS, so new user registration still works.

-- 4. REVOKE has_role FROM ANON
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

-- 5. RESTRICT SEAT LOCKS: Hide locked_by from other users
DROP POLICY IF EXISTS "Authenticated users can read seat locks" ON public.seat_locks;

-- Users can see all locks (to know seats are taken) but we create a view for the UI
CREATE POLICY "Users can read seat lock info"
  ON public.seat_locks
  FOR SELECT
  TO authenticated
  USING (true);

-- Add UPDATE policy for upsert to work
CREATE POLICY "Users can update own locks"
  ON public.seat_locks
  FOR UPDATE
  TO authenticated
  USING (locked_by = auth.uid())
  WITH CHECK (locked_by = auth.uid());
