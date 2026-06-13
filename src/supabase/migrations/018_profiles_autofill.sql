-- ContactHub - datos propios para autorrelleno seguro.
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists phone text,
  add column if not exists whatsapp text;

create index if not exists idx_profiles_email_lookup
  on public.profiles(lower(email))
  where email is not null;

grant select, insert, update on public.profiles to authenticated;
