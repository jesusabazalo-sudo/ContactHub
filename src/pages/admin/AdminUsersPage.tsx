import { Gift, MessageCircle, RefreshCw, Search, ShieldPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { useAuth } from '../../features/auth/AuthProvider';
import { formatDate } from '../../lib/format';
import { sanitizeText } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { getAdminCategories, getAdminUsers, type AdminCategory, type AdminProfile } from '../../services/adminService';

type UserFilter = 'all' | 'active' | 'leads' | 'trial' | 'no_access';

const statusClasses: Record<AdminProfile['customerStatus'], string> = {
  nuevo: 'bg-sky-400/10 text-sky-200',
  pendiente: 'bg-amber-300/10 text-amber-100',
  activo: 'bg-brand-400/10 text-brand-300',
  vip: 'bg-fuchsia-400/10 text-fuchsia-200',
  bloqueado: 'bg-red-400/10 text-red-200',
};

export default function AdminUsersPage() {
  const { user: adminUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [giftUser, setGiftUser] = useState<AdminProfile | null>(null);
  const [giftCategoryIds, setGiftCategoryIds] = useState<string[]>([]);
  const [giftNote, setGiftNote] = useState('');
  const [isGiftSaving, setIsGiftSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    setIsLoading(true);
    setError(null);
    try {
      const [nextUsers, nextCategories] = await Promise.all([getAdminUsers(), getAdminCategories()]);
      setUsers(nextUsers);
      setCategories(nextCategories);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar usuarios.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = sanitizeText(query, 80).toLowerCase();

    return users.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.email, item.fullName, item.phone].join(' ').toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && item.activeAccessCount > 0) ||
        (filter === 'leads' && ['nuevo', 'pendiente'].includes(item.customerStatus) && item.activeAccessCount === 0) ||
        (filter === 'trial' && item.usedTrial) ||
        (filter === 'no_access' && item.activeAccessCount === 0);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, users]);

  const leads = useMemo(
    () => users.filter((item) => ['nuevo', 'pendiente'].includes(item.customerStatus) && item.activeAccessCount === 0),
    [users],
  );

  function toggleGiftCategory(categoryId: string) {
    setGiftCategoryIds((current) => (current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]));
  }

  async function saveGift() {
    if (!giftUser || !adminUser?.id || !supabase || !isSupabaseConfigured || giftCategoryIds.length === 0) return;

    setIsGiftSaving(true);
    try {
      const selectedCategories = categories.filter((category) => giftCategoryIds.includes(category.id));
      const accessRows = selectedCategories.map((category) => ({
        user_id: giftUser.id,
        category_id: category.id,
        granted_by: adminUser.id,
        status: 'active' as const,
      }));

      const { error: accessError } = await supabase.from('user_category_access').upsert(accessRows, { onConflict: 'user_id,category_id' });
      if (accessError) {
        console.error('AdminUsersPage gift access:', accessError.message);
        toast.error(accessError.message);
        return;
      }

      for (const category of selectedCategories) {
        const { error: chatError } = await supabase.from('chat_messages').insert({
          user_id: giftUser.id,
          session_id: giftUser.id,
          sender: 'admin',
          read: false,
          message: `¡Hola! Te acabo de regalar acceso a ${category.name} 🎁 Espero que te sea útil. Cualquier cosa me avisas.`,
        });
        if (chatError) console.error('AdminUsersPage gift chat:', chatError.message);
      }

      toast.success('Regalo aplicado y mensaje enviado.');
      setGiftUser(null);
      setGiftCategoryIds([]);
      setGiftNote('');
      await loadUsers();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'No se pudo guardar el regalo.';
      toast.error(message);
    } finally {
      setIsGiftSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState title="Cargando usuarios" message="Buscando perfiles, roles, accesos y pruebas desde Supabase." />;
  }

  if (error) {
    return <FriendlyErrorState message={error} onRetry={loadUsers} />;
  }

  return (
    <AdminShell>
      <AdminNotice />
      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-md">
              <span className="sr-only">Buscar usuario</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(sanitizeText(event.target.value, 80))}
                placeholder="Buscar por email, nombre o teléfono"
                className="focus-ring h-12 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-sm text-white placeholder:text-gray-500"
              />
            </label>
            <button
              type="button"
              onClick={loadUsers}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-brand-400/35"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ['all', 'Todos'],
              ['active', 'Solo activos'],
              ['leads', 'Leads'],
              ['trial', 'Con prueba usada'],
              ['no_access', 'Sin ningún acceso'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id as UserFilter)}
                className={`focus-ring rounded-full border px-4 py-2 text-sm font-bold transition ${
                  filter === id ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-line bg-white/5 text-gray-300 hover:border-brand-400/35'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr className="border-b border-line">
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Fecha registro</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Carpetas activas</th>
                  <th className="py-3 pr-4">Prueba usada</th>
                  <th className="py-3 pr-4">Último acceso</th>
                  <th className="py-3 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-b-0">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-white">{item.email ?? 'Sin email'}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.fullName || item.phone || 'Datos pendientes'}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-400">{formatDate(item.createdAt)}</td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[item.customerStatus]}`}>{item.customerStatus}</span>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">{item.activeAccessCount}</td>
                    <td className="py-4 pr-4 text-gray-300">{item.usedTrial ? 'Sí' : 'No'}</td>
                    <td className="py-4 pr-4 text-gray-400">{formatDate(item.updatedAt)}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/soporte?user=${item.id}`)}
                          className="focus-ring inline-flex items-center gap-1 rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white hover:border-brand-400/35"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Ver chat
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/accesos?email=${encodeURIComponent(item.email ?? '')}`)}
                          className="focus-ring inline-flex items-center gap-1 rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white hover:border-brand-400/35"
                        >
                          <ShieldPlus className="h-3.5 w-3.5" />
                          Dar acceso
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGiftUser(item);
                            setGiftCategoryIds([]);
                            setGiftNote('');
                          }}
                          className="focus-ring inline-flex items-center gap-1 rounded-full bg-brand-400 px-3 py-2 text-xs font-bold text-ink-950 hover:bg-white"
                        >
                          <Gift className="h-3.5 w-3.5" />
                          Dar regalo
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredUsers.length ? <p className="py-8 text-center text-sm text-gray-400">No encontré usuarios con ese filtro.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Leads</h2>
              <p className="mt-2 text-sm text-gray-400">Usuarios nuevos o pendientes sin carpetas activas.</p>
            </div>
            <span className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs font-bold text-gray-300">{leads.length} lead(s)</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {leads.map((lead) => (
              <article key={lead.id} className="rounded-lg border border-line bg-ink-950/60 p-4">
                <p className="font-semibold text-white">{lead.email ?? 'Sin email'}</p>
                <p className="mt-1 text-xs text-gray-500">{formatDate(lead.createdAt)}</p>
                <button
                  type="button"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hola ${lead.email ?? ''}, vi que te registraste en ContactHub. ¿Te puedo ayudar a encontrar lo que necesitas? 😊`)}`, '_blank', 'noopener,noreferrer')}
                  className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-xs font-bold text-white hover:border-brand-400/35"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactar
                </button>
              </article>
            ))}
            {!leads.length ? <p className="text-sm text-gray-400">No hay leads pendientes ahora.</p> : null}
          </div>
        </section>
      </div>

      {giftUser ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-ink-950 p-6">
            <h3 className="font-display text-2xl font-bold text-white">Regalar acceso</h3>
            <p className="mt-2 text-sm text-gray-400">{giftUser.email ?? 'Usuario sin email'}</p>

            <div className="mt-5 grid gap-2">
              {categories.map((category) => (
                <label key={category.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-panel p-3">
                  <input
                    type="checkbox"
                    checked={giftCategoryIds.includes(category.id)}
                    onChange={() => toggleGiftCategory(category.id)}
                    className="h-4 w-4 rounded border-line text-brand-400"
                  />
                  <span className="text-sm font-semibold text-white">{category.name}</span>
                </label>
              ))}
            </div>

            <label className="mt-5 grid gap-2">
              <span className="text-sm font-semibold text-gray-300">Nota opcional</span>
              <textarea
                value={giftNote}
                onChange={(event) => setGiftNote(sanitizeText(event.target.value, 500))}
                rows={3}
                className="focus-ring resize-none rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-white"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setGiftUser(null)} className="focus-ring rounded-full border border-line bg-white/5 px-5 py-3 text-sm font-bold text-white">
                Cancelar
              </button>
              <button
                type="button"
                disabled={!giftCategoryIds.length || isGiftSaving}
                onClick={() => void saveGift()}
                className="focus-ring rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGiftSaving ? 'Guardando...' : 'Guardar regalo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
