-- ContactHub - comprobantes guardan ruta privada y metadatos, no signedUrl permanente.

alter table public.chat_messages
add column if not exists attachment_path text,
add column if not exists attachment_name text,
add column if not exists attachment_size bigint;

update public.chat_messages
set attachment_path = attachment_url
where has_attachment = true
  and attachment_path is null
  and attachment_url is not null
  and attachment_url not like 'http%'
  and attachment_url not like 'blob:%';

create index if not exists idx_chat_messages_attachment_path
  on public.chat_messages(attachment_path)
  where has_attachment = true;
