-- Preserve imported phone data exactly and keep restricted contacts admin-only.

begin;

alter table public.contacts
  alter column phone drop not null,
  alter column phone_masked drop not null,
  add column if not exists raw_phone text,
  add column if not exists phone_status text default 'valid',
  add column if not exists visibility text default 'public',
  add column if not exists is_public boolean default true,
  add column if not exists import_batch text,
  add column if not exists import_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'contacts_phone_status_check'
      and conrelid = 'public.contacts'::regclass
  ) then
    alter table public.contacts
      add constraint contacts_phone_status_check
      check (phone_status in ('valid', 'needs_review'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'contacts_visibility_check'
      and conrelid = 'public.contacts'::regclass
  ) then
    alter table public.contacts
      add constraint contacts_visibility_check
      check (visibility in ('public', 'restricted'));
  end if;
end
$$;

-- Correct the prior import in place. The workbook contains this review marker
-- rather than a publishable phone for the 67 restricted records.
update public.contacts
set
  raw_phone = coalesce(nullif(raw_phone, ''), 'REVISAR EN DOCUMENTO ORIGINAL'),
  phone = null,
  whatsapp = null,
  phone_masked = 'Reservado para revisión',
  phone_status = 'needs_review',
  visibility = 'restricted',
  is_public = false,
  import_batch = 'importacion_excel_1048_final',
  import_note = coalesce(nullif(import_note, ''), 'Número no republicado por seguridad del directorio'),
  internal_note = case
    when coalesce(internal_note, '') ilike '%Contacto reservado/importado para revisión admin%'
      then internal_note
    else concat_ws(' | ', 'Contacto reservado/importado para revisión admin', nullif(internal_note, ''))
  end,
  status = 'review',
  risk_level = 'review',
  tags = array['revisión', 'reservado', 'admin']::text[],
  country_code = 'XX',
  country_flag = '⚠️',
  updated_at = now()
where source = 'importacion_excel_1048_final'
  and (phone like '+000%' or status = 'review');

update public.contacts
set
  raw_phone = coalesce(nullif(raw_phone, ''), phone),
  phone_status = 'valid',
  visibility = 'public',
  is_public = true,
  import_batch = coalesce(nullif(import_batch, ''), 'importacion_excel_1048_final')
where source = 'importacion_excel_1048_final'
  and status = 'active'
  and phone is not null
  and phone not like '+000%';

create index if not exists idx_contacts_import_batch
  on public.contacts(import_batch);

create index if not exists idx_contacts_public_visibility
  on public.contacts(category_id, status, is_public, visibility);

update public.categories
set
  name = 'Contenido reservado o sensible — The Vault',
  icon = '⚠️',
  short_description = 'Contenido reservado o sensible',
  display_order = 18,
  sort_order = 18,
  updated_at = now()
where slug in ('the-vault', 'prohibido')
   or display_order = 18
   or sort_order = 18;

commit;
