-- ============================================================================
-- 032 — Libro de Reclamaciones digital (INDECOPI). Tabla nueva y aditiva.
-- Cualquier consumidor (logueado o no) puede registrar; solo el admin lee/gestiona.
-- ============================================================================

create table if not exists public.reclamaciones (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  tipo text not null check (tipo in ('reclamo','queja')),
  consumidor_nombre text not null,
  doc_tipo text not null,
  doc_numero text not null,
  domicilio text,
  telefono text,
  email text not null,
  es_menor boolean not null default false,
  bien_tipo text,
  bien_descripcion text,
  monto_reclamado numeric(10,2),
  detalle text not null,
  pedido text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','respondido','cerrado')),
  respuesta_admin text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table public.reclamaciones enable row level security;

grant insert on public.reclamaciones to anon, authenticated;
grant select, update on public.reclamaciones to authenticated;

drop policy if exists reclamaciones_public_insert on public.reclamaciones;
create policy reclamaciones_public_insert on public.reclamaciones
  for insert to anon, authenticated with check (true);

drop policy if exists reclamaciones_admin_select on public.reclamaciones;
create policy reclamaciones_admin_select on public.reclamaciones
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists reclamaciones_admin_update on public.reclamaciones;
create policy reclamaciones_admin_update on public.reclamaciones
  for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create index if not exists idx_reclamaciones_estado on public.reclamaciones(estado, created_at desc);
