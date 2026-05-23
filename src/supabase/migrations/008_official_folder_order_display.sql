-- ContactHub - official folder order and display metadata.
-- Safe to run multiple times. It preserves existing category ids and contacts.

with official(sort_order, icon, name, slug, short_description, description, tags) as (
  values
    (1, '🏢', 'CORPORATE & NEGOCIOS', 'corporate-negocios', 'Mundo empresarial, servicios corporativos y crecimiento comercial.', 'Contactos y oportunidades vinculadas al mundo empresarial, servicios corporativos y crecimiento comercial.', array['negocios','ventas','corporate','servicios']::text[]),
    (2, '🤖', 'INTELIGENCIA ARTIFICIAL (IA) & HERRAMIENTAS TECH', 'inteligencia-artificial-tech', 'Automatización, tecnología, IA y herramientas digitales.', 'Recursos y contactos orientados a automatización, tecnología, IA y herramientas digitales.', array['ia','tech','automatización','productividad']::text[]),
    (3, '📚', 'EDUCACIÓN, CURSOS & LIBROS', 'educacion-cursos-libros', 'Aprendizaje, clases, recursos educativos y desarrollo académico.', 'Opciones vinculadas a aprendizaje, formación, clases, recursos educativos y desarrollo académico.', array['educación','cursos','libros','formación']::text[]),
    (4, '💪', 'FITNESS, SALUD & NUTRICIÓN', 'fitness-salud-nutricion', 'Bienestar físico, nutrición, entrenamiento y hábitos saludables.', 'Contactos relacionados con bienestar físico, nutrición, entrenamiento y hábitos saludables.', array['fitness','salud','nutrición','bienestar']::text[]),
    (5, '🎨', 'CREATIVIDAD, DISEÑO & FOTOGRAFÍA', 'creatividad-diseno-fotografia', 'Diseño, fotografía, edición y creatividad visual.', 'Recursos y contactos para diseño, fotografía, edición, creatividad visual y producción gráfica.', array['diseño','creatividad','fotografía','edición']::text[]),
    (6, '🎮', 'GAMING, STREAMING & ENTRETENIMIENTO', 'gaming-entretenimiento-streaming', 'Gaming, streaming, entretenimiento digital y comunidades.', 'Opciones vinculadas a gaming, streaming, entretenimiento digital y comunidades online.', array['gaming','streaming','entretenimiento','comunidad']::text[]),
    (7, '🚀', 'MARKETING DIGITAL & CRECIMIENTO', 'marketing-digital-crecimiento', 'Marketing, ventas, redes sociales y crecimiento digital.', 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.', array['marketing','ventas','redes sociales','crecimiento']::text[]),
    (8, '⚽', 'DEPORTES ESPECÍFICOS & MANUALIDADES', 'deportes-manualidades', 'Deportes, hobbies, manualidades y comunidades especializadas.', 'Contactos y recursos para deportes específicos, hobbies, actividades manuales y comunidades especializadas.', array['deportes','manualidades','hobbies','actividades']::text[]),
    (9, '🛠️', 'REPARACIONES TÉCNICAS & OFICIOS', 'reparaciones-tecnicas-oficios', 'Reparaciones, soporte técnico, mantenimiento y oficios.', 'Contactos para reparaciones, soporte técnico, mantenimiento, oficios y soluciones prácticas.', array['reparaciones','técnico','oficios','mantenimiento']::text[]),
    (10, '🧘', 'ESPIRITUALIDAD, OCULTISMO & FAMILIA', 'espiritualidad-ocultismo-familia', 'Espiritualidad, orientación personal y bienestar familiar.', 'Opciones relacionadas con espiritualidad, orientación personal, bienestar familiar y temas afines.', array['espiritualidad','familia','bienestar','orientación']::text[]),
    (11, '🌟', 'VARIOS & BONUS', 'varios-bonus', 'Recursos variados, oportunidades bonus y contactos útiles.', 'Carpeta flexible con recursos variados, oportunidades bonus y contactos útiles difíciles de clasificar.', array['varios','bonus','recursos','oportunidades']::text[]),
    (12, '💰', 'POWER MONEY & NEGOCIOS ESCALABLES', 'power-money-negocios-escalables', 'Negocios escalables, ideas comerciales y crecimiento económico.', 'Contactos y oportunidades vinculadas a negocios escalables, ideas comerciales y crecimiento económico.', array['dinero','negocios','escalable','oportunidades']::text[]),
    (13, '🧠', 'MENTES MAESTRAS & ALTO RENDIMIENTO', 'mentes-maestras-alto-rendimiento', 'Productividad, enfoque, mentalidad y alto rendimiento.', 'Recursos sobre productividad, enfoque, mentalidad, rendimiento personal y desarrollo aplicado.', array['alto rendimiento','mentalidad','productividad','enfoque']::text[]),
    (14, '🎬', 'CONTENT KINGS & VIRAL LAB', 'content-kings-viral-lab', 'Contenido, viralidad, edición y producción digital.', 'Contactos y recursos para creación de contenido, viralidad, edición, redes y producción digital.', array['contenido','viralidad','redes','producción']::text[]),
    (15, '🎧', 'AUDIO MASTERS & MÚSICA INFINITA', 'audio-masters-musica', 'Música, audio, streaming, beats y producción.', 'Contactos para música, audio, streaming, beats, sonido, producción y recursos musicales.', array['música','audio','streaming','beats']::text[]),
    (16, '🎮', 'GAMER ELITE & VICIOS DIGITALES', 'gamer-elite-vicios-digitales', 'Gaming avanzado, comunidades y cultura digital.', 'Opciones de gaming avanzado, entretenimiento digital, comunidades, recursos gamer y cultura digital.', array['gaming','digital','entretenimiento','gamer']::text[]),
    (17, '🧘', 'ESPIRITUALIDAD & PODER INTERIOR', 'espiritualidad-poder-interior', 'Crecimiento interior, bienestar emocional y enfoque personal.', 'Contactos y recursos para crecimiento interior, bienestar emocional, enfoque personal y espiritualidad.', array['espiritualidad','bienestar','interior','enfoque']::text[]),
    (18, '🛡️', 'PROHIBIDO ⚠️', 'prohibido', 'Carpeta restringida para control interno.', 'Carpeta restringida para clasificación interna y control de seguridad. No debe exponerse como oferta para usuarios normales.', array['restringido','interno','seguridad']::text[]),
    (19, '👶', 'FAMILIA, EDUCACIÓN & DESARROLLO INFANTIL', 'familia-educacion-desarrollo-infantil', 'Familia, educación infantil, crianza y aprendizaje temprano.', 'Contactos para familia, educación infantil, crianza, aprendizaje temprano y desarrollo de niños.', array['familia','educación','infantil','crianza']::text[]),
    (20, '🛠️', 'OFICIOS & HERRAMIENTAS PRO', 'oficios-herramientas-pro', 'Oficios, herramientas profesionales y soluciones técnicas.', 'Contactos relacionados con oficios, herramientas profesionales, servicios técnicos y soluciones de trabajo.', array['oficios','herramientas','servicios','trabajo']::text[]),
    (21, '🧬', 'CIENCIA, TÉCNICA & CONOCIMIENTO AVANZADO', 'ciencia-tecnica-conocimiento-avanzado', 'Ciencia, técnica, conocimiento avanzado y formación especializada.', 'Recursos especializados para ciencia, técnica, conocimiento avanzado, formación y aprendizaje profundo.', array['ciencia','técnica','conocimiento','formación']::text[]),
    (22, '🏋️', 'FITNESS WARRIOR & GUERREROS MODERNOS', 'fitness-warrior-guerreros-modernos', 'Entrenamiento intenso, disciplina física y vida activa.', 'Contactos y recursos para entrenamiento intenso, disciplina física, rendimiento y estilo de vida activo.', array['fitness','entrenamiento','disciplina','rendimiento']::text[]),
    (23, '🍳', 'CHEF PREMIUM & GASTRONOMÍA ÉLITE', 'chef-premium-gastronomia-elite', 'Cocina, gastronomía, alimentos e insumos culinarios.', 'Contactos para cocina, gastronomía, alimentos, chef premium, insumos y oportunidades culinarias.', array['gastronomía','cocina','chef','alimentos']::text[]),
    (24, '📦', 'BONUS TRACK & TESOROS OCULTOS', 'bonus-track-tesoros-ocultos', 'Recursos especiales, bonus y oportunidades poco comunes.', 'Recursos especiales, contactos bonus y oportunidades valiosas que no encajan en una sola categoría.', array['bonus','tesoros','recursos','especiales']::text[]),
    (25, '🔥', 'ACCESO TOTAL — CONTACTOS ESTRATÉGICOS PREMIUM', 'acceso-total-contactos-premium', 'Acceso premium para explorar ContactHub de forma amplia.', 'Opción premium para quienes quieren una vista amplia de ContactHub y acceso estratégico a todas las oportunidades disponibles.', array['premium','acceso total','estratégico','oportunidades']::text[])
)
update public.categories c
set
  sort_order = o.sort_order,
  icon = o.icon,
  name = o.name,
  slug = o.slug,
  short_description = o.short_description,
  description = o.description,
  tags = o.tags,
  updated_at = now()
from official o
where c.sort_order = o.sort_order
   or c.slug = o.slug;

create index if not exists idx_categories_sort_order on public.categories(sort_order);
