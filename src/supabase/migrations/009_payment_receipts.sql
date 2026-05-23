-- Comprobantes de pago enviados desde el chat de ContactHub
create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  plan_id text,
  plan_name text,
  category_name text,
  file_url text,
  file_path text,
  file_name text,
  file_type text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'access_granted', 'reviewed')),
  message text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.payment_receipts enable row level security;

drop policy if exists "payment_receipts_user_insert" on public.payment_receipts;
create policy "payment_receipts_user_insert"
  on public.payment_receipts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "payment_receipts_user_select_own" on public.payment_receipts;
create policy "payment_receipts_user_select_own"
  on public.payment_receipts for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "payment_receipts_admin_update" on public.payment_receipts;
create policy "payment_receipts_admin_update"
  on public.payment_receipts for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create index if not exists idx_payment_receipts_status_created
  on public.payment_receipts(status, created_at desc);

create index if not exists idx_payment_receipts_user
  on public.payment_receipts(user_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', true)
on conflict (id) do nothing;

drop policy if exists "payment_receipts_storage_user_upload" on storage.objects;
create policy "payment_receipts_storage_user_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment_receipts_storage_user_read_own_or_admin" on storage.objects;
create policy "payment_receipts_storage_user_read_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-receipts'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
  );
