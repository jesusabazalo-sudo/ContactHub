// ============================================================================
// Edge Function: culqi-webhook  (OPCIONAL pero recomendado)
// Red de seguridad: si el cobro en Culqi salió bien pero la activación síncrona
// (culqi-charge) falló justo después (timeout, etc.), este webhook reconcilia y
// activa el acceso igual. Idempotente.
//
// No confía en el payload: vuelve a consultar el cargo a la API de Culqi por id.
// Configura este endpoint en el panel de Culqi (eventos de cargo) cuando actives
// producción. En sandbox puedes probarlo con los eventos de prueba de Culqi.
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const CULQI_SECRET_KEY = Deno.env.get('CULQI_SECRET_KEY');
  if (!CULQI_SECRET_KEY) return jsonResponse({ error: 'Culqi no configurado.' }, 503);

  let event: { data?: { id?: string }; type?: string };
  try { event = await req.json(); } catch { return jsonResponse({ error: 'JSON inválido' }, 400); }

  const chargeId = event?.data?.id;
  if (!chargeId) return jsonResponse({ ok: true, ignored: 'sin charge id' });

  // Verificar el cargo contra Culqi (no confiar en el payload entrante).
  const res = await fetch(`https://api.culqi.com/v2/charges/${chargeId}`, {
    headers: { Authorization: `Bearer ${CULQI_SECRET_KEY}` },
  });
  const charge = await res.json();
  if (!res.ok || charge?.object !== 'charge') return jsonResponse({ ok: true, ignored: 'cargo no válido' });

  const userId = charge?.metadata?.user_id as string | undefined;
  const planId = charge?.metadata?.plan_id as string | undefined;
  if (!userId || !planId) return jsonResponse({ ok: true, ignored: 'sin metadata' });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Idempotencia: si ya existe la compra por este cargo, no hacer nada.
  const { data: existing } = await admin.from('purchases').select('id').eq('provider_charge_id', chargeId).maybeSingle();
  if (existing) return jsonResponse({ ok: true, alreadyProcessed: true });

  const { data: plan } = await admin.from('plans').select('id, price, is_total_access').eq('id', planId).maybeSingle();
  if (!plan) return jsonResponse({ ok: true, ignored: 'plan no encontrado' });

  const now = new Date().toISOString();
  await admin.from('purchases').insert({
    user_id: userId, plan_id: plan.id, status: 'active', provider: 'culqi',
    provider_charge_id: chargeId, amount: Number(plan.price), currency: 'PEN',
    granted_at: now, paid_at: now, notes: `Culqi ${chargeId} (webhook)`,
  });
  // Nota: la concesión de carpetas específicas la hace culqi-charge (que conoce
  // las categorías elegidas). El webhook solo garantiza la compra activa; el
  // acceso total queda cubierto por has_category_access si el plan es total.

  return jsonResponse({ ok: true, reconciled: chargeId });
});
