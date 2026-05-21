-- ContactHub - Fase 3: schema and security base for Supabase.
-- Run this file in Supabase SQL Editor as the project owner/postgres role.
-- Do not expose service_role keys in the frontend.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.mask_phone(input_phone text)
returns text
language sql
immutable
as $$
  select case
    when input_phone is null or length(trim(input_phone)) = 0 then null
    when input_phone ~ '^\+[0-9]{1,3}' then regexp_replace(input_phone, '^(\+[0-9]{1,3}).*$', '\1 ••• ••• •••')
    else '••• ••• •••'
  end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  short_description text not null default '',
  icon text not null default 'Folder',
  contacts_count integer not null default 0 check (contacts_count >= 0),
  tags text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_top boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  name text not null,
  description text not null default '',
  phone text not null,
  phone_masked text not null,
  country_flag text,
  country_code text,
  tags text[] not null default '{}',
  source text,
  status text not null default 'review' check (status in ('active', 'inactive', 'review', 'rejected')),
  risk_level text not null default 'review' check (risk_level in ('safe', 'review', 'prohibited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(10,2) not null check (price >= 0),
  folder_limit integer,
  is_total_access boolean not null default false,
  description text not null default '',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_total_access = true or folder_limit is not null)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked', 'expired')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_category_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create table if not exists public.trial_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_ids uuid[] not null default '{}',
  claimed_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  session_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_active on public.categories(is_active);
create index if not exists idx_contacts_category_id on public.contacts(category_id);
create index if not exists idx_contacts_status_risk on public.contacts(status, risk_level);
create index if not exists idx_purchases_user_status on public.purchases(user_id, status);
create index if not exists idx_user_category_access_user_status on public.user_category_access(user_id, status);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_subcategories_updated_at on public.subcategories;
create trigger set_subcategories_updated_at
before update on public.subcategories
for each row execute function public.set_updated_at();

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_plans_updated_at on public.plans;
create trigger set_plans_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

drop trigger if exists set_purchases_updated_at on public.purchases;
create trigger set_purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

drop trigger if exists set_user_category_access_updated_at on public.user_category_access;
create trigger set_user_category_access_updated_at
before update on public.user_category_access
for each row execute function public.set_updated_at();

create or replace function public.set_contact_phone_mask()
returns trigger
language plpgsql
as $$
begin
  new.phone_masked = coalesce(nullif(new.phone_masked, ''), public.mask_phone(new.phone));
  return new;
end;
$$;

drop trigger if exists set_contact_phone_mask_before_write on public.contacts;
create trigger set_contact_phone_mask_before_write
before insert or update of phone, phone_masked on public.contacts
for each row execute function public.set_contact_phone_mask();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_contacthub_profile on auth.users;
create trigger on_auth_user_created_contacthub_profile
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = is_admin.user_id
      and ur.role = 'admin'
  );
$$;

create or replace function public.has_category_access(user_id uuid, category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin(has_category_access.user_id)
    or exists (
      select 1
      from public.user_category_access uca
      where uca.user_id = has_category_access.user_id
        and uca.category_id = has_category_access.category_id
        and uca.status = 'active'
    )
    or exists (
      select 1
      from public.purchases p
      join public.plans pl on pl.id = p.plan_id
      where p.user_id = has_category_access.user_id
        and p.status = 'active'
        and (p.expires_at is null or p.expires_at > now())
        and (
          p.category_id = has_category_access.category_id
          or pl.is_total_access = true
        )
    );
$$;

create or replace function public.promote_user_to_admin_by_email(email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if email is null or length(trim(email)) = 0 then
    raise exception 'Email is required';
  end if;

  select au.id
  into target_user_id
  from auth.users au
  where lower(au.email) = lower(trim(email))
  limit 1;

  if target_user_id is null then
    raise exception 'No auth user found for email %', email;
  end if;

  insert into public.user_roles (user_id, role)
  values (target_user_id, 'admin')
  on conflict (user_id) do update
    set role = 'admin';

  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    null,
    'promote_user_to_admin_by_email',
    'user',
    target_user_id,
    jsonb_build_object('email', lower(trim(email)), 'source', 'supabase_sql_editor')
  );

  return target_user_id;
end;
$$;

-- Public preview view: never includes contacts.phone.
create or replace view public.contact_public_preview
with (security_barrier = true)
as
select
  c.id,
  c.category_id,
  c.subcategory_id,
  c.name,
  c.description,
  c.phone_masked,
  c.country_flag,
  c.country_code,
  c.tags,
  c.created_at,
  c.updated_at
from public.contacts c
where c.status = 'active'
  and c.risk_level = 'safe';

-- Authenticated private view: includes phone only when has_category_access() is true.
create or replace view public.contact_unlocked_secure
with (security_barrier = true)
as
select
  c.id,
  c.category_id,
  c.subcategory_id,
  c.name,
  c.description,
  c.phone,
  c.phone_masked,
  c.country_flag,
  c.country_code,
  c.tags,
  c.created_at,
  c.updated_at
from public.contacts c
where c.status = 'active'
  and c.risk_level = 'safe'
  and auth.uid() is not null
  and public.has_category_access(auth.uid(), c.category_id);

-- Admin review view: includes prohibited/review contacts only for admins.
create or replace view public.admin_contacts_secure
with (security_barrier = true)
as
select
  c.*
from public.contacts c
where auth.uid() is not null
  and public.is_admin(auth.uid());

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.contacts enable row level security;
alter table public.plans enable row level security;
alter table public.purchases enable row level security;
alter table public.user_category_access enable row level security;
alter table public.trial_claims enable row level security;
alter table public.audit_logs enable row level security;
alter table public.chat_messages enable row level security;

alter table public.profiles force row level security;
alter table public.user_roles force row level security;
alter table public.categories force row level security;
alter table public.contacts force row level security;
alter table public.purchases force row level security;
alter table public.user_category_access force row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_roles_admin_insert" on public.user_roles;
create policy "user_roles_admin_insert"
on public.user_roles
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "user_roles_admin_update" on public.user_roles;
create policy "user_roles_admin_update"
on public.user_roles
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "user_roles_admin_delete" on public.user_roles;
create policy "user_roles_admin_delete"
on public.user_roles
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "categories_public_active_select" on public.categories;
create policy "categories_public_active_select"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "categories_admin_manage" on public.categories;
create policy "categories_admin_manage"
on public.categories
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "subcategories_public_active_category_select" on public.subcategories;
create policy "subcategories_public_active_category_select"
on public.subcategories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.categories c
    where c.id = subcategories.category_id
      and c.is_active = true
  )
);

drop policy if exists "subcategories_admin_manage" on public.subcategories;
create policy "subcategories_admin_manage"
on public.subcategories
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "contacts_public_safe_preview_select" on public.contacts;
create policy "contacts_public_safe_preview_select"
on public.contacts
for select
to anon, authenticated
using (
  status = 'active'
  and risk_level = 'safe'
  and exists (
    select 1
    from public.categories c
    where c.id = contacts.category_id
      and c.is_active = true
  )
);

drop policy if exists "contacts_authenticated_unlocked_select" on public.contacts;
create policy "contacts_authenticated_unlocked_select"
on public.contacts
for select
to authenticated
using (
  status = 'active'
  and risk_level = 'safe'
  and public.has_category_access(auth.uid(), category_id)
);

drop policy if exists "contacts_admin_manage" on public.contacts;
create policy "contacts_admin_manage"
on public.contacts
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "plans_public_select" on public.plans;
create policy "plans_public_select"
on public.plans
for select
to anon, authenticated
using (true);

drop policy if exists "plans_admin_manage" on public.plans;
create policy "plans_admin_manage"
on public.plans
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "purchases_select_own_or_admin" on public.purchases;
create policy "purchases_select_own_or_admin"
on public.purchases
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "purchases_user_create_pending_own" on public.purchases;
create policy "purchases_user_create_pending_own"
on public.purchases
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and granted_by is null
  and granted_at is null
);

drop policy if exists "purchases_admin_manage" on public.purchases;
create policy "purchases_admin_manage"
on public.purchases
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "user_category_access_select_own_or_admin" on public.user_category_access;
create policy "user_category_access_select_own_or_admin"
on public.user_category_access
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_category_access_admin_manage" on public.user_category_access;
create policy "user_category_access_admin_manage"
on public.user_category_access
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "trial_claims_select_own_or_admin" on public.trial_claims;
create policy "trial_claims_select_own_or_admin"
on public.trial_claims
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "trial_claims_insert_own" on public.trial_claims;
create policy "trial_claims_insert_own"
on public.trial_claims
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "audit_logs_admin_select" on public.audit_logs;
create policy "audit_logs_admin_select"
on public.audit_logs
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "audit_logs_admin_insert" on public.audit_logs;
create policy "audit_logs_admin_insert"
on public.audit_logs
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "chat_messages_insert_public" on public.chat_messages;
create policy "chat_messages_insert_public"
on public.chat_messages
for insert
to anon, authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "chat_messages_select_own_or_admin" on public.chat_messages;
create policy "chat_messages_select_own_or_admin"
on public.chat_messages
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant select on public.subcategories to anon, authenticated;
grant insert, update, delete on public.subcategories to authenticated;
grant select on public.plans to anon, authenticated;
grant insert, update, delete on public.plans to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.user_roles to authenticated;

grant select (id, category_id, subcategory_id, name, description, phone_masked, country_flag, country_code, tags, status, risk_level, created_at, updated_at)
on public.contacts to anon, authenticated;
grant insert, update, delete on public.contacts to authenticated;

grant select, insert on public.purchases to authenticated;
grant update, delete on public.purchases to authenticated;
grant select on public.user_category_access to authenticated;
grant insert, update, delete on public.user_category_access to authenticated;
grant select, insert on public.trial_claims to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant insert on public.chat_messages to anon, authenticated;
grant select on public.chat_messages to authenticated;

grant select on public.contact_public_preview to anon, authenticated;
grant select on public.contact_unlocked_secure to authenticated;
grant select on public.admin_contacts_secure to authenticated;

grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.has_category_access(uuid, uuid) to authenticated;
grant execute on function public.mask_phone(text) to authenticated;
revoke execute on function public.promote_user_to_admin_by_email(text) from public, anon, authenticated;

insert into public.plans (name, price, folder_limit, is_total_access, description, is_featured)
values
  ('Carpeta Individual', 20, 1, false, 'Una decision pequena. Un resultado que puede cambiar lo que estas buscando.', false),
  ('Starter', 65, 4, false, 'Para los que ya saben que una sola no alcanza.', false),
  ('Fast Track', 99, 7, false, 'Las 7 carpetas que mas resultados dan. Curadas. Sin adivinar.', true),
  ('Power', 150, 10, false, 'Cuando quieres tener opciones de verdad, no solo una.', false),
  ('Elite Total', 360, null, true, 'Para los que entienden que la informacion correcta vale mas que lo que cuesta.', true)
on conflict do nothing;

insert into public.categories (name, slug, icon, description, short_description, tags, is_active, is_featured, is_new, is_top)
values
  ('Corporate & Negocios', 'corporate-negocios', 'BriefcaseBusiness', 'Servicios empresariales, ventas, gestion, ideas comerciales y oportunidades para negocios.', 'Servicios, ventas y oportunidades empresariales.', array['empresa','ventas','emprendimiento','legal'], true, true, false, true),
  ('Inteligencia Artificial & Tech', 'inteligencia-artificial-tech', 'Bot', 'IA, automatizacion, herramientas digitales, agentes, prompts y servicios tecnologicos utiles.', 'IA, prompts, automatizacion y tecnologia aplicada.', array['ia','automatizacion','prompts','tech'], true, true, true, true),
  ('Educacion, Cursos & Libros', 'educacion-cursos-libros', 'GraduationCap', 'Cursos, ebooks, capacitacion, recursos academicos y material formativo.', 'Cursos, ebooks y capacitacion organizada.', array['cursos','ebooks','capacitacion','educacion'], true, true, false, true),
  ('Fitness, Salud & Nutricion', 'fitness-salud-nutricion', 'Activity', 'Bienestar, entrenamiento, nutricion, recetas y servicios que deben revisarse con criterio.', 'Bienestar, entrenamiento y nutricion.', array['fitness','salud','nutricion','bienestar'], true, false, false, false),
  ('Diseno, Creatividad & Recursos', 'diseno-creatividad-recursos', 'Palette', 'Plantillas, diseno, recursos creativos, edicion, branding y mockups.', 'Plantillas, diseno y recursos creativos.', array['diseno','canva','plantillas','logos'], true, true, false, true),
  ('Gaming, Streaming & Entretenimiento', 'gaming-streaming-entretenimiento', 'Gamepad2', 'Recursos para contenido, entretenimiento, streaming y comunidades digitales.', 'Gaming, streaming y entretenimiento digital.', array['gaming','streaming','entretenimiento','comunidad'], true, false, true, false),
  ('Marketing Digital & Crecimiento', 'marketing-digital-crecimiento', 'Megaphone', 'Marketing, contenido, ventas, CRM, anuncios, redes sociales y crecimiento digital.', 'Marketing, contenido, ventas y crecimiento.', array['marketing','ventas','crm','redes'], true, true, false, true),
  ('Deportes, Manualidades & Hobbies', 'deportes-manualidades-hobbies', 'Sparkles', 'Ideas, recursos y contactos para hobbies, manualidades, deportes y nichos.', 'Hobbies, manualidades y nichos activos.', array['deportes','manualidades','hobbies','nicho'], true, false, false, false),
  ('Reparaciones Tecnicas & Oficios', 'reparaciones-tecnicas-oficios', 'Wrench', 'Servicios tecnicos, oficios, reparacion de equipos y soporte operativo.', 'Tecnicos, oficios y reparacion.', array['tecnico','reparacion','oficios','servicio'], true, false, false, false),
  ('Espiritualidad, Familia & Bienestar', 'espiritualidad-familia-bienestar', 'HeartHandshake', 'Recursos de bienestar personal, familia y espiritualidad con revision sensible.', 'Familia, bienestar y acompanamiento.', array['familia','bienestar','espiritualidad','acompanamiento'], true, false, false, false),
  ('Varios & Bonus', 'varios-bonus', 'PackagePlus', 'Recursos utiles que no encajan en una sola linea.', 'Recursos utiles variados.', array['bonus','recursos','varios','oportunidades'], true, false, false, false),
  ('Power Money & Negocios Escalables', 'power-money-negocios-escalables', 'TrendingUp', 'Ideas comerciales, modelos escalables y recursos de negocio.', 'Modelos, ideas y oportunidades escalables.', array['negocios','escalable','ventas','modelo'], true, true, false, false),
  ('Mentes Maestras & Alto Rendimiento', 'mentes-maestras-alto-rendimiento', 'Brain', 'Productividad, aprendizaje, estrategia, enfoque y rendimiento personal.', 'Productividad, enfoque y estrategia personal.', array['productividad','estrategia','rendimiento','aprendizaje'], true, false, true, false),
  ('Content Kings & Viral Lab', 'content-kings-viral-lab', 'Clapperboard', 'Contenido, formatos virales, edicion, ideas, guiones y produccion digital.', 'Contenido, guiones, edicion y formatos virales.', array['contenido','viral','edicion','guiones'], true, true, true, true),
  ('Audio Masters & Musica', 'audio-masters-musica', 'Music2', 'Audio, produccion musical, voces, edicion y servicios de sonido.', 'Produccion, audio y musica digital.', array['musica','audio','produccion','streaming'], true, false, false, false),
  ('Gamer Elite & Vicios Digitales', 'gamer-elite-vicios-digitales', 'Joystick', 'Gaming, comunidades, entretenimiento y productos digitales.', 'Gaming avanzado y productos digitales.', array['gamer','digital','comunidad','entretenimiento'], true, false, false, false),
  ('Herramientas Digitales', 'herramientas-digitales', 'Laptop', 'Herramientas, software, recursos operativos y soluciones digitales legales.', 'Software, recursos y utilidades digitales.', array['herramientas','software','recursos','productividad'], true, true, false, true),
  ('Importacion & Mayoristas', 'importacion-mayoristas', 'Boxes', 'Proveedores, mayoristas, distribucion, importacion legal y stock.', 'Mayoristas, proveedores y stock.', array['proveedores','mayoristas','importacion','stock'], true, true, false, true),
  ('Tecnologia & Gadgets', 'tecnologia-gadgets', 'Cpu', 'Productos tecnologicos, accesorios, gadgets y oportunidades para revendedores.', 'Gadgets, accesorios y tecnologia util.', array['tecnologia','gadgets','accesorios','revendedores'], true, false, true, false),
  ('Moda, Belleza & Estilo', 'moda-belleza-estilo', 'Shirt', 'Moda, belleza, estilo, productos de catalogo y recursos para tiendas.', 'Moda, belleza y productos de estilo.', array['moda','belleza','estilo','revendedores'], true, false, false, false),
  ('Servicios Locales', 'servicios-locales', 'MapPin', 'Servicios locales, atencion directa y contactos que resuelven problemas puntuales.', 'Contactos utiles para necesidades locales.', array['local','servicios','atencion','negocio'], true, false, false, false),
  ('Recursos para Emprendedores', 'recursos-para-emprendedores', 'Rocket', 'Recursos, herramientas, proveedores y contactos para emprendedores.', 'Herramientas y contactos para emprender mejor.', array['emprendedores','recursos','herramientas','ventas'], true, true, false, true),
  ('Cursos Profesionales', 'cursos-profesionales', 'BookOpenCheck', 'Formacion profesional, capacitacion especializada y habilidades comerciales.', 'Capacitacion profesional y habilidades vendibles.', array['cursos','profesional','capacitacion','habilidades'], true, false, false, true),
  ('Plantillas, Sistemas & Automatizacion', 'plantillas-sistemas-automatizacion', 'Workflow', 'Plantillas, sistemas simples, automatizaciones y recursos operativos.', 'Plantillas, sistemas y automatizacion practica.', array['plantillas','sistemas','automatizacion','operaciones'], true, true, true, true),
  ('Bonus / Sin Clasificar', 'bonus-sin-clasificar', 'Archive', 'Recursos pendientes de clasificacion fina o validacion.', 'Recursos pendientes de clasificacion fina.', array['bonus','revision','recursos','clasificacion'], true, false, false, false)
on conflict (slug) do update
set name = excluded.name,
    icon = excluded.icon,
    description = excluded.description,
    short_description = excluded.short_description,
    tags = excluded.tags,
    is_active = excluded.is_active,
    is_featured = excluded.is_featured,
    is_new = excluded.is_new,
    is_top = excluded.is_top,
    updated_at = now();

commit;
