import { RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import LoadingState from '../../components/system/LoadingState';
import { formatDate } from '../../lib/format';
import { sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  onboarding_answers?: {
    busca?: string;
    uso?: string;
    contacto?: string;
  } | null;
};

type PurchaseRow = {
  user_id: string;
  status: 'pending' | 'active' | 'revoked' | 'expired';
};

function ensureClient() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase;
}

export default function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCustomers() {
    setIsLoading(true);
    setError(null);
    try {
      const client = ensureClient();
      if (!client) {
        setProfiles([]);
        setPurchases([]);
        setError('Falta conectar Supabase. Revisa tu archivo .env.local.');
        return;
      }
      const profileClient = client as unknown as { from: (table: string) => any };
      const [profilesResult, purchasesResult] = await Promise.all([
        profileClient.from('profiles').select('id,email,full_name,phone,created_at,updated_at,onboarding_answers').order('created_at', { ascending: false }).limit(500),
        client.from('purchases').select('user_id,status').limit(2000),
      ]);

      if (profilesResult.error) {
        console.error('AdminCustomersPage profiles:', profilesResult.error.message);
        setProfiles([]);
        setError(`No se pudieron cargar clientes por permisos de Supabase: ${profilesResult.error.message}`);
        return;
      }
      if (purchasesResult.error) {
        console.error('AdminCustomersPage purchases:', purchasesResult.error.message);
        setPurchases([]);
      }

      setProfiles((profilesResult.data ?? []) as ProfileRow[]);
      setPurchases(purchasesResult.data ?? []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar clientes.';
      console.error('No se pudieron cargar clientes por permisos de Supabase:', loadError);
      setError(`No se pudieron cargar clientes por permisos de Supabase: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const purchaseCountByUser = useMemo(() => {
    const map = new Map<string, { pending: number; active: number; revoked: number }>();
    for (const purchase of purchases) {
      const current = map.get(purchase.user_id) ?? { pending: 0, active: 0, revoked: 0 };
      if (purchase.status === 'pending') current.pending += 1;
      if (purchase.status === 'active') current.active += 1;
      if (purchase.status === 'revoked') current.revoked += 1;
      map.set(purchase.user_id, current);
    }
    return map;
  }, [purchases]);

  const filteredProfiles = useMemo(() => {
    const normalized = sanitizeText(query, 80).toLowerCase();
    if (!normalized) return profiles;
    return profiles.filter((profile) => [profile.email, profile.full_name, profile.phone].join(' ').toLowerCase().includes(normalized));
  }, [profiles, query]);

  if (isLoading) return <LoadingState title="Cargando clientes" message="Leyendo perfiles y compras desde Supabase." />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Clientes</h2>
            <p className="mt-2 text-sm text-gray-400">Versión estable: perfiles registrados y resumen simple de compras.</p>
          </div>
          <button
            type="button"
            onClick={loadCustomers}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white hover:border-brand-400/35"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{error}</div>
        ) : null}

        <label className="relative mt-6 block max-w-lg">
          <span className="sr-only">Buscar clientes</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(sanitizeTextInput(event.target.value, 80))}
            placeholder="Buscar por email, nombre o teléfono"
            className="focus-ring h-11 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-sm text-white"
          />
        </label>

        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead className="bg-ink-950/70 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Última actualización</th>
                <th className="px-4 py-3">Compras</th>
                <th className="px-4 py-3">Onboarding</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => {
                const counts = purchaseCountByUser.get(profile.id) ?? { pending: 0, active: 0, revoked: 0 };
                return (
                  <tr key={profile.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{profile.email ?? 'Sin email'}</p>
                      <p className="mt-1 text-xs text-gray-500">{profile.full_name ?? 'Sin nombre'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{profile.phone ?? 'No registrado'}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(profile.created_at)}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(profile.updated_at)}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {counts.active} activas · {counts.pending} pendientes · {counts.revoked} revocadas
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      <p>Busca: {profile.onboarding_answers?.busca ?? 'Pendiente'}</p>
                      <p className="mt-1">Uso: {profile.onboarding_answers?.uso ?? 'Pendiente'}</p>
                      <p className="mt-1">Contacto preferido: {profile.onboarding_answers?.contacto ?? 'Pendiente'}</p>
                    </td>
                  </tr>
                );
              })}
              {!filteredProfiles.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No hay clientes con ese filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
