import { ExternalLink, Plus, RefreshCw, Save, Search, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { normalizeOfficialCategoryRows, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { formatDate } from '../../lib/format';
import { sanitizePhone, sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { deleteContact, deleteContactsBulk, getCountryCode, getFlag, updateContact } from '../../services/adminContactsService';
import { formatPhone, maskPhone } from '../../utils/phone';

type CategoryOption = { id: string; name: string; icon?: string | null; slug?: string | null; sort_order?: number | null; short_description?: string | null } & OfficialCategoryDisplay;
type ContactStatus = 'active' | 'inactive' | 'review' | 'rejected';
type ContactRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  phone_masked: string | null;
  country_flag?: string | null;
  country_code?: string | null;
  tags: string[] | null;
  status: ContactStatus;
  risk_level: 'safe' | 'review' | 'prohibited';
  created_at: string;
  category_name?: string;
  category_icon?: string;
};

const pageSize = 50;
const adminContactSelect = 'id, name, phone, phone_masked, status, created_at, category_id, description, tags, risk_level, country_flag, country_code';

type SupabaseDebugError = {
  message?: string;
  details?: string | null;
  code?: string | null;
  hint?: string | null;
};

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

export function parseContactLine(line: string) {
  let cleanLine = line.trim();
  if (!cleanLine || cleanLine.length < 5) return null;
  cleanLine = cleanLine.replace(/^\d+[\.\)]\s*/, '');
  cleanLine = cleanLine.replace(/^[\u{1F1E0}-\u{1F1FF}]{2}\s*/u, '');
  cleanLine = cleanLine.replace(/^[📞☎️]\s*/, '');
  const phoneMatch = cleanLine.match(/(\+?\d[\d\s\-\(\)\.]{6,18}\d)/);
  if (!phoneMatch) return null;
  const phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
  const name = cleanLine.replace(phoneMatch[0], '').replace(/[\(\)\-—–:,\.]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!name || name.length < 2) return null;
  return { name, phone };
}

const emptyForm = {
  name: '',
  phone: '',
  category_id: '',
  description: '',
  country_flag: '🇵🇪',
  country_code: 'PE',
};

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

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ContactStatus>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [editTags, setEditTags] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setCategories([]);
      return;
    }

    const { data, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, icon, slug, sort_order, short_description')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categoriesError) {
      console.error('loadCategories error:', categoriesError);
      setCategories([]);
      return;
    }

    const normalizedCategories = normalizeOfficialCategoryRows((data ?? []) as CategoryOption[]);
    console.log('Categories loaded:', normalizedCategories.length, normalizedCategories[0]);
    setCategories(normalizedCategories as CategoryOption[]);
  };

  const loadContacts = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setContacts([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('contacts')
        .select(adminContactSelect)
        .order('created_at', { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      const searchTerm = search.trim();
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data: contactsData, error: contactsError } = await query;
      let rows: Array<Partial<ContactRow>> = contactsData ?? [];
      let contactsSource: 'admin_contacts_secure' | 'contacts' = 'contacts';

      if (contactsError) {
        logSupabaseError('AdminContactsPage contacts query failed:', contactsError);
        contactsSource = 'contacts';

        let fallbackQuery = supabase
          .from('contacts')
          .select(adminContactSelect)
          .order('created_at', { ascending: false })
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

        if (searchTerm) {
          fallbackQuery = fallbackQuery.or(`name.ilike.%${searchTerm}%,phone_masked.ilike.%${searchTerm}%`);
        }
        if (selectedCategory && selectedCategory !== 'all') {
          fallbackQuery = fallbackQuery.eq('category_id', selectedCategory);
        }
        if (selectedStatus && selectedStatus !== 'all') {
          fallbackQuery = fallbackQuery.eq('status', selectedStatus);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) {
          logSupabaseError('AdminContactsPage contacts fallback query failed:', fallbackError);
          throw new Error(`Error al cargar contactos. Revisa consola o configuración de Supabase. ${getSupabaseErrorMessage(fallbackError)}`);
        }

        rows = fallbackData ?? [];
      }

      const { data: catsData, error: catsError } = await supabase.from('categories').select('id, name, icon');
      if (catsError) logSupabaseError('AdminContactsPage categories query failed:', catsError);
      const catsMap = new Map((catsData ?? []).map((category) => [category.id, category]));

      const enriched = rows.map((contact) => ({
        ...contact,
        id: contact.id ?? '',
        category_id: contact.category_id ?? '',
        name: contact.name ?? 'Contacto sin nombre',
        phone: contact.phone ?? null,
        phone_masked: contact.phone_masked ?? null,
        status: (contact.status ?? 'active') as ContactStatus,
        created_at: contact.created_at ?? '',
        description: contact.description ?? '',
        country_flag: contact.country_flag ?? null,
        country_code: contact.country_code ?? null,
        tags: contact.tags ?? [],
        risk_level: contact.risk_level ?? 'safe',
        category_name: catsMap.get(contact.category_id ?? '')?.name ?? 'Sin categoría',
        category_icon: catsMap.get(contact.category_id ?? '')?.icon ?? '📁',
      })) as ContactRow[];

      setContacts(enriched);
      setSelectedIds([]);

      let countQuery = supabase.from('contacts').select('id', { count: 'exact', head: true });
      if (searchTerm) {
        countQuery = countQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      if (selectedCategory && selectedCategory !== 'all') countQuery = countQuery.eq('category_id', selectedCategory);
      if (selectedStatus && selectedStatus !== 'all') countQuery = countQuery.eq('status', selectedStatus);
      const { count, error: countError } = await countQuery;
      if (countError) {
        logSupabaseError(`AdminContactsPage ${contactsSource} count query failed:`, countError);
        setTotalCount(enriched.length);
      } else {
        setTotalCount(count ?? 0);
      }
    } catch (err) {
      console.error('loadContacts error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar contactos. Revisa consola o configuración de Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [search, selectedCategory, selectedStatus, currentPage]);

  useEffect(() => {
    if (!isAddOpen) return undefined;
    void loadCategories();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAddModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAddOpen]);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const pageStart = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd = Math.min(totalCount, currentPage * pageSize + contacts.length);
  const allVisibleSelected = contacts.length > 0 && contacts.every((contact) => selectedIds.includes(contact.id));

  function openEdit(contact: ContactRow) {
    setEditing(contact);
    setEditTags((contact.tags ?? []).join(', '));
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelectedIds(allVisibleSelected ? [] : contacts.map((contact) => contact.id));
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
      country_flag: detected.country_flag,
      country_code: detected.country_code,
    }));
  }

  async function reloadCurrentPage() {
    await loadContacts();
  }

  async function saveEdit() {
    if (!editing) return;
    setActionLoading(true);
    try {
      const formattedPhone = formatPhone(editing.phone);
      const ok = await updateContact(editing.id, {
        name: sanitizeText(editing.name, 160),
        phone: sanitizePhone(formattedPhone),
        phone_masked: maskPhone(formattedPhone),
        category_id: editing.category_id,
        description: sanitizeText(editing.description ?? '', 500),
        tags: editTags.split(',').map((tag) => sanitizeText(tag, 40)).filter(Boolean),
        status: editing.status,
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
    const name = sanitizeText(form.name, 160);
    const phone = sanitizePhone(form.phone.replace(/[\s\-\(\)]/g, ''));
    const categoryId = form.category_id;
    const description = sanitizeText(form.description, 200);
    const phoneMasked = phone.slice(0, -4) + '••••';

    if (!name || !phone || !categoryId) {
      toast.error('Completa nombre, teléfono y categoría.');
      return;
    }

    setActionLoading(true);
    try {
      const { data: duplicated, error: duplicateError } = await supabase
        .from('contacts')
        .select('id')
        .eq('category_id', categoryId)
        .eq('phone', phone)
        .limit(1);
      if (duplicateError) console.warn('duplicate contact check:', duplicateError.message);
      if (duplicated?.length) toast.warning('⚠️ Este número ya existe en esta carpeta');

      const { data, error: insertError } = await supabase
        .from('contacts')
        .insert({
          name,
          phone,
          phone_masked: phoneMasked,
          category_id: categoryId,
          description,
          country_flag: form.country_flag,
          country_code: form.country_code,
          tags: [],
          source: 'manual',
          status: 'active',
          risk_level: 'safe',
        })
        .select('*')
        .single();

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
      toast.success('✅ Contacto agregado correctamente');
      await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown> }).rpc('sync_category_count', { cat_id: categoryId }).catch(() => null);
      await loadContacts();
    } finally {
      setActionLoading(false);
    }
  }

  async function deactivateRow(contact: ContactRow) {
    setActionLoading(true);
    try {
      const ok = await updateContact(contact.id, { status: 'inactive' });
      if (!ok) {
        toast.error('Supabase no permitió desactivar este contacto por permisos RLS.');
        return;
      }
      toast.success('Contacto desactivado.');
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteRow(contact: ContactRow) {
    if (!window.confirm('¿Seguro que quieres eliminar este contacto?')) return;
    setActionLoading(true);
    try {
      const ok = await deleteContact(contact.id);
      if (!ok) {
        toast.error('Supabase no permitió eliminar. Revisa permisos RLS.');
        return;
      }
      toast.success('Contacto eliminado.');
      await reloadCurrentPage();
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteSelected() {
    if (!selectedIds.length || !window.confirm(`¿Seguro que quieres eliminar ${selectedIds.length} contactos seleccionados?`)) return;
    setActionLoading(true);
    try {
      const ok = await deleteContactsBulk(selectedIds);
      if (!ok) {
        toast.error('Supabase no permitió eliminar seleccionados. Revisa permisos RLS.');
        return;
      }
      toast.success(`${selectedIds.length} contactos eliminados.`);
      await reloadCurrentPage();
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
            <h2 className="font-display text-2xl font-bold text-white">Contactos</h2>
            <p className="mt-2 text-sm text-gray-400">Busca, edita, desactiva o elimina contactos reales de Supabase.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsAddOpen(true)} className="focus-ring btn-primary-glow inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950 hover:bg-white">
              <Plus className="h-4 w-4" />
              ➕ Agregar contacto
            </button>
            <Link to="/admin/importar" className="focus-ring inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950 hover:bg-white">
              <ExternalLink className="h-4 w-4" />
              Importar contactos
            </Link>
            <button type="button" onClick={() => void reloadCurrentPage()} className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white hover:border-brand-400/35">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_190px]">
          <label className="relative block">
            <span className="sr-only">Buscar contactos</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => {
                setCurrentPage(0);
                setSearch(sanitizeTextInput(event.target.value, 80));
              }}
              placeholder="Buscar por nombre, teléfono, descripción o categoría"
              className="focus-ring h-11 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-sm text-white"
            />
          </label>
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
            <option value="inactive">Inactivos</option>
            <option value="review">Revisión</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Filtrar por carpeta</p>
            <span className="text-xs text-gray-500">{categories.length} carpetas</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => {
                setCurrentPage(0);
                setSelectedCategory('all');
              }}
              className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                selectedCategory === 'all'
                  ? 'border-brand-400 bg-brand-400 text-ink-950'
                  : 'border-line bg-white/5 text-white hover:border-brand-400/40'
              }`}
            >
              Todas
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
                {category.icon ? `${category.icon} ` : ''}{category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {pageStart}-{pageEnd} de {totalCount} contactos
            {selectedCategory !== 'all' ? ` en ${categoryById.get(selectedCategory)?.name ?? 'esta carpeta'}` : ''}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={currentPage === 0} onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 font-bold text-white disabled:opacity-40">
              Anterior
            </button>
            <button type="button" disabled={pageEnd >= totalCount} onClick={() => setCurrentPage((page) => page + 1)} className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 font-bold text-white disabled:opacity-40">
              Siguiente
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-ink-950/70 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} /></th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Categoría real</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-line">
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleSelection(contact.id)} /></td>
                  <td className="px-4 py-3">
                    <p style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{contact.name}</p>
                    {contact.description ? (
                      <p style={{ fontStyle: 'italic', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', fontWeight: 500 }}>
                        {contact.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                      {contact.country_flag ?? '🌎'} {contact.phone ?? contact.phone_masked ?? maskPhone(contact.phone)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {contact.category_icon ?? categoryById.get(contact.category_id)?.icon ?? '📁'} {contact.category_name ?? categoryById.get(contact.category_id)?.name ?? 'Sin categoría'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      style={{
                        background: contact.status === 'active' ? 'rgba(29,180,122,0.2)' : 'rgba(255,0,0,0.2)',
                        color: contact.status === 'active' ? '#1DB47A' : '#ff4444',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                      }}
                    >
                      {contact.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{new Date(contact.created_at).toLocaleDateString('es-PE')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={actionLoading} onClick={() => openEdit(contact)} style={{ background: 'transparent', border: 'none', color: '#1DB47A', cursor: 'pointer', fontSize: '16px' }} title="Editar">
                        ✏️
                      </button>
                      <button type="button" disabled={actionLoading || contact.status === 'inactive'} onClick={() => void deactivateRow(contact)} className="focus-ring inline-flex items-center gap-1 rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                        <XCircle className="h-3.5 w-3.5" /> Desactivar
                      </button>
                      <button type="button" disabled={actionLoading} onClick={() => void deleteRow(contact)} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '16px', marginLeft: '8px' }} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!contacts.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    <p>No hay contactos registrados todavía o no encontramos resultados con ese filtro.</p>
                    <Link to="/admin/importar" className="mt-4 inline-flex rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950">
                      Importar contactos
                    </Link>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedIds.length ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-line bg-ink-900 px-5 py-3 shadow-2xl">
          <span className="text-sm font-bold text-white">{selectedIds.length} contactos seleccionados</span>
          <button type="button" disabled={actionLoading} onClick={() => void deleteSelected()} className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            🗑️ Eliminar seleccionados
          </button>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-line bg-ink-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">Editar contacto</h3>
                <p className="mt-2 text-sm text-gray-400">Actualiza lo necesario y guarda en Supabase.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-line p-2 text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Nombre</span><input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Teléfono</span><input value={editing.phone ?? ''} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-white" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Categoría</span><select value={editing.category_id} onChange={(event) => setEditing({ ...editing, category_id: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white">{categories.map((category) => <option key={category.id} value={category.id}>{category.displayLabel}</option>)}</select></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Estado</span><select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as ContactStatus })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white"><option value="active">active</option><option value="inactive">inactive</option><option value="review">review</option><option value="rejected">rejected</option></select></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-gray-300">Descripción</span><textarea value={editing.description ?? ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} rows={3} className="focus-ring rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white" /></label>
              <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-gray-300">Tags separados por coma</span><input value={editTags} onChange={(event) => setEditTags(event.target.value)} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" /></label>
            </div>
            <button type="button" disabled={actionLoading} onClick={() => void saveEdit()} className="focus-ring mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 disabled:opacity-60"><Save className="h-4 w-4" />Guardar cambios</button>
          </div>
        </div>
      ) : null}

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">Agregar contacto</h3>
                <p className="mt-2 text-sm text-gray-400">Carga rápida manual en Supabase.</p>
              </div>
              <button type="button" onClick={closeAddModal} className="rounded-full border border-line p-2 text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Nombre</span>
                <input value={form.name} placeholder="Ej: Pack de IA mensuales" onChange={(event) => setForm({ ...form, name: sanitizeTextInput(event.target.value, 160) })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white placeholder:text-gray-500 focus:border-brand-400" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Teléfono</span>
                <div className="flex items-center gap-2">
                  <span className="flex h-11 w-12 items-center justify-center rounded-full border border-line bg-ink-950/70 text-xl">{form.country_flag}</span>
                  <input value={form.phone} placeholder="Ej: +51 963 187 899" onChange={(event) => handlePhoneInput(event.target.value)} className="focus-ring h-11 flex-1 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-white placeholder:text-gray-500 focus:border-brand-400" />
                </div>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Categoría</span>
                <select value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white focus:border-brand-400">
                  <option value="">Selecciona una carpeta...</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">Descripción</span>
                <textarea
                  value={form.description}
                  rows={3}
                  maxLength={200}
                  placeholder="Breve descripción de lo que ofrece este contacto"
                  onChange={(event) => setForm({ ...form, description: event.target.value.slice(0, 200) })}
                  className="focus-ring resize-none rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white placeholder:text-gray-500 focus:border-brand-400"
                />
                <span className="text-right text-xs text-gray-500">{form.description.length}/200</span>
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={closeAddModal} className="focus-ring inline-flex h-11 items-center justify-center rounded-full border border-line bg-white/5 px-5 text-sm font-bold text-white">
                Cancelar
              </button>
              <button type="button" disabled={actionLoading || !form.name.trim() || !form.phone.trim() || !form.category_id} onClick={() => void saveNewContact()} className="focus-ring btn-primary-glow inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 disabled:cursor-not-allowed disabled:opacity-50">
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
