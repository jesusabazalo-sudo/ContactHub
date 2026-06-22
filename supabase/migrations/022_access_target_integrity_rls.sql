-- Endurece la tabla oficial de accesos.
-- El cliente destino siempre vive en user_id; el admin que actua vive en granted_by.

begin;

alter table public.user_category_access
  add column if not exists access_type text default 'manual',
  add column if not exists source text,
  add column if not exists note text,
  add column if not exists updated_at timestamptz default now();

update public.user_category_access
set updated_at = coalesce(updated_at, created_at, now()),
    access_type = coalesce(access_type, 'manual')
where updated_at is null
   or access_type is null;

create index if not exists idx_user_category_access_target_status
  on public.user_category_access(user_id, status);

create index if not exists idx_user_category_access_target_category
  on public.user_category_access(user_id, category_id);

alter table public.user_category_access enable row level security;

-- Sustituye politicas antiguas que podian permitir que cualquier usuario
-- autenticado escribiera accesos para si mismo o para otra cuenta.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_category_access'
  loop
    execute format(
      'drop policy if exists %I on public.user_category_access',
      policy_record.policyname
    );
  end loop;
end
$$;

create policy "users_read_own_active_access"
on public.user_category_access
for select
to authenticated
using (
  (user_id = auth.uid() and status = 'active')
  or public.is_admin(auth.uid())
);

create policy "admins_create_access_for_target_user"
on public.user_category_access
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  and granted_by = auth.uid()
  and user_id is not null
  and category_id is not null
  and exists (select 1 from public.profiles p where p.id = user_id)
  and exists (
    select 1
    from public.categories c
    where c.id = category_id
      and c.is_active = true
  )
);

create policy "admins_update_access_for_target_user"
on public.user_category_access
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (
  public.is_admin(auth.uid())
  and granted_by = auth.uid()
  and user_id is not null
);

revoke delete on public.user_category_access from authenticated;
grant select, insert, update on public.user_category_access to authenticated;

commit;

-- Diagnostico opcional de vinculos antiguos:
-- select uca.*
-- from public.user_category_access uca
-- left join public.categories c on c.id = uca.category_id
-- where uca.status = 'active'
--   and (uca.category_id is null or c.id is null);
