import { Edit3, RefreshCw, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type AdminCategoryRow = {
  id: string;
  sort_order: number | null;
  icon: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_top: boolean;
  contactsCount: number;
};

type CategoryUpdate = Partial<Omit<AdminCategoryRow, 'id' | 'contactsCount'>>;

function ensureClient() {
  if (!supabase || !isSupabaseConfigured) {
    return null;
  }
  return supabase;
}

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setIsLoading(true);
    setError(null);
    try {
      const client = ensureClient();
      if (!client) {
        setCategories([]);
        setError('Falta conectar Supabase. Crea un archivo .env.local en la raíz del proyecto con las variables necesarias.');
        return;
      }
      const categoriesWithSort = await client
        .from('categories')
        .select('id,sort_order,icon,name,slug,description,short_description,tags,is_active,is_featured,is_new,is_top')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      const categoriesQuery = categoriesWithSort.error?.message.toLowerCase().includes('sort_order')
        ? await client.from('categories').select('id,icon,name,slug,description,short_description,tags,is_active,is_featured,is_new,is_top').order('name', { ascending: true })
        : categoriesWithSort;

      const [categoriesResult, contactsResult] = await Promise.all([
        Promise.resolve(categoriesQuery),
        client.from('contacts').select('id,category_id').or('status.eq.active,status.is.null').limit(10000),
      ]);
      if (categoriesResult.error) {
        console.error('AdminCategoriasPage categories:', categoriesResult.error.message);
        setCategories([]);
        setError(categoriesResult.error.message);
        return;
      }
      if (contactsResult.error) {
        console.error('AdminCategoriasPage contacts:', contactsResult.error.message);
        setError(contactsResult.error.message);
      }

      const counts = new Map<string, number>();
      for (const contact of contactsResult.data ?? []) {
        counts.set(contact.category_id, (counts.get(contact.category_id) ?? 0) + 1);
      }

      setCategories(
        ((categoriesResult.data ?? []) as Array<Omit<AdminCategoryRow, 'contactsCount'> & { sort_order?: number | null }>).map((category) => ({
          ...category,
          sort_order: category.sort_order ?? null,
          contactsCount: counts.get(category.id) ?? 0,
        })),
      );
    } catch (loadError) {
      console.error('AdminCategoriasPage load:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar categorías.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function updateCategory(id: string, values: CategoryUpdate) {
    const client = ensureClient();
    if (!client) {
      console.error('updateCategory: Supabase no está configurado');
      return false;
    }
    const { error: updateError } = await client.from('categories').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id);
    if (updateError) {
      console.error('updateCategory:', updateError.message);
      return false;
    }
    setCategories((current) => current.map((category) => (category.id === id ? { ...category, ...values } : category)));
    return true;
  }

  async function toggleValue(category: AdminCategoryRow, key: 'is_active' | 'is_featured' | 'is_new' | 'is_top') {
    try {
      const ok = await updateCategory(category.id, { [key]: !category[key] });
      if (!ok) {
        toast.error('No se pudo actualizar.');
        return;
      }
      toast.success('Categoría actualizada.');
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar.');
    }
  }

  async function saveSortOrder(category: AdminCategoryRow, value: string) {
    const sortOrder = value.trim() ? Number(value) : null;
    if (sortOrder !== null && Number.isNaN(sortOrder)) return;
    try {
      const ok = await updateCategory(category.id, { sort_order: sortOrder });
      if (!ok) {
        toast.error('No se pudo guardar el orden.');
        return;
      }
      toast.success('Orden actualizado.');
    } catch (sortError) {
      toast.error(sortError instanceof Error ? sortError.message : 'No se pudo guardar el orden.');
    }
  }

  async function saveModal() {
    if (!editing) return;
    setIsSaving(true);
    try {
      const payload = {
        sort_order: editing.sort_order,
        icon: editing.icon,
        name: editing.name,
        slug: editing.slug,
        description: editing.description,
        short_description: editing.short_description,
        tags: editing.tags,
        is_active: editing.is_active,
        is_featured: editing.is_featured,
        is_new: editing.is_new,
        is_top: editing.is_top,
      };
      const ok = await updateCategory(editing.id, payload);
      if (!ok) {
        toast.error('No se pudo guardar la categoría.');
        return;
      }
      setEditing(null);
      toast.success('Categoría guardada.');
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'No se pudo guardar la categoría.');
    } finally {
      setIsSaving(false);
    }
  }

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.name.localeCompare(b.name)),
    [categories],
  );

  if (isLoading) return <LoadingState title="Cargando categorías" message="Leyendo las 25 carpetas desde Supabase." />;
  if (error) return <FriendlyErrorState message={error} onRetry={loadCategories} />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Categorías</h2>
            <p className="mt-2 text-sm text-gray-400">Orden, visibilidad y textos del catálogo.</p>
          </div>
          <button type="button" onClick={loadCategories} className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr className="border-b border-line">
                <th className="py-3 pr-3">Orden</th>
                <th className="py-3 pr-3">Icono</th>
                <th className="py-3 pr-3">Nombre</th>
                <th className="py-3 pr-3">Slug</th>
                <th className="py-3 pr-3">Descripción corta</th>
                <th className="py-3 pr-3">Contactos activos</th>
                <th className="py-3 pr-3">Activa</th>
                <th className="py-3 pr-3">Featured</th>
                <th className="py-3 pr-3">New</th>
                <th className="py-3 pr-3">Top</th>
                <th className="py-3 pr-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((category) => (
                <tr key={category.id} className="border-b border-line last:border-b-0">
                  <td className="py-3 pr-3">
                    <input
                      defaultValue={category.sort_order ?? ''}
                      onBlur={(event) => void saveSortOrder(category, event.target.value)}
                      className="focus-ring h-9 w-16 rounded-lg border border-line bg-ink-950/70 px-2 text-white"
                      type="number"
                    />
                  </td>
                  <td className="py-3 pr-3 text-gray-300">{category.icon}</td>
                  <td className="py-3 pr-3 font-semibold text-white">{category.name}</td>
                  <td className="py-3 pr-3 text-gray-400">{category.slug}</td>
                  <td className="max-w-xs py-3 pr-3 text-gray-400">{category.short_description}</td>
                  <td className="py-3 pr-3 text-brand-400">{category.contactsCount}</td>
                  {(['is_active', 'is_featured', 'is_new', 'is_top'] as const).map((key) => (
                    <td key={key} className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => void toggleValue(category, key)}
                        className={`h-6 w-11 rounded-full p-1 transition ${category[key] ? 'bg-brand-400' : 'bg-gray-700'}`}
                        aria-label={key}
                      >
                        <span className={`block h-4 w-4 rounded-full bg-white transition ${category[key] ? 'translate-x-5' : ''}`} />
                      </button>
                    </td>
                  ))}
                  <td className="py-3 pr-3">
                    <button type="button" onClick={() => setEditing(category)} className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white">
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-ink-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-2xl font-bold text-white">Editar categoría</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-line p-2 text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ['name', 'Nombre'],
                ['slug', 'Slug'],
                ['icon', 'Icono'],
                ['short_description', 'Descripción corta'],
              ].map(([key, label]) => (
                <label key={key} className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-300">{label}</span>
                  <input value={String(editing[key as keyof AdminCategoryRow] ?? '')} onChange={(event) => setEditing({ ...editing, [key]: event.target.value })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" />
                </label>
              ))}
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Descripción</span>
                <textarea value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} rows={4} className="focus-ring rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Tags separados por coma</span>
                <input value={editing.tags.join(', ')} onChange={(event) => setEditing({ ...editing, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" />
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                {(['is_active', 'is_featured', 'is_new', 'is_top'] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={editing[key]} onChange={(event) => setEditing({ ...editing, [key]: event.target.checked })} />
                    {key}
                  </label>
                ))}
              </div>
              <button type="button" disabled={isSaving} onClick={() => void saveModal()} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950">
                <Save className="h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
