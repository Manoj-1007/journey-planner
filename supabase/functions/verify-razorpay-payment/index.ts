import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const hexSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hexSig === signature;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_data } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing payment details' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      return new Response(JSON.stringify({ error: 'Razorpay not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create booking after successful verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert booking
    const { data: booking, error: bookError } = await supabase.from('bookings').insert({
      user_id: booking_data.user_id,
      bus_id: booking_data.bus_id,
      bus_name: booking_data.bus_name,
      route_from: booking_data.route_from,
      route_to: booking_data.route_to,
      date: booking_data.date,
      departure_time: booking_data.departure_time,
      arrival_time: booking_data.arrival_time,
      seats: booking_data.seats,
      total_amount: booking_data.total_amount,
      payment_method: `Razorpay (${razorpay_payment_id})`,
    }).select().single();

    if (bookError) {
      return new Response(JSON.stringify({ error: bookError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update bus seats
    const { error: busError } = await supabase.from('buses')
      .update({
        available_seats: booking_data.new_available_seats,
        booked_seats: booking_data.new_booked_seats,
      })
      .eq('id', booking_data.bus_id);

    if (busError) {
      return new Response(JSON.stringify({ error: busError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, booking }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
