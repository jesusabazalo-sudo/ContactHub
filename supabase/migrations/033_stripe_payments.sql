-- ============================================================================
-- 033 — Integración Stripe: tabla `stripe_sessions`.
--
-- ⚠️ NO APLICAR EN PRODUCCIÓN todavía. Aplícala junto con desplegar las Edge
-- Functions (stripe-checkout, stripe-webhook) y configurar las llaves de
-- Stripe. Usa llaves de PRUEBA (sk_test_/pk_test_) primero, no llaves live,
-- hasta haber probado el flujo completo.
--
-- Registra cada sesión de Stripe Checkout creada, para poder reconciliarla
-- cuando llega el webhook `checkout.session.completed` o
-- `payment_intent.payment_failed`. No reemplaza el flujo manual de Yape/Plin,
-- que sigue intacto como respaldo sin comisión.
-- ============================================================================

begin;

create table if not exists public.stripe_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text unique not null,
  plan_id text not null,
  amount integer not null,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_stripe_sessions_user_id on public.stripe_sessions(user_id);

alter table public.stripe_sessions enable row level security;

-- Solo lectura desde el cliente: el usuario ve sus propias sesiones, el admin
-- ve todas. Los inserts/updates los hacen las Edge Functions con la
-- service_role key, que ignora RLS por diseño.
create policy "stripe_sessions_read"
on public.stripe_sessions for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

commit;
