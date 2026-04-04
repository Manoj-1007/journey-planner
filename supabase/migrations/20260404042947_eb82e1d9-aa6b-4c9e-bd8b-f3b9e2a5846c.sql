
-- Function to get all seats booked within last 24 hours for a bus+date
CREATE OR REPLACE FUNCTION public.get_booked_seats_24h(_bus_id uuid, _date date)
RETURNS integer[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result integer[];
BEGIN
  SELECT COALESCE(array_agg(seat_num), '{}')
  INTO result
  FROM (
    SELECT unnest(seats) AS seat_num
    FROM bookings
    WHERE bus_id = _bus_id
      AND date = _date
      AND status = 'confirmed'
      AND created_at > (now() - interval '24 hours')
  ) sub;
  RETURN result;
END;
$$;

-- Atomic booking function with race condition protection
CREATE OR REPLACE FUNCTION public.book_seats_atomic(
  _user_id uuid,
  _bus_id uuid,
  _bus_name text,
  _route_from text,
  _route_to text,
  _date date,
  _departure_time text,
  _arrival_time text,
  _seats integer[],
  _total_amount integer,
  _payment_method text,
  _passenger_details jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booked_24h integer[];
  conflict_seats integer[];
  new_booking_id uuid;
  current_bus record;
  new_available integer[];
  new_booked integer[];
BEGIN
  -- Lock the bus row to prevent concurrent modifications
  SELECT * INTO current_bus FROM buses WHERE id = _bus_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Bus not found');
  END IF;

  -- Get all seats booked within 24 hours
  booked_24h := get_booked_seats_24h(_bus_id, _date);
  
  -- Check for conflicts with 24h bookings
  SELECT array_agg(s) INTO conflict_seats
  FROM unnest(_seats) AS s
  WHERE s = ANY(booked_24h);
  
  IF conflict_seats IS NOT NULL AND array_length(conflict_seats, 1) > 0 THEN
    RETURN jsonb_build_object(
      'error', 'Seat(s) ' || array_to_string(conflict_seats, ', ') || ' already booked. Please select different seats.'
    );
  END IF;
  
  -- Also check against current bus booked_seats array
  SELECT array_agg(s) INTO conflict_seats
  FROM unnest(_seats) AS s
  WHERE s = ANY(current_bus.booked_seats);
  
  IF conflict_seats IS NOT NULL AND array_length(conflict_seats, 1) > 0 THEN
    RETURN jsonb_build_object(
      'error', 'Seat(s) ' || array_to_string(conflict_seats, ', ') || ' already booked. Please select different seats.'
    );
  END IF;

  -- Insert booking
  INSERT INTO bookings (user_id, bus_id, bus_name, route_from, route_to, date, departure_time, arrival_time, seats, total_amount, payment_method, passenger_details)
  VALUES (_user_id, _bus_id, _bus_name, _route_from, _route_to, _date, _departure_time, _arrival_time, _seats, _total_amount, _payment_method, _passenger_details)
  RETURNING id INTO new_booking_id;

  -- Update bus seats
  new_available := ARRAY(SELECT unnest(current_bus.available_seats) EXCEPT SELECT unnest(_seats));
  new_booked := current_bus.booked_seats || _seats;
  
  UPDATE buses SET available_seats = new_available, booked_seats = new_booked WHERE id = _bus_id;

  -- Clean up seat locks for these seats
  DELETE FROM seat_locks WHERE bus_id = _bus_id AND seat_number = ANY(_seats);

  RETURN jsonb_build_object('success', true, 'booking_id', new_booking_id);
END;
$$;
