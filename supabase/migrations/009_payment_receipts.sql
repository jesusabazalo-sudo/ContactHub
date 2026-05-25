-- ContactHub - comprobantes de pago enviados desde el chat.
-- Ejecutar en Supabase SQL Editor como owner/postgres.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  user_name text,
  payment_method text not null default 'yape',
  amount numeric(10, 2),
  plan_key text,
  plan_label text,
  folder_id uuid references public.categories(id) on delete set null,
  folder_label text,
  receipt_file_url text,
  receipt_file_path text,
  receipt_file_name text,
  receipt_mime_type text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'access_granted')),
  customer_message text,
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_receipts
  add column if not exists user_email text,
  add column if not exists user_name text,
  add column if not exists payment_method text default 'yape',
  add column if not exists amount numeric(10, 2),
  add column if not exists plan_key text,
  add column if not exists plan_label text,
  add column if not exists folder_id uuid references public.categories(id) on delete set null,
  add column if not exists folder_label text,
  add column if not exists receipt_file_url text,
  add column if not exists receipt_file_path text,
  add column if not exists receipt_file_name text,
  add column if not exists receipt_mime_type text,
  add column if not exists customer_message text,
  add column if not exists admin_note text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- Compatibilidad con una versión previa de esta tabla si ya fue ejecutada.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'email') then
    execute 'update public.payment_receipts set user_email = coalesce(user_email, email, ''sin-email@contacthub.local'')';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'plan_id') then
    execute 'update public.payment_receipts set plan_key = coalesce(plan_key, plan_id)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'plan_name') then
    execute 'update public.payment_receipts set plan_label = coalesce(plan_label, plan_name)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'category_name') then
    execute 'update public.payment_receipts set folder_label = coalesce(folder_label, category_name)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'file_url') then
    execute 'update public.payment_receipts set receipt_file_url = coalesce(receipt_file_url, file_url)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'file_path') then
    execute 'update public.payment_receipts set receipt_file_path = coalesce(receipt_file_path, file_path)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'file_name') then
    execute 'update public.payment_receipts set receipt_file_name = coalesce(receipt_file_name, file_name)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'file_type') then
    execute 'update public.payment_receipts set receipt_mime_type = coalesce(receipt_mime_type, file_type)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_receipts' and column_name = 'message') then
    execute 'update public.payment_receipts set customer_message = coalesce(customer_message, message)';
  end if;
end $$;

update public.payment_receipts
set
  user_email = coalesce(user_email, 'sin-email@contacthub.local'),
  status = case when status = 'reviewed' then 'approved' else status end,
  updated_at = coalesce(updated_at, now())
where true;

alter table public.payment_receipts
  alter column user_email set not null,
  alter column payment_method set default 'yape',
  alter column status set default 'pending_review';

alter table public.payment_receipts
  drop constraint if exists payment_receipts_status_check;

alter table public.payment_receipts
  add constraint payment_receipts_status_check
  check (status in ('pending_review', 'approved', 'rejected', 'access_granted'));

drop trigger if exists set_payment_receipts_updated_at on public.payment_receipts;
create trigger set_payment_receipts_updated_at
before update on public.payment_receipts
for each row execute function public.set_updated_at();

alter table public.payment_receipts enable row level security;

drop policy if exists "payment_receipts_user_insert" on public.payment_receipts;
create policy "payment_receipts_user_insert"
on public.payment_receipts
for insert
to authenticated
with check (auth.uid() = user_id and user_email is not null);

drop policy if exists "payment_receipts_user_select_own" on public.payment_receipts;
create policy "payment_receipts_user_select_own"
on public.payment_receipts
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "payment_receipts_admin_update" on public.payment_receipts;
create policy "payment_receipts_admin_update"
on public.payment_receipts
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create index if not exists idx_payment_receipts_status_created
  on public.payment_receipts(status, created_at desc);

create index if not exists idx_payment_receipts_user
  on public.payment_receipts(user_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payment_receipts_storage_user_upload" on storage.objects;
create policy "payment_receipts_storage_user_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "payment_receipts_storage_user_read_own_or_admin" on storage.objects;
create policy "payment_receipts_storage_user_read_own_or_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

grant select, insert, update on public.payment_receipts to authenticated;

commit;
