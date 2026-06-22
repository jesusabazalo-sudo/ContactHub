-- ContactHub - official 24-folder seed plus baseline production hardening.
-- Safe to run multiple times from Supabase SQL Editor.
-- It preserves existing category ids whenever slug or order already match.

begin;

create extension if not exists pgcrypto;

alter table public.categories
  add column if not exists sort_order integer,
  add column if not exists display_order integer,
  add column if not exists icon text default '📁',
  add column if not exists short_description text default '',
  add column if not exists description text default '',
  add column if not exists tags text[] default '{}',
  add column if not exists is_active boolean default true,
  add column if not exists updated_at timestamptz default now();

create temporary table official_contacthub_folders (
  display_order integer primary key,
  icon text not null,
  name text not null,
  subtitle text not null,
  slug text not null unique,
  short_description text not null,
  description text not null,
  tags text[] not null
) on commit drop;

insert into official_contacthub_folders (display_order, icon, name, subtitle, slug, short_description, description, tags)
values
  (1, '🔥', 'ELITE BUSINESS – Corporate & Negocios', 'Corporate & Negocios', 'elite-business', 'Corporate & Negocios', 'Contactos y oportunidades vinculadas al mundo empresarial, servicios corporativos y crecimiento comercial.', array['negocios','ventas','corporate','servicios']::text[]),
  (2, '🤖', 'IA MASTERS – Inteligencia Artificial', 'Inteligencia Artificial', 'ia-masters', 'Inteligencia Artificial', 'Recursos y contactos orientados a inteligencia artificial, automatización y herramientas digitales.', array['ia','tech','automatización','productividad']::text[]),
  (3, '📚', 'KNOWLEDGE VAULT – Educación & Cursos', 'Educación & Cursos', 'knowledge-vault', 'Educación & Cursos', 'Opciones vinculadas a aprendizaje, formación, clases, cursos, libros y desarrollo académico.', array['educación','cursos','libros','formación']::text[]),
  (4, '💪', 'FIT KINGDOM – Salud & Nutrición', 'Salud & Nutrición', 'fit-kingdom', 'Salud & Nutrición', 'Contactos relacionados con bienestar físico, nutrición, entrenamiento y hábitos saludables.', array['fitness','salud','nutrición','bienestar']::text[]),
  (5, '🎨', 'CREATIVE STUDIO – Diseño & Fotografía', 'Diseño & Fotografía', 'creative-studio', 'Diseño & Fotografía', 'Recursos y contactos para diseño, fotografía, edición, creatividad visual y producción gráfica.', array['diseño','creatividad','fotografía','edición']::text[]),
  (6, '🎮', 'ENTERPLAY – Gaming & Streaming', 'Gaming & Streaming', 'enterplay', 'Gaming & Streaming', 'Opciones vinculadas a gaming, streaming, entretenimiento digital y comunidades online.', array['gaming','streaming','entretenimiento','comunidad']::text[]),
  (7, '🚀', 'SCALE UP – Marketing Digital', 'Marketing Digital', 'scale-up', 'Marketing Digital', 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.', array['marketing','ventas','redes sociales','crecimiento']::text[]),
  (8, '⚽', 'SPORTS LAB – Deportes & Manualidades', 'Deportes & Manualidades', 'sports-lab', 'Deportes & Manualidades', 'Contactos y recursos para deportes específicos, hobbies, actividades manuales y comunidades especializadas.', array['deportes','manualidades','hobbies','actividades']::text[]),
  (9, '🛠️', 'TECH REPAIR – Reparaciones Técnicas', 'Reparaciones Técnicas', 'tech-repair', 'Reparaciones Técnicas', 'Contactos para reparaciones, soporte técnico, mantenimiento, oficios y soluciones prácticas.', array['reparaciones','técnico','oficios','mantenimiento']::text[]),
  (10, '🧘', 'SOUL REALM – Espiritualidad & Familia', 'Espiritualidad & Familia', 'soul-realm', 'Espiritualidad & Familia', 'Opciones relacionadas con espiritualidad, orientación personal, bienestar familiar y temas afines.', array['espiritualidad','familia','bienestar','orientación']::text[]),
  (11, '🌟', 'MISC BONUS – Varios', 'Varios', 'misc-bonus', 'Varios', 'Carpeta flexible con recursos variados, oportunidades bonus y contactos útiles difíciles de clasificar.', array['varios','bonus','recursos','oportunidades']::text[]),
  (12, '💰', 'CASH FLOW – Negocios Escalables', 'Negocios Escalables', 'cash-flow', 'Negocios Escalables', 'Contactos y oportunidades vinculadas a negocios escalables, ideas comerciales y crecimiento económico.', array['dinero','negocios','escalable','oportunidades']::text[]),
  (13, '🧠', 'MIND POWER – Desarrollo Personal', 'Desarrollo Personal', 'mind-power', 'Desarrollo Personal', 'Recursos sobre productividad, enfoque, mentalidad, rendimiento personal y desarrollo aplicado.', array['alto rendimiento','mentalidad','productividad','enfoque']::text[]),
  (14, '🎬', 'VIRAL FACTORY – Contenido & Edición', 'Contenido & Edición', 'viral-factory', 'Contenido & Edición', 'Contactos y recursos para creación de contenido, viralidad, edición, redes y producción digital.', array['contenido','viralidad','redes','producción']::text[]),
  (15, '🎧', 'BEAT STUDIO – Música & DJ', 'Música & DJ', 'beat-studio', 'Música & DJ', 'Contactos para música, audio, streaming, beats, sonido, DJ, producción y recursos musicales.', array['música','audio','streaming','beats']::text[]),
  (16, '🎮', 'GAMER ZONE – Vicios Digitales', 'Vicios Digitales', 'gamer-zone', 'Vicios Digitales', 'Opciones de gaming avanzado, entretenimiento digital, comunidades, recursos gamer y cultura digital.', array['gaming','digital','entretenimiento','gamer']::text[]),
  (17, '🙏', 'SACRED POWER – Espiritualidad', 'Espiritualidad', 'sacred-power', 'Espiritualidad', 'Contactos y recursos para crecimiento interior, bienestar emocional, enfoque personal y espiritualidad.', array['espiritualidad','bienestar','interior','enfoque']::text[]),
  (18, '⚠️', 'THE VAULT – Contenido Prohibido', 'Contenido Prohibido', 'the-vault', 'Contenido Prohibido', 'Carpeta restringida para clasificación interna y control de seguridad.', array['restringido','interno','seguridad']::text[]),
  (19, '👶', 'FAMILY CARE – Desarrollo Infantil', 'Desarrollo Infantil', 'family-care', 'Desarrollo Infantil', 'Contactos para familia, educación infantil, crianza, aprendizaje temprano y desarrollo de niños.', array['familia','educación','infantil','crianza']::text[]),
  (20, '🔧', 'PRO TOOLS – Oficios & Herramientas', 'Oficios & Herramientas', 'pro-tools', 'Oficios & Herramientas', 'Contactos relacionados con oficios, herramientas profesionales, servicios técnicos y soluciones de trabajo.', array['oficios','herramientas','servicios','trabajo']::text[]),
  (21, '🔬', 'SCIENCE DEEP – Conocimiento Avanzado', 'Conocimiento Avanzado', 'science-deep', 'Conocimiento Avanzado', 'Recursos especializados para ciencia, técnica, conocimiento avanzado, formación y aprendizaje profundo.', array['ciencia','técnica','conocimiento','formación']::text[]),
  (22, '💪', 'WARRIOR FIT – Fitness Extremo', 'Fitness Extremo', 'warrior-fit', 'Fitness Extremo', 'Contactos y recursos para entrenamiento intenso, disciplina física, rendimiento y estilo de vida activo.', array['fitness','entrenamiento','disciplina','rendimiento']::text[]),
  (23, '🍳', 'CHEF GOLD – Gastronomía Élite', 'Gastronomía Élite', 'chef-gold', 'Gastronomía Élite', 'Contactos para cocina, gastronomía, alimentos, chef premium, insumos y oportunidades culinarias.', array['gastronomía','cocina','chef','alimentos']::text[]),
  (24, '🎁', 'BONUS HUNT – Tesoros Ocultos', 'Tesoros Ocultos', 'bonus-hunt', 'Tesoros Ocultos', 'Recursos especiales, contactos bonus y oportunidades valiosas que no encajan en una sola categoría.', array['bonus','tesoros','recursos','especiales']::text[]);

-- Update existing rows by stable order first. This keeps the current ids and contacts.
update public.categories c
set
  slug = f.slug,
  name = f.name,
  icon = f.icon,
  short_description = f.short_description,
  description = f.description,
  tags = f.tags,
  sort_order = f.display_order,
  display_order = f.display_order,
  is_active = true,
  updated_at = now()
from official_contacthub_folders f
where c.sort_order = f.display_order
  and not exists (
    select 1
    from public.categories other
    where other.slug = f.slug
      and other.id <> c.id
  );

-- Update any rows already carrying the official slug.
update public.categories c
set
  name = f.name,
  icon = f.icon,
  short_description = f.short_description,
  description = f.description,
  tags = f.tags,
  sort_order = f.display_order,
  display_order = f.display_order,
  is_active = true,
  updated_at = now()
from official_contacthub_folders f
where c.slug = f.slug;

insert into public.categories (
  name,
  slug,
  icon,
  short_description,
  description,
  tags,
  sort_order,
  display_order,
  is_active
)
select
  f.name,
  f.slug,
  f.icon,
  f.short_description,
  f.description,
  f.tags,
  f.display_order,
  f.display_order,
  true
from official_contacthub_folders f
where not exists (
  select 1
  from public.categories c
  where c.slug = f.slug
     or c.sort_order = f.display_order
);

-- Keep duplicate rows available for historical FKs, but remove them from active selectors.
with duplicate_slugs as (
  select
    c.id,
    row_number() over (
      partition by c.slug
      order by
        case when f.slug is not null then 0 else 1 end,
        coalesce(c.updated_at, c.created_at, now()) asc,
        c.id
    ) as rn
  from public.categories c
  left join official_contacthub_folders f on f.slug = c.slug
  where c.slug is not null
)
update public.categories c
set
  slug = c.slug || '-legacy-' || left(c.id::text, 8),
  is_active = false,
  updated_at = now()
from duplicate_slugs d
where c.id = d.id
  and d.rn > 1;

create unique index if not exists categories_slug_unique_idx on public.categories(slug);
create index if not exists idx_categories_display_order on public.categories(display_order, is_active);
create index if not exists idx_categories_sort_order_active on public.categories(sort_order, is_active);

-- Baseline grants. RLS policies still decide row visibility.
grant select on public.categories to anon, authenticated;
grant select on public.contact_public_preview to anon, authenticated;
grant select on public.contact_unlocked_secure to authenticated;
grant select on public.admin_contacts_secure to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.user_category_access to authenticated;
grant select, insert, update on public.purchases to authenticated;
grant select, insert on public.trial_claims to authenticated;
grant select, insert, update on public.chat_messages to authenticated;

-- Ensure payment receipts exists before policies reference it. The full table/bucket
-- definition still lives in 009_payment_receipts.sql.
do $$
begin
  if to_regclass('public.payment_receipts') is not null then
    execute 'grant select, insert, update on public.payment_receipts to authenticated';
  end if;
end $$;

commit;
