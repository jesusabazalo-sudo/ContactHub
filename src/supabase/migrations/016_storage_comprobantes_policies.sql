-- ContactHub - refuerzo de storage para comprobantes Yape/Plin.

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do update set public = false;

drop policy if exists "upload_comprobantes" on storage.objects;
create policy "upload_comprobantes"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'comprobantes'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "admin_read_comprobantes" on storage.objects;
create policy "admin_read_comprobantes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'comprobantes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  )
);
