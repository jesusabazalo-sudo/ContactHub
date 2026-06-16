export type SearchableCategory = {
  name?: string | null;
  title?: string | null;
  subtitle?: string | null;
  displayTitle?: string | null;
  displaySubtitle?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  short_description?: string | null;
  slug?: string | null;
  tags?: string[] | null;
  whatYouCanFind?: string[] | null;
};

export type SearchableContact = {
  name?: string | null;
  description?: string | null;
  phone?: string | null;
  phoneMasked?: string | null;
  phone_masked?: string | null;
  tags?: string[] | null;
  categoryName?: string | null;
  category_name?: string | null;
  folderName?: string | null;
  visibleNote?: string | null;
  internal_note?: string | null;
  import_note?: string | null;
  raw_phone?: string | null;
  status?: string | null;
  source?: string | null;
};

export function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

function tokenMatches(queryToken: string, candidateToken: string) {
  if (!queryToken || !candidateToken) return false;
  if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) return true;
  if (queryToken.length < 4 || candidateToken.length < 4) return false;
  const tolerance = Math.max(queryToken.length, candidateToken.length) >= 8 ? 2 : 1;
  return editDistance(queryToken, candidateToken) <= tolerance;
}

const semanticGroups = [
  ['ia', 'inteligencia', 'artificial', 'automatizacion', 'prompts', 'tech', 'tecnologia'],
  ['video', 'videos', 'contenido', 'edicion', 'viralidad', 'audiovisual'],
  ['libro', 'libros', 'pdf', 'biblioteca', 'lectura', 'educacion', 'curso', 'cursos'],
  ['proveedor', 'proveedores', 'negocio', 'negocios', 'empresa', 'empresas', 'ventas'],
  ['ingles', 'idioma', 'idiomas', 'educacion', 'curso', 'cursos'],
  ['streaming', 'striming', 'directos', 'entretenimiento', 'gaming'],
  ['cocina', 'gastronomia', 'chef', 'alimentos', 'recetas'],
  ['fitness', 'salud', 'nutricion', 'entrenamiento', 'bienestar'],
  ['marketing', 'ventas', 'redes', 'crecimiento', 'publicidad'],
  ['musica', 'audio', 'dj', 'beats', 'sonido'],
  ['diseno', 'fotografia', 'creatividad', 'grafico', 'visual'],
  ['reparacion', 'reparaciones', 'tecnico', 'mantenimiento', 'oficios'],
];

function tokenAlternatives(token: string) {
  const group = semanticGroups.find((items) => items.some((item) => tokenMatches(token, item)));
  return group ? [...new Set([token, ...group])] : [token];
}

function scoreSearch(query: string, weightedFields: Array<{ value: string | null | undefined; weight: number }>) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  let score = 0;
  const matchedTokens = new Set<string>();

  weightedFields.forEach(({ value, weight }) => {
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue) return;
    const valueTokens = normalizedValue.split(' ').filter(Boolean);

    if (normalizedValue === normalizedQuery) score += 100 * weight;
    else if (normalizedValue.startsWith(normalizedQuery)) score += 50 * weight;
    else if (normalizedValue.includes(normalizedQuery)) score += 30 * weight;

    queryTokens.forEach((queryToken) => {
      const alternatives = tokenAlternatives(queryToken);
      if (alternatives.some((alternative) => valueTokens.some((valueToken) => tokenMatches(alternative, valueToken)))) {
        matchedTokens.add(queryToken);
        score += 12 * weight;
      }
    });
  });

  if (!matchedTokens.size) return 0;
  const coverageBonus = matchedTokens.size === queryTokens.length ? queryTokens.length * 18 : matchedTokens.size * 4;
  return score + coverageBonus;
}

export function searchCategories<T extends SearchableCategory>(query: string, categories: T[]) {
  if (!normalizeSearchText(query)) return categories;
  return categories
    .map((category, index) => ({
      category,
      index,
      score: scoreSearch(query, [
        { value: category.name, weight: 5 },
        { value: category.title ?? category.displayTitle, weight: 5 },
        { value: category.subtitle ?? category.displaySubtitle, weight: 4 },
        { value: category.slug, weight: 3 },
        { value: category.shortDescription ?? category.short_description, weight: 3 },
        { value: category.description, weight: 2 },
        { value: category.tags?.join(' '), weight: 4 },
        { value: category.whatYouCanFind?.join(' '), weight: 4 },
      ]),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((result) => result.category);
}

export function searchContacts<T extends SearchableContact>(query: string, contacts: T[]) {
  if (!normalizeSearchText(query)) return contacts;
  return contacts
    .map((contact, index) => ({
      contact,
      index,
      score: scoreSearch(query, [
        { value: contact.name, weight: 5 },
        { value: contact.description, weight: 4 },
        { value: contact.categoryName ?? contact.category_name ?? contact.folderName, weight: 4 },
        { value: contact.tags?.join(' '), weight: 4 },
        { value: contact.phone, weight: 3 },
        { value: contact.phoneMasked ?? contact.phone_masked, weight: 2 },
        { value: contact.visibleNote, weight: 2 },
        { value: contact.internal_note, weight: 3 },
        { value: contact.import_note, weight: 2 },
        { value: contact.raw_phone, weight: 2 },
        { value: contact.status, weight: 2 },
        { value: contact.source, weight: 1 },
      ]),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((result) => result.contact);
}
