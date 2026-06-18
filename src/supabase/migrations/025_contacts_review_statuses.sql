-- Permite estados de revision mas precisos para contactos importados.
-- Evita telefonos placeholder y separa contactos publicos de registros solo admin.

alter table public.contacts
  add column if not exists raw_phone text,
  add column if not exists phone_status text default 'valid',
  add column if not exists visibility text default 'public',
  add column if not exists is_public boolean default true,
  add column if not exists import_batch text,
  add column if not exists import_note text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
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
    select 1
    from pg_constraint
    where conname = 'contacts_visibility_check'
      and conrelid = 'public.contacts'::regclass
  ) then
    alter table public.contacts drop constraint contacts_visibility_check;
  end if;

  alter table public.contacts
    add constraint contacts_visibility_check
    check (visibility in ('public', 'restricted', 'admin_only'));
end $$;

update public.contacts
set
  raw_phone = coalesce(nullif(raw_phone, ''), phone, phone_masked, 'REVISAR EN DOCUMENTO ORIGINAL'),
  phone = null,
  phone_status = 'placeholder_bug',
  visibility = 'admin_only',
  is_public = false,
  status = 'review',
  risk_level = 'review',
  import_note = concat_ws(' | ', nullif(import_note, ''), 'Placeholder detectado; requiere telefono real antes de publicar.'),
  updated_at = now()
where phone like '+000000000%';

create index if not exists idx_contacts_admin_review
  on public.contacts(phone_status, visibility, status);
