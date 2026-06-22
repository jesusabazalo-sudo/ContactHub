-- Solicitudes para publicar servicios. Ejecutar en Supabase SQL Editor.
begin;

create extension if not exists pgcrypto;

create table if not exists public.service_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text,
  email text,
  whatsapp text not null,
  business_name text not null,
  offer text not null,
  suggested_category text,
  description text not null,
  city text,
  social_url text,
  additional_message text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'published')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_submissions_status_created
  on public.service_submissions(status, created_at desc);

alter table public.service_submissions enable row level security;

drop policy if exists "service_submissions_public_insert" on public.service_submissions;
create policy "service_submissions_public_insert"
on public.service_submissions
for insert
to anon, authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "service_submissions_owner_or_admin_read" on public.service_submissions;
create policy "service_submissions_owner_or_admin_read"
on public.service_submissions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "service_submissions_admin_update" on public.service_submissions;
create policy "service_submissions_admin_update"
on public.service_submissions
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant insert on public.service_submissions to anon;
grant select, insert, update on public.service_submissions to authenticated;

commit;
