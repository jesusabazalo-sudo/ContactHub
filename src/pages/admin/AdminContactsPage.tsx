import { Archive, Check, ChevronDown, Copy, ExternalLink, Plus, RefreshCw, Save, Search, Tags, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import ContactsMaintenancePanel from '../../components/admin/ContactsMaintenancePanel';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { buildOfficialCategoryOptions, officialCategories, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { onOverlayClick, useModalDismiss } from '../../hooks/useModalDismiss';
import { sanitizePhone, sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { normalizeSearchText, searchContacts } from '../../lib/searchUtils';
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
type ContactPhoneStatus = 'valid' | 'needs_review' | 'missing' | 'invalid' | 'placeholder_bug';
type ContactVisibility = 'public' | 'restricted' | 'admin_only';
type ContactQualityFilter = 'all' | 'publicable' | 'restricted' | 'complete' | 'pending' | 'no_phone' | 'verified';
type AdminContactStats = {
  total: number;
  publicable: number;
  restricted: number;
  uncategorized: number;
  complete: number;
  noPhone: number;
  placeholders: number;
};

type CategoryRepairItem = {
  id: string;
  target: CategoryOption;
};

type CategoryRepairPlan = {
  scanned: number;
  repairs: CategoryRepairItem[];
  unresolved: number;
};

type ContactRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  raw_phone?: string | null;
  phone_status?: ContactPhoneStatus | null;
  phone_masked: string | null;
  whatsapp?: string | null;
  internal_note?: string | null;
  source?: string | null;
  visibility?: ContactVisibility | null;
  is_public?: boolean | null;
  import_batch?: string | null;
  import_note?: string | null;
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
const extendedContactSelect = `${baseContactSelect}, whatsapp, internal_note, source, is_active, deleted_at, raw_phone, phone_status, visibility, is_public, import_batch, import_note`;

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
  return /schema cache|column|whatsapp|internal_note|deleted_at|is_active|source|raw_phone|phone_status|visibility|is_public|import_batch|import_note/i.test(error.message ?? '');
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
  if (order === '18') return `18. ${category.displayIcon ?? category.icon ?? '⚠️'} Contenido reservado o sensible — The Vault`;
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

function isPlaceholderPhone(phone?: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '');
  return Boolean(digits && (/^0{6,}/.test(digits) || /^\+?0{6,}/.test(phone ?? '')));
}

function hasUsablePhone(phone?: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '');
  return Boolean(phone && !/revisar en documento original/i.test(phone) && digits.length >= 7 && !isPlaceholderPhone(phone));
}

function inferPhoneStatus(contact: Partial<ContactRow>): ContactPhoneStatus {
  if (contact.phone_status) return contact.phone_status;
  const phone = contact.phone ?? '';
  if (isPlaceholderPhone(phone)) return 'placeholder_bug';
  if (!phone && contact.raw_phone) return 'needs_review';
  if (!phone) return 'missing';
  return hasUsablePhone(phone) ? 'valid' : 'invalid';
}

function isRestrictedContact(contact: Partial<ContactRow>) {
  return (
    contact.status === 'review'
    || contact.status === 'rejected'
    || contact.visibility === 'restricted'
    || contact.visibility === 'admin_only'
    || contact.is_public === false
  );
}

function isPublicableContact(contact: Partial<ContactRow>) {
  return (
    contact.status === 'active'
    && hasUsablePhone(contact.phone)
    && inferPhoneStatus(contact) === 'valid'
    && (contact.visibility ?? 'public') === 'public'
    && contact.is_public !== false
  );
}

function isCompleteContact(contact: Partial<ContactRow>) {
  return Boolean(isPublicableContact(contact) && contact.description?.trim());
}

function matchesQualityFilter(contact: ContactRow, filter: ContactQualityFilter) {
  const quality = getContactQuality(contact).key;
  if (filter === 'all') return true;
  if (filter === 'publicable') return isPublicableContact(contact);
  if (filter === 'restricted') return isRestrictedContact(contact);
  if (filter === 'complete') return isCompleteContact(contact);
  if (filter === 'pending') return quality === 'pending';
  if (filter === 'no_phone') return quality === 'no_phone';
  if (filter === 'verified') return quality === 'verified' || quality === 'complete' || quality === 'publicable';
  return true;
}

function getContactQuality(contact: ContactRow) {
  const phoneStatus = inferPhoneStatus(contact);
  if (phoneStatus !== 'valid' || !hasUsablePhone(contact.phone)) return { key: 'no_phone', label: phoneStatus === 'placeholder_bug' ? 'Placeholder' : 'Sin teléfono', className: 'bg-red-500/15 text-red-300 border-red-400/25' };
  if (contact.deleted_at || contact.is_active === false || contact.status === 'inactive') return { key: 'archived', label: 'Archivado', className: 'bg-muted text-content-secondary border-border' };
  if (isRestrictedContact(contact)) return { key: 'pending', label: contact.status === 'rejected' ? 'Rechazado' : 'Restringido', className: 'bg-yellow-500/15 text-yellow-200 border-yellow-400/25' };
  if (isCompleteContact(contact)) return { key: 'complete', label: 'Completo', className: 'bg-brand-400/15 text-brand-text border-brand-400/25' };
  if (isPublicableContact(contact)) return { key: 'publicable', label: 'Publicable', className: 'bg-sky-400/15 text-sky-200 border-sky-400/25' };
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
  if (/revisar en documento original/i.test(phone ?? '')) return '';
  const clean = normalizePhoneForAdmin(phone ?? '').replace(/^\+/, '');
  return clean ? `https://wa.me/${clean}` : '';
}

function normalizeAdminPhoneStatus(phone: string, requestedStatus?: ContactPhoneStatus | null): ContactPhoneStatus {
  if (requestedStatus === 'placeholder_bug' || isPlaceholderPhone(phone)) return 'placeholder_bug';
  if (requestedStatus && requestedStatus !== 'valid') return requestedStatus;
  if (!phone) return 'missing';
  return hasUsablePhone(phone) ? 'valid' : 'invalid';
}

function getSafePublicationState(params: {
  phone: string;
  requestedStatus: ContactStatus;
  requestedVisibility?: ContactVisibility | null;
  requestedIsPublic?: boolean | null;
  requestedPhoneStatus?: ContactPhoneStatus | null;
}) {
  const phoneStatus = normalizeAdminPhoneStatus(params.phone, params.requestedPhoneStatus);
  if (params.requestedStatus === 'inactive') {
    return {
      status: 'inactive' as ContactStatus,
      visibility: 'admin_only' as ContactVisibility,
      isPublic: false,
      phoneStatus,
    };
  }
  const canBePublic = (
    params.requestedStatus === 'active'
    && phoneStatus === 'valid'
    && hasUsablePhone(params.phone)
    && (params.requestedVisibility ?? 'public') === 'public'
  );

  return {
    status: canBePublic ? params.requestedStatus : (params.requestedStatus === 'rejected' ? 'rejected' : 'review') as ContactStatus,
    visibility: canBePublic ? 'public' as ContactVisibility : (params.requestedVisibility === 'restricted' ? 'restricted' : 'admin_only') as ContactVisibility,
    isPublic: canBePublic && params.requestedIsPublic !== false,
    phoneStatus,
  };
}

function omitNewOptionalColumns(payload: Record<string, unknown>) {
  const {
    whatsapp,
    internal_note,
    is_active,
    deleted_at,
    raw_phone,
    phone_status,
    visibility,
    is_public,
    import_batch,
    import_note,
    review_reason,
    reviewed_at,
    reviewed_by,
    ...fallback
  } = payload;
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
  const loadContactsRequestIdRef = useRef(0);
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
  const [adminStats, setAdminStats] = useState<AdminContactStats>({
    total: 0,
    publicable: 0,
    restricted: 0,
    uncategorized: 0,
    complete: 0,
    noPhone: 0,
    placeholders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [repairPlan, setRepairPlan] = useState<CategoryRepairPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const repairDestinationSummary = useMemo(() => {
    if (!repairPlan) return [];
    const counts = new Map<string, { category: CategoryOption; count: number }>();
    repairPlan.repairs.forEach(({ target }) => {
      const current = counts.get(target.id);
      counts.set(target.id, { category: target, count: (current?.count ?? 0) + 1 });
    });
    return Array.from(counts.values()).sort(
      (a, b) => (a.category.displayOrder ?? a.category.sort_order ?? 999) - (b.category.displayOrder ?? b.category.sort_order ?? 999),
    );
  }, [repairPlan]);

  const filteredContacts = useMemo(() => contacts, [contacts]);

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

  const fetchActiveContactRows = async (select: string) => {
    if (!supabase) return { data: [] as Array<Record<string, unknown>>, error: null };
    const rows: Array<Record<string, unknown>> = [];
    const batchSize = 1000;

    for (let offset = 0; ; offset += batchSize) {
      const response = await (supabase as any)
        .from('contacts')
        .select(select)
        .in('status', ['active', 'review'])
        .order('id', { ascending: true })
        .range(offset, offset + batchSize - 1);
      if (response.error) return { data: rows, error: response.error as SupabaseDebugError };

      const page = (response.data ?? []) as Array<Record<string, unknown>>;
      rows.push(...page);
      if (page.length < batchSize) break;
    }

    return { data: rows, error: null };
  };

  const loadCategories = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setCategories(buildOfficialCategoryRows([]) as CategoryOption[]);
      setAdminStats({
        total: 0,
        publicable: 0,
        restricted: 0,
        uncategorized: 0,
        complete: 0,
        noPhone: 0,
        placeholders: 0,
      });
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
    let { data: contactCounters, error: contactCountersError } = await fetchActiveContactRows(extendedContactSelect);
    if (contactCountersError && isMissingColumnError(contactCountersError)) {
      const fallback = await fetchActiveContactRows(baseContactSelect);
      contactCounters = fallback.data;
      contactCountersError = fallback.error;
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
      publicable: rowsForStats.filter(isPublicableContact).length,
      restricted: rowsForStats.filter(isRestrictedContact).length,
      uncategorized: rowsForStats.filter((contact) => !contact.category_id || !realIds.has(contact.category_id)).length,
      complete: rowsForStats.filter(isCompleteContact).length,
      noPhone: rowsForStats.filter((contact) => inferPhoneStatus(contact) !== 'valid' || !hasUsablePhone(contact.phone)).length,
      placeholders: rowsForStats.filter((contact) => inferPhoneStatus(contact) === 'placeholder_bug').length,
    });

    setCategories(withCounts as CategoryOption[]);
  };

  const buildContactsQuery = (select: string, includeOptionalSearch = false) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    let query = supabase
      .from('contacts')
      .select(select)
      .order('created_at', { ascending: false });

    const searchTerm = debouncedSearch.trim();
    const needsClientSideFiltering = Boolean(searchTerm || tagFilter.trim() || qualityFilter !== 'all');
    if (needsClientSideFiltering) {
      query = query.limit(10000);
    } else {
      query = query.range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
    }
    if (selectedCategory && selectedCategory !== 'all' && !isUncategorizedFilter(selectedCategory) && !isSyntheticCategoryId(selectedCategory)) query = query.eq('category_id', selectedCategory);
    query = applyStatusVisibility(query);
    return query;
  };

  const buildUncategorizedContactsQuery = (select: string, includeOptionalSearch = false) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    let query = supabase.from('contacts').select(select).order('created_at', { ascending: false }).limit(10000);
    query = applyStatusVisibility(query);
    return query;
  };

  const loadContacts = async () => {
    const requestId = ++loadContactsRequestIdRef.current;
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
      const enrichedRows = visibleRows.map((contact) => {
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

      const safeTag = normalizeSearchText(tagFilter);
      const locallyFilteredRows = searchContacts(debouncedSearch, enrichedRows)
        .filter((contact) => matchesQualityFilter(contact, qualityFilter))
        .filter((contact) => !safeTag || (contact.tags ?? []).some((tag) => normalizeSearchText(tag).includes(safeTag)));
      const needsLocalPagination = Boolean(isUncategorized || debouncedSearch.trim() || tagFilter.trim() || qualityFilter !== 'all');
      const enriched = needsLocalPagination
        ? locallyFilteredRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
        : locallyFilteredRows;

      if (requestId !== loadContactsRequestIdRef.current) return; // filtro cambió mientras cargaba: descarta respuesta obsoleta

      setContacts(enriched);
      hasLoadedContactsRef.current = true;
      setSelectedIds([]);

      if (needsLocalPagination) {
        setTotalCount(locallyFilteredRows.length);
        return;
      }

      let countQuery = supabase.from('contacts').select('id', { count: 'exact', head: true });
      const searchTerm = debouncedSearch.trim();
      if (searchTerm) countQuery = countQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`);
      if (selectedCategory && selectedCategory !== 'all') countQuery = countQuery.eq('category_id', selectedCategory);
      countQuery = applyStatusVisibility(countQuery);
      const { count, error: countError } = await countQuery;
      if (requestId !== loadContactsRequestIdRef.current) return;
      if (countError) {
        logSupabaseError('AdminContactsPage count query failed:', countError);
        setTotalCount(enriched.length);
      } else {
        setTotalCount(count ?? 0);
      }
    } catch (err) {
      if (requestId !== loadContactsRequestIdRef.current) return;
      console.error('loadContacts error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar contactos. Revisa consola o configuración de Supabase.');
    } finally {
      if (requestId === loadContactsRequestIdRef.current) {
        setLoading(false);
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!categories.length || selectedCategory === 'all' || selectedCategory === 'uncategorized') return;
    const selected = categoryById.get(selectedCategory);
    if (!selected || isSyntheticCategoryId(selected.id)) {
      setSelectedCategory('all');
      setCurrentPage(0);
    }
  }, [categories, categoryById, selectedCategory]);

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
    if (!isAddOpen) return;
    void loadCategories();
  }, [isAddOpen]);

  useModalDismiss(isAddOpen, closeAddModal);
  useModalDismiss(Boolean(repairPlan), () => setRepairPlan(null));
  useModalDismiss(Boolean(editing), () => setEditing(null));

  function openEdit(contact: ContactRow) {
    setEditing(contact);
    setEditTags((contact.tags ?? []).join(', '));
  }

  function clearViewFilters() {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setQualityFilter('all');
    setTagFilter('');
    setSearch('');
    setDebouncedSearch('');
    setCurrentPage(0);
    setSelectedIds([]);
  }

  function applyMetricFilter(filter: 'total' | 'publicable' | 'restricted' | 'uncategorized' | 'no_phone' | 'complete') {
    setActiveSubtab('list');
    setSelectedStatus('all');
    setSearch('');
    setDebouncedSearch('');
    setTagFilter('');
    setCurrentPage(0);
    setSelectedIds([]);

    if (filter === 'uncategorized') {
      setSelectedCategory('uncategorized');
      setQualityFilter('all');
      return;
    }

    setSelectedCategory('all');
    if (filter === 'total') setQualityFilter('all');
    if (filter === 'publicable') setQualityFilter('publicable');
    if (filter === 'restricted') setQualityFilter('restricted');
    if (filter === 'no_phone') setQualityFilter('no_phone');
    if (filter === 'complete') setQualityFilter('complete');
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
      const publication = getSafePublicationState({
        phone,
        requestedStatus: editing.status,
        requestedVisibility: editing.visibility,
        requestedIsPublic: editing.is_public,
        requestedPhoneStatus: editing.phone_status,
      });
      const ok = await updateContactCompat(editing.id, {
        name: sanitizeText(editing.name, 160),
        phone: phone || null,
        raw_phone: sanitizeText(editing.raw_phone ?? '', 80) || null,
        whatsapp: normalizePhoneForAdmin(editing.whatsapp ?? phone),
        phone_masked: phone ? maskPhone(phone) : 'Requiere revisión',
        phone_status: publication.phoneStatus,
        category_id: editing.category_id,
        description: sanitizeText(editing.description ?? '', 500),
        tags: splitTags(editTags),
        status: publication.status,
        visibility: publication.visibility,
        is_public: publication.isPublic,
        country_flag: detected.country_flag,
        country_code: detected.country_code,
        internal_note: sanitizeText(editing.internal_note ?? '', 700),
        import_note: sanitizeText(editing.import_note ?? '', 700),
        source: sanitizeText(editing.source ?? 'manual', 80),
        is_active: publication.status !== 'inactive',
      });
      if (!ok) {
        toast.error('Supabase no permitió editar este contacto.');
        return;
      }
      toast.success(publication.isPublic ? 'Contacto actualizado y publicable.' : 'Contacto actualizado en revisión admin.');
      setEditing(null);
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function approveContact(contact: ContactRow) {
    const phone = normalizePhoneForAdmin(contact.phone ?? '');
    const categoryExists = Boolean(categoryById.get(contact.category_id) && !isSyntheticCategoryId(contact.category_id));
    if (!hasUsablePhone(phone) || inferPhoneStatus({ ...contact, phone }) !== 'valid') {
      toast.error('No se puede aprobar: corrige un teléfono real y útil primero.');
      return;
    }
    if (!categoryExists) {
      toast.error('No se puede aprobar: asigna una carpeta oficial válida.');
      return;
    }
    const category = categoryById.get(contact.category_id);
    const autoDescription = contact.description?.trim() || defaultDescriptionFor(category);

    setActionLoading(true);
    try {
      const detected = detectPhoneCountry(phone);
      const ok = await updateContactCompat(contact.id, {
        phone,
        whatsapp: normalizePhoneForAdmin(contact.whatsapp ?? phone),
        phone_masked: maskPhone(phone),
        phone_status: 'valid',
        status: 'active',
        visibility: 'public',
        is_public: true,
        is_active: true,
        country_flag: detected.country_flag,
        country_code: detected.country_code,
        description: autoDescription,
        internal_note: sanitizeText(`${contact.internal_note ?? ''}\nAprobado manualmente desde Admin Contactos.`, 700),
      });
      if (!ok) {
        toast.error('No se pudo aprobar este contacto.');
        return;
      }
      toast.success('Contacto aprobado y movido a publicables.');
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
    const publication = getSafePublicationState({
      phone,
      requestedStatus: form.status,
      requestedVisibility: form.status === 'active' ? 'public' : 'admin_only',
      requestedIsPublic: form.status === 'active',
      requestedPhoneStatus: null,
    });

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
        raw_phone: phone || null,
        phone_status: publication.phoneStatus,
        visibility: publication.visibility,
        is_public: publication.isPublic,
        is_active: publication.status !== 'inactive',
        status: publication.status,
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
    if (
      (bulkStatus === 'inactive' || bulkStatus === 'rejected') &&
      !window.confirm(`Vas a cambiar el estado de ${selectedIds.length} contacto(s) a "${bulkStatus}". Dejarán de verse en el catálogo público. ¿Deseas continuar?`)
    ) {
      return;
    }
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

  async function repairReservedPhonePlaceholders() {
    if (!supabase || !isSupabaseConfigured) {
      toast.error('Falta conectar Supabase.');
      return;
    }

    setActionLoading(true);
    try {
      const table = (supabase as unknown as { from: (name: string) => any }).from('contacts');
      const extendedPayload = {
        phone: null,
        raw_phone: 'REVISAR EN DOCUMENTO ORIGINAL',
        phone_status: 'needs_review',
        whatsapp: null,
        phone_masked: 'Reservado para revisión',
        visibility: 'restricted',
        is_public: false,
        import_batch: 'importacion_excel_1048_final',
        import_note: 'Número no republicado por seguridad del directorio',
        internal_note: 'Contacto reservado/importado para revisión admin',
        status: 'review',
        risk_level: 'review',
        tags: ['revisión', 'reservado', 'admin'],
        country_code: 'XX',
        country_flag: '⚠️',
      };

      let response = await table
        .update(extendedPayload)
        .eq('source', 'importacion_excel_1048_final')
        .like('phone', '+000%')
        .select('id');

      if (response.error && isMissingColumnError(response.error)) {
        response = await table
          .update({
            phone: 'REVISAR EN DOCUMENTO ORIGINAL',
            phone_masked: 'Reservado para revisión',
            status: 'review',
            risk_level: 'review',
            tags: ['revisión', 'reservado', 'admin'],
            country_code: 'XX',
            country_flag: '⚠️',
          })
          .eq('source', 'importacion_excel_1048_final')
          .like('phone', '+000%')
          .select('id');
      }

      if (response.error) throw new Error(response.error.message);

      const repaired = response.data?.length ?? 0;
      toast.success(`${repaired} teléfonos reservados corregidos sin placeholders.`);
      await reloadCurrentPage();
    } catch (repairError) {
      const message = repairError instanceof Error ? repairError.message : String(repairError);
      console.error('repairReservedPhonePlaceholders failed:', message);
      toast.error(`No pude corregirlos: ${message}`);
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
      let { data, error: repairReadError } = await fetchActiveContactRows(legacySelect);
      let hasLegacyColumns = true;

      if (repairReadError && isMissingColumnError(repairReadError)) {
        hasLegacyColumns = false;
        const fallback = await fetchActiveContactRows(baseContactSelect);
        data = fallback.data;
        repairReadError = fallback.error;
      }

      if (repairReadError) {
        logSupabaseError('repairCategoryLinks read failed:', repairReadError);
        toast.error('No pude leer contactos para reparar. Revisa consola.');
        return;
      }

      if (!hasLegacyColumns) {
        const invalidLinks = ((data ?? []) as Array<Record<string, unknown>>)
          .filter((row) => {
            const categoryId = String(row.category_id ?? '');
            return !categoryId || !realIds.has(categoryId);
          })
          .length;
        if (invalidLinks === 0) {
          toast.success('Los vínculos actuales ya son válidos. No se modificó ningún contacto.');
        } else {
          toast.info(`${invalidLinks} contactos requieren revisión manual. No se modificó ni eliminó ningún registro.`);
        }
        return;
      }

      const candidates = ((data ?? []) as Array<Record<string, unknown>>)
        .filter((row) => {
          const categoryId = String(row.category_id ?? '');
          return !categoryId || !realIds.has(categoryId);
        });
      const repairs = candidates
        .map((row) => {
          const target = getLegacyFolderValues(row)
            .map((value) => findCategoryByLegacyValue(value, realCategories))
            .find(Boolean);
          return target ? { id: String(row.id), target } : null;
        })
        .filter((repair): repair is { id: string; target: CategoryOption } => Boolean(repair));

      if (!repairs.length) {
        toast.info(`No se encontraron vínculos reparables automáticamente. ${candidates.length} registros quedaron intactos para revisión manual.`);
        return;
      }

      setRepairPlan({
        scanned: (data ?? []).length,
        repairs,
        unresolved: Math.max(0, candidates.length - repairs.length),
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmCategoryRepairs() {
    if (!repairPlan) return;
    setActionLoading(true);
    try {
      const results = await Promise.all(
        repairPlan.repairs.map((repair) => updateContactCompat(repair.id, { category_id: repair.target.id })),
      );
      const repaired = results.filter(Boolean).length;
      const failed = results.length - repaired;
      setRepairPlan(null);
      toast.success(
        `${repaired} vínculos reparados. ${failed + repairPlan.unresolved} quedaron sin cambios para revisión manual.`,
      );
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
      <div className="mb-6">
        <ContactsMaintenancePanel
          onArchived={async () => {
            setSelectedIds([]);
            setCurrentPage(0);
            await loadCategories();
            await loadContacts();
          }}
        />
      </div>
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-text">Admin ContactHub</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-content">Gestión de contactos</h2>
            <p className="mt-2 max-w-2xl text-sm text-content-secondary">
              Administra contactos reales por carpeta, revisa calidad de datos, archiva sin borrar y prepara importaciones grandes con control.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openAddContact} className="focus-ring btn-primary-glow inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950 hover:bg-white">
              <Plus className="h-4 w-4" />
              Agregar contacto
            </button>
            <Link to="/admin/importar" className="focus-ring inline-flex items-center gap-2 rounded-full border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-sm font-bold text-brand-text hover:bg-brand-400 hover:text-ink-950">
              <ExternalLink className="h-4 w-4" />
              Importar 200+
            </Link>
            <button type="button" onClick={() => void reloadCurrentPage()} className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-bold text-content hover:border-brand-400/35">
              <RefreshCw className="h-4 w-4" />
              Recargar
            </button>
            <button type="button" onClick={clearViewFilters} className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-bold text-content hover:border-brand-400/35">
              <XCircle className="h-4 w-4" />
              Limpiar filtros
            </button>
            <button type="button" disabled={actionLoading} onClick={() => void repairCategoryLinks()} className="focus-ring inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-100 hover:border-yellow-300/45 disabled:opacity-50">
              Revisar vínculos de carpetas
            </button>
            <button type="button" disabled={actionLoading} onClick={() => void repairReservedPhonePlaceholders()} className="focus-ring inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-300/10 px-4 py-2 text-sm font-bold text-red-100 hover:border-red-300/45 disabled:opacity-50">
              Corregir teléfonos reservados
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <button type="button" onClick={() => applyMetricFilter('total')} className="focus-ring rounded-2xl border border-brand-400/20 bg-brand-400/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400/45">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text">Total admin</p>
            <p className="mt-2 text-2xl font-black text-content">{adminStats.total}</p>
            <p className="mt-1 text-xs text-content-secondary">Vista actual: {totalCount}</p>
          </button>
          <button type="button" onClick={() => applyMetricFilter('publicable')} className="focus-ring rounded-2xl border border-brand-400/20 bg-canvas/55 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400/45">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text">Publicables</p>
            <p className="mt-2 text-2xl font-black text-content">{adminStats.publicable}</p>
            <p className="mt-1 text-xs text-content-secondary">activos, públicos y válidos</p>
          </button>
          <button type="button" onClick={() => applyMetricFilter('restricted')} className="focus-ring rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-300/45">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-200">Restringidos</p>
            <p className="mt-2 text-2xl font-black text-content">{adminStats.restricted}</p>
            <p className="mt-1 text-xs text-content-secondary">solo revisión admin</p>
          </button>
          <button type="button" onClick={() => applyMetricFilter('uncategorized')} className="focus-ring rounded-2xl border border-border bg-canvas/55 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400/35">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-content-muted">Sin categoría</p>
            <p className="mt-2 text-2xl font-black text-content">{adminStats.uncategorized}</p>
            <p className="mt-1 text-xs text-content-secondary">para reasignar o limpiar</p>
          </button>
          <button type="button" onClick={() => applyMetricFilter('no_phone')} className="focus-ring rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-300/45">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-200">Sin teléfono útil</p>
            <p className="mt-2 text-2xl font-black text-content">{adminStats.noPhone}</p>
            <p className="mt-1 text-xs text-content-secondary">incluye revisión reservada</p>
          </button>
          <button type="button" onClick={() => applyMetricFilter('complete')} className="focus-ring rounded-2xl border border-brand-400/20 bg-canvas/55 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400/45">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text">Completos</p>
            <p className="mt-2 text-2xl font-black text-content">{adminStats.complete}</p>
            <p className="mt-1 text-xs text-content-secondary">publicables con descripción</p>
          </button>
        </div>

        {adminStats.placeholders > 0 ? (
          <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            Detectamos {adminStats.placeholders} teléfonos placeholder. Usa “Corregir teléfonos reservados” antes de publicar datos.
          </div>
        ) : null}

        {totalCount === 0 && adminStats.total > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand-400/20 bg-brand-400/10 px-4 py-3 text-sm text-brand-50 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Los {adminStats.total} contactos siguen registrados. La vista “{selectedCategoryLabel}” no tiene resultados con los filtros actuales.
            </span>
            <button type="button" onClick={clearViewFilters} className="rounded-full bg-brand-400 px-4 py-2 text-xs font-black text-ink-950">
              Mostrar todos
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveSubtab('list')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeSubtab === 'list' ? 'bg-brand-400 text-ink-950' : 'border border-border bg-muted text-content hover:border-brand-400/40'}`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab('folder')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeSubtab === 'folder' ? 'bg-brand-400 text-ink-950' : 'border border-border bg-muted text-content hover:border-brand-400/40'}`}
          >
            Por carpeta
          </button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_320px_170px_170px_170px]">
          <label className="relative block">
            <span className="sr-only">Buscar contactos</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(sanitizeTextInput(event.target.value, 80));
              }}
              placeholder="Buscar por nombre, teléfono, WhatsApp, descripción, tags o estado"
              className="focus-ring h-11 w-full rounded-full border border-border bg-canvas/70 pl-11 pr-4 text-sm text-content"
            />
            {isSearching ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-text">Buscando...</span> : null}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFolderPickerOpen((value) => !value)}
              className="focus-ring flex h-11 w-full items-center justify-between gap-3 rounded-full border border-border bg-canvas/70 px-4 text-left text-sm text-content hover:border-brand-400/40"
            >
              <span className="min-w-0 truncate">{selectedCategory === 'all' ? 'Todas las carpetas' : selectedCategory === 'uncategorized' ? 'Sin categoría' : getCategoryLabel(selectedCategoryObject)}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-brand-text" />
            </button>
            {isFolderPickerOpen ? (
              <div className="absolute left-0 right-0 top-12 z-40 rounded-2xl border border-border bg-canvas p-3 shadow-2xl">
                <input
                  value={folderPickerSearch}
                  onChange={(event) => setFolderPickerSearch(sanitizeTextInput(event.target.value, 80))}
                  placeholder="Buscar carpeta..."
                  className="focus-ring h-10 w-full rounded-full border border-border bg-muted px-4 text-sm text-content placeholder:text-content-muted"
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
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${selectedCategory === 'all' ? 'bg-brand-400 text-ink-950' : 'text-content hover:bg-brand-400/10 hover:text-content'}`}
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
                    className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${selectedCategory === 'uncategorized' ? 'bg-brand-400 text-ink-950' : 'text-content hover:bg-brand-400/10 hover:text-content'}`}
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
                      className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${selectedCategory === category.id ? 'bg-brand-400 text-ink-950' : 'text-content hover:bg-brand-400/10 hover:text-content'}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{getCategoryLabel(category)}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{category.contacts_count ?? 0}</span>
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
            className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-sm text-content"
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
            className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-sm text-content"
          >
            <option value="all">Calidad: todas</option>
            <option value="publicable">Publicables</option>
            <option value="restricted">Restringidos</option>
            <option value="complete">Completos</option>
            <option value="verified">Verificados</option>
            <option value="pending">Pendientes</option>
            <option value="no_phone">Sin teléfono</option>
          </select>
          <input
            value={tagFilter}
            onChange={(event) => setTagFilter(sanitizeTextInput(event.target.value, 40))}
            placeholder="Filtrar tag"
            className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-sm text-content placeholder:text-content-muted"
          />
        </div>

        {activeSubtab === 'folder' ? (
        <div className="mt-5">
          {selectedCategory === 'uncategorized' ? (
            <div className="mb-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <h3 className="text-sm font-black text-content">Contactos sin categoría</h3>
              <p className="mt-1 text-sm text-yellow-100/80">Estos contactos aún no están vinculados a una carpeta. Puedes reasignarlos, archivarlos o eliminarlos.</p>
            </div>
          ) : null}
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-content-muted">Carpetas oficiales</p>
            <span className="text-xs text-content-muted">{categories.length} carpetas activas</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => {
                setCurrentPage(0);
                setSelectedCategory('all');
              }}
              className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                selectedCategory === 'all' ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-border bg-muted text-content hover:border-brand-400/40'
              }`}
            >
              Todas las carpetas
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${selectedCategory === 'all' ? 'bg-canvas/15 text-ink-950' : 'bg-muted text-content-secondary'}`}>
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
                selectedCategory === 'uncategorized' ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-border bg-muted text-content hover:border-brand-400/40'
              }`}
            >
              Sin categoría
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${selectedCategory === 'uncategorized' ? 'bg-canvas/15 text-ink-950' : 'bg-muted text-content-secondary'}`}>
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
                    : 'border-border bg-canvas/70 text-content hover:border-brand-400/40 hover:text-content'
                }`}
              >
                <span>{getCategoryCompactLabel(category)}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${selectedCategory === category.id ? 'bg-canvas/15 text-ink-950' : 'bg-muted text-content-secondary'}`}>
                  {category.contacts_count ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 text-sm text-content-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {pageStart}-{pageEnd} de {totalCount} contactos
            {selectedCategory !== 'all' ? ` en ${selectedCategoryLabel}` : ''}
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={toggleAllVisible} className="focus-ring rounded-full border border-border bg-muted px-4 py-2 font-bold text-content">
              {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
            </button>
            <button type="button" onClick={() => void selectCurrentFolder()} className="focus-ring rounded-full border border-border bg-muted px-4 py-2 font-bold text-content">
              Seleccionar carpeta
            </button>
            <button type="button" disabled={currentPage === 0} onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} className="focus-ring rounded-full border border-border bg-muted px-4 py-2 font-bold text-content disabled:opacity-40">
              Anterior
            </button>
            <button type="button" disabled={pageEnd >= totalCount} onClick={() => setCurrentPage((page) => page + 1)} className="focus-ring rounded-full border border-border bg-muted px-4 py-2 font-bold text-content disabled:opacity-40">
              Siguiente
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-canvas/70 text-xs uppercase text-content-muted">
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
                  <tr key={contact.id} className="border-t border-border hover:bg-muted">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleSelection(contact.id)} /></td>
                    <td className="px-4 py-3 text-xs font-bold text-content-muted">{currentPage * pageSize + index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-content">{contact.name}</p>
                      {contact.description ? <p className="mt-1 max-w-[360px] text-xs italic text-content-secondary">{contact.description}</p> : <p className="mt-1 text-xs text-yellow-200/75">Sin descripción: conviene completar valor del contacto.</p>}
                      {contact.internal_note ? <p className="mt-1 text-[11px] text-brand-text/75">Nota: {contact.internal_note}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-content">
                        {contact.country_flag ?? '🌎'} {contact.phone ? formatPhone(contact.phone) : contact.raw_phone ?? contact.phone_masked ?? maskPhone(null)}
                      </div>
                      {contact.raw_phone ? (
                        <p className="mt-1 break-all text-[11px] text-content-muted">Raw: {contact.raw_phone}</p>
                      ) : null}
                      {inferPhoneStatus(contact) !== 'valid' ? (
                        <p className="mt-1 text-[11px] font-semibold text-yellow-300">phone_status: {inferPhoneStatus(contact)}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {whatsappLink ? (
                          <a href={whatsappLink} target="_blank" rel="noreferrer" className="rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-[11px] font-bold text-brand-text">
                            WhatsApp
                          </a>
                        ) : (
                          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-bold text-yellow-100">pendiente</span>
                        )}
                        {contact.phone && !/revisar en documento original/i.test(contact.phone) ? (
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(contact.phone ?? '');
                              toast.success('Número copiado.');
                            }}
                            className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-bold text-content"
                          >
                            Copiar
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-content-secondary">{getCategoryLabel(category)}</td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-1.5">
                        {(contact.tags ?? []).length ? (
                          (contact.tags ?? []).map((tag) => (
                            <span key={tag} className="rounded-full border border-border bg-muted px-2 py-1 text-[10px] font-bold text-content-secondary">{tag}</span>
                          ))
                        ) : (
                          <span className="text-xs text-content-muted">Sin tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${quality.className}`}>{quality.label}</span>
                        <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-bold text-content-secondary">{contact.status}</span>
                        <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-bold text-content-secondary">{contact.visibility ?? 'public'}</span>
                        <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-bold text-content-secondary">{inferPhoneStatus(contact)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-content-muted">{contact.created_at ? new Date(contact.created_at).toLocaleDateString('es-PE') : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={actionLoading} onClick={(e) => { e.stopPropagation(); openEdit(contact); }} className="rounded-full border border-border bg-muted p-2 text-brand-text hover:border-brand-400/40" title="Editar">
                          ✏️
                        </button>
                        <button type="button" disabled={actionLoading || isPublicableContact(contact)} onClick={(e) => { e.stopPropagation(); void approveContact(contact); }} className="rounded-full border border-brand-400/25 bg-brand-400/10 p-2 text-brand-text hover:border-brand-400/50 disabled:cursor-not-allowed disabled:opacity-40" title="Aprobar">
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={actionLoading} onClick={(e) => { e.stopPropagation(); openDuplicate(contact); }} className="rounded-full border border-border bg-muted p-2 text-content hover:border-brand-400/40" title="Duplicar">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={actionLoading || contact.status === 'inactive'} onClick={(e) => { e.stopPropagation(); void archiveRow(contact); }} className="rounded-full border border-border bg-muted p-2 text-yellow-100 hover:border-yellow-300/40" title="Archivar">
                          <Archive className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={actionLoading} onClick={(e) => { e.stopPropagation(); void deleteRow(contact); }} className="rounded-full border border-red-400/20 bg-red-500/10 p-2 text-red-300 hover:border-red-300/50" title="Archivar con confirmación">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredContacts.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-content-secondary">
                    <p className="text-base font-bold text-content">
                      {debouncedSearch.trim()
                        ? 'No encontramos contactos con esa búsqueda en esta carpeta.'
                        : selectedCategory === 'all'
                          ? 'No hay contactos registrados todavía.'
                          : 'Esta carpeta aún no tiene contactos.'}
                    </p>
                    <p className="mt-2 text-sm">Puedes crear el primer contacto manualmente, importar una lista o pegar contactos desde el importador.</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <button type="button" onClick={openAddContact} className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950">Crear primer contacto</button>
                      <Link to="/admin/importar" className="rounded-full border border-border bg-muted px-4 py-2 text-sm font-bold text-content">Importar contactos</Link>
                      <Link to="/admin/importar" className="rounded-full border border-border bg-muted px-4 py-2 text-sm font-bold text-content">Pegar lista</Link>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedIds.length ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(960px,calc(100vw-24px))] -translate-x-1/2 rounded-2xl border border-border bg-surface p-4 shadow-2xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <span className="text-sm font-bold text-content">{selectedIds.length} contactos seleccionados</span>
            <div className="flex flex-wrap gap-2">
              <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ContactStatus)} className="h-10 rounded-full border border-border bg-canvas px-3 text-xs text-content">
                <option value="active">Activo</option>
                <option value="review">Revisión</option>
                <option value="inactive">Archivado</option>
                <option value="rejected">Rechazado</option>
              </select>
              <button type="button" disabled={actionLoading} onClick={() => void bulkUpdateStatus()} className="rounded-full border border-border bg-muted px-3 py-2 text-xs font-bold text-content disabled:opacity-50">Cambiar estado</button>
              <input value={bulkTag} onChange={(event) => setBulkTag(sanitizeTextInput(event.target.value, 32))} placeholder="tag" className="h-10 w-28 rounded-full border border-border bg-canvas px-3 text-xs text-content" />
              <button type="button" disabled={actionLoading || !bulkTag.trim()} onClick={() => void bulkAddTag()} className="rounded-full border border-border bg-muted px-3 py-2 text-xs font-bold text-content disabled:opacity-50"><Tags className="inline h-3 w-3" /> Tag</button>
              <select value={bulkMoveCategory} onChange={(event) => setBulkMoveCategory(event.target.value)} className="h-10 max-w-[220px] rounded-full border border-border bg-canvas px-3 text-xs text-content">
                <option value="">Mover a carpeta...</option>
                {categories.filter((category) => !isSyntheticCategoryId(category.id)).map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(category)}</option>)}
              </select>
              <button type="button" disabled={actionLoading || !bulkMoveCategory} onClick={() => void bulkMove()} className="rounded-full border border-border bg-muted px-3 py-2 text-xs font-bold text-content disabled:opacity-50">Mover</button>
              <button type="button" disabled={actionLoading} onClick={() => void archiveSelected()} className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-content disabled:opacity-50">
                Eliminar seleccionados
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {repairPlan ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4" onClick={onOverlayClick(() => setRepairPlan(null))}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-yellow-300/25 bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-200">Vista previa segura</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-content">Reparar vínculos de carpetas</h3>
              </div>
              <button type="button" onClick={() => setRepairPlan(null)} className="rounded-full border border-border p-2 text-content">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-content-secondary">
              Esta acción intentará vincular contactos a carpetas oficiales. No eliminará contactos ni carpetas.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-xs text-content-secondary">Analizados</p>
                <p className="mt-1 text-xl font-black text-content">{repairPlan.scanned}</p>
              </div>
              <div className="rounded-xl border border-brand-400/25 bg-brand-400/10 p-3">
                <p className="text-xs text-brand-text">Reparables</p>
                <p className="mt-1 text-xl font-black text-content">{repairPlan.repairs.length}</p>
              </div>
              <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/10 p-3">
                <p className="text-xs text-yellow-100">Revisión manual</p>
                <p className="mt-1 text-xl font-black text-content">{repairPlan.unresolved}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-canvas/60 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-content-secondary">Cambios propuestos</p>
              <div className="mt-3 grid gap-2">
                {repairDestinationSummary.slice(0, 8).map(({ category, count }) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-content">{getCategoryLabel(category)}</span>
                    <span className="shrink-0 rounded-full bg-brand-400/15 px-2 py-1 text-xs font-black text-brand-text">{count}</span>
                  </div>
                ))}
                {repairDestinationSummary.length > 8 ? (
                  <p className="text-xs text-content-muted">Y {repairDestinationSummary.length - 8} carpetas adicionales.</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={actionLoading} onClick={() => setRepairPlan(null)} className="h-11 rounded-full border border-border bg-muted px-5 text-sm font-bold text-content disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" disabled={actionLoading} onClick={() => void confirmCategoryRepairs()} className="h-11 rounded-full bg-brand-400 px-5 text-sm font-black text-ink-950 disabled:opacity-50">
                {actionLoading ? 'Reparando...' : `Confirmar ${repairPlan.repairs.length} cambios`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onOverlayClick(() => setEditing(null))}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-content">Editar contacto</h3>
                <p className="mt-2 text-sm text-content-secondary">Actualiza datos visibles y datos internos para administración.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-border p-2 text-content"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Nombre</span><input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Teléfono</span><input value={editing.phone ?? ''} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 font-mono text-content" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Teléfono original / raw_phone</span><input value={editing.raw_phone ?? ''} onChange={(event) => setEditing({ ...editing, raw_phone: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 font-mono text-content" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">WhatsApp</span><input value={editing.whatsapp ?? editing.phone ?? ''} onChange={(event) => setEditing({ ...editing, whatsapp: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 font-mono text-content" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Categoría</span><select value={editing.category_id} onChange={(event) => setEditing({ ...editing, category_id: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content">{categories.filter((category) => !isSyntheticCategoryId(category.id)).map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(category)}</option>)}</select></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Estado</span><select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as ContactStatus })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content"><option value="active">active</option><option value="review">review</option><option value="inactive">inactive</option><option value="rejected">rejected</option></select></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Phone status</span><select value={editing.phone_status ?? inferPhoneStatus(editing)} onChange={(event) => setEditing({ ...editing, phone_status: event.target.value as ContactPhoneStatus })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content"><option value="valid">valid</option><option value="needs_review">needs_review</option><option value="missing">missing</option><option value="invalid">invalid</option><option value="placeholder_bug">placeholder_bug</option></select></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Visibilidad</span><select value={editing.visibility ?? 'public'} onChange={(event) => setEditing({ ...editing, visibility: event.target.value as ContactVisibility })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content"><option value="public">public</option><option value="restricted">restricted</option><option value="admin_only">admin_only</option></select></label>
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-canvas/70 px-4 py-3 text-sm font-semibold text-content-secondary">
                <input type="checkbox" checked={editing.is_public !== false} onChange={(event) => setEditing({ ...editing, is_public: event.target.checked })} />
                is_public
              </label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Fuente</span><input value={editing.source ?? 'manual'} onChange={(event) => setEditing({ ...editing, source: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content" /></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-content-secondary">Descripción</span><textarea value={editing.description ?? ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} rows={3} className="focus-ring rounded-2xl border border-border bg-canvas/70 px-4 py-3 text-content" /></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-content-secondary">Tags separados por coma</span><input value={editTags} onChange={(event) => setEditTags(event.target.value)} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content" /></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-content-secondary">Nota interna</span><textarea value={editing.internal_note ?? ''} onChange={(event) => setEditing({ ...editing, internal_note: event.target.value })} rows={3} className="focus-ring rounded-2xl border border-border bg-canvas/70 px-4 py-3 text-content" /></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-content-secondary">Motivo / nota de importación</span><textarea value={editing.import_note ?? ''} onChange={(event) => setEditing({ ...editing, import_note: event.target.value })} rows={2} className="focus-ring rounded-2xl border border-border bg-canvas/70 px-4 py-3 text-content" /></label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={actionLoading} onClick={() => void saveEdit()} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 disabled:opacity-60"><Save className="h-4 w-4" />Guardar cambios</button>
              <button type="button" disabled={actionLoading} onClick={() => void approveContact(editing)} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-full border border-brand-400/35 bg-brand-400/10 px-5 text-sm font-bold text-brand-text disabled:opacity-60"><Check className="h-4 w-4" />Aprobar contacto</button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onOverlayClick(closeAddModal)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-content">Agregar contacto</h3>
                <p className="mt-2 text-sm text-content-secondary">Crea un contacto manual y asígnalo a una carpeta oficial.</p>
              </div>
              <button type="button" onClick={closeAddModal} className="rounded-full border border-border p-2 text-content"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-semibold text-content-secondary">Nombre del contacto</span>
                <input value={form.name} placeholder="Ej: Pack de IA mensuales" onChange={(event) => setForm({ ...form, name: sanitizeTextInput(event.target.value, 160) })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content placeholder:text-content-muted focus:border-brand-400" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-content-secondary">Teléfono</span>
                <div className="flex items-center gap-2">
                  <span className="flex h-11 w-12 items-center justify-center rounded-full border border-border bg-canvas/70 text-xl">{form.country_flag}</span>
                  <input value={form.phone} placeholder="Ej: +51 963 187 899" onChange={(event) => handlePhoneInput(event.target.value)} className="focus-ring h-11 flex-1 rounded-full border border-border bg-canvas/70 px-4 font-mono text-content placeholder:text-content-muted focus:border-brand-400" />
                </div>
                <span className="text-xs text-content-muted">Puede quedar vacío si todavía está pendiente.</span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-content-secondary">WhatsApp</span>
                <input value={form.whatsapp} placeholder="Se genera desde el teléfono" onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 font-mono text-content placeholder:text-content-muted focus:border-brand-400" />
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-semibold text-content-secondary">Carpeta destino</span>
                <select value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content focus:border-brand-400">
                  <option value="">Selecciona una carpeta...</option>
                  {categories.filter((category) => !isSyntheticCategoryId(category.id)).map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(category)}</option>)}
                </select>
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-semibold text-content">Descripción</span>
                <textarea
                  value={form.description}
                  rows={3}
                  maxLength={500}
                  placeholder="Breve descripción de lo que ofrece este contacto"
                  onChange={(event) => setForm({ ...form, description: event.target.value.slice(0, 500) })}
                  className="focus-ring resize-none rounded-2xl border border-border bg-canvas/70 px-4 py-3 text-content placeholder:text-content-muted focus:border-brand-400"
                />
                <span className="text-right text-xs text-content-muted">{form.description.length}/500</span>
              </label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Tags</span><input value={form.tags} placeholder="ia, proveedor, curso" onChange={(event) => setForm({ ...form, tags: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content placeholder:text-content-muted" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Estado</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ContactStatus })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content"><option value="active">Activo</option><option value="review">Pendiente</option><option value="inactive">Archivado</option><option value="rejected">Rechazado</option></select></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Fuente</span><input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-content-secondary">Nota interna</span><input value={form.internal_note} placeholder="Pago, origen, revisión..." onChange={(event) => setForm({ ...form, internal_note: event.target.value })} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content placeholder:text-content-muted" /></label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={closeAddModal} className="focus-ring inline-flex h-11 items-center justify-center rounded-full border border-border bg-muted px-5 text-sm font-bold text-content">
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
