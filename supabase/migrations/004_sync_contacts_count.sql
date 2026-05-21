-- ContactHub - Keep categories.contacts_count synchronized with active contacts.
-- Run this complete file in Supabase SQL Editor after 003_category_sort_order.sql.

begin;

create or replace function public.sync_category_contacts_count()
returns trigger
language plpgsql
as $$
declare
  affected_category_id uuid;
begin
  affected_category_id := coalesce(new.category_id, old.category_id);

  update public.categories
  set contacts_count = (
    select count(*)
    from public.contacts
    where category_id = affected_category_id
      and status = 'active'
  )
  where id = affected_category_id;

  if tg_op = 'UPDATE' and old.category_id is distinct from new.category_id then
    update public.categories
    set contacts_count = (
      select count(*)
      from public.contacts
      where category_id = old.category_id
        and status = 'active'
    )
    where id = old.category_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_contacts_count on public.contacts;
create trigger trg_sync_contacts_count
after insert or update or delete on public.contacts
for each row execute function public.sync_category_contacts_count();

update public.categories c
set contacts_count = (
  select count(*)
  from public.contacts ct
  where ct.category_id = c.id
    and ct.status = 'active'
);

commit;
