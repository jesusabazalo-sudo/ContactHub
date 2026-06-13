export type OfficialCategory = {
  sortOrder: number;
  displayOrder: number;
  icon: string;
  name: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  shortDescription: string;
  tags: string[];
  whatYouCanFind: string[];
  isActive: boolean;
  isPremium?: boolean;
};

export const officialCategories: OfficialCategory[] = [
  {
    sortOrder: 1,
    displayOrder: 1,
    icon: '🔥',
    title: 'Negocios, empresas y proveedores',
    subtitle: 'Elite Business',
    name: 'Negocios, empresas y proveedores - Elite Business',
    slug: 'elite-business',
    description: 'Contactos y oportunidades vinculadas al mundo empresarial, servicios corporativos y crecimiento comercial.',
    shortDescription: 'Contactos para negocios, empresas, proveedores y servicios comerciales.',
    tags: ['negocios', 'ventas', 'corporate', 'servicios'],
    whatYouCanFind: ['proveedores', 'contactos de negocio', 'servicios corporativos', 'oportunidades comerciales'],
    isActive: true,
  },
  {
    sortOrder: 2,
    displayOrder: 2,
    icon: '🤖',
    title: 'Inteligencia artificial y herramientas digitales',
    subtitle: 'IA Masters',
    name: 'Inteligencia artificial y herramientas digitales - IA Masters',
    slug: 'ia-masters',
    description: 'Recursos y contactos orientados a inteligencia artificial, automatización y herramientas digitales.',
    shortDescription: 'Herramientas, recursos tech y contactos para avanzar con IA.',
    tags: ['ia', 'tech', 'automatización', 'productividad'],
    whatYouCanFind: ['herramientas IA', 'automatización', 'productividad digital', 'recursos tech'],
    isActive: true,
  },
  {
    sortOrder: 3,
    displayOrder: 3,
    icon: '📚',
    title: 'Educación, cursos y libros',
    subtitle: 'Knowledge Vault',
    name: 'Educación, cursos y libros - Knowledge Vault',
    slug: 'knowledge-vault',
    description: 'Opciones vinculadas a aprendizaje, formación, clases, cursos, libros y desarrollo académico.',
    shortDescription: 'Opciones para aprender, formarte y encontrar recursos educativos.',
    tags: ['educación', 'cursos', 'libros', 'formación'],
    whatYouCanFind: ['cursos', 'tutorías', 'libros y recursos', 'formación profesional'],
    isActive: true,
  },
  {
    sortOrder: 4,
    displayOrder: 4,
    icon: '💪',
    title: 'Fitness, salud y nutrición',
    subtitle: 'Fit Kingdom',
    name: 'Fitness, salud y nutrición - Fit Kingdom',
    slug: 'fit-kingdom',
    description: 'Contactos relacionados con bienestar físico, nutrición, entrenamiento y hábitos saludables.',
    shortDescription: 'Contactos para entrenamiento, salud, rutinas y bienestar.',
    tags: ['fitness', 'salud', 'nutrición', 'bienestar'],
    whatYouCanFind: ['entrenadores', 'nutrición', 'rutinas', 'bienestar saludable'],
    isActive: true,
  },
  {
    sortOrder: 5,
    displayOrder: 5,
    icon: '🎨',
    title: 'Diseño, fotografía y creatividad',
    subtitle: 'Creative Studio',
    name: 'Diseño, fotografía y creatividad - Creative Studio',
    slug: 'creative-studio',
    description: 'Recursos y contactos para diseño, fotografía, edición, creatividad visual y producción gráfica.',
    shortDescription: 'Recursos visuales, creativos y contactos para proyectos gráficos.',
    tags: ['diseño', 'creatividad', 'fotografía', 'edición'],
    whatYouCanFind: ['diseñadores', 'recursos visuales', 'edición', 'fotografía'],
    isActive: true,
  },
  {
    sortOrder: 6,
    displayOrder: 6,
    icon: '🎮',
    title: 'Gaming, streaming y entretenimiento',
    subtitle: 'Enterplay',
    name: 'Gaming, streaming y entretenimiento - Enterplay',
    slug: 'enterplay',
    description: 'Opciones vinculadas a gaming, streaming, entretenimiento digital y comunidades online.',
    shortDescription: 'Contactos y recursos para gaming, streaming y entretenimiento digital.',
    tags: ['gaming', 'streaming', 'entretenimiento', 'comunidad'],
    whatYouCanFind: ['streaming', 'comunidades gamer', 'entretenimiento digital', 'recursos gaming'],
    isActive: true,
  },
  {
    sortOrder: 7,
    displayOrder: 7,
    icon: '🚀',
    title: 'Marketing digital y crecimiento',
    subtitle: 'Scale Up',
    name: 'Marketing digital y crecimiento - Scale Up',
    slug: 'scale-up',
    description: 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.',
    shortDescription: 'Opciones para crecer, vender y mover mejor tus canales digitales.',
    tags: ['marketing', 'ventas', 'redes sociales', 'crecimiento'],
    whatYouCanFind: ['marketing digital', 'ventas', 'redes sociales', 'crecimiento de audiencia'],
    isActive: true,
  },
  {
    sortOrder: 8,
    displayOrder: 8,
    icon: '⚽',
    title: 'Deportes y manualidades',
    subtitle: 'Sports Lab',
    name: 'Deportes y manualidades - Sports Lab',
    slug: 'sports-lab',
    description: 'Contactos y recursos para deportes específicos, hobbies, actividades manuales y comunidades especializadas.',
    shortDescription: 'Recursos para actividades físicas, hobbies y proyectos manuales.',
    tags: ['deportes', 'manualidades', 'hobbies', 'actividades'],
    whatYouCanFind: ['deportes específicos', 'manualidades', 'hobbies', 'actividades guiadas'],
    isActive: true,
  },
  {
    sortOrder: 9,
    displayOrder: 9,
    icon: '🛠️',
    title: 'Reparaciones técnicas y oficios',
    subtitle: 'Tech Repair',
    name: 'Reparaciones técnicas y oficios - Tech Repair',
    slug: 'tech-repair',
    description: 'Contactos para reparaciones, soporte técnico, mantenimiento, oficios y soluciones prácticas.',
    shortDescription: 'Contactos para soporte técnico, reparaciones y servicios prácticos.',
    tags: ['reparaciones', 'técnico', 'oficios', 'mantenimiento'],
    whatYouCanFind: ['servicios técnicos', 'reparaciones', 'mantenimiento', 'oficios prácticos'],
    isActive: true,
  },
  {
    sortOrder: 10,
    displayOrder: 10,
    icon: '🧘',
    title: 'Espiritualidad, bienestar y familia',
    subtitle: 'Soul Realm',
    name: 'Espiritualidad, bienestar y familia - Soul Realm',
    slug: 'soul-realm',
    description: 'Opciones relacionadas con espiritualidad, orientación personal, bienestar familiar y temas afines.',
    shortDescription: 'Orientación, bienestar y recursos para equilibrio personal y familiar.',
    tags: ['espiritualidad', 'familia', 'bienestar', 'orientación'],
    whatYouCanFind: ['orientación personal', 'bienestar familiar', 'espiritualidad', 'recursos de apoyo'],
    isActive: true,
  },
  {
    sortOrder: 11,
    displayOrder: 11,
    icon: '🌟',
    title: 'Varios y recursos extra',
    subtitle: 'Misc Bonus',
    name: 'Varios y recursos extra - Misc Bonus',
    slug: 'misc-bonus',
    description: 'Carpeta flexible con recursos variados, oportunidades bonus y contactos útiles difíciles de clasificar.',
    shortDescription: 'Recursos sueltos, oportunidades extra y contactos útiles variados.',
    tags: ['varios', 'bonus', 'recursos', 'oportunidades'],
    whatYouCanFind: ['recursos variados', 'bonus útiles', 'oportunidades sueltas', 'contactos especiales'],
    isActive: true,
  },
  {
    sortOrder: 12,
    displayOrder: 12,
    icon: '💰',
    title: 'Negocios escalables y dinero',
    subtitle: 'Cash Flow',
    name: 'Negocios escalables y dinero - Cash Flow',
    slug: 'cash-flow',
    description: 'Contactos y oportunidades vinculadas a negocios escalables, ideas comerciales y crecimiento económico.',
    shortDescription: 'Ideas comerciales, modelos escalables y oportunidades de crecimiento.',
    tags: ['dinero', 'negocios', 'escalable', 'oportunidades'],
    whatYouCanFind: ['ideas de negocio', 'modelos escalables', 'oportunidades comerciales', 'recursos de crecimiento'],
    isActive: true,
  },
  {
    sortOrder: 13,
    displayOrder: 13,
    icon: '🧠',
    title: 'Desarrollo personal y alto rendimiento',
    subtitle: 'Mind Power',
    name: 'Desarrollo personal y alto rendimiento - Mind Power',
    slug: 'mind-power',
    description: 'Recursos sobre productividad, enfoque, mentalidad, rendimiento personal y desarrollo aplicado.',
    shortDescription: 'Recursos para mentalidad, enfoque, productividad y rendimiento.',
    tags: ['alto rendimiento', 'mentalidad', 'productividad', 'enfoque'],
    whatYouCanFind: ['productividad', 'mentalidad', 'alto rendimiento', 'desarrollo personal'],
    isActive: true,
  },
  {
    sortOrder: 14,
    displayOrder: 14,
    icon: '🎬',
    title: 'Contenido, edición y viralidad',
    subtitle: 'Viral Factory',
    name: 'Contenido, edición y viralidad - Viral Factory',
    slug: 'viral-factory',
    description: 'Contactos y recursos para creación de contenido, viralidad, edición, redes y producción digital.',
    shortDescription: 'Recursos para crear, editar y mover contenido con más impacto.',
    tags: ['contenido', 'viralidad', 'redes', 'producción'],
    whatYouCanFind: ['creadores', 'edición', 'viralidad', 'producción digital'],
    isActive: true,
  },
  {
    sortOrder: 15,
    displayOrder: 15,
    icon: '🎧',
    title: 'Música, audio y DJ',
    subtitle: 'Beat Studio',
    name: 'Música, audio y DJ - Beat Studio',
    slug: 'beat-studio',
    description: 'Contactos para música, audio, streaming, beats, sonido, DJ, producción y recursos musicales.',
    shortDescription: 'Contactos y recursos para música, sonido, beats y producción.',
    tags: ['música', 'audio', 'streaming', 'beats'],
    whatYouCanFind: ['música', 'audio', 'streaming', 'producción sonora'],
    isActive: true,
  },
  {
    sortOrder: 16,
    displayOrder: 16,
    icon: '🎮',
    title: 'Juegos, plataformas y mundo gamer',
    subtitle: 'Gamer Zone',
    name: 'Juegos, plataformas y mundo gamer - Gamer Zone',
    slug: 'gamer-zone',
    description: 'Opciones de gaming avanzado, entretenimiento digital, comunidades, recursos gamer y cultura digital.',
    shortDescription: 'Recursos gamer, plataformas, comunidades y entretenimiento digital.',
    tags: ['gaming', 'digital', 'entretenimiento', 'gamer'],
    whatYouCanFind: ['recursos gamer', 'comunidades', 'entretenimiento digital', 'herramientas gaming'],
    isActive: true,
  },
  {
    sortOrder: 17,
    displayOrder: 17,
    icon: '🙏',
    title: 'Espiritualidad y poder interior',
    subtitle: 'Sacred Power',
    name: 'Espiritualidad y poder interior - Sacred Power',
    slug: 'sacred-power',
    description: 'Contactos y recursos para crecimiento interior, bienestar emocional, enfoque personal y espiritualidad.',
    shortDescription: 'Opciones para crecimiento interior, enfoque y bienestar emocional.',
    tags: ['espiritualidad', 'bienestar', 'interior', 'enfoque'],
    whatYouCanFind: ['bienestar emocional', 'crecimiento interior', 'orientación', 'recursos espirituales'],
    isActive: true,
  },
  {
    sortOrder: 18,
    displayOrder: 18,
    icon: '⚠️',
    title: 'Contenido reservado o sensible',
    subtitle: 'The Vault',
    name: 'Contenido reservado o sensible — The Vault',
    slug: 'the-vault',
    description: 'Carpeta reservada para revision, clasificacion interna y control de seguridad.',
    shortDescription: 'Contenido de tratamiento reservado, visible solo bajo criterios internos.',
    tags: ['revision', 'interno', 'seguridad'],
    whatYouCanFind: ['control interno', 'clasificacion', 'revision', 'seguridad'],
    isActive: true,
  },
  {
    sortOrder: 19,
    displayOrder: 19,
    icon: '👶',
    title: 'Familia, educación infantil y crianza',
    subtitle: 'Family Care',
    name: 'Familia, educación infantil y crianza - Family Care',
    slug: 'family-care',
    description: 'Contactos para familia, educación infantil, crianza, aprendizaje temprano y desarrollo de niños.',
    shortDescription: 'Recursos para crianza, aprendizaje infantil y apoyo familiar.',
    tags: ['familia', 'educación', 'infantil', 'crianza'],
    whatYouCanFind: ['educación infantil', 'crianza', 'recursos familiares', 'desarrollo de niños'],
    isActive: true,
  },
  {
    sortOrder: 20,
    displayOrder: 20,
    icon: '🔧',
    title: 'Oficios, herramientas y servicios prácticos',
    subtitle: 'Pro Tools',
    name: 'Oficios, herramientas y servicios prácticos - Pro Tools',
    slug: 'pro-tools',
    description: 'Contactos relacionados con oficios, herramientas profesionales, servicios técnicos y soluciones de trabajo.',
    shortDescription: 'Servicios prácticos, oficios y recursos útiles para trabajar mejor.',
    tags: ['oficios', 'herramientas', 'servicios', 'trabajo'],
    whatYouCanFind: ['herramientas pro', 'oficios', 'servicios técnicos', 'soluciones de trabajo'],
    isActive: true,
  },
  {
    sortOrder: 21,
    displayOrder: 21,
    icon: '🔬',
    title: 'Ciencia, técnica y conocimiento avanzado',
    subtitle: 'Science Deep',
    name: 'Ciencia, técnica y conocimiento avanzado - Science Deep',
    slug: 'science-deep',
    description: 'Recursos especializados para ciencia, técnica, conocimiento avanzado, formación y aprendizaje profundo.',
    shortDescription: 'Recursos especializados para aprender temas técnicos o avanzados.',
    tags: ['ciencia', 'técnica', 'conocimiento', 'formación'],
    whatYouCanFind: ['conocimiento avanzado', 'recursos técnicos', 'ciencia aplicada', 'formación especializada'],
    isActive: true,
  },
  {
    sortOrder: 22,
    displayOrder: 22,
    icon: '💪',
    title: 'Fitness intenso y disciplina física',
    subtitle: 'Warrior Fit',
    name: 'Fitness intenso y disciplina física - Warrior Fit',
    slug: 'warrior-fit',
    description: 'Contactos y recursos para entrenamiento intenso, disciplina física, rendimiento y estilo de vida activo.',
    shortDescription: 'Opciones para entrenamiento intenso, disciplina y rendimiento físico.',
    tags: ['fitness', 'entrenamiento', 'disciplina', 'rendimiento'],
    whatYouCanFind: ['entrenamiento', 'disciplina física', 'rutinas intensas', 'rendimiento'],
    isActive: true,
  },
  {
    sortOrder: 23,
    displayOrder: 23,
    icon: '🍳',
    title: 'Gastronomía, cocina y chef',
    subtitle: 'Chef Gold',
    name: 'Gastronomía, cocina y chef - Chef Gold',
    slug: 'chef-gold',
    description: 'Contactos para cocina, gastronomia, alimentos, insumos y oportunidades culinarias.',
    shortDescription: 'Contactos e ideas para cocina, insumos, chef y oportunidades culinarias.',
    tags: ['gastronomía', 'cocina', 'chef', 'alimentos'],
    whatYouCanFind: ['insumos', 'cocina', 'servicios culinarios', 'oportunidades gastronomicas'],
    isActive: true,
  },
  {
    sortOrder: 24,
    displayOrder: 24,
    icon: '🎁',
    title: 'Bonus, hallazgos y oportunidades extra',
    subtitle: 'Bonus Hunt',
    name: 'Bonus, hallazgos y oportunidades extra - Bonus Hunt',
    slug: 'bonus-hunt',
    description: 'Recursos especiales, contactos bonus y oportunidades utiles que no encajan en una sola categoria.',
    shortDescription: 'Hallazgos, contactos bonus y oportunidades complementarias.',
    tags: ['bonus', 'recursos', 'especiales'],
    whatYouCanFind: ['contactos bonus', 'recursos especiales', 'oportunidades utiles', 'ideas complementarias'],
    isActive: true,
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

export const officialCategorySlugAliases: Record<string, string[]> = {
  'elite-business': ['corporate-negocios'],
  'ia-masters': ['inteligencia-artificial-tech', 'ia-herramientas-tech'],
  'knowledge-vault': ['educacion-cursos-libros', 'educacion-cursos-libros-recursos'],
  'fit-kingdom': ['fitness-salud-nutricion'],
  'creative-studio': ['diseno-creatividad-recursos', 'creatividad-diseno-fotografia'],
  enterplay: ['gaming-streaming-entretenimiento'],
  'scale-up': ['marketing-digital-crecimiento'],
  'sports-lab': ['deportes-manualidades', 'deportes-especificos-manualidades'],
  'tech-repair': ['reparaciones-tecnicas-oficios'],
  'soul-realm': ['espiritualidad-familia', 'espiritualidad-ocultismo-familia'],
  'misc-bonus': ['varios-bonus'],
  'cash-flow': ['power-money-negocios-escalables'],
  'mind-power': ['mentes-maestras-alto-rendimiento'],
  'viral-factory': ['content-kings-viral-lab'],
  'beat-studio': ['audio-masters-musica', 'audio-masters-musica-infinita'],
  'gamer-zone': ['gamer-elite-vicios-digitales'],
  'sacred-power': ['espiritualidad-poder-interior'],
  'the-vault': ['prohibido'],
  'family-care': ['familia-educacion-desarrollo-infantil'],
  'pro-tools': ['oficios-herramientas-pro'],
  'science-deep': ['ciencia-tecnica-conocimiento-avanzado'],
  'warrior-fit': ['fitness-warrior-guerreros-modernos'],
  'chef-gold': ['chef-premium-gastronomia-elite'],
  'bonus-hunt': ['bonus-track-tesoros-ocultos'],
};

function normalizeWords(value?: string | null) {
  return normalize(value).replace(/-/g, ' ').trim();
}

function stripLeadingSymbol(value?: string | null) {
  return (value ?? '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

function officialSlugSet(official: OfficialCategory) {
  return new Set([official.slug, ...(officialCategorySlugAliases[official.slug] ?? [])].map(normalize));
}

function categoryMatchesOfficial(
  category: { slug?: string | null; name?: string | null; short_description?: string | null; shortDescription?: string | null },
  official: OfficialCategory,
) {
  const slug = normalize(category.slug);
  if (slug && officialSlugSet(official).has(slug)) return true;

  const name = normalizeWords(stripLeadingSymbol(category.name));
  const shortDescription = normalizeWords(category.shortDescription ?? category.short_description);
  const officialTitle = normalizeWords(official.title);
  const officialSubtitle = normalizeWords(official.subtitle);
  const officialName = normalizeWords(official.name);

  if (name && (name === officialName || name.includes(officialTitle))) return true;
  if (name && officialSubtitle && name.includes(officialSubtitle)) return true;
  if (shortDescription && officialSubtitle && shortDescription.includes(officialSubtitle)) return true;
  return false;
}

export function getOfficialCategoryByOrder(order?: number | null) {
  if (!order) return undefined;
  return officialCategories.find((category) => category.sortOrder === order);
}

export function getOfficialCategoryFor(
  category: { sort_order?: number | null; sortOrder?: number | null; display_order?: number | null; displayOrder?: number | null; slug?: string | null; name?: string | null; short_description?: string | null; shortDescription?: string | null },
  fallbackIndex = -1,
) {
  const order = category.display_order ?? category.displayOrder ?? category.sort_order ?? category.sortOrder ?? null;
  return (
    officialCategories.find((item) => categoryMatchesOfficial(category, item)) ??
    getOfficialCategoryByOrder(order) ??
    (fallbackIndex >= 0 ? officialCategories[fallbackIndex] : undefined)
  );
}

export function formatCategoryOptionLabel(
  category: { name: string; icon?: string | null; sort_order?: number | null; sortOrder?: number | null; display_order?: number | null; displayOrder?: number | null; slug?: string | null },
  fallbackIndex = -1,
) {
  const official = getOfficialCategoryFor(category, fallbackIndex);
  const order = official?.sortOrder ?? category.display_order ?? category.displayOrder ?? category.sort_order ?? category.sortOrder ?? (fallbackIndex >= 0 ? fallbackIndex + 1 : null);
  const icon = official?.icon ?? category.icon ?? '';
  const title = official?.title ?? category.name;
  const subtitle = official?.subtitle ?? '';
  const name = subtitle ? `${title} - ${subtitle}` : title;
  return order ? `${icon} ${String(order).padStart(2, '0')}. ${name}`.trim() : `${icon} ${name}`.trim();
}

export function applyOfficialCategoryDisplay<
  T extends {
    sort_order?: number | null;
    sortOrder?: number | null;
    display_order?: number | null;
    displayOrder?: number | null;
    slug?: string | null;
    name?: string | null;
    icon?: string | null;
    description?: string | null;
    short_description?: string | null;
    shortDescription?: string | null;
    tags?: string[] | null;
  },
>(category: T, fallbackIndex = -1) {
  const official = getOfficialCategoryFor(category, fallbackIndex);
  if (!official) return category;
  return {
    ...category,
    sort_order: official.sortOrder,
    sortOrder: official.sortOrder,
    display_order: official.displayOrder,
    displayOrder: official.displayOrder,
    icon: official.icon,
    name: official.name,
    displayTitle: official.title,
    displaySubtitle: official.subtitle,
    displayLabel: official.displayOrder === 18
      ? `18. ${official.icon} Contenido reservado o sensible — The Vault`
      : `${official.icon} ${String(official.displayOrder).padStart(2, '0')}. ${official.title} - ${official.subtitle}`,
    description: official.description,
    short_description: official.shortDescription,
    shortDescription: official.shortDescription,
    tags: official.tags,
    whatYouCanFind: official.whatYouCanFind,
    is_active: official.isActive,
    isActive: official.isActive,
    isPremiumOfficial: official.isPremium ?? false,
  };
}

export function sortByOfficialOrder<T extends { sort_order?: number | null; sortOrder?: number | null; display_order?: number | null; displayOrder?: number | null; slug?: string | null; name?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const officialA = getOfficialCategoryFor(a);
    const officialB = getOfficialCategoryFor(b);
    const orderA = officialA?.sortOrder ?? a.display_order ?? a.displayOrder ?? a.sort_order ?? a.sortOrder ?? 999;
    const orderB = officialB?.sortOrder ?? b.display_order ?? b.displayOrder ?? b.sort_order ?? b.sortOrder ?? 999;
    return orderA - orderB || (a.name ?? '').localeCompare(b.name ?? '');
  });
}

export type OfficialCategoryDisplay = {
  displayOrder: number;
  displayIcon: string;
  displayTitle: string;
  displaySubtitle: string;
  displayLabel: string;
  officialSlug?: string;
};

function formatOfficialDisplayLabel(order: number, icon: string, title: string, subtitle: string) {
  if (order === 18) return `18. ${icon} Contenido reservado o sensible — The Vault`;
  return `${icon} ${String(order).padStart(2, '0')}. ${title}${subtitle ? ` - ${subtitle}` : ''}`;
}

function splitOfficialName(name: string, fallbackSubtitle = '') {
  const [title = name, ...subtitleParts] = name.split(/\s+[–-]\s+/);
  return {
    title: title.trim(),
    subtitle: (subtitleParts.join(' - ') || fallbackSubtitle).trim(),
  };
}

export function getOfficialCategoryDisplayParts(
  category: {
    sort_order?: number | null;
    sortOrder?: number | null;
    display_order?: number | null;
    displayOrder?: number | null;
    slug?: string | null;
    name?: string | null;
    icon?: string | null;
    short_description?: string | null;
    shortDescription?: string | null;
  },
  fallbackIndex = -1,
): OfficialCategoryDisplay {
  const official = getOfficialCategoryFor(category, fallbackIndex);
  const order = official?.sortOrder ?? category.display_order ?? category.displayOrder ?? category.sort_order ?? category.sortOrder ?? (fallbackIndex >= 0 ? fallbackIndex + 1 : 999);
  const icon = official?.icon ?? category.icon ?? '📁';
  const fallback = splitOfficialName(category.name ?? 'Carpeta', category.shortDescription ?? category.short_description ?? '');
  const title = official?.title ?? fallback.title;
  const subtitle = official?.subtitle ?? fallback.subtitle;

  return {
    displayOrder: order,
    displayIcon: icon,
    displayTitle: title,
    displaySubtitle: subtitle,
    displayLabel: formatOfficialDisplayLabel(order, icon, title, subtitle),
    officialSlug: official?.slug,
  };
}

export function normalizeOfficialCategoryRows<
  T extends {
    id?: string;
    sort_order?: number | null;
    sortOrder?: number | null;
    display_order?: number | null;
    displayOrder?: number | null;
    slug?: string | null;
    name?: string | null;
    icon?: string | null;
    description?: string | null;
    short_description?: string | null;
    shortDescription?: string | null;
    tags?: string[] | null;
  },
>(items: T[]) {
  const byOfficialKey = new Map<string, T & ReturnType<typeof applyOfficialCategoryDisplay> & OfficialCategoryDisplay>();

  items.forEach((item, index) => {
    const applied = applyOfficialCategoryDisplay(item, index) as T & ReturnType<typeof applyOfficialCategoryDisplay>;
    const display = getOfficialCategoryDisplayParts(applied, index);
    const key = display.officialSlug ?? applied.slug ?? item.slug ?? item.id ?? `${display.displayOrder}-${display.displayTitle}`;
    const normalized = { ...applied, ...display };
    const current = byOfficialKey.get(key);
    const normalizedHasOfficialSlug = Boolean(display.officialSlug && (item.slug === display.officialSlug || applied.slug === display.officialSlug));
    const currentHasOfficialSlug = Boolean(current?.officialSlug && current.slug === current.officialSlug);

    if (!current || (normalizedHasOfficialSlug && !currentHasOfficialSlug)) {
      byOfficialKey.set(key, normalized);
    }
  });

  return [...byOfficialKey.values()].sort((a, b) => a.displayOrder - b.displayOrder || a.displayTitle.localeCompare(b.displayTitle));
}

export function buildOfficialCategoryOptions<
  T extends {
    id?: string;
    sort_order?: number | null;
    sortOrder?: number | null;
    display_order?: number | null;
    displayOrder?: number | null;
    slug?: string | null;
    name?: string | null;
    icon?: string | null;
    description?: string | null;
    short_description?: string | null;
    shortDescription?: string | null;
    tags?: string[] | null;
    contacts_count?: number | null;
  },
>(items: T[]) {
  const uniqueItems = [...new Map(items.map((item) => [item.slug ?? item.id ?? item.name ?? Math.random().toString(), item])).values()];

  return officialCategories
    .filter((category) => category.displayOrder <= 24)
    .map((official) => {
      const real = uniqueItems.find((item) => categoryMatchesOfficial(item, official));
      const base = real ?? ({ id: `missing:${official.slug}`, slug: official.slug, contacts_count: 0 } as T);

      return {
        ...base,
        sort_order: official.sortOrder,
        sortOrder: official.sortOrder,
        display_order: official.displayOrder,
        displayOrder: official.displayOrder,
        icon: official.icon,
        name: official.name,
        description: official.description,
        short_description: official.shortDescription,
        shortDescription: official.shortDescription,
        tags: official.tags,
        whatYouCanFind: official.whatYouCanFind,
        is_active: official.isActive,
        isActive: official.isActive,
        isPremiumOfficial: official.isPremium ?? false,
        displayIcon: official.icon,
        displayTitle: official.title,
        displaySubtitle: official.subtitle,
        displayLabel: formatOfficialDisplayLabel(official.displayOrder, official.icon, official.title, official.subtitle),
        officialSlug: official.slug,
        contacts_count: real?.contacts_count ?? 0,
      };
    });
}
