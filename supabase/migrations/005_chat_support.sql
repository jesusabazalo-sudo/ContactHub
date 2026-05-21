-- ContactHub - Chat support fields and policies.
-- Run this complete file in Supabase SQL Editor after 004_sync_contacts_count.sql.

begin;

alter table public.chat_messages
add column if not exists sender text not null default 'user' check (sender in ('user', 'admin'));

alter table public.chat_messages
add column if not exists read boolean not null default false;

drop policy if exists "chat_admin_insert" on public.chat_messages;
create policy "chat_admin_insert"
on public.chat_messages
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "chat_mark_read_admin" on public.chat_messages;
create policy "chat_mark_read_admin"
on public.chat_messages
for update
to authenticated
using (public.is_admin(auth.uid()) or user_id = auth.uid())
with check (public.is_admin(auth.uid()) or user_id = auth.uid());

grant update on public.chat_messages to authenticated;

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
  and exists (
    select 1
    from public.trial_claims tc
    where tc.user_id = auth.uid()
      and c.id = any(tc.contact_ids)
  );

grant select on public.contact_trial_secure to authenticated;

commit;
