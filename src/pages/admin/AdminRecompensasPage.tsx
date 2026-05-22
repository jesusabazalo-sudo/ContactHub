import { Gift, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { formatCategoryOptionLabel } from '../../data/officialCategories';
import { useAuth } from '../../features/auth/AuthProvider';
import { formatDate } from '../../lib/format';
import { sanitizeText } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ProfileRow = { id: string; email: string | null; full_name: string | null };
type CategoryRow = { id: string; name: string; icon?: string | null; sort_order?: number | null };
type AccessRow = { user_id: string; category_id: string; status: string };
type RewardRow = { id: string; user_id: string; quantity: number; reason: string | null; created_at: string };

export default function AdminRecompensasPage() {
  const { user: adminUser } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [accesses, setAccesses] = useState<AccessRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase || !isSupabaseConfigured) {
        setError('Falta conectar Supabase.');
        setProfiles([]);
        setCategories([]);
        setAccesses([]);
        setRewards([]);
        return;
      }

      const [profilesRes, categoriesRes, accessesRes, rewardsRes] = await Promise.all([
        supabase.from('profiles').select('id,email,full_name').order('email', { ascending: true }),
        supabase.from('categories').select('id,name,icon,sort_order').order('sort_order', { ascending: true }).order('name', { ascending: true }),
        supabase.from('user_category_access').select('user_id,category_id,status').eq('status', 'active'),
        supabase.from('customer_rewards').select('id,user_id,quantity,reason,created_at').eq('reward_type', 'folder_gift').order('created_at', { ascending: false }),
      ]);

      if (profilesRes.error) {
        console.error('AdminRecompensas profiles:', profilesRes.error.message);
        setError(profilesRes.error.message);
        return;
      }
      if (categoriesRes.error) console.error('AdminRecompensas categories:', categoriesRes.error.message);
      if (accessesRes.error) console.error('AdminRecompensas accesses:', accessesRes.error.message);
      if (rewardsRes.error) console.error('AdminRecompensas rewards:', rewardsRes.error.message);

      setProfiles(profilesRes.data ?? []);
      setCategories(categoriesRes.data ?? []);
      setAccesses(accessesRes.data ?? []);
      setRewards(rewardsRes.data ?? []);
    } catch (loadError) {
      console.error('AdminRecompensas load:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar recompensas.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const selectedUser = selectedUserId ? profileById.get(selectedUserId) ?? null : null;
  const currentAccesses = accesses.filter((access) => access.user_id === selectedUserId);
  const currentCategoryIds = new Set(currentAccesses.map((access) => access.category_id));

  const filteredProfiles = useMemo(() => {
    const normalized = sanitizeText(query, 80).toLowerCase();
    if (!normalized) return profiles;
    return profiles.filter((profile) => [profile.email, profile.full_name].join(' ').toLowerCase().includes(normalized));
  }, [profiles, query]);

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) => (current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]));
  }

  async function sendGift() {
    if (!supabase || !isSupabaseConfigured || !selectedUser || !adminUser?.id || !selectedCategoryIds.length) return;
    setIsSaving(true);
    try {
      const selectedCategories = categories.filter((category) => selectedCategoryIds.includes(category.id));
      const rows = selectedCategories.map((category) => ({
        user_id: selectedUser.id,
        category_id: category.id,
        granted_by: adminUser.id,
        status: 'active' as const,
      }));

      const { error: accessError } = await supabase.from('user_category_access').upsert(rows, { onConflict: 'user_id,category_id' });
      if (accessError) {
        console.error('AdminRecompensas gift access:', accessError.message);
        toast.error(accessError.message);
        return;
      }

      const folderNames = selectedCategories.map((category) => category.name).join(', ');
      const message = `¡Hola! Te acabo de regalar acceso a ${folderNames} 🎁\nEspero que te sea muy útil. Cualquier cosa me avisas.`;
      const { error: chatError } = await supabase.from('chat_messages').insert({
        user_id: selectedUser.id,
        session_id: selectedUser.id,
        sender: 'admin',
        read: false,
        message,
      });
      if (chatError) console.error('AdminRecompensas gift chat:', chatError.message);

      const cleanNote = sanitizeText(note, 500);
      const { error: rewardError } = await supabase.from('customer_rewards').insert({
        user_id: selectedUser.id,
        reward_type: 'folder_gift',
        quantity: selectedCategories.length,
        reason: `${cleanNote || 'Regalo de carpetas'}\nCarpetas: ${folderNames}`,
        granted_by: adminUser.id,
      });
      if (rewardError) console.error('AdminRecompensas reward:', rewardError.message);

      toast.success(`✅ Regalo enviado a ${selectedUser.email ?? 'usuario'}`);
      setSelectedCategoryIds([]);
      setNote('');
      await loadData();
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState title="Cargando recompensas" message="Leyendo usuarios, carpetas e historial." />;
  if (error) return <FriendlyErrorState message={error} onRetry={loadData} />;

  return (
    <AdminShell>
      <AdminNotice />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Dar regalo de carpetas</h2>
              <p className="mt-2 text-sm text-gray-400">Selecciona un usuario y activa carpetas como regalo.</p>
            </div>
            <button type="button" onClick={loadData} className="focus-ring rounded-full border border-line p-2 text-white">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <label className="relative mt-5 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(sanitizeText(event.target.value, 80))}
              placeholder="Buscar usuario por email o nombre"
              className="focus-ring h-11 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-sm text-white"
            />
          </label>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-xl border border-line">
            {filteredProfiles.map((profile) => (
              <label key={profile.id} className="flex cursor-pointer items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <input
                  type="checkbox"
                  checked={selectedUserId === profile.id}
                  onChange={() => {
                    setSelectedUserId(selectedUserId === profile.id ? null : profile.id);
                    setSelectedCategoryIds([]);
                  }}
                />
                <span>
                  <span className="block font-semibold text-white">{profile.email ?? 'Sin email'}</span>
                  <span className="text-xs text-gray-500">{profile.full_name ?? 'Sin nombre'}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          {selectedUser ? (
            <>
              <p className="text-sm font-semibold text-brand-400">Usuario seleccionado</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">{selectedUser.email ?? selectedUser.id}</h3>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase text-gray-500">Carpetas actuales</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentAccesses.map((access) => (
                    <span key={access.category_id} className="rounded-full bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-300">
                      {categoryById.get(access.category_id)?.name ?? access.category_id}
                    </span>
                  ))}
                  {!currentAccesses.length ? <span className="text-sm text-gray-500">Sin carpetas activas.</span> : null}
                </div>
              </div>

              <div className="mt-5 grid max-h-[360px] gap-2 overflow-auto sm:grid-cols-2">
                {categories.map((category, index) => (
                  <label key={category.id} className="flex items-start gap-3 rounded-xl border border-line bg-white/5 p-3 text-sm text-white">
                    <input type="checkbox" checked={selectedCategoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                    <span>
                      {formatCategoryOptionLabel(category, index)}
                      {currentCategoryIds.has(category.id) ? <span className="ml-2 text-xs text-brand-400">(ya tiene)</span> : null}
                    </span>
                  </label>
                ))}
              </div>

              <label className="mt-5 grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Motivo del regalo</span>
                <textarea value={note} onChange={(event) => setNote(sanitizeText(event.target.value, 500))} rows={3} className="focus-ring rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white" />
              </label>

              <button
                type="button"
                disabled={isSaving || !selectedCategoryIds.length}
                onClick={() => void sendGift()}
                className="focus-ring btn-primary-glow mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 disabled:opacity-50"
              >
                <Gift className="h-4 w-4" />
                {isSaving ? 'Enviando...' : '🎁 Dar acceso de regalo'}
              </button>
            </>
          ) : (
            <div className="grid min-h-[360px] place-items-center text-center text-gray-400">Selecciona un usuario para preparar el regalo.</div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
        <h2 className="font-display text-2xl font-bold text-white">Historial de regalos</h2>
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ink-950/70 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Carpetas regaladas</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward) => {
                const [reason = '', folders = ''] = (reward.reason ?? '').split('\nCarpetas: ');
                return (
                  <tr key={reward.id} className="border-t border-line">
                    <td className="px-4 py-3 text-white">{profileById.get(reward.user_id)?.email ?? reward.user_id}</td>
                    <td className="px-4 py-3 text-gray-300">{folders || `${reward.quantity} carpeta(s)`}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(reward.created_at)}</td>
                    <td className="px-4 py-3 text-gray-300">{reason || 'Regalo de carpetas'}</td>
                  </tr>
                );
              })}
              {!rewards.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">Todavía no hay regalos registrados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
