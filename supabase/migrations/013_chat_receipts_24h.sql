-- ContactHub - chat renovable cada 24h y comprobantes adjuntos.

alter table public.chat_messages
add column if not exists expires_at timestamptz default (now() + interval '24 hours'),
add column if not exists has_attachment boolean default false,
add column if not exists attachment_url text,
add column if not exists attachment_type text,
add column if not exists comprobante_status text default 'pendiente'
  check (comprobante_status in ('pendiente', 'verificado', 'rechazado'));

create or replace function public.cleanup_old_chat_messages()
returns void
language plpgsql
as $$
begin
  delete from public.chat_messages
  where expires_at < now()
    and sender = 'user'
    and message not ilike '%comprobante%'
    and message not ilike '%pago%'
    and message not ilike '%yape%'
    and message not ilike '%plin%'
    and coalesce(has_attachment, false) = false;
end;
$$;

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

drop policy if exists "comprobantes_user_upload" on storage.objects;
create policy "comprobantes_user_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'comprobantes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "comprobantes_user_read_own_or_admin" on storage.objects;
create policy "comprobantes_user_read_own_or_admin"
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

create index if not exists idx_chat_messages_24h
  on public.chat_messages(user_id, created_at desc);

create index if not exists idx_chat_messages_attachments
  on public.chat_messages(has_attachment, created_at desc);
