-- Permite que cada cliente lea solamente sus propios accesos activos.
-- Ejecutar en Supabase SQL Editor si /mis-contactos no resuelve accesos
-- que ya existen en public.user_category_access.

begin;

alter table public.user_category_access enable row level security;

drop policy if exists "users_read_own_active_access" on public.user_category_access;

create policy "users_read_own_active_access"
on public.user_category_access
for select
to authenticated
using (
  (user_id = auth.uid() and status = 'active')
  or public.is_admin(auth.uid())
);

grant select on public.user_category_access to authenticated;
grant select on public.categories to authenticated;
grant select on public.contact_unlocked_secure to authenticated;

commit;

-- Verificacion como referencia:
-- select user_id, category_id, status
-- from public.user_category_access
-- where user_id = auth.uid()
--   and status = 'active';
