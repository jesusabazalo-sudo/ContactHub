-- ============================================================================
-- 034 — Historial de actividad del cliente: tabla `contact_views`.
--
-- ⚠️ NO APLICAR EN PRODUCCIÓN todavía. Este archivo se crea como parte de la
-- Fase 3 (dashboard del cliente), pero esta fase tiene restricción explícita
-- de no tocar RLS/índices/funciones en vivo (eso es Fase 4). Sigue el mismo
-- patrón que 033_stripe_payments.sql: se deja lista para aplicar manualmente
-- (Supabase Studio o CLI) cuando el usuario lo decida.
--
-- Registra cuándo un usuario copia el número o abre WhatsApp de un contacto
-- desbloqueado, para alimentar la sección "Contactos recientes" y "Mis
-- estadísticas" del dashboard. El cliente (src/lib/activityTracking.ts) hace
-- el insert de forma silenciosa: si esta tabla todavía no existe, la promesa
-- falla sin romper la UI (mismo patrón defensivo ya usado en el resto del
-- proyecto para features opcionales).
-- ============================================================================

begin;

create table if not exists public.contact_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  action text not null check (action in ('view', 'copy', 'whatsapp')),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_views_user_id on public.contact_views(user_id, created_at desc);
create index if not exists idx_contact_views_contact_id on public.contact_views(contact_id);

alter table public.contact_views enable row level security;

-- Cada usuario solo ve y crea sus propios registros de actividad.
create policy "contact_views_select_own"
on public.contact_views for select
using (user_id = auth.uid());

create policy "contact_views_insert_own"
on public.contact_views for insert
with check (user_id = auth.uid());

commit;
