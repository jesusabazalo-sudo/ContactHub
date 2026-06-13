import { CheckCircle2, Gift, RefreshCw, Search, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { normalizeOfficialCategoryRows, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { useAuth } from '../../features/auth/AuthProvider';
import { formatDate } from '../../lib/format';
import { sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { grantCategoryAccess } from '../../services/accessService';

type ProfileRow = { id: string; email: string | null; full_name: string | null };
type CategoryRow = {
  id: string;
  name: string;
  icon?: string | null;
  slug?: string | null;
  sort_order?: number | null;
  short_description?: string | null;
} & OfficialCategoryDisplay;
type AccessRow = { user_id: string; category_id: string; status: string };
type RewardRow = { id: string; user_id: string; quantity: number; reason: string | null; created_at: string };
type MissionRequestRow = {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  screenshot_url: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function rewardsClient() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase as unknown as { from: (table: string) => any };
}

function statusBadgeClass(status: MissionRequestRow['status']) {
  if (status === 'approved') return 'border-brand-400/25 bg-brand-400/10 text-brand-100';
  if (status === 'rejected') return 'border-red-400/25 bg-red-400/10 text-red-100';
  return 'border-amber-300/25 bg-amber-300/10 text-amber-100';
}

async function loadRewardCategories(client: { from: (table: string) => any }) {
  let result = await client
    .from('categories')
    .select('id,name,icon,slug,sort_order,short_description')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (result.error) {
    console.error('AdminRecompensas categories:', result.error.message);
    result = await client
      .from('categories')
      .select('id,name,icon,slug,short_description')
      .eq('is_active', true)
      .order('name', { ascending: true });
  }

  if (result.error) {
    console.error('AdminRecompensas categories fallback:', result.error.message);
    return [];
  }

  return normalizeOfficialCategoryRows((result.data ?? []) as CategoryRow[]) as CategoryRow[];
}

export default function AdminRecompensasPage() {
  const { user: adminUser } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [accesses, setAccesses] = useState<AccessRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [missionRequests, setMissionRequests] = useState<MissionRequestRow[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const client = rewardsClient();
      if (!client) {
        setError('Falta conectar Supabase.');
        setProfiles([]);
        setCategories([]);
        setAccesses([]);
        setRewards([]);
        setMissionRequests([]);
        return;
      }

      const [profilesRes, categoriesRes, accessesRes, rewardsRes, requestsRes] = await Promise.all([
        client.from('profiles').select('id,email,full_name').order('email', { ascending: true }),
        loadRewardCategories(client),
        client.from('user_category_access').select('user_id,category_id,status').eq('status', 'active'),
        client.from('customer_rewards').select('id,user_id,quantity,reason,created_at').eq('reward_type', 'folder_gift').order('created_at', { ascending: false }),
        client.from('reward_requests').select('id,user_id,status,admin_note,screenshot_url,created_at,reviewed_at').order('created_at', { ascending: false }),
      ]);

      if (profilesRes.error) {
        console.error('AdminRecompensas profiles:', profilesRes.error.message);
        setError(profilesRes.error.message);
        return;
      }
      if (accessesRes.error) console.error('AdminRecompensas accesses:', accessesRes.error.message);
      if (rewardsRes.error) console.error('AdminRecompensas rewards:', rewardsRes.error.message);
      if (requestsRes.error) console.error('AdminRecompensas mission requests:', requestsRes.error.message);

      setProfiles(profilesRes.data ?? []);
      console.log('Categories loaded:', categoriesRes.length, categoriesRes[0]);
      setCategories(categoriesRes);
      setAccesses(accessesRes.data ?? []);
      setRewards(rewardsRes.data ?? []);
      setMissionRequests(requestsRes.data ?? []);
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
  const allSelected = categories.length > 0 && selectedCategoryIds.length === categories.length;

  const filteredProfiles = useMemo(() => {
    const normalized = sanitizeText(query, 80).toLowerCase();
    if (!normalized) return profiles;
    return profiles.filter((profile) => [profile.email, profile.full_name].join(' ').toLowerCase().includes(normalized));
  }, [profiles, query]);

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) => (current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]));
  }

  function toggleAllCategories() {
    setSelectedCategoryIds(allSelected ? [] : categories.map((category) => category.id));
  }

  function prepareGiftFromMission(request: MissionRequestRow) {
    setSelectedUserId(request.user_id);
    setSelectedCategoryIds([]);
    setNote(`Recompensa por misión. ${request.admin_note ?? ''}`.trim());
    toast.info('Usuario cargado. Selecciona las carpetas o contactos que vas a regalar.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function updateMissionStatus(request: MissionRequestRow, status: MissionRequestRow['status']) {
    const client = rewardsClient();
    if (!client) return;
    setUpdatingRequestId(request.id);
    try {
      const { error: updateError } = await client
        .from('reward_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          admin_note: request.admin_note,
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('AdminRecompensas request update:', updateError.message);
        toast.error(updateError.message);
        return;
      }

      toast.success(status === 'approved' ? 'Misión aprobada.' : 'Misión rechazada.');
      await loadData();
    } finally {
      setUpdatingRequestId(null);
    }
  }

  async function sendGift() {
    const client = rewardsClient();
    if (!client || !selectedUser || !adminUser?.id || !selectedCategoryIds.length) return;
    setIsSaving(true);
    try {
      const selectedCategories = categories.filter((category) => selectedCategoryIds.includes(category.id));
      const accessResult = await grantCategoryAccess({
        targetUserId: selectedUser.id,
        targetUserEmail: selectedUser.email,
        categoryIds: selectedCategoryIds,
        grantedBy: adminUser.id,
        accessType: 'gift',
        source: 'admin_rewards',
        note: sanitizeText(note, 500) || 'Regalo de carpetas desde Admin Recompensas.',
      });
      if (!accessResult.ok) {
        toast.error(accessResult.error ?? 'No se pudo activar el regalo.');
        return;
      }

      const folderNames = selectedCategories.map((category) => category.displayLabel).join(', ');
      const message = `¡Hola! Te acabo de regalar acceso a ${folderNames} 🎁\nEspero que te sea muy útil. Cualquier cosa me avisas.`;
      const { error: chatError } = await client.from('chat_messages').insert({
        user_id: selectedUser.id,
        session_id: selectedUser.id,
        sender: 'admin',
        read: false,
        message,
      });
      if (chatError) console.error('AdminRecompensas gift chat:', chatError.message);

      const cleanNote = sanitizeText(note, 500);
      const { error: rewardError } = await client.from('customer_rewards').insert({
        user_id: selectedUser.id,
        reward_type: 'folder_gift',
        quantity: selectedCategories.length,
        reason: `${cleanNote || 'Regalo de carpetas'}\nCarpetas: ${folderNames}`,
        granted_by: adminUser.id,
      });
      if (rewardError) console.error('AdminRecompensas reward:', rewardError.message);

      setSelectedCategoryIds([]);
      setNote('');
      await loadData();
      toast.success(`✅ Regalo confirmado para ${selectedUser.email ?? 'usuario'}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState title="Cargando recompensas" message="Leyendo usuarios, misiones e historial." />;
  if (error) return <FriendlyErrorState message={error} onRetry={loadData} />;

  return (
    <AdminShell>
      <AdminNotice />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="dopamine-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Dar regalo de carpetas</h2>
              <p className="mt-2 text-sm text-gray-400">Selecciona un usuario y activa carpetas como regalo o recompensa manual.</p>
            </div>
            <button type="button" onClick={loadData} className="focus-ring rounded-full border border-line p-2 text-white">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <label className="relative mt-5 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(sanitizeTextInput(event.target.value, 80))}
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

        <section className="dopamine-card rounded-2xl p-5">
          {selectedUser ? (
            <>
              <p className="text-sm font-semibold text-brand-400">Usuario seleccionado</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">{selectedUser.email ?? selectedUser.id}</h3>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase text-gray-500">Carpetas actuales</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentAccesses.map((access) => (
                    <span key={access.category_id} className="rounded-full bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-300">
                      {categoryById.get(access.category_id)?.displayLabel ?? access.category_id}
                    </span>
                  ))}
                  {!currentAccesses.length ? <span className="text-sm text-gray-500">Sin carpetas activas.</span> : null}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-gray-300">{selectedCategoryIds.length} carpetas seleccionadas</p>
                <button
                  type="button"
                  onClick={toggleAllCategories}
                  disabled={!categories.length}
                  className={`focus-ring rounded-lg px-4 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    allSelected ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-brand-400 text-ink-950 hover:bg-white'
                  }`}
                >
                  {allSelected ? '☐ Deseleccionar todas' : '☑ Seleccionar todas'}
                </button>
              </div>

              <div className="mt-3 grid max-h-[360px] gap-2 overflow-auto sm:grid-cols-2">
                {categories.map((category) => {
                  const checked = selectedCategoryIds.includes(category.id);
                  const alreadyActive = currentCategoryIds.has(category.id);
                  return (
                    <div
                      key={category.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleCategory(category.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleCategory(category.id);
                        }
                      }}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition hover:border-brand-400/45 ${
                        checked ? 'border-brand-400/70 bg-brand-400/15 shadow-[0_0_24px_rgba(34,197,94,0.12)]' : 'border-line bg-white/5 hover:border-brand-400/35'
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="pointer-events-none mt-1" />
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-brand-400/20 bg-brand-400/10 text-lg">
                        {category.displayIcon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-0.5 text-xs font-bold text-brand-200">
                            {String(category.displayOrder).padStart(2, '0')}
                          </span>
                          <span className="truncate font-semibold text-white">{category.displayTitle}</span>
                        </span>
                        <span className="mt-1 block text-xs text-gray-400">{category.displaySubtitle}</span>
                        {alreadyActive ? <span className="mt-1 inline-flex text-xs font-semibold text-brand-400">Ya tiene acceso</span> : null}
                      </span>
                    </div>
                  );
                })}
              </div>

              <label className="mt-5 grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Motivo del regalo</span>
                <textarea value={note} onChange={(event) => setNote(sanitizeTextInput(event.target.value, 500))} rows={3} className="focus-ring rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white" />
              </label>

              <button
                type="button"
                disabled={isSaving || !selectedUser || !selectedCategoryIds.length}
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

      <section className="dopamine-card mt-6 rounded-2xl p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Misiones en revisión</h2>
            <p className="mt-2 text-sm text-gray-400">Solicitudes enviadas por usuarios que quieren ganar contactos extra apoyando ContactHub.</p>
          </div>
          <button type="button" onClick={loadData} className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-ink-950/70 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Mensaje / evidencia</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {missionRequests.map((request) => (
                <tr key={request.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 text-white">{profileById.get(request.user_id)?.email ?? request.user_id}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(request.status)}`}>{request.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(request.created_at)}</td>
                  <td className="px-4 py-3 text-gray-300">
                    <p>{request.admin_note ?? 'Solicitud sin nota.'}</p>
                    {request.screenshot_url ? (
                      <a href={request.screenshot_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-brand-400 hover:text-white">
                        Ver evidencia
                      </a>
                    ) : (
                      <span className="mt-2 inline-flex text-xs text-gray-500">Evidencia por chat o pendiente.</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={updatingRequestId === request.id}
                        onClick={() => void updateMissionStatus(request, 'approved')}
                        className="focus-ring inline-flex items-center gap-1 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-2 text-xs font-bold text-brand-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={updatingRequestId === request.id}
                        onClick={() => void updateMissionStatus(request, 'rejected')}
                        className="focus-ring inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-100"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => prepareGiftFromMission(request)}
                        className="focus-ring inline-flex items-center gap-1 rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white"
                      >
                        <Gift className="h-3.5 w-3.5" />
                        Otorgar recompensa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!missionRequests.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">Todavía no hay misiones pendientes.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dopamine-card mt-6 rounded-2xl p-5">
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
