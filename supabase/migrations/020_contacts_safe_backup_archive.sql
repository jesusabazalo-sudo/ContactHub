-- Safe ContactHub contact maintenance.
-- This migration affects only public.contacts and dynamically-created contacts_backup_* tables.

begin;

alter table public.contacts
  add column if not exists is_active boolean default true,
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_at timestamptz default now();

create or replace function public.backup_contacts_snapshot()
returns table(backup_table text, backed_up_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  table_name text := 'contacts_backup_' || to_char(clock_timestamp(), 'YYYYMMDD_HH24MI');
  row_count bigint;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Solo un administrador puede respaldar contactos.';
  end if;

  while to_regclass('public.' || table_name) is not null loop
    table_name := 'contacts_backup_' || to_char(clock_timestamp(), 'YYYYMMDD_HH24MISS');
  end loop;

  execute format('create table public.%I as select * from public.contacts', table_name);
  execute format('select count(*) from public.%I', table_name) into row_count;

  return query select table_name, row_count;
end;
$$;

create or replace function public.archive_contacts_after_backup(p_backup_table text)
returns table(archived_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count bigint;
  backup_count bigint;
  affected bigint;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Solo un administrador puede archivar contactos.';
  end if;

  if p_backup_table !~ '^contacts_backup_[0-9]{8}_[0-9]{4,6}$' then
    raise exception 'Nombre de backup inválido.';
  end if;

  if to_regclass('public.' || p_backup_table) is null then
    raise exception 'El backup % no existe.', p_backup_table;
  end if;

  select count(*) into current_count from public.contacts;
  execute format('select count(*) from public.%I', p_backup_table) into backup_count;

  if backup_count < current_count then
    raise exception 'Backup incompleto: contiene %, pero contacts contiene %.', backup_count, current_count;
  end if;

  update public.contacts
  set
    status = 'inactive',
    is_active = false,
    deleted_at = coalesce(deleted_at, now()),
    updated_at = now()
  where deleted_at is null
     or is_active is distinct from false
     or status is distinct from 'inactive';

  get diagnostics affected = row_count;
  return query select affected;
end;
$$;

revoke all on function public.backup_contacts_snapshot() from public, anon;
revoke all on function public.archive_contacts_after_backup(text) from public, anon;
grant execute on function public.backup_contacts_snapshot() to authenticated;
grant execute on function public.archive_contacts_after_backup(text) to authenticated;

commit;
