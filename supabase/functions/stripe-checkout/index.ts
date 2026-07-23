// Crea una sesión de Stripe Checkout para un plan de ContactHub.
//
// El precio SIEMPRE se lee del servidor (STRIPE_PLANS en _shared/plans.ts),
// nunca del cliente, para evitar que alguien manipule el monto a pagar.
// Requiere STRIPE_SECRET_KEY configurado como secret en Supabase
// (usa sk_test_... hasta haber probado el flujo completo, no sk_live_...).

import Stripe from 'npm:stripe@17';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getPlanById } from '../_shared/plans.ts';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY no está configurado.');
    if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error('Supabase no está configurado en el servidor.');

    const { plan_id, user_id, success_url, cancel_url } = await req.json();
    if (!plan_id || !user_id || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: plan_id, user_id, success_url y cancel_url son obligatorios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const plan = getPlanById(plan_id);
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan no reconocido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
    // Los precios de ContactHub están en soles (PEN); se cobran en la misma
    // moneda para que el monto coincida exactamente con lo que ve el cliente.
    const currency = 'pen';
    const amount = Math.round(plan.price * 100); // Stripe espera céntimos.

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: `ContactHub — ${plan.name}` },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: { user_id, plan_id },
      success_url,
      cancel_url,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: insertError } = await supabase.from('stripe_sessions').insert({
      user_id,
      session_id: session.id,
      plan_id,
      amount,
      currency,
      status: 'pending',
    });
    if (insertError) console.error('stripe_sessions insert:', insertError.message);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('stripe-checkout error:', error);
    const message = error instanceof Error ? error.message : 'No se pudo iniciar el pago.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
