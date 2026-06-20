-- Admin contacts management hardening.
-- Run this in Supabase SQL Editor if your project was created before these fields existed.

begin;

alter table public.contacts
  add column if not exists whatsapp text,
  add column if not exists internal_note text,
  add column if not exists is_active boolean default true,
  add column if not exists deleted_at timestamptz;

alter table public.contacts
  alter column phone drop not null,
  alter column phone_masked drop not null;

update public.contacts
set is_active = case when status = 'inactive' then false else true end
where is_active is null;

create index if not exists idx_contacts_category_status_active
  on public.contacts(category_id, status, is_active);

create index if not exists idx_contacts_phone_lookup
  on public.contacts(phone)
  where phone is not null and phone <> '';

create index if not exists idx_contacts_deleted_at
  on public.contacts(deleted_at);

create index if not exists idx_contacts_tags_gin
  on public.contacts using gin(tags);

grant select, insert, update, delete on public.contacts to authenticated;

-- Optional duplicate protection. Enable only after reviewing existing duplicate phones.
-- create unique index if not exists idx_contacts_category_phone_unique
--   on public.contacts(category_id, phone)
--   where phone is not null and phone <> '' and deleted_at is null;

commit;
