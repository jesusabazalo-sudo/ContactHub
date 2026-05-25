-- ContactHub - seed/upsert official access folders for admin grants.
-- Run this complete file in Supabase SQL Editor.
-- Safe to run multiple times. It preserves existing category ids when sort_order or slug already match.

begin;

alter table public.categories
add column if not exists sort_order integer;

grant select on public.categories to anon, authenticated;
grant insert, update on public.categories to authenticated;

with official(sort_order, icon, name, slug, short_description, description, tags) as (
  values
    (1, '🔥', 'ELITE BUSINESS – Corporate & Negocios', 'elite-business', 'Corporate & Negocios', 'Contactos y oportunidades vinculadas al mundo empresarial, servicios corporativos y crecimiento comercial.', array['negocios','ventas','corporate','servicios']::text[]),
    (2, '🤖', 'IA MASTERS – Inteligencia Artificial', 'ia-masters', 'Inteligencia Artificial', 'Recursos y contactos orientados a inteligencia artificial, automatización y herramientas digitales.', array['ia','tech','automatización','productividad']::text[]),
    (3, '📚', 'KNOWLEDGE VAULT – Educación & Cursos', 'knowledge-vault', 'Educación & Cursos', 'Opciones vinculadas a aprendizaje, formación, clases, cursos, libros y desarrollo académico.', array['educación','cursos','libros','formación']::text[]),
    (4, '💪', 'FIT KINGDOM – Salud & Nutrición', 'fit-kingdom', 'Salud & Nutrición', 'Contactos relacionados con bienestar físico, nutrición, entrenamiento y hábitos saludables.', array['fitness','salud','nutrición','bienestar']::text[]),
    (5, '🎨', 'CREATIVE STUDIO – Diseño & Fotografía', 'creative-studio', 'Diseño & Fotografía', 'Recursos y contactos para diseño, fotografía, edición, creatividad visual y producción gráfica.', array['diseño','creatividad','fotografía','edición']::text[]),
    (6, '🎮', 'ENTERPLAY – Gaming & Streaming', 'enterplay', 'Gaming & Streaming', 'Opciones vinculadas a gaming, streaming, entretenimiento digital y comunidades online.', array['gaming','streaming','entretenimiento','comunidad']::text[]),
    (7, '🚀', 'SCALE UP – Marketing Digital', 'scale-up', 'Marketing Digital', 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.', array['marketing','ventas','redes sociales','crecimiento']::text[]),
    (8, '⚽', 'SPORTS LAB – Deportes & Manualidades', 'sports-lab', 'Deportes & Manualidades', 'Contactos y recursos para deportes específicos, hobbies, actividades manuales y comunidades especializadas.', array['deportes','manualidades','hobbies','actividades']::text[]),
    (9, '🛠️', 'TECH REPAIR – Reparaciones Técnicas', 'tech-repair', 'Reparaciones Técnicas', 'Contactos para reparaciones, soporte técnico, mantenimiento, oficios y soluciones prácticas.', array['reparaciones','técnico','oficios','mantenimiento']::text[]),
    (10, '🧘', 'SOUL REALM – Espiritualidad & Familia', 'soul-realm', 'Espiritualidad & Familia', 'Opciones relacionadas con espiritualidad, orientación personal, bienestar familiar y temas afines.', array['espiritualidad','familia','bienestar','orientación']::text[]),
    (11, '🌟', 'MISC BONUS – Varios', 'misc-bonus', 'Varios', 'Carpeta flexible con recursos variados, oportunidades bonus y contactos útiles difíciles de clasificar.', array['varios','bonus','recursos','oportunidades']::text[]),
    (12, '💰', 'CASH FLOW – Negocios Escalables', 'cash-flow', 'Negocios Escalables', 'Contactos y oportunidades vinculadas a negocios escalables, ideas comerciales y crecimiento económico.', array['dinero','negocios','escalable','oportunidades']::text[]),
    (13, '🧠', 'MIND POWER – Desarrollo Personal', 'mind-power', 'Desarrollo Personal', 'Recursos sobre productividad, enfoque, mentalidad, rendimiento personal y desarrollo aplicado.', array['alto rendimiento','mentalidad','productividad','enfoque']::text[]),
    (14, '🎬', 'VIRAL FACTORY – Contenido & Edición', 'viral-factory', 'Contenido & Edición', 'Contactos y recursos para creación de contenido, viralidad, edición, redes y producción digital.', array['contenido','viralidad','redes','producción']::text[]),
    (15, '🎧', 'BEAT STUDIO – Música & DJ', 'beat-studio', 'Música & DJ', 'Contactos para música, audio, streaming, beats, sonido, DJ, producción y recursos musicales.', array['música','audio','streaming','beats']::text[]),
    (16, '🎮', 'GAMER ZONE – Vicios Digitales', 'gamer-zone', 'Vicios Digitales', 'Opciones de gaming avanzado, entretenimiento digital, comunidades, recursos gamer y cultura digital.', array['gaming','digital','entretenimiento','gamer']::text[]),
    (17, '🙏', 'SACRED POWER – Espiritualidad', 'sacred-power', 'Espiritualidad', 'Contactos y recursos para crecimiento interior, bienestar emocional, enfoque personal y espiritualidad.', array['espiritualidad','bienestar','interior','enfoque']::text[]),
    (18, '⚠️', 'THE VAULT – Contenido Prohibido', 'the-vault', 'Contenido Prohibido', 'Carpeta restringida para clasificación interna y control de seguridad.', array['restringido','interno','seguridad']::text[]),
    (19, '👶', 'FAMILY CARE – Desarrollo Infantil', 'family-care', 'Desarrollo Infantil', 'Contactos para familia, educación infantil, crianza, aprendizaje temprano y desarrollo de niños.', array['familia','educación','infantil','crianza']::text[]),
    (20, '🔧', 'PRO TOOLS – Oficios & Herramientas', 'pro-tools', 'Oficios & Herramientas', 'Contactos relacionados con oficios, herramientas profesionales, servicios técnicos y soluciones de trabajo.', array['oficios','herramientas','servicios','trabajo']::text[]),
    (21, '🔬', 'SCIENCE DEEP – Conocimiento Avanzado', 'science-deep', 'Conocimiento Avanzado', 'Recursos especializados para ciencia, técnica, conocimiento avanzado, formación y aprendizaje profundo.', array['ciencia','técnica','conocimiento','formación']::text[]),
    (22, '💪', 'WARRIOR FIT – Fitness Extremo', 'warrior-fit', 'Fitness Extremo', 'Contactos y recursos para entrenamiento intenso, disciplina física, rendimiento y estilo de vida activo.', array['fitness','entrenamiento','disciplina','rendimiento']::text[]),
    (23, '🍳', 'CHEF GOLD – Gastronomía Élite', 'chef-gold', 'Gastronomía Élite', 'Contactos para cocina, gastronomía, alimentos, chef premium, insumos y oportunidades culinarias.', array['gastronomía','cocina','chef','alimentos']::text[]),
    (24, '🎁', 'BONUS HUNT – Tesoros Ocultos', 'bonus-hunt', 'Tesoros Ocultos', 'Recursos especiales, contactos bonus y oportunidades valiosas que no encajan en una sola categoría.', array['bonus','tesoros','recursos','especiales']::text[])
),
updated as (
  update public.categories c
  set
    name = o.name,
    slug = o.slug,
    icon = o.icon,
    short_description = o.short_description,
    description = o.description,
    tags = o.tags,
    sort_order = o.sort_order,
    is_active = true,
    updated_at = now()
  from official o
  where c.slug = o.slug
     or c.sort_order = o.sort_order
  returning c.id
)
insert into public.categories (
  name,
  slug,
  icon,
  short_description,
  description,
  tags,
  sort_order,
  is_active
)
select
  o.name,
  o.slug,
  o.icon,
  o.short_description,
  o.description,
  o.tags,
  o.sort_order,
  true
from official o
where not exists (
  select 1
  from public.categories c
  where c.slug = o.slug
     or c.sort_order = o.sort_order
);

create index if not exists idx_categories_sort_order on public.categories(sort_order, name);

commit;
