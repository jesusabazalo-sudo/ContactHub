alter table public.categories add column if not exists sort_order integer;

with official_categories(sort_order, icon, name, slug, description, short_description, tags) as (
  values
    (1, '🏢', 'CORPORATE & NEGOCIOS', 'corporate-negocios', 'Contactos para servicios empresariales, ventas, gestión, ideas comerciales y oportunidades para negocios en marcha.', 'Contactos comerciales y oportunidades de negocio.', array['negocios','ventas','corporate']::text[]),
    (2, '🤖', 'INTELIGENCIA ARTIFICIAL (IA) & HERRAMIENTAS TECH', 'inteligencia-artificial-tech', 'Recursos, herramientas y contactos relacionados con inteligencia artificial, automatización y tecnología.', 'IA, automatización y herramientas tech.', array['ia','tech','automatización']::text[]),
    (3, '📚', 'EDUCACIÓN, CURSOS & LIBROS', 'educacion-cursos-libros', 'Contactos relacionados con cursos, libros, ebooks, clases y recursos educativos digitales.', 'Cursos, libros y recursos educativos.', array['educación','cursos','libros']::text[]),
    (4, '💪', 'FITNESS, SALUD & NUTRICIÓN', 'fitness-salud-nutricion', 'Contactos para fitness, salud, nutrición, bienestar físico y hábitos saludables.', 'Fitness, salud y nutrición.', array['fitness','salud','nutrición']::text[]),
    (5, '🎨', 'CREATIVIDAD, DISEÑO & FOTOGRAFÍA', 'creatividad-diseno-fotografia', 'Contactos de diseño, creatividad, fotografía, edición y recursos visuales.', 'Diseño, creatividad y fotografía.', array['diseño','creatividad','fotografía']::text[]),
    (6, '🎮', 'GAMING, ENTRETENIMIENTO & STREAMING', 'gaming-entretenimiento-streaming', 'Contactos vinculados a gaming, entretenimiento digital, streaming y comunidades online.', 'Gaming, streaming y entretenimiento.', array['gaming','streaming','entretenimiento']::text[]),
    (7, '🚀', 'MARKETING DIGITAL & CRECIMIENTO', 'marketing-digital-crecimiento', 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.', 'Marketing, ventas y crecimiento.', array['marketing','ventas','redes sociales']::text[]),
    (8, '⚽', 'DEPORTES ESPECÍFICOS & MANUALIDADES', 'deportes-manualidades', 'Contactos de deportes, hobbies, manualidades y actividades especializadas.', 'Deportes, hobbies y manualidades.', array['deportes','hobbies','manualidades']::text[]),
    (9, '🛠️', 'REPARACIONES TÉCNICAS & OFICIOS', 'reparaciones-tecnicas-oficios', 'Contactos para reparaciones, oficios, soporte técnico y servicios prácticos.', 'Reparaciones, soporte y oficios.', array['oficios','reparaciones','técnico']::text[]),
    (10, '🔮', 'ESPIRITUALIDAD, OCULTISMO & FAMILIA', 'espiritualidad-ocultismo-familia', 'Contactos relacionados con espiritualidad, bienestar familiar, orientación y temas afines.', 'Espiritualidad, familia y bienestar.', array['espiritualidad','familia','bienestar']::text[]),
    (11, '🌟', 'VARIOS & BONUS', 'varios-bonus', 'Carpeta flexible con recursos variados y contactos bonus de utilidad comercial.', 'Recursos variados y bonus.', array['varios','bonus','recursos']::text[]),
    (12, '🔥', 'POWER MONEY & NEGOCIOS ESCALABLES', 'power-money-negocios-escalables', 'Contactos enfocados en oportunidades, negocios escalables, dinero y crecimiento comercial.', 'Negocios escalables y oportunidades.', array['dinero','negocios','escalable']::text[]),
    (13, '🧠', 'MENTES MAESTRAS & ALTO RENDIMIENTO', 'mentes-maestras-alto-rendimiento', 'Contactos sobre productividad, mentalidad, alto rendimiento y desarrollo personal aplicado.', 'Productividad y alto rendimiento.', array['alto rendimiento','mentalidad','productividad']::text[]),
    (14, '🎬', 'CONTENT KINGS & VIRAL LAB', 'content-kings-viral-lab', 'Contactos para contenido, viralidad, edición, redes y producción digital.', 'Contenido, viralidad y producción.', array['contenido','viral','redes']::text[]),
    (15, '🎧', 'AUDIO MASTERS & MÚSICA INFINITA', 'audio-masters-musica', 'Contactos de música, audio, streaming, beats, sonido y recursos musicales.', 'Música, audio y streaming.', array['música','audio','streaming']::text[]),
    (16, '🎮', 'GAMER ELITE & VICIOS DIGITALES', 'gamer-elite-vicios-digitales', 'Contactos de gaming avanzado, entretenimiento digital, comunidades y recursos gamer.', 'Gaming avanzado y recursos digitales.', array['gaming','digital','entretenimiento']::text[]),
    (17, '🧘', 'ESPIRITUALIDAD & PODER INTERIOR', 'espiritualidad-poder-interior', 'Contactos de espiritualidad, crecimiento interior, bienestar emocional y enfoque personal.', 'Espiritualidad y poder interior.', array['espiritualidad','bienestar','interior']::text[]),
    (18, '🚫', 'PROHIBIDO ⚠️', 'prohibido', 'Carpeta restringida para clasificación interna. No debe exponerse a usuarios normales.', 'Carpeta restringida interna.', array['restringido','interno']::text[]),
    (19, '👶', 'FAMILIA, EDUCACIÓN & DESARROLLO INFANTIL', 'familia-educacion-desarrollo-infantil', 'Contactos para familia, educación infantil, crianza, aprendizaje y desarrollo de niños.', 'Familia y desarrollo infantil.', array['familia','infantil','educación']::text[]),
    (20, '🛠️', 'OFICIOS & HERRAMIENTAS PRO', 'oficios-herramientas-pro', 'Contactos para oficios, herramientas profesionales, servicios técnicos y soluciones prácticas.', 'Oficios y herramientas profesionales.', array['oficios','herramientas','servicios']::text[]),
    (21, '🧬', 'CIENCIA, TÉCNICA & CONOCIMIENTO AVANZADO', 'ciencia-tecnica-conocimiento-avanzado', 'Contactos relacionados con conocimiento técnico, ciencia, formación avanzada y recursos especializados.', 'Ciencia, técnica y conocimiento.', array['ciencia','técnica','conocimiento']::text[]),
    (22, '🏋️', 'FITNESS WARRIOR & GUERREROS MODERNOS', 'fitness-warrior-guerreros-modernos', 'Contactos de fitness intenso, entrenamiento, salud física y estilo de vida activo.', 'Entrenamiento, fitness y disciplina.', array['fitness','entrenamiento','salud']::text[]),
    (23, '🍳', 'CHEF PREMIUM & GASTRONOMÍA ELITE', 'chef-premium-gastronomia-elite', 'Contactos para gastronomía, cocina, alimentos, chef premium y oportunidades culinarias.', 'Gastronomía, cocina y alimentos.', array['gastronomía','cocina','chef']::text[]),
    (24, '📦', 'BONUS TRACK & TESOROS OCULTOS', 'bonus-track-tesoros-ocultos', 'Contactos bonus, recursos especiales y oportunidades difíciles de clasificar.', 'Recursos bonus y oportunidades ocultas.', array['bonus','recursos','oportunidades']::text[]),
    (25, '🔥', 'ACCESO TOTAL — 246 CONTACTOS ESTRATÉGICOS PREMIUM', 'acceso-total-contactos-premium', 'Carpeta de referencia para acceso total, contactos estratégicos y paquetes premium.', 'Acceso total y contactos premium.', array['premium','acceso total','estratégico']::text[])
)
insert into public.categories (sort_order, icon, name, slug, description, short_description, tags, is_active, is_featured, is_new, is_top)
select sort_order, icon, name, slug, description, short_description, tags, true, false, false, false
from official_categories
on conflict (slug) do update set
  sort_order = excluded.sort_order,
  icon = excluded.icon,
  name = excluded.name,
  description = excluded.description,
  short_description = excluded.short_description,
  tags = excluded.tags,
  is_active = true,
  updated_at = now();
