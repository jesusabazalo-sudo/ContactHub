export type OfficialCategory = {
  sortOrder: number;
  icon: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  tags: string[];
};

export const officialCategories: OfficialCategory[] = [
  { sortOrder: 1, icon: '🏢', name: 'CORPORATE & NEGOCIOS', slug: 'corporate-negocios', description: 'Contactos para servicios empresariales, ventas, gestión, ideas comerciales y oportunidades para negocios en marcha.', shortDescription: 'Contactos comerciales y oportunidades de negocio.', tags: ['negocios', 'ventas', 'corporate'] },
  { sortOrder: 2, icon: '🤖', name: 'INTELIGENCIA ARTIFICIAL (IA) & HERRAMIENTAS TECH', slug: 'inteligencia-artificial-tech', description: 'Recursos, herramientas y contactos relacionados con inteligencia artificial, automatización y tecnología.', shortDescription: 'IA, automatización y herramientas tech.', tags: ['ia', 'tech', 'automatización'] },
  { sortOrder: 3, icon: '📚', name: 'EDUCACIÓN, CURSOS & LIBROS', slug: 'educacion-cursos-libros', description: 'Contactos relacionados con cursos, libros, ebooks, clases y recursos educativos digitales.', shortDescription: 'Cursos, libros y recursos educativos.', tags: ['educación', 'cursos', 'libros'] },
  { sortOrder: 4, icon: '💪', name: 'FITNESS, SALUD & NUTRICIÓN', slug: 'fitness-salud-nutricion', description: 'Contactos para fitness, salud, nutrición, bienestar físico y hábitos saludables.', shortDescription: 'Fitness, salud y nutrición.', tags: ['fitness', 'salud', 'nutrición'] },
  { sortOrder: 5, icon: '🎨', name: 'CREATIVIDAD, DISEÑO & FOTOGRAFÍA', slug: 'creatividad-diseno-fotografia', description: 'Contactos de diseño, creatividad, fotografía, edición y recursos visuales.', shortDescription: 'Diseño, creatividad y fotografía.', tags: ['diseño', 'creatividad', 'fotografía'] },
  { sortOrder: 6, icon: '🎮', name: 'GAMING, ENTRETENIMIENTO & STREAMING', slug: 'gaming-entretenimiento-streaming', description: 'Contactos vinculados a gaming, entretenimiento digital, streaming y comunidades online.', shortDescription: 'Gaming, streaming y entretenimiento.', tags: ['gaming', 'streaming', 'entretenimiento'] },
  { sortOrder: 7, icon: '🚀', name: 'MARKETING DIGITAL & CRECIMIENTO', slug: 'marketing-digital-crecimiento', description: 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.', shortDescription: 'Marketing, ventas y crecimiento.', tags: ['marketing', 'ventas', 'redes sociales'] },
  { sortOrder: 8, icon: '⚽', name: 'DEPORTES ESPECÍFICOS & MANUALIDADES', slug: 'deportes-manualidades', description: 'Contactos de deportes, hobbies, manualidades y actividades especializadas.', shortDescription: 'Deportes, hobbies y manualidades.', tags: ['deportes', 'hobbies', 'manualidades'] },
  { sortOrder: 9, icon: '🛠️', name: 'REPARACIONES TÉCNICAS & OFICIOS', slug: 'reparaciones-tecnicas-oficios', description: 'Contactos para reparaciones, oficios, soporte técnico y servicios prácticos.', shortDescription: 'Reparaciones, soporte y oficios.', tags: ['oficios', 'reparaciones', 'técnico'] },
  { sortOrder: 10, icon: '🔮', name: 'ESPIRITUALIDAD, OCULTISMO & FAMILIA', slug: 'espiritualidad-ocultismo-familia', description: 'Contactos relacionados con espiritualidad, bienestar familiar, orientación y temas afines.', shortDescription: 'Espiritualidad, familia y bienestar.', tags: ['espiritualidad', 'familia', 'bienestar'] },
  { sortOrder: 11, icon: '🌟', name: 'VARIOS & BONUS', slug: 'varios-bonus', description: 'Carpeta flexible con recursos variados y contactos bonus de utilidad comercial.', shortDescription: 'Recursos variados y bonus.', tags: ['varios', 'bonus', 'recursos'] },
  { sortOrder: 12, icon: '🔥', name: 'POWER MONEY & NEGOCIOS ESCALABLES', slug: 'power-money-negocios-escalables', description: 'Contactos enfocados en oportunidades, negocios escalables, dinero y crecimiento comercial.', shortDescription: 'Negocios escalables y oportunidades.', tags: ['dinero', 'negocios', 'escalable'] },
  { sortOrder: 13, icon: '🧠', name: 'MENTES MAESTRAS & ALTO RENDIMIENTO', slug: 'mentes-maestras-alto-rendimiento', description: 'Contactos sobre productividad, mentalidad, alto rendimiento y desarrollo personal aplicado.', shortDescription: 'Productividad y alto rendimiento.', tags: ['alto rendimiento', 'mentalidad', 'productividad'] },
  { sortOrder: 14, icon: '🎬', name: 'CONTENT KINGS & VIRAL LAB', slug: 'content-kings-viral-lab', description: 'Contactos para contenido, viralidad, edición, redes y producción digital.', shortDescription: 'Contenido, viralidad y producción.', tags: ['contenido', 'viral', 'redes'] },
  { sortOrder: 15, icon: '🎧', name: 'AUDIO MASTERS & MÚSICA INFINITA', slug: 'audio-masters-musica', description: 'Contactos de música, audio, streaming, beats, sonido y recursos musicales.', shortDescription: 'Música, audio y streaming.', tags: ['música', 'audio', 'streaming'] },
  { sortOrder: 16, icon: '🎮', name: 'GAMER ELITE & VICIOS DIGITALES', slug: 'gamer-elite-vicios-digitales', description: 'Contactos de gaming avanzado, entretenimiento digital, comunidades y recursos gamer.', shortDescription: 'Gaming avanzado y recursos digitales.', tags: ['gaming', 'digital', 'entretenimiento'] },
  { sortOrder: 17, icon: '🧘', name: 'ESPIRITUALIDAD & PODER INTERIOR', slug: 'espiritualidad-poder-interior', description: 'Contactos de espiritualidad, crecimiento interior, bienestar emocional y enfoque personal.', shortDescription: 'Espiritualidad y poder interior.', tags: ['espiritualidad', 'bienestar', 'interior'] },
  { sortOrder: 18, icon: '🚫', name: 'PROHIBIDO ⚠️', slug: 'prohibido', description: 'Carpeta restringida para clasificación interna. No debe exponerse a usuarios normales.', shortDescription: 'Carpeta restringida interna.', tags: ['restringido', 'interno'] },
  { sortOrder: 19, icon: '👶', name: 'FAMILIA, EDUCACIÓN & DESARROLLO INFANTIL', slug: 'familia-educacion-desarrollo-infantil', description: 'Contactos para familia, educación infantil, crianza, aprendizaje y desarrollo de niños.', shortDescription: 'Familia y desarrollo infantil.', tags: ['familia', 'infantil', 'educación'] },
  { sortOrder: 20, icon: '🛠️', name: 'OFICIOS & HERRAMIENTAS PRO', slug: 'oficios-herramientas-pro', description: 'Contactos para oficios, herramientas profesionales, servicios técnicos y soluciones prácticas.', shortDescription: 'Oficios y herramientas profesionales.', tags: ['oficios', 'herramientas', 'servicios'] },
  { sortOrder: 21, icon: '🧬', name: 'CIENCIA, TÉCNICA & CONOCIMIENTO AVANZADO', slug: 'ciencia-tecnica-conocimiento-avanzado', description: 'Contactos relacionados con conocimiento técnico, ciencia, formación avanzada y recursos especializados.', shortDescription: 'Ciencia, técnica y conocimiento.', tags: ['ciencia', 'técnica', 'conocimiento'] },
  { sortOrder: 22, icon: '🏋️', name: 'FITNESS WARRIOR & GUERREROS MODERNOS', slug: 'fitness-warrior-guerreros-modernos', description: 'Contactos de fitness intenso, entrenamiento, salud física y estilo de vida activo.', shortDescription: 'Entrenamiento, fitness y disciplina.', tags: ['fitness', 'entrenamiento', 'salud'] },
  { sortOrder: 23, icon: '🍳', name: 'CHEF PREMIUM & GASTRONOMÍA ELITE', slug: 'chef-premium-gastronomia-elite', description: 'Contactos para gastronomía, cocina, alimentos, chef premium y oportunidades culinarias.', shortDescription: 'Gastronomía, cocina y alimentos.', tags: ['gastronomía', 'cocina', 'chef'] },
  { sortOrder: 24, icon: '📦', name: 'BONUS TRACK & TESOROS OCULTOS', slug: 'bonus-track-tesoros-ocultos', description: 'Contactos bonus, recursos especiales y oportunidades difíciles de clasificar.', shortDescription: 'Recursos bonus y oportunidades ocultas.', tags: ['bonus', 'recursos', 'oportunidades'] },
  { sortOrder: 25, icon: '🔥', name: 'ACCESO TOTAL — 246 CONTACTOS ESTRATÉGICOS PREMIUM', slug: 'acceso-total-contactos-premium', description: 'Carpeta de referencia para acceso total, contactos estratégicos y paquetes premium.', shortDescription: 'Acceso total y contactos premium.', tags: ['premium', 'acceso total', 'estratégico'] },
];

export function formatCategoryOptionLabel(category: { name: string; icon?: string | null; sort_order?: number | null }, fallbackIndex = 0) {
  const order = category.sort_order ?? fallbackIndex + 1;
  const icon = category.icon ? `${category.icon} ` : '';
  return `${String(order).padStart(2, '0')}. ${icon}${category.name}`;
}
