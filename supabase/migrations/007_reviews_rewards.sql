create table if not exists public.public_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  display_name text null,
  is_anonymous boolean not null default true,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.reward_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_id uuid null references public.public_reviews(id) on delete set null,
  screenshot_url text null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  bonus_contact_ids uuid[] not null default '{}',
  admin_note text null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null
);

alter table public.public_reviews enable row level security;
alter table public.reward_requests enable row level security;

grant select, insert on public.public_reviews to authenticated;
grant select on public.public_reviews to anon;
grant select, insert, update, delete on public.reward_requests to authenticated;

drop policy if exists "public_reviews_read_approved" on public.public_reviews;
create policy "public_reviews_read_approved"
on public.public_reviews for select
using (status = 'approved' or public.is_admin(auth.uid()) or user_id = auth.uid());

drop policy if exists "public_reviews_insert_authenticated" on public.public_reviews;
create policy "public_reviews_insert_authenticated"
on public.public_reviews for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "public_reviews_admin_update" on public.public_reviews;
create policy "public_reviews_admin_update"
on public.public_reviews for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "reward_requests_owner_read" on public.reward_requests;
create policy "reward_requests_owner_read"
on public.reward_requests for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "reward_requests_owner_insert" on public.reward_requests;
create policy "reward_requests_owner_insert"
on public.reward_requests for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "reward_requests_admin_update" on public.reward_requests;
create policy "reward_requests_admin_update"
on public.reward_requests for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "reward_requests_admin_delete" on public.reward_requests;
create policy "reward_requests_admin_delete"
on public.reward_requests for delete
using (public.is_admin(auth.uid()));

create or replace view public.contact_trial_secure
with (security_barrier = true)
as
select
  c.id,
  c.category_id,
  c.name,
  c.description,
  c.phone,
  c.phone_masked,
  c.country_flag,
  c.country_code,
  c.tags,
  c.created_at
from public.contacts c
where c.status = 'active'
  and c.risk_level = 'safe'
  and auth.uid() is not null
  and (
    exists (
      select 1
      from public.trial_claims tc
      where tc.user_id = auth.uid()
        and c.id = any(tc.contact_ids)
    )
    or exists (
      select 1
      from public.reward_requests rr
      where rr.user_id = auth.uid()
        and rr.status = 'approved'
        and c.id = any(rr.bonus_contact_ids)
    )
    or public.is_admin(auth.uid())
  );

grant select on public.contact_trial_secure to authenticated;
