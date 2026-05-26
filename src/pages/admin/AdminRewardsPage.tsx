import { Gift, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import LoadingState from '../../components/system/LoadingState';
import { normalizeOfficialCategoryRows, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type RewardRow = {
  id: string;
  user_id: string;
  review_id: string | null;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  bonus_contact_ids: string[];
  admin_note: string | null;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  icon?: string | null;
  slug?: string | null;
  sort_order?: number | null;
  short_description?: string | null;
} & OfficialCategoryDisplay;
type ContactRow = { id: string; name: string; category_id: string };

function clientAny() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase as unknown as { from: (table: string) => any };
}

async function loadRewardCategories(client: { from: (table: string) => any }) {
  let result = await client
    .from('categories')
    .select('id,name,icon,slug,sort_order,short_description')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (result.error) {
    console.error('AdminRewardsPage categories:', result.error.message);
    result = await client
      .from('categories')
      .select('id,name,icon,slug,short_description')
      .eq('is_active', true)
      .order('name', { ascending: true });
  }

  if (result.error) {
    console.error('AdminRewardsPage categories fallback:', result.error.message);
    return [];
  }

  return normalizeOfficialCategoryRows((result.data ?? []) as CategoryRow[]) as CategoryRow[];
}

export default function AdminRewardsPage() {
  const [requests, setRequests] = useState<RewardRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const client = clientAny();
      if (!client) {
        setRequests([]);
        setCategories([]);
        setContacts([]);
        setError('Falta conectar Supabase. Crea un archivo .env.local en la raíz del proyecto con las variables necesarias.');
        return;
      }
      const [requestsResult, categoriesResult, contactsResult] = await Promise.all([
        client.from('reward_requests').select('id,user_id,review_id,screenshot_url,status,bonus_contact_ids,admin_note,created_at').order('created_at', { ascending: false }),
        loadRewardCategories(client),
        client.from('contacts').select('id,name,category_id').or('status.eq.active,status.is.null').order('created_at', { ascending: false }).limit(500),
      ]);

      if (requestsResult.error) {
        console.error('AdminRewardsPage requests:', requestsResult.error.message);
        setRequests([]);
        setError(requestsResult.error.message);
        return;
      }
      if (contactsResult.error) {
        console.error('AdminRewardsPage contacts:', contactsResult.error.message);
        setContacts([]);
      }

      setRequests(requestsResult.data ?? []);
      console.log('Categories loaded:', categoriesResult.length, categoriesResult[0]);
      setCategories(categoriesResult);
      setContacts(contactsResult.data ?? []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar recompensas.';
      console.error('Error cargando recompensas:', loadError);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const visibleContacts = useMemo(() => (categoryId === 'all' ? contacts : contacts.filter((contact) => contact.category_id === categoryId)), [categoryId, contacts]);
  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? null;

  function toggleContact(id: string) {
    setSelectedContactIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current));
  }

  async function approveRequest() {
    if (!selectedRequest || selectedContactIds.length !== 3) {
      toast.error('Selecciona una solicitud y exactamente 3 contactos.');
      return;
    }

    try {
      const client = clientAny();
      if (!client) {
        toast.error('Falta conectar Supabase.');
        return;
      }
      const { error: updateError } = await client
        .from('reward_requests')
        .update({ status: 'approved', bonus_contact_ids: selectedContactIds, reviewed_at: new Date().toISOString() })
        .eq('id', selectedRequest.id);
      if (updateError) {
        console.error('approveRequest:', updateError.message);
        toast.error(updateError.message);
        return;
      }
      toast.success('Recompensa aprobada.');
      setSelectedRequestId(null);
      setSelectedContactIds([]);
      await loadData();
    } catch (approveError) {
      console.error('Error aprobando recompensa:', approveError);
      toast.error(approveError instanceof Error ? approveError.message : 'No se pudo aprobar.');
    }
  }

  async function rejectRequest(request: RewardRow) {
    try {
      const client = clientAny();
      if (!client) {
        toast.error('Falta conectar Supabase.');
        return;
      }
      const { error: updateError } = await client.from('reward_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', request.id);
      if (updateError) {
        console.error('rejectRequest:', updateError.message);
        toast.error(updateError.message);
        return;
      }
      toast.success('Recompensa rechazada.');
      await loadData();
    } catch (rejectError) {
      console.error('Error rechazando recompensa:', rejectError);
      toast.error(rejectError instanceof Error ? rejectError.message : 'No se pudo rechazar.');
    }
  }

  if (isLoading) return <LoadingState title="Cargando recompensas" message="Leyendo solicitudes pendientes." />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Recompensas</h2>
            <p className="mt-2 text-sm text-gray-400">Aprueba solicitudes y asigna exactamente 3 contactos extra.</p>
          </div>
          <button type="button" onClick={loadData} className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        {error ? <div className="mt-5 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">{error}</div> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-ink-950/70 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Captura</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-t border-line">
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">{request.user_id}</td>
                    <td className="px-4 py-3 text-gray-300">{request.status}</td>
                    <td className="px-4 py-3">
                      {request.screenshot_url ? (
                        <a href={request.screenshot_url} target="_blank" rel="noreferrer" className="text-brand-400 underline">
                          Ver captura
                        </a>
                      ) : (
                        <span className="text-gray-500">WhatsApp / pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setSelectedRequestId(request.id)} className="focus-ring rounded-full bg-brand-400 px-3 py-2 text-xs font-bold text-ink-950">
                          Seleccionar
                        </button>
                        <button type="button" onClick={() => void rejectRequest(request)} className="focus-ring rounded-full border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-100">
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!requests.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      No hay solicitudes de recompensa.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <aside className="rounded-2xl border border-line bg-ink-950/50 p-5">
            <h3 className="font-display text-xl font-bold text-white">Aprobar 3 contactos</h3>
            <p className="mt-2 text-sm text-gray-400">{selectedRequest ? `Solicitud: ${selectedRequest.id}` : 'Selecciona una solicitud pendiente.'}</p>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="focus-ring mt-4 h-11 w-full rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white">
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.displayLabel}
                </option>
              ))}
            </select>
            <div className="mt-4 max-h-[360px] space-y-2 overflow-auto">
              {visibleContacts.map((contact) => {
                const checked = selectedContactIds.includes(contact.id);
                return (
                  <label key={contact.id} className={`flex items-center gap-3 rounded-lg border border-line bg-white/5 p-3 text-sm text-white ${!checked && selectedContactIds.length >= 3 ? 'opacity-50' : ''}`}>
                    <input type="checkbox" checked={checked} disabled={!checked && selectedContactIds.length >= 3} onChange={() => toggleContact(contact.id)} />
                    {contact.name}
                  </label>
                );
              })}
            </div>
            <button type="button" onClick={() => void approveRequest()} disabled={!selectedRequest || selectedContactIds.length !== 3} className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 disabled:opacity-50">
              <Gift className="h-4 w-4" />
              Aprobar recompensa
            </button>
          </aside>
        </div>
      </section>
    </AdminShell>
  );
}
