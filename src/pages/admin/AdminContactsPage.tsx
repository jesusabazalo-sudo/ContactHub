import { Edit3, ExternalLink, Plus, RefreshCw, Save, Search, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { applyOfficialCategoryDisplay, formatCategoryOptionLabel, sortByOfficialOrder } from '../../data/officialCategories';
import { formatDate } from '../../lib/format';
import { sanitizePhone, sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { deleteContact, deleteContactsBulk, getContacts, getTotalContactsCount, updateContact } from '../../services/adminContactsService';
import { formatPhone, maskPhone } from '../../utils/phone';

type CategoryOption = { id: string; name: string; slug: string; icon?: string | null; sort_order?: number | null };
type ContactStatus = 'active' | 'inactive' | 'review' | 'rejected';
type ContactRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  phone: string;
  phone_masked: string | null;
  tags: string[] | null;
  status: ContactStatus;
  risk_level: 'safe' | 'review' | 'prohibited';
  created_at: string;
};

const pageSize = 50;

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

async function loadCategoriesSafe() {
  if (!supabase || !isSupabaseConfigured) return [];
  const sorted = await supabase.from('categories').select('id,name,slug,icon,sort_order').order('sort_order', { ascending: true }).order('name', { ascending: true });
  const result = sorted.error?.message.toLowerCase().includes('sort_order')
    ? await supabase.from('categories').select('id,name,slug,icon').order('name', { ascending: true })
    : sorted;
  if (result.error) {
    console.error('AdminContactsPage categories:', result.error.message);
    return [];
  }
  return sortByOfficialOrder((result.data ?? []).map((category) => applyOfficialCategoryDisplay(category)));
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
  const [newContact, setNewContact] = useState({ name: '', phone: '', category_id: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [categoryData, data, total] = await Promise.all([
          loadCategoriesSafe(),
          getContacts({ search, categoryId: selectedCategory, status: selectedStatus, page: currentPage }),
          getTotalContactsCount({ search, categoryId: selectedCategory, status: selectedStatus }),
        ]);
        setCategories(categoryData);
        setContacts(data as ContactRow[]);
        setTotalCount(total);
        setSelectedIds([]);
      } catch (err) {
        console.error('AdminContactsPage load:', err);
        setError('Error al cargar contactos. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [search, selectedCategory, selectedStatus, currentPage]);

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

  async function reloadCurrentPage() {
    const [data, total] = await Promise.all([
      getContacts({ search, categoryId: selectedCategory, status: selectedStatus, page: currentPage }),
      getTotalContactsCount({ search, categoryId: selectedCategory, status: selectedStatus }),
    ]);
    setContacts(data as ContactRow[]);
    setTotalCount(total);
    setSelectedIds([]);
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
    const name = sanitizeText(newContact.name, 160);
    const formattedPhone = formatPhone(newContact.phone);
    const phone = sanitizePhone(formattedPhone);
    const categoryId = newContact.category_id;

    if (!name || !phone || !categoryId) {
      toast.error('Completa nombre, teléfono y categoría.');
      return;
    }

    setActionLoading(true);
    try {
      const { data, error: insertError } = await supabase
        .from('contacts')
        .insert({
          name,
          phone,
          phone_masked: maskPhone(phone),
          category_id: categoryId,
          description: '',
          country_flag: '🇵🇪',
          country_code: 'PE',
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
      setIsAddOpen(false);
      setNewContact({ name: '', phone: '', category_id: '' });
      toast.success('Contacto agregado.');
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
  if (error) return <FriendlyErrorState message={error} onRetry={() => window.location.reload()} />;

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

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px_190px]">
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
            value={selectedCategory}
            onChange={(event) => {
              setCurrentPage(0);
              setSelectedCategory(event.target.value);
            }}
            className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((category, index) => (
              <option key={category.id} value={category.id}>
                {formatCategoryOptionLabel(category, index)}
              </option>
            ))}
          </select>
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

        <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {pageStart}-{pageEnd} de {totalCount} contactos
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
                    <p className="font-semibold text-white">{contact.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">{contact.description}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-300">{formatPhone(contact.phone)}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {categoryById.get(contact.category_id) ? formatCategoryOptionLabel(categoryById.get(contact.category_id)!, 0) : contact.category_id}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{contact.status ?? 'sin estado'}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(contact.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={actionLoading} onClick={() => openEdit(contact)} className="focus-ring inline-flex items-center gap-1 rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                        <Edit3 className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button type="button" disabled={actionLoading || contact.status === 'inactive'} onClick={() => void deactivateRow(contact)} className="focus-ring inline-flex items-center gap-1 rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                        <XCircle className="h-3.5 w-3.5" /> Desactivar
                      </button>
                      <button type="button" disabled={actionLoading} onClick={() => void deleteRow(contact)} className="focus-ring inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-100 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!contacts.length ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No encontramos resultados con ese filtro.</td></tr>
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
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Teléfono</span><input value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-white" /></label>
              <label className="grid gap-2"><span className="text-sm font-semibold text-gray-300">Categoría</span><select value={editing.category_id} onChange={(event) => setEditing({ ...editing, category_id: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white">{categories.map((category, index) => <option key={category.id} value={category.id}>{formatCategoryOptionLabel(category, index)}</option>)}</select></label>
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
              <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-full border border-line p-2 text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Nombre</span>
                <input value={newContact.name} onChange={(event) => setNewContact({ ...newContact, name: sanitizeTextInput(event.target.value, 160) })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Teléfono</span>
                <input value={newContact.phone} onChange={(event) => setNewContact({ ...newContact, phone: sanitizePhone(event.target.value) })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-white" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Categoría</span>
                <select value={newContact.category_id} onChange={(event) => setNewContact({ ...newContact, category_id: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white">
                  <option value="">Selecciona categoría</option>
                  {categories.map((category, index) => <option key={category.id} value={category.id}>{formatCategoryOptionLabel(category, index)}</option>)}
                </select>
              </label>
            </div>
            <button type="button" disabled={actionLoading} onClick={() => void saveNewContact()} className="focus-ring btn-primary-glow mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 disabled:opacity-60">
              <Save className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
