-- ============================================================================
-- 026 — Todas las columnas que el importador de contactos espera en `contacts`.
--
-- Consolida lo que añadían las migraciones 015/020/021/025. Es 100% idempotente
-- (ADD COLUMN IF NOT EXISTS / DROP CONSTRAINT IF EXISTS) y SOLO toca el esquema:
-- no modifica ni borra ninguna fila existente. Seguro de ejecutar de una vez,
-- incluso si algunas columnas ya existen.
--
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- ============================================================================

begin;

-- 1) El importador inserta `phone` y `phone_masked` nulos para contactos
--    reservados/sin teléfono. La tabla base los tenía NOT NULL.
alter table public.contacts alter column phone drop not null;
alter table public.contacts alter column phone_masked drop not null;

-- 2) Columnas que el importador escribe y que la tabla base no tenía.
alter table public.contacts
  add column if not exists raw_phone     text,
  add column if not exists phone_status  text    default 'valid',
  add column if not exists whatsapp      text,
  add column if not exists visibility    text    default 'public',
  add column if not exists is_public     boolean default true,
  add column if not exists import_batch  text,
  add column if not exists import_note   text,
  add column if not exists internal_note text,
  add column if not exists is_active     boolean default true,
  add column if not exists deleted_at    timestamptz;

-- Por si una base muy antigua no tuviera estas columnas "core" (la tabla base
-- sí las trae, pero las dejamos a prueba de fallos):
alter table public.contacts
  add column if not exists subcategory_id uuid,
  add column if not exists country_code   text,
  add column if not exists country_flag   text,
  add column if not exists source         text,
  add column if not exists updated_at     timestamptz default now();

-- 3) Constraints CHECK con el conjunto de valores FINAL que usa el código.
--    Se eliminan primero por si existe una versión antigua con menos valores.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'contacts_phone_status_check'
      and conrelid = 'public.contacts'::regclass
  ) then
    alter table public.contacts drop constraint contacts_phone_status_check;
  end if;

  alter table public.contacts
    add constraint contacts_phone_status_check
    check (phone_status in ('valid', 'needs_review', 'missing', 'invalid', 'placeholder_bug'));
end $$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'contacts_visibility_check'
      and conrelid = 'public.contacts'::regclass
  ) then
    alter table public.contacts drop constraint contacts_visibility_check;
  end if;

  alter table public.contacts
    add constraint contacts_visibility_check
    check (visibility in ('public', 'restricted', 'admin_only'));
end $$;

-- 4) Índices de apoyo para el panel admin y la importación (idempotentes).
create index if not exists idx_contacts_admin_review
  on public.contacts(phone_status, visibility, status);
create index if not exists idx_contacts_import_batch
  on public.contacts(import_batch);
create index if not exists idx_contacts_public_visibility
  on public.contacts(category_id, status, is_public, visibility);

commit;
