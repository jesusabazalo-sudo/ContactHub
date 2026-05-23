export type OfficialCategory = {
  sortOrder: number;
  icon: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  tags: string[];
  whatYouCanFind: string[];
  isPremium?: boolean;
};

export const officialCategories: OfficialCategory[] = [
  {
    sortOrder: 1,
    icon: '🏢',
    name: 'CORPORATE & NEGOCIOS',
    slug: 'corporate-negocios',
    description: 'Contactos y oportunidades vinculadas al mundo empresarial, servicios corporativos y crecimiento comercial.',
    shortDescription: 'Mundo empresarial, servicios corporativos y crecimiento comercial.',
    tags: ['negocios', 'ventas', 'corporate', 'servicios'],
    whatYouCanFind: ['proveedores', 'contactos de negocio', 'servicios corporativos', 'oportunidades comerciales'],
  },
  {
    sortOrder: 2,
    icon: '🤖',
    name: 'INTELIGENCIA ARTIFICIAL (IA) & HERRAMIENTAS TECH',
    slug: 'inteligencia-artificial-tech',
    description: 'Recursos y contactos orientados a automatización, tecnología, IA y herramientas digitales.',
    shortDescription: 'Automatización, tecnología, IA y herramientas digitales.',
    tags: ['ia', 'tech', 'automatización', 'productividad'],
    whatYouCanFind: ['herramientas IA', 'automatización', 'productividad digital', 'recursos tech'],
  },
  {
    sortOrder: 3,
    icon: '📚',
    name: 'EDUCACIÓN, CURSOS & LIBROS',
    slug: 'educacion-cursos-libros',
    description: 'Opciones vinculadas a aprendizaje, formación, clases, recursos educativos y desarrollo académico.',
    shortDescription: 'Aprendizaje, clases, recursos educativos y desarrollo académico.',
    tags: ['educación', 'cursos', 'libros', 'formación'],
    whatYouCanFind: ['cursos', 'tutorías', 'libros y recursos', 'formación profesional'],
  },
  {
    sortOrder: 4,
    icon: '💪',
    name: 'FITNESS, SALUD & NUTRICIÓN',
    slug: 'fitness-salud-nutricion',
    description: 'Contactos relacionados con bienestar físico, nutrición, entrenamiento y hábitos saludables.',
    shortDescription: 'Bienestar físico, nutrición, entrenamiento y hábitos saludables.',
    tags: ['fitness', 'salud', 'nutrición', 'bienestar'],
    whatYouCanFind: ['entrenadores', 'nutrición', 'rutinas', 'bienestar saludable'],
  },
  {
    sortOrder: 5,
    icon: '🎨',
    name: 'CREATIVIDAD, DISEÑO & FOTOGRAFÍA',
    slug: 'creatividad-diseno-fotografia',
    description: 'Recursos y contactos para diseño, fotografía, edición, creatividad visual y producción gráfica.',
    shortDescription: 'Diseño, fotografía, edición y creatividad visual.',
    tags: ['diseño', 'creatividad', 'fotografía', 'edición'],
    whatYouCanFind: ['diseñadores', 'recursos visuales', 'edición', 'fotografía'],
  },
  {
    sortOrder: 6,
    icon: '🎮',
    name: 'GAMING, STREAMING & ENTRETENIMIENTO',
    slug: 'gaming-entretenimiento-streaming',
    description: 'Opciones vinculadas a gaming, streaming, entretenimiento digital y comunidades online.',
    shortDescription: 'Gaming, streaming, entretenimiento digital y comunidades.',
    tags: ['gaming', 'streaming', 'entretenimiento', 'comunidad'],
    whatYouCanFind: ['streaming', 'comunidades gamer', 'entretenimiento digital', 'recursos gaming'],
  },
  {
    sortOrder: 7,
    icon: '🚀',
    name: 'MARKETING DIGITAL & CRECIMIENTO',
    slug: 'marketing-digital-crecimiento',
    description: 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.',
    shortDescription: 'Marketing, ventas, redes sociales y crecimiento digital.',
    tags: ['marketing', 'ventas', 'redes sociales', 'crecimiento'],
    whatYouCanFind: ['marketing digital', 'ventas', 'redes sociales', 'crecimiento de audiencia'],
  },
  {
    sortOrder: 8,
    icon: '⚽',
    name: 'DEPORTES ESPECÍFICOS & MANUALIDADES',
    slug: 'deportes-manualidades',
    description: 'Contactos y recursos para deportes específicos, hobbies, actividades manuales y comunidades especializadas.',
    shortDescription: 'Deportes, hobbies, manualidades y comunidades especializadas.',
    tags: ['deportes', 'manualidades', 'hobbies', 'actividades'],
    whatYouCanFind: ['deportes específicos', 'manualidades', 'hobbies', 'actividades guiadas'],
  },
  {
    sortOrder: 9,
    icon: '🛠️',
    name: 'REPARACIONES TÉCNICAS & OFICIOS',
    slug: 'reparaciones-tecnicas-oficios',
    description: 'Contactos para reparaciones, soporte técnico, mantenimiento, oficios y soluciones prácticas.',
    shortDescription: 'Reparaciones, soporte técnico, mantenimiento y oficios.',
    tags: ['reparaciones', 'técnico', 'oficios', 'mantenimiento'],
    whatYouCanFind: ['servicios técnicos', 'reparaciones', 'mantenimiento', 'oficios prácticos'],
  },
  {
    sortOrder: 10,
    icon: '🧘',
    name: 'ESPIRITUALIDAD, OCULTISMO & FAMILIA',
    slug: 'espiritualidad-ocultismo-familia',
    description: 'Opciones relacionadas con espiritualidad, orientación personal, bienestar familiar y temas afines.',
    shortDescription: 'Espiritualidad, orientación personal y bienestar familiar.',
    tags: ['espiritualidad', 'familia', 'bienestar', 'orientación'],
    whatYouCanFind: ['orientación personal', 'bienestar familiar', 'espiritualidad', 'recursos de apoyo'],
  },
  {
    sortOrder: 11,
    icon: '🌟',
    name: 'VARIOS & BONUS',
    slug: 'varios-bonus',
    description: 'Carpeta flexible con recursos variados, oportunidades bonus y contactos útiles difíciles de clasificar.',
    shortDescription: 'Recursos variados, oportunidades bonus y contactos útiles.',
    tags: ['varios', 'bonus', 'recursos', 'oportunidades'],
    whatYouCanFind: ['recursos variados', 'bonus útiles', 'oportunidades sueltas', 'contactos especiales'],
  },
  {
    sortOrder: 12,
    icon: '💰',
    name: 'POWER MONEY & NEGOCIOS ESCALABLES',
    slug: 'power-money-negocios-escalables',
    description: 'Contactos y oportunidades vinculadas a negocios escalables, ideas comerciales y crecimiento económico.',
    shortDescription: 'Negocios escalables, ideas comerciales y crecimiento económico.',
    tags: ['dinero', 'negocios', 'escalable', 'oportunidades'],
    whatYouCanFind: ['ideas de negocio', 'modelos escalables', 'oportunidades comerciales', 'recursos de crecimiento'],
  },
  {
    sortOrder: 13,
    icon: '🧠',
    name: 'MENTES MAESTRAS & ALTO RENDIMIENTO',
    slug: 'mentes-maestras-alto-rendimiento',
    description: 'Recursos sobre productividad, enfoque, mentalidad, rendimiento personal y desarrollo aplicado.',
    shortDescription: 'Productividad, enfoque, mentalidad y alto rendimiento.',
    tags: ['alto rendimiento', 'mentalidad', 'productividad', 'enfoque'],
    whatYouCanFind: ['productividad', 'mentalidad', 'alto rendimiento', 'desarrollo personal'],
  },
  {
    sortOrder: 14,
    icon: '🎬',
    name: 'CONTENT KINGS & VIRAL LAB',
    slug: 'content-kings-viral-lab',
    description: 'Contactos y recursos para creación de contenido, viralidad, edición, redes y producción digital.',
    shortDescription: 'Contenido, viralidad, edición y producción digital.',
    tags: ['contenido', 'viralidad', 'redes', 'producción'],
    whatYouCanFind: ['creadores', 'edición', 'viralidad', 'producción digital'],
  },
  {
    sortOrder: 15,
    icon: '🎧',
    name: 'AUDIO MASTERS & MÚSICA INFINITA',
    slug: 'audio-masters-musica',
    description: 'Contactos para música, audio, streaming, beats, sonido, producción y recursos musicales.',
    shortDescription: 'Música, audio, streaming, beats y producción.',
    tags: ['música', 'audio', 'streaming', 'beats'],
    whatYouCanFind: ['música', 'audio', 'streaming', 'producción sonora'],
  },
  {
    sortOrder: 16,
    icon: '🎮',
    name: 'GAMER ELITE & VICIOS DIGITALES',
    slug: 'gamer-elite-vicios-digitales',
    description: 'Opciones de gaming avanzado, entretenimiento digital, comunidades, recursos gamer y cultura digital.',
    shortDescription: 'Gaming avanzado, comunidades y cultura digital.',
    tags: ['gaming', 'digital', 'entretenimiento', 'gamer'],
    whatYouCanFind: ['recursos gamer', 'comunidades', 'entretenimiento digital', 'herramientas gaming'],
  },
  {
    sortOrder: 17,
    icon: '🧘',
    name: 'ESPIRITUALIDAD & PODER INTERIOR',
    slug: 'espiritualidad-poder-interior',
    description: 'Contactos y recursos para crecimiento interior, bienestar emocional, enfoque personal y espiritualidad.',
    shortDescription: 'Crecimiento interior, bienestar emocional y enfoque personal.',
    tags: ['espiritualidad', 'bienestar', 'interior', 'enfoque'],
    whatYouCanFind: ['bienestar emocional', 'crecimiento interior', 'orientación', 'recursos espirituales'],
  },
  {
    sortOrder: 18,
    icon: '🛡️',
    name: 'PROHIBIDO ⚠️',
    slug: 'prohibido',
    description: 'Carpeta restringida para clasificación interna y control de seguridad. No debe exponerse como oferta para usuarios normales.',
    shortDescription: 'Carpeta restringida para control interno.',
    tags: ['restringido', 'interno', 'seguridad'],
    whatYouCanFind: ['control interno', 'clasificación', 'revisión', 'seguridad'],
  },
  {
    sortOrder: 19,
    icon: '👶',
    name: 'FAMILIA, EDUCACIÓN & DESARROLLO INFANTIL',
    slug: 'familia-educacion-desarrollo-infantil',
    description: 'Contactos para familia, educación infantil, crianza, aprendizaje temprano y desarrollo de niños.',
    shortDescription: 'Familia, educación infantil, crianza y aprendizaje temprano.',
    tags: ['familia', 'educación', 'infantil', 'crianza'],
    whatYouCanFind: ['educación infantil', 'crianza', 'recursos familiares', 'desarrollo de niños'],
  },
  {
    sortOrder: 20,
    icon: '🛠️',
    name: 'OFICIOS & HERRAMIENTAS PRO',
    slug: 'oficios-herramientas-pro',
    description: 'Contactos relacionados con oficios, herramientas profesionales, servicios técnicos y soluciones de trabajo.',
    shortDescription: 'Oficios, herramientas profesionales y soluciones técnicas.',
    tags: ['oficios', 'herramientas', 'servicios', 'trabajo'],
    whatYouCanFind: ['herramientas pro', 'oficios', 'servicios técnicos', 'soluciones de trabajo'],
  },
  {
    sortOrder: 21,
    icon: '🧬',
    name: 'CIENCIA, TÉCNICA & CONOCIMIENTO AVANZADO',
    slug: 'ciencia-tecnica-conocimiento-avanzado',
    description: 'Recursos especializados para ciencia, técnica, conocimiento avanzado, formación y aprendizaje profundo.',
    shortDescription: 'Ciencia, técnica, conocimiento avanzado y formación especializada.',
    tags: ['ciencia', 'técnica', 'conocimiento', 'formación'],
    whatYouCanFind: ['conocimiento avanzado', 'recursos técnicos', 'ciencia aplicada', 'formación especializada'],
  },
  {
    sortOrder: 22,
    icon: '🏋️',
    name: 'FITNESS WARRIOR & GUERREROS MODERNOS',
    slug: 'fitness-warrior-guerreros-modernos',
    description: 'Contactos y recursos para entrenamiento intenso, disciplina física, rendimiento y estilo de vida activo.',
    shortDescription: 'Entrenamiento intenso, disciplina física y vida activa.',
    tags: ['fitness', 'entrenamiento', 'disciplina', 'rendimiento'],
    whatYouCanFind: ['entrenamiento', 'disciplina física', 'rutinas intensas', 'rendimiento'],
  },
  {
    sortOrder: 23,
    icon: '🍳',
    name: 'CHEF PREMIUM & GASTRONOMÍA ÉLITE',
    slug: 'chef-premium-gastronomia-elite',
    description: 'Contactos para cocina, gastronomía, alimentos, chef premium, insumos y oportunidades culinarias.',
    shortDescription: 'Cocina, gastronomía, alimentos e insumos culinarios.',
    tags: ['gastronomía', 'cocina', 'chef', 'alimentos'],
    whatYouCanFind: ['chef premium', 'insumos', 'cocina', 'oportunidades gastronómicas'],
  },
  {
    sortOrder: 24,
    icon: '📦',
    name: 'BONUS TRACK & TESOROS OCULTOS',
    slug: 'bonus-track-tesoros-ocultos',
    description: 'Recursos especiales, contactos bonus y oportunidades valiosas que no encajan en una sola categoría.',
    shortDescription: 'Recursos especiales, bonus y oportunidades poco comunes.',
    tags: ['bonus', 'tesoros', 'recursos', 'especiales'],
    whatYouCanFind: ['contactos bonus', 'recursos especiales', 'oportunidades ocultas', 'ideas poco comunes'],
  },
  {
    sortOrder: 25,
    icon: '🔥',
    name: 'ACCESO TOTAL — CONTACTOS ESTRATÉGICOS PREMIUM',
    slug: 'acceso-total-contactos-premium',
    description: 'Opción premium para quienes quieren una vista amplia de ContactHub y acceso estratégico a todas las oportunidades disponibles.',
    shortDescription: 'Acceso premium para explorar ContactHub de forma amplia.',
    tags: ['premium', 'acceso total', 'estratégico', 'oportunidades'],
    whatYouCanFind: ['acceso amplio', 'contactos estratégicos', 'todas las carpetas', 'visión completa'],
    isPremium: true,
  },
];

function normalize(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getOfficialCategoryByOrder(order?: number | null) {
  if (!order) return undefined;
  return officialCategories.find((category) => category.sortOrder === order);
}

export function getOfficialCategoryFor(category: { sort_order?: number | null; sortOrder?: number | null; slug?: string | null; name?: string | null }, fallbackIndex = 0) {
  const order = category.sort_order ?? category.sortOrder ?? fallbackIndex + 1;
  return (
    getOfficialCategoryByOrder(order) ??
    officialCategories.find((item) => item.slug === category.slug) ??
    officialCategories.find((item) => normalize(item.name) === normalize(category.name)) ??
    officialCategories[fallbackIndex]
  );
}

export function formatCategoryOptionLabel(category: { name: string; icon?: string | null; sort_order?: number | null; sortOrder?: number | null; slug?: string | null }, fallbackIndex = 0) {
  const official = getOfficialCategoryFor(category, fallbackIndex);
  const order = official?.sortOrder ?? category.sort_order ?? category.sortOrder ?? fallbackIndex + 1;
  const icon = official?.icon ?? category.icon ?? '';
  const name = official?.name ?? category.name;
  return `${String(order).padStart(2, '0')}. ${icon} ${name}`.trim();
}

export function applyOfficialCategoryDisplay<T extends { sort_order?: number | null; sortOrder?: number | null; slug?: string | null; name?: string | null; icon?: string | null; description?: string | null; short_description?: string | null; shortDescription?: string | null; tags?: string[] | null }>(
  category: T,
  fallbackIndex = 0,
) {
  const official = getOfficialCategoryFor(category, fallbackIndex);
  if (!official) return category;
  return {
    ...category,
    sort_order: official.sortOrder,
    sortOrder: official.sortOrder,
    icon: official.icon,
    name: official.name,
    description: official.description,
    short_description: official.shortDescription,
    shortDescription: official.shortDescription,
    tags: official.tags,
    whatYouCanFind: official.whatYouCanFind,
    isPremiumOfficial: official.isPremium ?? false,
  };
}

export function sortByOfficialOrder<T extends { sort_order?: number | null; sortOrder?: number | null; slug?: string | null; name?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const officialA = getOfficialCategoryFor(a);
    const officialB = getOfficialCategoryFor(b);
    const orderA = officialA?.sortOrder ?? a.sort_order ?? a.sortOrder ?? 999;
    const orderB = officialB?.sortOrder ?? b.sort_order ?? b.sortOrder ?? 999;
    return orderA - orderB || (a.name ?? '').localeCompare(b.name ?? '');
  });
}
