// Verifica la firma de Stripe y procesa los eventos de pago.
//
// checkout.session.completed  -> marca la sesión como completada, concede
//                                 acceso a las carpetas del plan e inserta
//                                 el registro en `purchases`.
// payment_intent.payment_failed -> marca la sesión como fallida.
//
// Requiere STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET como secrets en
// Supabase (usa llaves de prueba hasta haber validado el flujo completo).

import Stripe from 'npm:stripe@17';
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { getPlanById } from '../_shared/plans.ts';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

/** Concede acceso a las carpetas del plan y registra la compra. */
async function grantPlanAccess(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  sessionId: string,
  amountCents: number,
  currency: string,
) {
  const plan = getPlanById(planId);
  if (!plan) {
    console.error('stripe-webhook: plan desconocido en metadata:', planId);
    return;
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (categoriesError) {
    console.error('stripe-webhook categories:', categoriesError.message);
    return;
  }

  const allIds = (categories ?? []).map((category: { id: string }) => category.id);
  // Sin selector de carpetas en el checkout: para planes limitados se asignan
  // las primeras N carpetas activas (por orden oficial). Para acceso total,
  // todas. Si el negocio necesita que el cliente elija carpetas específicas,
  // hace falta un paso de selección antes del pago (no estaba en el alcance
  // pedido para esta integración).
  const categoryIds = plan.folderLimit === 'total' ? allIds : allIds.slice(0, plan.folderLimit);

  if (!categoryIds.length) {
    console.error('stripe-webhook: no hay carpetas activas para asignar.');
    return;
  }

  const now = new Date().toISOString();
  const accessRows = categoryIds.map((categoryId) => ({
    user_id: userId,
    category_id: categoryId,
    status: 'active',
    access_type: 'paid',
    source: 'stripe',
    note: `Pago Stripe confirmado (sesión ${sessionId}).`,
    updated_at: now,
  }));

  const { error: accessError } = await supabase
    .from('user_category_access')
    .upsert(accessRows, { onConflict: 'user_id,category_id' });
  if (accessError) {
    console.error('stripe-webhook user_category_access:', accessError.message);
    return;
  }

  // `purchases.plan_id` es un uuid que referencia a `public.plans`, distinto
  // del slug de texto usado en el frontend/Stripe (p. ej. "individual").
  // Se resuelve por precio, igual que ya hacía el flujo de pago anterior.
  const { data: dbPlan, error: dbPlanError } = await supabase
    .from('plans')
    .select('id')
    .eq('price', plan.price)
    .maybeSingle();
  if (dbPlanError) console.error('stripe-webhook plans lookup:', dbPlanError.message);

  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: userId,
    plan_id: dbPlan?.id ?? null,
    status: 'active',
    granted_at: now,
    notes: `Pago automático vía Stripe. Plan "${plan.name}" (${planId}), sesión ${sessionId}, monto ${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}.`,
  });
  if (purchaseError) console.error('stripe-webhook purchases insert:', purchaseError.message);
}

Deno.serve(async (req) => {
  try {
    if (!stripeSecretKey || !webhookSecret) throw new Error('Stripe no está configurado en el servidor.');
    if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error('Supabase no está configurado en el servidor.');

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    if (!signature) return new Response('Falta la firma de Stripe.', { status: 400 });

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (signatureError) {
      console.error('stripe-webhook: firma inválida:', signatureError);
      return new Response('Firma inválida.', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const { error: updateError } = await supabase
        .from('stripe_sessions')
        .update({ status: 'completed' })
        .eq('session_id', session.id);
      if (updateError) console.error('stripe-webhook stripe_sessions update:', updateError.message);

      const userId = session.metadata?.user_id;
      const planId = session.metadata?.plan_id;
      if (userId && planId) {
        await grantPlanAccess(supabase, userId, planId, session.id, session.amount_total ?? 0, session.currency ?? 'pen');
      } else {
        console.error('stripe-webhook: falta user_id o plan_id en metadata de la sesión', session.id);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // El PaymentIntent no es la misma sesión de Checkout: hay que resolver
      // qué Checkout Session generó este PaymentIntent para actualizar la
      // fila correcta en stripe_sessions (que guarda el session_id, no el
      // payment_intent id).
      const relatedSessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });
      const relatedSession = relatedSessions.data[0];
      if (relatedSession) {
        const { error: updateError } = await supabase
          .from('stripe_sessions')
          .update({ status: 'failed' })
          .eq('session_id', relatedSession.id);
        if (updateError) console.error('stripe-webhook payment_failed update:', updateError.message);
      } else {
        console.error('stripe-webhook: no se encontró la sesión de Checkout para el payment_intent', paymentIntent.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('stripe-webhook error:', error);
    return new Response('Error interno.', { status: 500 });
  }
});
