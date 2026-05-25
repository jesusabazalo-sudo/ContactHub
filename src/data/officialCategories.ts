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
    icon: '🔥',
    name: 'ELITE BUSINESS – Corporate & Negocios',
    slug: 'elite-business',
    description: 'Contactos y oportunidades vinculadas al mundo empresarial, servicios corporativos y crecimiento comercial.',
    shortDescription: 'Corporate & Negocios',
    tags: ['negocios', 'ventas', 'corporate', 'servicios'],
    whatYouCanFind: ['proveedores', 'contactos de negocio', 'servicios corporativos', 'oportunidades comerciales'],
  },
  {
    sortOrder: 2,
    icon: '🤖',
    name: 'IA MASTERS – Inteligencia Artificial',
    slug: 'ia-masters',
    description: 'Recursos y contactos orientados a inteligencia artificial, automatización y herramientas digitales.',
    shortDescription: 'Inteligencia Artificial',
    tags: ['ia', 'tech', 'automatización', 'productividad'],
    whatYouCanFind: ['herramientas IA', 'automatización', 'productividad digital', 'recursos tech'],
  },
  {
    sortOrder: 3,
    icon: '📚',
    name: 'KNOWLEDGE VAULT – Educación & Cursos',
    slug: 'knowledge-vault',
    description: 'Opciones vinculadas a aprendizaje, formación, clases, cursos, libros y desarrollo académico.',
    shortDescription: 'Educación & Cursos',
    tags: ['educación', 'cursos', 'libros', 'formación'],
    whatYouCanFind: ['cursos', 'tutorías', 'libros y recursos', 'formación profesional'],
  },
  {
    sortOrder: 4,
    icon: '💪',
    name: 'FIT KINGDOM – Salud & Nutrición',
    slug: 'fit-kingdom',
    description: 'Contactos relacionados con bienestar físico, nutrición, entrenamiento y hábitos saludables.',
    shortDescription: 'Salud & Nutrición',
    tags: ['fitness', 'salud', 'nutrición', 'bienestar'],
    whatYouCanFind: ['entrenadores', 'nutrición', 'rutinas', 'bienestar saludable'],
  },
  {
    sortOrder: 5,
    icon: '🎨',
    name: 'CREATIVE STUDIO – Diseño & Fotografía',
    slug: 'creative-studio',
    description: 'Recursos y contactos para diseño, fotografía, edición, creatividad visual y producción gráfica.',
    shortDescription: 'Diseño & Fotografía',
    tags: ['diseño', 'creatividad', 'fotografía', 'edición'],
    whatYouCanFind: ['diseñadores', 'recursos visuales', 'edición', 'fotografía'],
  },
  {
    sortOrder: 6,
    icon: '🎮',
    name: 'ENTERPLAY – Gaming & Streaming',
    slug: 'enterplay',
    description: 'Opciones vinculadas a gaming, streaming, entretenimiento digital y comunidades online.',
    shortDescription: 'Gaming & Streaming',
    tags: ['gaming', 'streaming', 'entretenimiento', 'comunidad'],
    whatYouCanFind: ['streaming', 'comunidades gamer', 'entretenimiento digital', 'recursos gaming'],
  },
  {
    sortOrder: 7,
    icon: '🚀',
    name: 'SCALE UP – Marketing Digital',
    slug: 'scale-up',
    description: 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.',
    shortDescription: 'Marketing Digital',
    tags: ['marketing', 'ventas', 'redes sociales', 'crecimiento'],
    whatYouCanFind: ['marketing digital', 'ventas', 'redes sociales', 'crecimiento de audiencia'],
  },
  {
    sortOrder: 8,
    icon: '⚽',
    name: 'SPORTS LAB – Deportes & Manualidades',
    slug: 'sports-lab',
    description: 'Contactos y recursos para deportes específicos, hobbies, actividades manuales y comunidades especializadas.',
    shortDescription: 'Deportes & Manualidades',
    tags: ['deportes', 'manualidades', 'hobbies', 'actividades'],
    whatYouCanFind: ['deportes específicos', 'manualidades', 'hobbies', 'actividades guiadas'],
  },
  {
    sortOrder: 9,
    icon: '🛠️',
    name: 'TECH REPAIR – Reparaciones Técnicas',
    slug: 'tech-repair',
    description: 'Contactos para reparaciones, soporte técnico, mantenimiento, oficios y soluciones prácticas.',
    shortDescription: 'Reparaciones Técnicas',
    tags: ['reparaciones', 'técnico', 'oficios', 'mantenimiento'],
    whatYouCanFind: ['servicios técnicos', 'reparaciones', 'mantenimiento', 'oficios prácticos'],
  },
  {
    sortOrder: 10,
    icon: '🧘',
    name: 'SOUL REALM – Espiritualidad & Familia',
    slug: 'soul-realm',
    description: 'Opciones relacionadas con espiritualidad, orientación personal, bienestar familiar y temas afines.',
    shortDescription: 'Espiritualidad & Familia',
    tags: ['espiritualidad', 'familia', 'bienestar', 'orientación'],
    whatYouCanFind: ['orientación personal', 'bienestar familiar', 'espiritualidad', 'recursos de apoyo'],
  },
  {
    sortOrder: 11,
    icon: '🌟',
    name: 'MISC BONUS – Varios',
    slug: 'misc-bonus',
    description: 'Carpeta flexible con recursos variados, oportunidades bonus y contactos útiles difíciles de clasificar.',
    shortDescription: 'Varios',
    tags: ['varios', 'bonus', 'recursos', 'oportunidades'],
    whatYouCanFind: ['recursos variados', 'bonus útiles', 'oportunidades sueltas', 'contactos especiales'],
  },
  {
    sortOrder: 12,
    icon: '💰',
    name: 'CASH FLOW – Negocios Escalables',
    slug: 'cash-flow',
    description: 'Contactos y oportunidades vinculadas a negocios escalables, ideas comerciales y crecimiento económico.',
    shortDescription: 'Negocios Escalables',
    tags: ['dinero', 'negocios', 'escalable', 'oportunidades'],
    whatYouCanFind: ['ideas de negocio', 'modelos escalables', 'oportunidades comerciales', 'recursos de crecimiento'],
  },
  {
    sortOrder: 13,
    icon: '🧠',
    name: 'MIND POWER – Desarrollo Personal',
    slug: 'mind-power',
    description: 'Recursos sobre productividad, enfoque, mentalidad, rendimiento personal y desarrollo aplicado.',
    shortDescription: 'Desarrollo Personal',
    tags: ['alto rendimiento', 'mentalidad', 'productividad', 'enfoque'],
    whatYouCanFind: ['productividad', 'mentalidad', 'alto rendimiento', 'desarrollo personal'],
  },
  {
    sortOrder: 14,
    icon: '🎬',
    name: 'VIRAL FACTORY – Contenido & Edición',
    slug: 'viral-factory',
    description: 'Contactos y recursos para creación de contenido, viralidad, edición, redes y producción digital.',
    shortDescription: 'Contenido & Edición',
    tags: ['contenido', 'viralidad', 'redes', 'producción'],
    whatYouCanFind: ['creadores', 'edición', 'viralidad', 'producción digital'],
  },
  {
    sortOrder: 15,
    icon: '🎧',
    name: 'BEAT STUDIO – Música & DJ',
    slug: 'beat-studio',
    description: 'Contactos para música, audio, streaming, beats, sonido, DJ, producción y recursos musicales.',
    shortDescription: 'Música & DJ',
    tags: ['música', 'audio', 'streaming', 'beats'],
    whatYouCanFind: ['música', 'audio', 'streaming', 'producción sonora'],
  },
  {
    sortOrder: 16,
    icon: '🎮',
    name: 'GAMER ZONE – Vicios Digitales',
    slug: 'gamer-zone',
    description: 'Opciones de gaming avanzado, entretenimiento digital, comunidades, recursos gamer y cultura digital.',
    shortDescription: 'Vicios Digitales',
    tags: ['gaming', 'digital', 'entretenimiento', 'gamer'],
    whatYouCanFind: ['recursos gamer', 'comunidades', 'entretenimiento digital', 'herramientas gaming'],
  },
  {
    sortOrder: 17,
    icon: '🙏',
    name: 'SACRED POWER – Espiritualidad',
    slug: 'sacred-power',
    description: 'Contactos y recursos para crecimiento interior, bienestar emocional, enfoque personal y espiritualidad.',
    shortDescription: 'Espiritualidad',
    tags: ['espiritualidad', 'bienestar', 'interior', 'enfoque'],
    whatYouCanFind: ['bienestar emocional', 'crecimiento interior', 'orientación', 'recursos espirituales'],
  },
  {
    sortOrder: 18,
    icon: '⚠️',
    name: 'THE VAULT – Contenido Prohibido',
    slug: 'the-vault',
    description: 'Carpeta restringida para clasificación interna y control de seguridad.',
    shortDescription: 'Contenido Prohibido',
    tags: ['restringido', 'interno', 'seguridad'],
    whatYouCanFind: ['control interno', 'clasificación', 'revisión', 'seguridad'],
  },
  {
    sortOrder: 19,
    icon: '👶',
    name: 'FAMILY CARE – Desarrollo Infantil',
    slug: 'family-care',
    description: 'Contactos para familia, educación infantil, crianza, aprendizaje temprano y desarrollo de niños.',
    shortDescription: 'Desarrollo Infantil',
    tags: ['familia', 'educación', 'infantil', 'crianza'],
    whatYouCanFind: ['educación infantil', 'crianza', 'recursos familiares', 'desarrollo de niños'],
  },
  {
    sortOrder: 20,
    icon: '🔧',
    name: 'PRO TOOLS – Oficios & Herramientas',
    slug: 'pro-tools',
    description: 'Contactos relacionados con oficios, herramientas profesionales, servicios técnicos y soluciones de trabajo.',
    shortDescription: 'Oficios & Herramientas',
    tags: ['oficios', 'herramientas', 'servicios', 'trabajo'],
    whatYouCanFind: ['herramientas pro', 'oficios', 'servicios técnicos', 'soluciones de trabajo'],
  },
  {
    sortOrder: 21,
    icon: '🔬',
    name: 'SCIENCE DEEP – Conocimiento Avanzado',
    slug: 'science-deep',
    description: 'Recursos especializados para ciencia, técnica, conocimiento avanzado, formación y aprendizaje profundo.',
    shortDescription: 'Conocimiento Avanzado',
    tags: ['ciencia', 'técnica', 'conocimiento', 'formación'],
    whatYouCanFind: ['conocimiento avanzado', 'recursos técnicos', 'ciencia aplicada', 'formación especializada'],
  },
  {
    sortOrder: 22,
    icon: '💪',
    name: 'WARRIOR FIT – Fitness Extremo',
    slug: 'warrior-fit',
    description: 'Contactos y recursos para entrenamiento intenso, disciplina física, rendimiento y estilo de vida activo.',
    shortDescription: 'Fitness Extremo',
    tags: ['fitness', 'entrenamiento', 'disciplina', 'rendimiento'],
    whatYouCanFind: ['entrenamiento', 'disciplina física', 'rutinas intensas', 'rendimiento'],
  },
  {
    sortOrder: 23,
    icon: '🍳',
    name: 'CHEF GOLD – Gastronomía Élite',
    slug: 'chef-gold',
    description: 'Contactos para cocina, gastronomía, alimentos, chef premium, insumos y oportunidades culinarias.',
    shortDescription: 'Gastronomía Élite',
    tags: ['gastronomía', 'cocina', 'chef', 'alimentos'],
    whatYouCanFind: ['chef premium', 'insumos', 'cocina', 'oportunidades gastronómicas'],
  },
  {
    sortOrder: 24,
    icon: '🎁',
    name: 'BONUS HUNT – Tesoros Ocultos',
    slug: 'bonus-hunt',
    description: 'Recursos especiales, contactos bonus y oportunidades valiosas que no encajan en una sola categoría.',
    shortDescription: 'Tesoros Ocultos',
    tags: ['bonus', 'tesoros', 'recursos', 'especiales'],
    whatYouCanFind: ['contactos bonus', 'recursos especiales', 'oportunidades ocultas', 'ideas poco comunes'],
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

export function getOfficialCategoryFor(category: { sort_order?: number | null; sortOrder?: number | null; slug?: string | null; name?: string | null }, fallbackIndex = -1) {
  const order = category.sort_order ?? category.sortOrder ?? (fallbackIndex >= 0 ? fallbackIndex + 1 : null);
  return (
    officialCategories.find((item) => item.slug === category.slug) ??
    officialCategories.find((item) => normalize(item.name) === normalize(category.name)) ??
    getOfficialCategoryByOrder(order) ??
    (fallbackIndex >= 0 ? officialCategories[fallbackIndex] : undefined)
  );
}

export function formatCategoryOptionLabel(category: { name: string; icon?: string | null; sort_order?: number | null; sortOrder?: number | null; slug?: string | null }, fallbackIndex = -1) {
  const official = getOfficialCategoryFor(category, fallbackIndex);
  const order = official?.sortOrder ?? category.sort_order ?? category.sortOrder ?? (fallbackIndex >= 0 ? fallbackIndex + 1 : null);
  const icon = official?.icon ?? category.icon ?? '';
  const name = official?.name ?? category.name;
  return order ? `${String(order).padStart(2, '0')}. ${icon} ${name}`.trim() : `${icon} ${name}`.trim();
}

export function applyOfficialCategoryDisplay<T extends { sort_order?: number | null; sortOrder?: number | null; slug?: string | null; name?: string | null; icon?: string | null; description?: string | null; short_description?: string | null; shortDescription?: string | null; tags?: string[] | null }>(
  category: T,
  fallbackIndex = -1,
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
