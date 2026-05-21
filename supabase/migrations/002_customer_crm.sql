-- ContactHub - Customer CRM module.
-- Run this complete file in Supabase SQL Editor after 001_contacthub_security_base.sql.

begin;

create table if not exists public.customer_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'nuevo' check (status in ('nuevo', 'pendiente', 'activo', 'vip', 'bloqueado')),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.customer_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_type text not null,
  quantity integer not null default 0 check (quantity >= 0),
  reason text not null default '',
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  comment text not null,
  rating integer not null check (rating between 1 and 5),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  reward_granted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_status_user_id on public.customer_status(user_id);
create index if not exists idx_customer_rewards_user_id on public.customer_rewards(user_id);
create index if not exists idx_customer_notes_user_id_created_at on public.customer_notes(user_id, created_at desc);
create index if not exists idx_customer_feedback_user_id_status on public.customer_feedback(user_id, status);

drop trigger if exists set_customer_status_updated_at on public.customer_status;
create trigger set_customer_status_updated_at
before update on public.customer_status
for each row execute function public.set_updated_at();

alter table public.customer_status enable row level security;
alter table public.customer_rewards enable row level security;
alter table public.customer_notes enable row level security;
alter table public.customer_feedback enable row level security;

alter table public.customer_status force row level security;
alter table public.customer_rewards force row level security;
alter table public.customer_notes force row level security;
alter table public.customer_feedback force row level security;

drop policy if exists "customer_status_admin_manage" on public.customer_status;
create policy "customer_status_admin_manage"
on public.customer_status
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "customer_rewards_select_own_or_admin" on public.customer_rewards;
create policy "customer_rewards_select_own_or_admin"
on public.customer_rewards
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "customer_rewards_admin_insert" on public.customer_rewards;
create policy "customer_rewards_admin_insert"
on public.customer_rewards
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "customer_notes_admin_manage" on public.customer_notes;
create policy "customer_notes_admin_manage"
on public.customer_notes
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "customer_feedback_public_approved_select" on public.customer_feedback;
create policy "customer_feedback_public_approved_select"
on public.customer_feedback
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "customer_feedback_admin_select" on public.customer_feedback;
create policy "customer_feedback_admin_select"
on public.customer_feedback
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "customer_feedback_public_insert_pending" on public.customer_feedback;
create policy "customer_feedback_public_insert_pending"
on public.customer_feedback
for insert
to anon, authenticated
with check (
  status = 'pending'
  and reward_granted = false
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists "customer_feedback_admin_update" on public.customer_feedback;
create policy "customer_feedback_admin_update"
on public.customer_feedback
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select, insert, update, delete on public.customer_status to authenticated;
grant select, insert on public.customer_rewards to authenticated;
grant select, insert, update, delete on public.customer_notes to authenticated;
grant select, insert on public.customer_feedback to anon, authenticated;
grant update, delete on public.customer_feedback to authenticated;

commit;
