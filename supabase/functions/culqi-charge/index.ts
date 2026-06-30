// ============================================================================
// Edge Function: culqi-charge
// Crea un cargo en Culqi a partir de un token (Culqi.js) y, si el cobro es
// exitoso, ACTIVA el acceso del usuario. Núcleo seguro del flujo de pago.
//
// Reglas de seguridad clave:
//  - El precio SIEMPRE se lee de la tabla `plans` en el servidor (nunca del
//    cliente), para que nadie pueda pagar S/1 por el plan total.
//  - Se valida que quien llama sea el usuario autenticado (su JWT).
//  - Idempotencia por provider_charge_id (un cargo no activa dos veces).
//  - Escribe con service_role (omite RLS) SOLO tras un cobro confirmado.
//
// Sandbox: usa la llave secreta de PRUEBA de Culqi (sk_test_...). No toca
// producción hasta que configures las llaves reales. Ver functions/README.md.
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type ChargeBody = {
  token: string;          // token de Culqi.js (tkn_test_... en sandbox)
  planId: string;         // UUID del plan en la tabla public.plans
  categoryIds?: string[]; // carpetas elegidas (para planes no-totales)
  email: string;          // email del comprador (requerido por Culqi)
};

const CULQI_API = 'https://api.culqi.com/v2/charges';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const CULQI_SECRET_KEY = Deno.env.get('CULQI_SECRET_KEY'); // sk_test_... en sandbox

  if (!CULQI_SECRET_KEY) return jsonResponse({ error: 'Culqi no está configurado (falta CULQI_SECRET_KEY).' }, 503);

  // 1) Identificar al usuario por su JWT (cliente con el token del request).
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return jsonResponse({ error: 'No autenticado.' }, 401);
  const user = userData.user;

  // 2) Validar entrada.
  let body: ChargeBody;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'JSON inválido.' }, 400); }
  if (!body.token || !body.planId || !body.email) return jsonResponse({ error: 'Faltan datos (token, planId, email).' }, 400);

  // 3) Cliente con service_role para leer plan y escribir acceso (omite RLS).
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // 4) Precio y reglas SIEMPRE desde el servidor.
  const { data: plan, error: planErr } = await admin
    .from('plans').select('id, name, price, folder_limit, is_total_access').eq('id', body.planId).maybeSingle();
  if (planErr || !plan) return jsonResponse({ error: 'Plan no encontrado.' }, 400);

  const price = Number(plan.price);
  if (!(price > 0)) return jsonResponse({ error: 'Plan con precio inválido.' }, 400);

  // 5) Validar carpetas elegidas (si el plan no es total).
  let categoryIds: string[] = [];
  if (!plan.is_total_access) {
    categoryIds = [...new Set((body.categoryIds ?? []).filter(Boolean))];
    if (categoryIds.length === 0) return jsonResponse({ error: 'Debes elegir al menos una carpeta.' }, 400);
    if (plan.folder_limit != null && categoryIds.length > plan.folder_limit) {
      return jsonResponse({ error: `Este plan permite máximo ${plan.folder_limit} carpetas.` }, 400);
    }
    const { data: validCats } = await admin.from('categories').select('id').in('id', categoryIds).eq('is_active', true);
    if ((validCats?.length ?? 0) !== categoryIds.length) return jsonResponse({ error: 'Hay carpetas inválidas o inactivas.' }, 400);
  }

  // 6) Crear el cargo en Culqi (monto en céntimos).
  const culqiRes = await fetch(CULQI_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CULQI_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(price * 100),
      currency_code: 'PEN',
      email: body.email,
      source_id: body.token,
      metadata: { user_id: user.id, plan_id: plan.id, plan_name: plan.name },
    }),
  });
  const charge = await culqiRes.json();

  if (!culqiRes.ok || charge?.object !== 'charge') {
    // Culqi devuelve user_message legible para mostrar al cliente.
    return jsonResponse({ error: charge?.user_message ?? charge?.merchant_message ?? 'El pago no se pudo procesar.' }, 402);
  }

  // 7) Idempotencia: si este cargo ya activó algo, no duplicar.
  const { data: existing } = await admin.from('purchases').select('id').eq('provider_charge_id', charge.id).maybeSingle();
  if (existing) return jsonResponse({ ok: true, alreadyProcessed: true });

  const now = new Date().toISOString();

  // 8) Registrar la compra ACTIVA (cobro confirmado).
  const { data: purchase, error: buyErr } = await admin.from('purchases').insert({
    user_id: user.id,
    plan_id: plan.id,
    status: 'active',
    provider: 'culqi',
    provider_charge_id: charge.id,
    amount: price,
    currency: 'PEN',
    granted_by: null,
    granted_at: now,
    paid_at: now,
    notes: `Culqi ${charge.id}`,
  }).select('id').single();
  if (buyErr) return jsonResponse({ error: `Cobro OK pero no se pudo registrar la compra: ${buyErr.message}` }, 500);

  // 9) Conceder acceso.
  //  - Total: has_category_access ya lo cubre por is_total_access (nada que hacer).
  //  - No total: otorgar las carpetas elegidas en user_category_access.
  if (!plan.is_total_access && categoryIds.length) {
    const rows = categoryIds.map((category_id) => ({
      user_id: user.id, category_id, status: 'active', granted_by: null, updated_at: now,
    }));
    const { error: accErr } = await admin.from('user_category_access').upsert(rows, { onConflict: 'user_id,category_id' });
    if (accErr) return jsonResponse({ error: `Cobro OK pero no se pudo activar el acceso: ${accErr.message}` }, 500);
  }

  return jsonResponse({ ok: true, chargeId: charge.id, purchaseId: purchase.id });
});
