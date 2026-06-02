import { Archive, Check, ChevronDown, Copy, ExternalLink, Plus, RefreshCw, Save, Search, Tags, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { buildOfficialCategoryOptions, officialCategories, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { sanitizePhone, sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { deleteContact, deleteContactsBulk, getCountryCode, getFlag, updateContact } from '../../services/adminContactsService';
import { formatPhone, maskPhone } from '../../utils/phone';

type CategoryOption = {
  id: string;
  name: string;
  icon?: string | null;
  slug?: string | null;
  sort_order?: number | null;
  short_description?: string | null;
  tags?: string[] | null;
  contacts_count?: number;
} & OfficialCategoryDisplay;

type ContactStatus = 'active' | 'inactive' | 'review' | 'rejected';
type ContactQualityFilter = 'all' | 'complete' | 'pending' | 'no_phone' | 'verified';
type AdminContactStats = {
  total: number;
  uncategorized: number;
  complete: number;
  noPhone: number;
};

type ContactRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  phone_masked: string | null;
  whatsapp?: string | null;
  internal_note?: string | null;
  source?: string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
  country_flag?: string | null;
  country_code?: string | null;
  tags: string[] | null;
  status: ContactStatus;
  risk_level: 'safe' | 'review' | 'prohibited';
  created_at: string;
  category_name?: string;
  category_icon?: string;
};

type ContactForm = {
  name: string;
  phone: string;
  whatsapp: string;
  category_id: string;
  description: string;
  tags: string;
  status: ContactStatus;
  internal_note: string;
  source: string;
  country_flag: string;
  country_code: string;
};

const pageSize = 50;
const suggestedFolderCapacity = 200;
const adminContactsStateKey = 'contacthub_admin_contacts_state_v1';
const baseContactSelect = 'id, name, phone, phone_masked, status, created_at, category_id, description, tags, risk_level, country_flag, country_code';
const extendedContactSelect = `${baseContactSelect}, whatsapp, internal_note, source, is_active, deleted_at`;

const emptyForm: ContactForm = {
  name: '',
  phone: '',
  whatsapp: '',
  category_id: '',
  description: '',
  tags: '',
  status: 'active',
  internal_note: '',
  source: 'manual',
  country_flag: '🇵🇪',
  country_code: 'PE',
};

type SupabaseDebugError = {
  message?: string;
  details?: string | null;
  code?: string | null;
  hint?: string | null;
};

type PersistedAdminContactsState = {
  selectedCategory?: string;
  activeSubtab?: 'list' | 'folder';
  selectedStatus?: 'all' | ContactStatus;
  qualityFilter?: ContactQualityFilter;
  tagFilter?: string;
  search?: string;
  currentPage?: number;
};

function loadPersistedAdminContactsState(): PersistedAdminContactsState {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(adminContactsStateKey) ?? '{}') as PersistedAdminContactsState;
  } catch {
    return {};
  }
}

function logSupabaseError(context: string, error: SupabaseDebugError) {
  console.error(context, {
    message: error.message,
    details: error.details,
    code: error.code,
    hint: error.hint,
  });
}

function getSupabaseErrorMessage(error: SupabaseDebugError) {
  return [error.message, error.details, error.code ? `code: ${error.code}` : null, error.hint ? `hint: ${error.hint}` : null].filter(Boolean).join(' | ');
}

function isMissingColumnError(error: SupabaseDebugError) {
  return /schema cache|column|whatsapp|internal_note|deleted_at|is_active|source/i.test(error.message ?? '');
}

export function parseContactLine(line: string) {
  let cleanLine = line.trim();
  if (!cleanLine || cleanLine.length < 5) return null;
  cleanLine = cleanLine.replace(/^\d+[\.)]\s*/, '');
  cleanLine = cleanLine.replace(/^[\u{1F1E0}-\u{1F1FF}]{2}\s*/u, '');
  cleanLine = cleanLine.replace(/^[📞☎️]\s*/, '');
  const phoneMatch = cleanLine.match(/(\+?\d[\d\s\-\(\)\.]{6,18}\d)/);
  if (!phoneMatch) return null;
  const phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
  const name = cleanLine.replace(phoneMatch[0], '').replace(/[\(\)\-—–:,.]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!name || name.length < 2) return null;
  return { name, phone };
}

function detectPhoneCountry(phone: string) {
  const value = phone.replace(/[\s\-\(\)]/g, '');
  if (value.startsWith('+591')) return { country_flag: '🇧🇴', country_code: 'BO' };
  if (value.startsWith('+593')) return { country_flag: '🇪🇨', country_code: 'EC' };
  if (value.startsWith('+595')) return { country_flag: '🇵🇾', country_code: 'PY' };
  if (value.startsWith('+51')) return { country_flag: '🇵🇪', country_code: 'PE' };
  if (value.startsWith('+57')) return { country_flag: '🇨🇴', country_code: 'CO' };
  if (value.startsWith('+52')) return { country_flag: '🇲🇽', country_code: 'MX' };
  if (value.startsWith('+54')) return { country_flag: '🇦🇷', country_code: 'AR' };
  if (value.startsWith('+55')) return { country_flag: '🇧🇷', country_code: 'BR' };
  if (value.startsWith('+56')) return { country_flag: '🇨🇱', country_code: 'CL' };
  if (value.startsWith('+1')) return { country_flag: '🇺🇸', country_code: 'US' };
  if (value.startsWith('+34')) return { country_flag: '🇪🇸', country_code: 'ES' };
  if (value.startsWith('+86')) return { country_flag: '🇨🇳', country_code: 'CN' };
  return { country_flag: getFlag(value), country_code: getCountryCode(value) };
}

function normalizePhoneForAdmin(phone: string) {
  return sanitizePhone(phone.replace(/[\s\-\(\)]/g, ''));
}

function splitTags(tags: string) {
  return tags
    .split(',')
    .map((tag) => sanitizeText(tag, 32).toLowerCase())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .slice(0, 5);
}

function getCategoryLabel(category?: CategoryOption) {
  if (!category) return 'Sin categoría';
  const order = String(category.displayOrder ?? category.sort_order ?? '').padStart(2, '0');
  const title = category.displayTitle ?? category.name;
  const subtitle = category.displaySubtitle ?? category.short_description;
  return `${category.displayIcon ?? category.icon ?? '📁'} ${order}. ${title}${subtitle ? ` - ${subtitle}` : ''}`;
}

function getCategoryCompactLabel(category?: CategoryOption) {
  if (!category) return 'Sin categoría';
  const order = String(category.displayOrder ?? category.sort_order ?? '').padStart(2, '0');
  return `${category.displayIcon ?? category.icon ?? '📁'} ${order}. ${category.displayTitle ?? category.name}`;
}

function suggestContactTags(contact: { name: string; description: string; category?: CategoryOption }) {
  const seed = [
    ...(contact.category?.tags ?? []),
    contact.category?.displayTitle,
    contact.category?.displaySubtitle,
    ...contact.name.split(/\s+/),
    ...contact.description.split(/\s+/),
  ];

  const stopWords = new Set(['para', 'con', 'del', 'las', 'los', 'una', 'uno', 'por', 'que', 'the', 'and']);
  return seed
    .map((item) => sanitizeText(String(item ?? ''), 28).toLowerCase())
    .filter((item) => item.length > 2 && !stopWords.has(item))
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 5);
}

function defaultDescriptionFor(category?: CategoryOption) {
  if (!category) return 'Contacto agregado manualmente para revisión y organización interna.';
  const subtitle = category.displaySubtitle ?? category.short_description ?? 'esta carpeta';
  return `Contacto relacionado con ${subtitle}. Revisa los detalles antes de publicarlo como completo.`;
}

function getContactQuality(contact: ContactRow) {
  if (!contact.phone) return { key: 'no_phone', label: 'Sin teléfono', className: 'bg-red-500/15 text-red-300 border-red-400/25' };
  if (contact.deleted_at || contact.is_active === false || contact.status === 'inactive') return { key: 'archived', label: 'Archivado', className: 'bg-white/10 text-gray-300 border-white/15' };
  if (contact.status === 'review') return { key: 'pending', label: 'Pendiente', className: 'bg-yellow-500/15 text-yellow-200 border-yellow-400/25' };
  if (contact.status === 'rejected') return { key: 'rejected', label: 'Rechazado', className: 'bg-red-500/15 text-red-300 border-red-400/25' };
  if (contact.phone && contact.description?.trim()) return { key: 'complete', label: 'Completo', className: 'bg-brand-400/15 text-brand-200 border-brand-400/25' };
  return { key: 'verified', label: 'Verificado', className: 'bg-sky-400/15 text-sky-200 border-sky-400/25' };
}

const hiddenContactStatuses = new Set(['inactive', 'deleted', 'archived']);

function isVisibleContact(contact: Partial<ContactRow> & { status?: string | null }) {
  const status = String(contact.status ?? 'active').toLowerCase();
  if (hiddenContactStatuses.has(status)) return false;
  if (contact.deleted_at) return false;
  if (contact.is_active === false) return false;
  return true;
}

function getWhatsappLink(phone: string | null | undefined) {
  const clean = normalizePhoneForAdmin(phone ?? '').replace(/^\+/, '');
  return clean ? `https://wa.me/${clean}` : '';
}

function omitNewOptionalColumns(payload: Record<string, unknown>) {
  const { whatsapp, internal_note, is_active, deleted_at, ...fallback } = payload;
  return fallback;
}

function isSyntheticCategoryId(id: string) {
  return id.startsWith('missing:');
}

function isUncategorizedFilter(id: string) {
  return id === 'uncategorized';
}

const officialCategorySlugAliases: Record<string, string[]> = {
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

function normalizeCategoryKey(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCategoryWords(value?: string | null) {
  return normalizeCategoryKey(value).replace(/-/g, ' ').trim();
}

function stripLeadingEmoji(value?: string | null) {
  return (value ?? '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

function findRealCategoryForOfficial(realRows: CategoryOption[], official: (typeof officialCategories)[number]) {
  const officialSlug = normalizeCategoryKey(official.slug);
  const aliases = new Set([officialSlug, ...(officialCategorySlugAliases[official.slug] ?? []).map(normalizeCategoryKey)]);
  const officialTitle = normalizeCategoryWords(official.title);
  const officialSubtitle = normalizeCategoryWords(official.subtitle);

  return realRows.find((category) => {
    const slug = normalizeCategoryKey(category.slug);
    if (slug && aliases.has(slug)) return true;

    const name = normalizeCategoryWords(stripLeadingEmoji(category.name));
    if (!name) return false;
    if (officialTitle && name.includes(officialTitle)) return true;
    if (officialSubtitle && name.includes(officialSubtitle)) return true;
    return false;
  });
}

function buildOfficialCategoryRows(realRows: CategoryOption[] = []) {
  return buildOfficialCategoryOptions(realRows) as CategoryOption[];
}

function findCategoryByLegacyValue(value: unknown, categoryRows: CategoryOption[]) {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  const normalizedKey = normalizeCategoryKey(text);
  const normalizedWords = normalizeCategoryWords(text);

  return categoryRows.find((category) => {
    const slug = normalizeCategoryKey(category.slug);
    const officialSlug = normalizeCategoryKey(category.officialSlug);
    const title = normalizeCategoryWords(category.displayTitle);
    const subtitle = normalizeCategoryWords(category.displaySubtitle);
    const label = normalizeCategoryWords(category.displayLabel);
    const name = normalizeCategoryWords(category.name);

    if (normalizedKey && (normalizedKey === slug || normalizedKey === officialSlug)) return true;
    if (normalizedWords && (label.includes(normalizedWords) || name.includes(normalizedWords))) return true;
    if (title && normalizedWords.includes(title)) return true;
    if (subtitle && normalizedWords.includes(subtitle)) return true;
    if (subtitle && subtitle.includes(normalizedWords)) return true;
    return false;
  });
}

function getLegacyFolderValues(row: Record<string, unknown>) {
  return ['category_slug', 'folder_slug', 'category_name', 'folder_name', 'carpeta']
    .map((key) => row[key])
    .filter((value) => String(value ?? '').trim());
}

export default function AdminContactsPage() {
  const persistedState = useMemo(loadPersistedAdminContactsState, []);
  const hasLoadedContactsRef = useRef(false);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(persistedState.selectedCategory ?? 'all');
  const [activeSubtab, setActiveSubtab] = useState<'list' | 'folder'>(persistedState.activeSubtab ?? 'list');
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [folderPickerSearch, setFolderPickerSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ContactStatus>(persistedState.selectedStatus ?? 'all');
  const [qualityFilter, setQualityFilter] = useState<ContactQualityFilter>(persistedState.qualityFilter ?? 'all');
  const [tagFilter, setTagFilter] = useState(persistedState.tagFilter ?? '');
  const [search, setSearch] = useState(persistedState.search ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(persistedState.search ?? '');
  const [currentPage, setCurrentPage] = useState(persistedState.currentPage ?? 0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [editTags, setEditTags] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [bulkTag, setBulkTag] = useState('');
  const [bulkMoveCategory, setBulkMoveCategory] = useState('');
  const [bulkStatus, setBulkStatus] = useState<ContactStatus>('active');
  const [adminStats, setAdminStats] = useState<AdminContactStats>({ total: 0, uncategorized: 0, complete: 0, noPhone: 0 });
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const filteredContacts = useMemo(() => {
    const safeTag = tagFilter.trim().toLowerCase();
    const safeSearch = debouncedSearch.trim().toLowerCase();
    return contacts.filter((contact) => {
      const quality = getContactQuality(contact).key;
      if (qualityFilter === 'complete' && quality !== 'complete') return false;
      if (qualityFilter === 'pending' && quality !== 'pending') return false;
      if (qualityFilter === 'no_phone' && quality !== 'no_phone') return false;
      if (qualityFilter === 'verified' && quality !== 'verified' && quality !== 'complete') return false;
      if (safeTag && !(contact.tags ?? []).some((tag) => tag.toLowerCase().includes(safeTag))) return false;
      if (safeSearch) {
        const haystack = [
          contact.name,
          contact.phone,
          contact.whatsapp,
          contact.description,
          contact.category_name,
          contact.status,
          ...(contact.tags ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(safeSearch)) return false;
      }
      return true;
    });
  }, [contacts, qualityFilter, tagFilter, debouncedSearch]);

  const folderPickerOptions = useMemo(() => {
    const term = folderPickerSearch.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) => getCategoryLabel(category).toLowerCase().includes(term));
  }, [categories, folderPickerSearch]);

  const visibleStats = useMemo(() => {
    const missingPhone = contacts.filter((contact) => !contact.phone).length;
    const complete = contacts.filter((contact) => getContactQuality(contact).key === 'complete').length;
    const pending = contacts.filter((contact) => getContactQuality(contact).key === 'pending' || getContactQuality(contact).key === 'no_phone').length;
    return { missingPhone, complete, pending };
  }, [contacts]);

  const pageStart = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd = Math.min(totalCount, currentPage * pageSize + contacts.length);
  const allVisibleSelected = filteredContacts.length > 0 && filteredContacts.every((contact) => selectedIds.includes(contact.id));
  const selectedCategoryObject = selectedCategory === 'all' || selectedCategory === 'uncategorized' ? undefined : categoryById.get(selectedCategory);
  const realCategoryIds = useMemo(() => categories.filter((category) => !isSyntheticCategoryId(category.id)).map((category) => category.id), [categories]);
  const selectedCategoryLabel = selectedCategory === 'all'
    ? 'Todas las carpetas'
    : selectedCategory === 'uncategorized'
      ? 'Sin categoría'
      : getCategoryCompactLabel(selectedCategoryObject);

  const applyStatusVisibility = (query: any) => {
    if (selectedStatus && selectedStatus !== 'all') return query.eq('status', selectedStatus);
    return query.neq('status', 'inactive').neq('status', 'deleted').neq('status', 'archived');
  };

  const loadCategories = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setCategories(buildOfficialCategoryRows([]) as CategoryOption[]);
      setAdminStats({ total: 0, uncategorized: 0, complete: 0, noPhone: 0 });
      return;
    }

    let realCategoryRows: CategoryOption[] = [];
    const { data, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, icon, slug, short_description, contacts_count, tags')
      .eq('is_active', true);

    if (categoriesError) {
      console.error('loadCategories error:', categoriesError);
    } else {
      realCategoryRows = (data ?? []) as CategoryOption[];
    }

    const officialRows = buildOfficialCategoryRows(realCategoryRows);

    const realIds = new Set(officialRows.filter((category) => !isSyntheticCategoryId(category.id)).map((category) => category.id));
    let { data: contactCounters, error: contactCountersError } = await (supabase as any)
      .from('contacts')
      .select('id, category_id, phone, description, status, is_active, deleted_at')
      .limit(10000);
    if (contactCountersError && isMissingColumnError(contactCountersError)) {
      const fallbackCounters = await supabase.from('contacts').select('id, category_id, phone, description, status').limit(10000);
      contactCounters = fallbackCounters.data;
      contactCountersError = fallbackCounters.error;
    }
    if (contactCountersError) console.warn('contact counters:', contactCountersError.message);

    const rowsForStats = ((contactCounters ?? []) as Array<Partial<ContactRow> & { status?: string | null }>).filter(isVisibleContact);
    const countByCategory = new Map<string, number>();
    rowsForStats.forEach((contact) => {
      if (contact.category_id && realIds.has(contact.category_id)) {
        countByCategory.set(contact.category_id, (countByCategory.get(contact.category_id) ?? 0) + 1);
      }
    });

    const withCounts = officialRows.map((category) => ({
      ...category,
      contacts_count: isSyntheticCategoryId(category.id) ? 0 : countByCategory.get(category.id) ?? 0,
    }));

    setAdminStats({
      total: rowsForStats.length,
      uncategorized: rowsForStats.filter((contact) => !contact.category_id || !realIds.has(contact.category_id)).length,
      complete: rowsForStats.filter((contact) => Boolean(contact.phone && contact.description?.trim())).length,
      noPhone: rowsForStats.filter((contact) => !contact.phone).length,
    });

    console.log('Categories loaded:', withCounts.length, withCounts[0]);
    setCategories(withCounts as CategoryOption[]);
  };

  const buildContactsQuery = (select: string, includeOptionalSearch = false) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    let query = supabase
      .from('contacts')
      .select(select)
      .order('created_at', { ascending: false })
      .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

    const searchTerm = debouncedSearch.trim();
    if (searchTerm) {
      const searchFields = [`name.ilike.%${searchTerm}%`, `phone.ilike.%${searchTerm}%`, `description.ilike.%${searchTerm}%`, `status.ilike.%${searchTerm}%`];
      if (includeOptionalSearch) searchFields.push(`whatsapp.ilike.%${searchTerm}%`);
      query = query.or(searchFields.join(','));
    }
    if (selectedCategory && selectedCategory !== 'all' && !isUncategorizedFilter(selectedCategory) && !isSyntheticCategoryId(selectedCategory)) query = query.eq('category_id', selectedCategory);
    query = applyStatusVisibility(query);
    return query;
  };

  const buildUncategorizedContactsQuery = (select: string, includeOptionalSearch = false) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    let query = supabase.from('contacts').select(select).order('created_at', { ascending: false }).limit(10000);
    const searchTerm = debouncedSearch.trim();
    if (searchTerm) {
      const searchFields = [`name.ilike.%${searchTerm}%`, `phone.ilike.%${searchTerm}%`, `description.ilike.%${searchTerm}%`, `status.ilike.%${searchTerm}%`];
      if (includeOptionalSearch) searchFields.push(`whatsapp.ilike.%${searchTerm}%`);
      query = query.or(searchFields.join(','));
    }
    query = applyStatusVisibility(query);
    return query;
  };

  const loadContacts = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setContacts([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    try {
      const showFullLoading = !hasLoadedContactsRef.current && contacts.length === 0;
      if (showFullLoading) {
        setLoading(true);
      } else {
        setIsSearching(true);
      }
      setError(null);

      if (isSyntheticCategoryId(selectedCategory)) {
        setContacts([]);
        setTotalCount(0);
        setSelectedIds([]);
        hasLoadedContactsRef.current = true;
        return;
      }

      const isUncategorized = isUncategorizedFilter(selectedCategory);
      let { data: contactsData, error: contactsError } = await (isUncategorized ? buildUncategorizedContactsQuery(extendedContactSelect, true) : buildContactsQuery(extendedContactSelect, true));
      if (contactsError && isMissingColumnError(contactsError)) {
        logSupabaseError('AdminContactsPage extended contacts query fallback:', contactsError);
        const fallback = await (isUncategorized ? buildUncategorizedContactsQuery(baseContactSelect) : buildContactsQuery(baseContactSelect));
        contactsData = fallback.data;
        contactsError = fallback.error;
      }

      if (contactsError) {
        logSupabaseError('AdminContactsPage contacts query failed:', contactsError);
        throw new Error(`Error al cargar contactos. Revisa consola o configuración de Supabase. ${getSupabaseErrorMessage(contactsError)}`);
      }

      const { data: catsData, error: catsError } = await supabase.from('categories').select('id, name, icon');
      if (catsError) logSupabaseError('AdminContactsPage categories query failed:', catsError);
      const catsMap = new Map((catsData ?? []).map((category) => [category.id, category]));

      const realIds = new Set(realCategoryIds);
      const activeRows = selectedStatus === 'all'
        ? ((contactsData ?? []) as Array<Partial<ContactRow> & { status?: string | null }>).filter(isVisibleContact)
        : contactsData ?? [];
      const visibleRows = isUncategorized
        ? activeRows.filter((contact) => {
          const row = contact as Partial<ContactRow>;
          return !row.category_id || !realIds.has(row.category_id);
        })
        : activeRows;
      const pagedRows = isUncategorized ? visibleRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : visibleRows;

      const enriched = pagedRows.map((contact) => {
        const row = contact as Partial<ContactRow>;
        return {
          ...row,
          id: row.id ?? '',
          category_id: row.category_id ?? '',
          name: row.name ?? 'Contacto sin nombre',
          phone: row.phone ?? null,
          phone_masked: row.phone_masked ?? null,
          status: (row.status ?? 'active') as ContactStatus,
          created_at: row.created_at ?? '',
          description: row.description ?? '',
          country_flag: row.country_flag ?? null,
          country_code: row.country_code ?? null,
          tags: row.tags ?? [],
          risk_level: row.risk_level ?? 'safe',
          category_name: catsMap.get(row.category_id ?? '')?.name ?? categoryById.get(row.category_id ?? '')?.displayTitle ?? 'Sin categoría',
          category_icon: catsMap.get(row.category_id ?? '')?.icon ?? categoryById.get(row.category_id ?? '')?.displayIcon ?? '📁',
        };
      }) as ContactRow[];

      setContacts(enriched);
      hasLoadedContactsRef.current = true;
      setSelectedIds([]);

      if (isUncategorized) {
        setTotalCount(visibleRows.length);
        return;
      }

      let countQuery = supabase.from('contacts').select('id', { count: 'exact', head: true });
      const searchTerm = debouncedSearch.trim();
      if (searchTerm) countQuery = countQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`);
      if (selectedCategory && selectedCategory !== 'all') countQuery = countQuery.eq('category_id', selectedCategory);
      countQuery = applyStatusVisibility(countQuery);
      const { count, error: countError } = await countQuery;
      if (countError) {
        logSupabaseError('AdminContactsPage count query failed:', countError);
        setTotalCount(enriched.length);
      } else {
        setTotalCount(count ?? 0);
      }
    } catch (err) {
      console.error('loadContacts error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar contactos. Revisa consola o configuración de Supabase.');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(
      adminContactsStateKey,
      JSON.stringify({
        selectedCategory,
        activeSubtab,
        selectedStatus,
        qualityFilter,
        tagFilter,
        search,
        currentPage,
      } satisfies PersistedAdminContactsState),
    );
  }, [activeSubtab, currentPage, qualityFilter, search, selectedCategory, selectedStatus, tagFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(0);
      setDebouncedSearch(search);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void loadContacts();
  }, [debouncedSearch, selectedCategory, selectedStatus, currentPage, realCategoryIds.join('|')]);

  useEffect(() => {
    if (!isAddOpen) return undefined;
    void loadCategories();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAddModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAddOpen]);

  function openEdit(contact: ContactRow) {
    setEditing(contact);
    setEditTags((contact.tags ?? []).join(', '));
  }

  function openAddContact() {
    setForm({
      ...emptyForm,
      category_id: selectedCategory !== 'all' && selectedCategory !== 'uncategorized' && !isSyntheticCategoryId(selectedCategory) ? selectedCategory : '',
    });
    setIsAddOpen(true);
  }

  function openDuplicate(contact: ContactRow) {
    const category = categoryById.get(contact.category_id);
    setForm({
      ...emptyForm,
      name: `${contact.name} copia`,
      phone: contact.phone ?? '',
      whatsapp: contact.whatsapp ?? contact.phone ?? '',
      category_id: contact.category_id,
      description: contact.description ?? defaultDescriptionFor(category),
      tags: (contact.tags ?? []).join(', '),
      status: contact.status,
      internal_note: contact.internal_note ?? '',
      source: contact.source ?? 'manual',
      country_flag: contact.country_flag ?? emptyForm.country_flag,
      country_code: contact.country_code ?? emptyForm.country_code,
    });
    setIsAddOpen(true);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAllVisible() {
    setSelectedIds(allVisibleSelected ? [] : filteredContacts.map((contact) => contact.id));
  }

  async function selectCurrentFolder() {
    if (!supabase || !isSupabaseConfigured) return;
    if (selectedCategory === 'uncategorized' || isSyntheticCategoryId(selectedCategory)) {
      setSelectedIds(filteredContacts.map((contact) => contact.id));
      return;
    }
    let query = supabase.from('contacts').select('id').limit(1000);
    if (selectedCategory !== 'all') query = query.eq('category_id', selectedCategory);
    query = applyStatusVisibility(query);
    const { data, error: idsError } = await query;
    if (idsError) {
      toast.error('No pude seleccionar toda la carpeta.');
      console.error('selectCurrentFolder:', idsError.message);
      return;
    }
    setSelectedIds((data ?? []).map((row) => row.id));
  }

  function closeAddModal() {
    setIsAddOpen(false);
    setForm(emptyForm);
  }

  function handlePhoneInput(value: string) {
    const detected = detectPhoneCountry(value);
    setForm((current) => ({
      ...current,
      phone: value,
      whatsapp: current.whatsapp && current.whatsapp !== current.phone ? current.whatsapp : value,
      country_flag: detected.country_flag,
      country_code: detected.country_code,
    }));
  }

  async function reloadCurrentPage() {
    await loadCategories();
    await loadContacts();
  }

  function removeContactsFromLocal(ids: string[]) {
    const idSet = new Set(ids);
    setContacts((current) => current.filter((contact) => !idSet.has(contact.id)));
    setSelectedIds((current) => current.filter((id) => !idSet.has(id)));
    setTotalCount((count) => Math.max(0, count - ids.length));
  }

  async function updateContactCompat(id: string, payload: Record<string, unknown>) {
    const ok = await updateContact(id, payload);
    if (ok) return true;
    const fallbackPayload = omitNewOptionalColumns(payload);
    if (Object.keys(fallbackPayload).length === Object.keys(payload).length) return false;
    return updateContact(id, fallbackPayload);
  }

  async function saveEdit() {
    if (!editing) return;
    setActionLoading(true);
    try {
      const phone = normalizePhoneForAdmin(editing.phone ?? '');
      const detected = detectPhoneCountry(phone);
      const status = phone ? editing.status : 'review';
      const ok = await updateContactCompat(editing.id, {
        name: sanitizeText(editing.name, 160),
        phone,
        whatsapp: normalizePhoneForAdmin(editing.whatsapp ?? phone),
        phone_masked: phone ? maskPhone(phone) : maskPhone(null),
        category_id: editing.category_id,
        description: sanitizeText(editing.description ?? '', 500),
        tags: splitTags(editTags),
        status,
        country_flag: detected.country_flag,
        country_code: detected.country_code,
        internal_note: sanitizeText(editing.internal_note ?? '', 700),
        source: sanitizeText(editing.source ?? 'manual', 80),
        is_active: status !== 'inactive',
      });
      if (!ok) {
        toast.error('Supabase no permitió editar este contacto.');
        return;
      }
      toast.success('Contacto actualizado.');
      setEditing(null);
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function saveNewContact() {
    if (!supabase || !isSupabaseConfigured) {
      toast.error('Falta conectar Supabase.');
      return;
    }
    const category = categoryById.get(form.category_id);
    const name = sanitizeText(form.name, 160);
    const phone = normalizePhoneForAdmin(form.phone);
    const whatsapp = normalizePhoneForAdmin(form.whatsapp || form.phone);
    const categoryId = form.category_id;
    const description = sanitizeText(form.description || defaultDescriptionFor(category), 500);
    const phoneMasked = phone ? maskPhone(phone) : maskPhone(null);
    const tags = splitTags(form.tags).length ? splitTags(form.tags) : suggestContactTags({ name, description, category });
    const status: ContactStatus = phone ? form.status : 'review';

    if (!name || !categoryId) {
      toast.error('Completa nombre y carpeta destino.');
      return;
    }
    if (phone && phone.replace(/\D/g, '').length < 8) {
      toast.error('El teléfono parece incompleto. Revisa el prefijo y el número.');
      return;
    }

    setActionLoading(true);
    try {
      if (phone) {
        const { data: duplicated, error: duplicateError } = await supabase.from('contacts').select('id').eq('category_id', categoryId).eq('phone', phone).limit(1);
        if (duplicateError) console.warn('duplicate contact check:', duplicateError.message);
        if (duplicated?.length) {
          toast.warning('Este número ya existe en esta carpeta. No se guardó para evitar duplicados.');
          return;
        }
      }

      const payload = {
        name,
        phone,
        whatsapp,
        phone_masked: phoneMasked,
        category_id: categoryId,
        description,
        country_flag: form.country_flag,
        country_code: form.country_code,
        tags,
        internal_note: sanitizeText(form.internal_note, 700),
        source: sanitizeText(form.source || 'manual', 80),
        is_active: status !== 'inactive',
        status,
        risk_level: 'safe',
      };

      let { data, error: insertError } = await (supabase as any).from('contacts').insert(payload).select('*').single();
      if (insertError && isMissingColumnError(insertError)) {
        const fallbackPayload = omitNewOptionalColumns(payload);
        const fallback = await (supabase as any).from('contacts').insert(fallbackPayload).select('*').single();
        data = fallback.data;
        insertError = fallback.error;
        if (!insertError) toast.warning('Contacto guardado. Ejecuta la migración para guardar WhatsApp, nota interna y soft delete.');
      }

      if (insertError) {
        console.error('saveNewContact:', insertError.message);
        toast.error(insertError.message);
        return;
      }

      if (data) {
        setContacts((current) => [data as ContactRow, ...current].slice(0, pageSize));
        setTotalCount((count) => count + 1);
      }
      closeAddModal();
      toast.success('Contacto agregado correctamente');
      await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown> }).rpc('sync_category_count', { cat_id: categoryId }).catch(() => null);
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function archiveRow(contact: ContactRow) {
    setActionLoading(true);
    try {
      const ok = await deleteContact(contact.id);
      if (!ok) {
        toast.error('No se pudo eliminar. Inténtalo nuevamente.');
        await reloadCurrentPage();
        return;
      }
      removeContactsFromLocal([contact.id]);
      toast.success('Contactos eliminados correctamente.');
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteRow(contact: ContactRow) {
    if (!window.confirm('Vas a eliminar 1 contacto. Esta acción no se puede deshacer. ¿Deseas continuar?')) return;
    await archiveRow(contact);
  }

  async function archiveSelected() {
    if (!selectedIds.length || !window.confirm(`Vas a eliminar ${selectedIds.length} contactos. Esta acción no se puede deshacer. ¿Deseas continuar?`)) return;
    setActionLoading(true);
    const idsToDelete = [...selectedIds];
    try {
      const ok = await deleteContactsBulk(idsToDelete);
      if (!ok) {
        toast.error('No se pudo eliminar. Inténtalo nuevamente.');
        await reloadCurrentPage();
        return;
      }
      removeContactsFromLocal(idsToDelete);
      toast.success('Contactos eliminados correctamente.');
      setSelectedIds([]);
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function bulkUpdateStatus() {
    if (!selectedIds.length) return;
    setActionLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateContactCompat(id, { status: bulkStatus, is_active: bulkStatus !== 'inactive' })));
      toast.success('Estado actualizado en lote.');
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function bulkMove() {
    if (!selectedIds.length || !bulkMoveCategory) return;
    setActionLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateContact(id, { category_id: bulkMoveCategory })));
      toast.success('Contactos movidos de carpeta.');
      setBulkMoveCategory('');
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function bulkAddTag() {
    const tag = sanitizeText(bulkTag, 32).toLowerCase();
    if (!selectedIds.length || !tag) return;
    setActionLoading(true);
    try {
      const selectedContacts = contacts.filter((contact) => selectedIds.includes(contact.id));
      await Promise.all(
        selectedContacts.map((contact) => {
          const tags = [...new Set([...(contact.tags ?? []), tag])].slice(0, 5);
          return updateContact(contact.id, { tags });
        }),
      );
      toast.success('Etiqueta agregada en lote.');
      setBulkTag('');
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function repairCategoryLinks() {
    if (!supabase || !isSupabaseConfigured) {
      toast.error('Falta conectar Supabase.');
      return;
    }
    const realCategories = categories.filter((category) => !isSyntheticCategoryId(category.id));
    const realIds = new Set(realCategories.map((category) => category.id));
    if (!realCategories.length) {
      toast.error('No hay carpetas reales para reparar vínculos.');
      return;
    }

    setActionLoading(true);
    try {
      const legacySelect = `${baseContactSelect}, category_slug, folder_slug, category_name, folder_name, carpeta`;
      let { data, error: repairReadError } = await (supabase as any).from('contacts').select(legacySelect).limit(10000);
      let hasLegacyColumns = true;

      if (repairReadError && isMissingColumnError(repairReadError)) {
        hasLegacyColumns = false;
        const fallback = await supabase.from('contacts').select(baseContactSelect).limit(10000);
        data = fallback.data;
        repairReadError = fallback.error;
      }

      if (repairReadError) {
        logSupabaseError('repairCategoryLinks read failed:', repairReadError);
        toast.error('No pude leer contactos para reparar. Revisa consola.');
        return;
      }

      if (!hasLegacyColumns) {
        toast.info('No encontré columnas antiguas de carpeta para inferir vínculos. Los contactos sin categoría quedan para reasignación manual.');
        setSelectedCategory('uncategorized');
        return;
      }

      const repairs = ((data ?? []) as Array<Record<string, unknown>>)
        .filter((row) => {
          const categoryId = String(row.category_id ?? '');
          return !categoryId || !realIds.has(categoryId);
        })
        .map((row) => {
          const target = getLegacyFolderValues(row)
            .map((value) => findCategoryByLegacyValue(value, realCategories))
            .find(Boolean);
          return target ? { id: String(row.id), target } : null;
        })
        .filter((repair): repair is { id: string; target: CategoryOption } => Boolean(repair));

      if (!repairs.length) {
        toast.info('No encontré contactos reparables automáticamente. Puedes usar “Sin categoría” y moverlos manualmente.');
        setSelectedCategory('uncategorized');
        return;
      }

      if (!window.confirm(`Se encontraron ${repairs.length} contactos reparables. ¿Quieres reasignarlos a sus carpetas oficiales ahora?`)) return;

      await Promise.all(repairs.map((repair) => updateContactCompat(repair.id, { category_id: repair.target.id })));
      toast.success(`${repairs.length} vínculos de carpetas reparados.`);
      await loadCategories();
      await loadContacts();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <LoadingState title="Cargando contactos" message="Leyendo contactos reales desde Supabase." />;
  if (error) return <FriendlyErrorState title="Error al cargar contactos." message={error} onRetry={reloadCurrentPage} />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-300">Admin ContactHub</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">Gestión de contactos</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Administra contactos reales por carpeta, revisa calidad de datos, archiva sin borrar y prepara importaciones grandes con control.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openAddContact} className="focus-ring btn-primary-glow inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950 hover:bg-white">
              <Plus className="h-4 w-4" />
              Agregar contacto
            </button>
            <Link to="/admin/importar" className="focus-ring inline-flex items-center gap-2 rounded-full border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-sm font-bold text-brand-100 hover:bg-brand-400 hover:text-ink-950">
              <ExternalLink className="h-4 w-4" />
              Importar 200+
            </Link>
            <button type="button" onClick={() => void reloadCurrentPage()} className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white hover:border-brand-400/35">
              <RefreshCw className="h-4 w-4" />
              Recargar
            </button>
            <button type="button" disabled={actionLoading} onClick={() => void repairCategoryLinks()} className="focus-ring inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-100 hover:border-yellow-300/45 disabled:opacity-50">
              Reparar vínculos de carpetas
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-brand-400/20 bg-brand-400/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">Contactos</p>
            <p className="mt-2 text-2xl font-black text-white">{totalCount}</p>
            <p className="mt-1 text-xs text-gray-400">{selectedCategoryLabel}</p>
          </div>
          <div className="rounded-2xl border border-line bg-ink-950/55 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Sin categoría</p>
            <p className="mt-2 text-2xl font-black text-white">{adminStats.uncategorized}</p>
            <p className="mt-1 text-xs text-gray-400">para reasignar o limpiar</p>
          </div>
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-200">Pendientes visibles</p>
            <p className="mt-2 text-2xl font-black text-white">{adminStats.noPhone}</p>
            <p className="mt-1 text-xs text-gray-400">contactos sin teléfono</p>
          </div>
          <div className="rounded-2xl border border-brand-400/20 bg-ink-950/55 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">Completos visibles</p>
            <p className="mt-2 text-2xl font-black text-white">{adminStats.complete}</p>
            <p className="mt-1 text-xs text-gray-400">con teléfono y descripción</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-3">
          <button
            type="button"
            onClick={() => setActiveSubtab('list')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeSubtab === 'list' ? 'bg-brand-400 text-ink-950' : 'border border-line bg-white/5 text-white hover:border-brand-400/40'}`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab('folder')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeSubtab === 'folder' ? 'bg-brand-400 text-ink-950' : 'border border-line bg-white/5 text-white hover:border-brand-400/40'}`}
          >
            Por carpeta
          </button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_320px_170px_170px_170px]">
          <label className="relative block">
            <span className="sr-only">Buscar contactos</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(sanitizeTextInput(event.target.value, 80));
              }}
              placeholder="Buscar por nombre, teléfono, WhatsApp, descripción, tags o estado"
              className="focus-ring h-11 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-sm text-white"
            />
            {isSearching ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-200">Buscando...</span> : null}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFolderPickerOpen((value) => !value)}
              className="focus-ring flex h-11 w-full items-center justify-between gap-3 rounded-full border border-line bg-ink-950/70 px-4 text-left text-sm text-white hover:border-brand-400/40"
            >
              <span className="min-w-0 truncate">{selectedCategory === 'all' ? 'Todas las carpetas' : selectedCategory === 'uncategorized' ? 'Sin categoría' : getCategoryLabel(selectedCategoryObject)}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-brand-200" />
            </button>
            {isFolderPickerOpen ? (
              <div className="absolute left-0 right-0 top-12 z-40 rounded-2xl border border-line bg-ink-950 p-3 shadow-2xl">
                <input
                  value={folderPickerSearch}
                  onChange={(event) => setFolderPickerSearch(sanitizeTextInput(event.target.value, 80))}
                  placeholder="Buscar carpeta..."
                  className="focus-ring h-10 w-full rounded-full border border-line bg-white/5 px-4 text-sm text-white placeholder:text-gray-500"
                />
                <div className="mt-3 max-h-[360px] overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(0);
                      setSelectedCategory('all');
                      setIsFolderPickerOpen(false);
                      setFolderPickerSearch('');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${selectedCategory === 'all' ? 'bg-brand-400 text-ink-950' : 'text-gray-200 hover:bg-brand-400/10 hover:text-white'}`}
                  >
                    <span>Todas las carpetas</span>
                    <span className="text-xs font-bold">{adminStats.total}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(0);
                      setSelectedCategory('uncategorized');
                      setIsFolderPickerOpen(false);
                      setFolderPickerSearch('');
                    }}
                    className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${selectedCategory === 'uncategorized' ? 'bg-brand-400 text-ink-950' : 'text-gray-200 hover:bg-brand-400/10 hover:text-white'}`}
                  >
                    <span>Sin categoría</span>
                    <span className="text-xs font-bold">{adminStats.uncategorized}</span>
                  </button>
                  {folderPickerOptions.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setCurrentPage(0);
                        setSelectedCategory(category.id);
                        setIsFolderPickerOpen(false);
                        setFolderPickerSearch('');
                        setActiveSubtab('folder');
                      }}
                      className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${selectedCategory === category.id ? 'bg-brand-400 text-ink-950' : 'text-gray-200 hover:bg-brand-400/10 hover:text-white'}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{getCategoryLabel(category)}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">{category.contacts_count ?? 0}</span>
                      {selectedCategory === category.id ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <select
            value={selectedStatus}
            onChange={(event) => {
              setCurrentPage(0);
              setSelectedStatus(event.target.value as 'all' | ContactStatus);
            }}
            className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Archivados</option>
            <option value="review">Revisión</option>
            <option value="rejected">Rechazados</option>
          </select>
          <select
            value={qualityFilter}
            onChange={(event) => setQualityFilter(event.target.value as ContactQualityFilter)}
            className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white"
          >
            <option value="all">Calidad: todas</option>
            <option value="complete">Completos</option>
            <option value="verified">Verificados</option>
            <option value="pending">Pendientes</option>
            <option value="no_phone">Sin teléfono</option>
          </select>
          <input
            value={tagFilter}
            onChange={(event) => setTagFilter(sanitizeTextInput(event.target.value, 40))}
            placeholder="Filtrar tag"
            className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white placeholder:text-gray-500"
          />
        </div>

        {activeSubtab === 'folder' ? (
        <div className="mt-5">
          {selectedCategory === 'uncategorized' ? (
            <div className="mb-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <h3 className="text-sm font-black text-white">Contactos sin categoría</h3>
              <p className="mt-1 text-sm text-yellow-100/80">Estos contactos aún no están vinculados a una carpeta. Puedes reasignarlos, archivarlos o eliminarlos.</p>
            </div>
          ) : null}
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Carpetas oficiales</p>
            <span className="text-xs text-gray-500">{categories.length} carpetas activas</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => {
                setCurrentPage(0);
                setSelectedCategory('all');
              }}
              className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                selectedCategory === 'all' ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-line bg-white/5 text-white hover:border-brand-400/40'
              }`}
            >
              Todas las carpetas
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${selectedCategory === 'all' ? 'bg-ink-950/15 text-ink-950' : 'bg-white/10 text-gray-300'}`}>
                {adminStats.total}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentPage(0);
                setSelectedCategory('uncategorized');
              }}
              className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                selectedCategory === 'uncategorized' ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-line bg-white/5 text-white hover:border-brand-400/40'
              }`}
            >
              Sin categoría
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${selectedCategory === 'uncategorized' ? 'bg-ink-950/15 text-ink-950' : 'bg-white/10 text-gray-300'}`}>
                {adminStats.uncategorized}
              </span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setCurrentPage(0);
                  setSelectedCategory(category.id);
                }}
                className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  selectedCategory === category.id
                    ? 'border-brand-400 bg-brand-400 text-ink-950'
                    : 'border-line bg-ink-950/70 text-gray-200 hover:border-brand-400/40 hover:text-white'
                }`}
              >
                <span>{getCategoryCompactLabel(category)}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${selectedCategory === category.id ? 'bg-ink-950/15 text-ink-950' : 'bg-white/10 text-gray-300'}`}>
                  {category.contacts_count ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {pageStart}-{pageEnd} de {totalCount} contactos
            {selectedCategory !== 'all' ? ` en ${selectedCategoryLabel}` : ''}
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={toggleAllVisible} className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 font-bold text-white">
              {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
            </button>
            <button type="button" onClick={() => void selectCurrentFolder()} className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 font-bold text-white">
              Seleccionar carpeta
            </button>
            <button type="button" disabled={currentPage === 0} onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 font-bold text-white disabled:opacity-40">
              Anterior
            </button>
            <button type="button" disabled={pageEnd >= totalCount} onClick={() => setCurrentPage((page) => page + 1)} className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 font-bold text-white disabled:opacity-40">
              Siguiente
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-ink-950/70 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Teléfono / WhatsApp</th>
                <th className="px-4 py-3">Carpeta</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => {
                const quality = getContactQuality(contact);
                const whatsappLink = getWhatsappLink(contact.whatsapp || contact.phone);
                const category = categoryById.get(contact.category_id);
                return (
                  <tr key={contact.id} className="border-t border-line hover:bg-white/[0.03]">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleSelection(contact.id)} /></td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-500">{currentPage * pageSize + index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-white">{contact.name}</p>
                      {contact.description ? <p className="mt-1 max-w-[360px] text-xs italic text-gray-400">{contact.description}</p> : <p className="mt-1 text-xs text-yellow-200/75">Sin descripción: conviene completar valor del contacto.</p>}
                      {contact.internal_note ? <p className="mt-1 text-[11px] text-brand-200/75">Nota: {contact.internal_note}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-white">
                        {contact.country_flag ?? '🌎'} {contact.phone ? formatPhone(contact.phone) : contact.phone_masked ?? maskPhone(null)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {whatsappLink ? (
                          <a href={whatsappLink} target="_blank" rel="noreferrer" className="rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-[11px] font-bold text-brand-100">
                            WhatsApp
                          </a>
                        ) : (
                          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-bold text-yellow-100">pendiente</span>
                        )}
                        {contact.phone ? (
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(contact.phone ?? '');
                              toast.success('Número copiado.');
                            }}
                            className="rounded-full border border-line bg-white/5 px-3 py-1 text-[11px] font-bold text-gray-200"
                          >
                            Copiar
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{getCategoryLabel(category)}</td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-1.5">
                        {(contact.tags ?? []).length ? (
                          (contact.tags ?? []).map((tag) => (
                            <span key={tag} className="rounded-full border border-line bg-white/5 px-2 py-1 text-[10px] font-bold text-gray-300">{tag}</span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Sin tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${quality.className}`}>{quality.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{contact.created_at ? new Date(contact.created_at).toLocaleDateString('es-PE') : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={actionLoading} onClick={() => openEdit(contact)} className="rounded-full border border-line bg-white/5 p-2 text-brand-200 hover:border-brand-400/40" title="Editar">
                          ✏️
                        </button>
                        <button type="button" disabled={actionLoading} onClick={() => openDuplicate(contact)} className="rounded-full border border-line bg-white/5 p-2 text-gray-200 hover:border-brand-400/40" title="Duplicar">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={actionLoading || contact.status === 'inactive'} onClick={() => void archiveRow(contact)} className="rounded-full border border-line bg-white/5 p-2 text-yellow-100 hover:border-yellow-300/40" title="Archivar">
                          <Archive className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={actionLoading} onClick={() => void deleteRow(contact)} className="rounded-full border border-red-400/20 bg-red-500/10 p-2 text-red-300 hover:border-red-300/50" title="Archivar con confirmación">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredContacts.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <p className="text-base font-bold text-white">
                      {debouncedSearch.trim()
                        ? 'No encontramos contactos con esa búsqueda en esta carpeta.'
                        : selectedCategory === 'all'
                          ? 'No hay contactos registrados todavía.'
                          : 'Esta carpeta aún no tiene contactos.'}
                    </p>
                    <p className="mt-2 text-sm">Puedes crear el primer contacto manualmente, importar una lista o pegar contactos desde el importador.</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <button type="button" onClick={openAddContact} className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950">Crear primer contacto</button>
                      <Link to="/admin/importar" className="rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white">Importar contactos</Link>
                      <Link to="/admin/importar" className="rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white">Pegar lista</Link>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedIds.length ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(960px,calc(100vw-24px))] -translate-x-1/2 rounded-2xl border border-line bg-ink-900 p-4 shadow-2xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <span className="text-sm font-bold text-white">{selectedIds.length} contactos seleccionados</span>
            <div className="flex flex-wrap gap-2">
              <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ContactStatus)} className="h-10 rounded-full border border-line bg-ink-950 px-3 text-xs text-white">
                <option value="active">Activo</option>
                <option value="review">Revisión</option>
                <option value="inactive">Archivado</option>
                <option value="rejected">Rechazado</option>
              </select>
              <button type="button" disabled={actionLoading} onClick={() => void bulkUpdateStatus()} className="rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Cambiar estado</button>
              <input value={bulkTag} onChange={(event) => setBulkTag(sanitizeTextInput(event.target.value, 32))} placeholder="tag" className="h-10 w-28 rounded-full border border-line bg-ink-950 px-3 text-xs text-white" />
              <button type="button" disabled={actionLoading || !bulkTag.trim()} onClick={() => void bulkAddTag()} className="rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Tags className="inline h-3 w-3" /> Tag</button>
              <select value={bulkMoveCategory} onChange={(event) => setBulkMoveCategory(event.target.value)} className="h-10 max-w-[220px] rounded-full border border-line bg-ink-950 px-3 text-xs text-white">
                <option value="">Mover a carpeta...</option>
                {categories.filter((category) => !isSyntheticCategoryId(category.id)).map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(category)}</option>)}
              </select>
              <button type="button" disabled={actionLoading || !bulkMoveCategory} onClick={() => void bulkMove()} className="rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Mover</button>
              <button type="button" disabled={actionLoading} onClick={() => void archiveSelected()} className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                Eliminar seleccionados
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-ink-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">Editar contacto</h3>
                <p className="mt-2 text-sm text-gray-400">Actualiza datos visibles y datos internos para administración.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-line p-2 text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Nombre</span><input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Teléfono</span><input value={editing.phone ?? ''} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-white" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">WhatsApp</span><input value={editing.whatsapp ?? editing.phone ?? ''} onChange={(event) => setEditing({ ...editing, whatsapp: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-white" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Categoría</span><select value={editing.category_id} onChange={(event) => setEditing({ ...editing, category_id: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white">{categories.filter((category) => !isSyntheticCategoryId(category.id)).map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(category)}</option>)}</select></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Estado</span><select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as ContactStatus })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white"><option value="active">active</option><option value="review">review</option><option value="inactive">inactive</option><option value="rejected">rejected</option></select></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Fuente</span><input value={editing.source ?? 'manual'} onChange={(event) => setEditing({ ...editing, source: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" /></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-gray-300">Descripción</span><textarea value={editing.description ?? ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} rows={3} className="focus-ring rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white" /></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-gray-300">Tags separados por coma</span><input value={editTags} onChange={(event) => setEditTags(event.target.value)} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" /></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-gray-300">Nota interna</span><textarea value={editing.internal_note ?? ''} onChange={(event) => setEditing({ ...editing, internal_note: event.target.value })} rows={3} className="focus-ring rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white" /></label>
            </div>
            <button type="button" disabled={actionLoading} onClick={() => void saveEdit()} className="focus-ring mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 disabled:opacity-60"><Save className="h-4 w-4" />Guardar cambios</button>
          </div>
        </div>
      ) : null}

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-ink-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">Agregar contacto</h3>
                <p className="mt-2 text-sm text-gray-400">Crea un contacto manual y asígnalo a una carpeta oficial.</p>
              </div>
              <button type="button" onClick={closeAddModal} className="rounded-full border border-line p-2 text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-semibold text-gray-300">Nombre del contacto</span>
                <input value={form.name} placeholder="Ej: Pack de IA mensuales" onChange={(event) => setForm({ ...form, name: sanitizeTextInput(event.target.value, 160) })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white placeholder:text-gray-500 focus:border-brand-400" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Teléfono</span>
                <div className="flex items-center gap-2">
                  <span className="flex h-11 w-12 items-center justify-center rounded-full border border-line bg-ink-950/70 text-xl">{form.country_flag}</span>
                  <input value={form.phone} placeholder="Ej: +51 963 187 899" onChange={(event) => handlePhoneInput(event.target.value)} className="focus-ring h-11 flex-1 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-white placeholder:text-gray-500 focus:border-brand-400" />
                </div>
                <span className="text-xs text-gray-500">Puede quedar vacío si todavía está pendiente.</span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">WhatsApp</span>
                <input value={form.whatsapp} placeholder="Se genera desde el teléfono" onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-white placeholder:text-gray-500 focus:border-brand-400" />
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-semibold text-gray-300">Carpeta destino</span>
                <select value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white focus:border-brand-400">
                  <option value="">Selecciona una carpeta...</option>
                  {categories.filter((category) => !isSyntheticCategoryId(category.id)).map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(category)}</option>)}
                </select>
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-semibold text-white">Descripción</span>
                <textarea
                  value={form.description}
                  rows={3}
                  maxLength={500}
                  placeholder="Breve descripción de lo que ofrece este contacto"
                  onChange={(event) => setForm({ ...form, description: event.target.value.slice(0, 500) })}
                  className="focus-ring resize-none rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white placeholder:text-gray-500 focus:border-brand-400"
                />
                <span className="text-right text-xs text-gray-500">{form.description.length}/500</span>
              </label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Tags</span><input value={form.tags} placeholder="ia, proveedor, curso" onChange={(event) => setForm({ ...form, tags: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white placeholder:text-gray-500" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Estado</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ContactStatus })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white"><option value="active">Activo</option><option value="review">Pendiente</option><option value="inactive">Archivado</option><option value="rejected">Rechazado</option></select></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Fuente</span><input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Nota interna</span><input value={form.internal_note} placeholder="Pago, origen, revisión..." onChange={(event) => setForm({ ...form, internal_note: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white placeholder:text-gray-500" /></label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={closeAddModal} className="focus-ring inline-flex h-11 items-center justify-center rounded-full border border-line bg-white/5 px-5 text-sm font-bold text-white">
                Cancelar
              </button>
              <button type="button" disabled={actionLoading || !form.name.trim() || !form.category_id} onClick={() => void saveNewContact()} className="focus-ring btn-primary-glow inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 disabled:cursor-not-allowed disabled:opacity-50">
                <Save className="h-4 w-4" />
                Guardar contacto
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
