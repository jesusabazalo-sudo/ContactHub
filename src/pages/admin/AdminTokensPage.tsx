import { Coins, Gift, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { formatDate } from '../../lib/format';
import { sanitizeEmail, sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase, withTimeout } from '../../lib/supabaseClient';

type ProfileRow = { id: string; email: string | null; full_name: string | null };
type UserTokensRow = { balance: number; total_earned: number; total_spent: number };
type TransactionRow = { id: string; user_id: string; amount: number; reason: string; description: string | null; created_at: string; userEmail?: string | null };
type ContactRankingRow = { contactId: string; contactName: string; categoryName: string; unlockCount: number };

const REASON_OPTIONS = [
  { value: 'mision_redes', label: 'Misión: seguir en redes' },
  { value: 'mision_recomendacion', label: 'Misión: recomendación' },
  { value: 'resena_verificada', label: 'Reseña verificada' },
  { value: 'ajuste_manual', label: 'Ajuste manual' },
];

function ensureClient() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase;
}

export default function AdminTokensPage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<UserTokensRow | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [amount, setAmount] = useState(3);
  const [reason, setReason] = useState(REASON_OPTIONS[0].value);
  const [description, setDescription] = useState('');
  const [isAwarding, setIsAwarding] = useState(false);

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [ranking, setRanking] = useState<ContactRankingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    setIsLoading(true);
    setError(null);
    try {
      const client = ensureClient();
      if (!client) {
        setError('Falta conectar Supabase.');
        return;
      }

      const [transactionsRes, unlocksRes] = await withTimeout(
        Promise.all([
          Promise.resolve(client.from('token_transactions').select('id,user_id,amount,reason,description,created_at').order('created_at', { ascending: false }).limit(50)),
          Promise.resolve(client.from('contact_token_unlocks').select('contact_id')),
        ]),
        10000,
      );

      if (transactionsRes.error) throw transactionsRes.error;
      if (unlocksRes.error) throw unlocksRes.error;

      const userIds = [...new Set((transactionsRes.data ?? []).map((row) => row.user_id))];
      const profilesRes = userIds.length ? await client.from('profiles').select('id,email').in('id', userIds) : { data: [] as Array<{ id: string; email: string | null }> };
      const emailById = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile.email]));

      setTransactions(
        (transactionsRes.data ?? []).map((row) => ({
          id: row.id,
          user_id: row.user_id,
          amount: row.amount,
          reason: row.reason,
          description: row.description,
          created_at: row.created_at,
          userEmail: emailById.get(row.user_id) ?? row.user_id,
        })),
      );

      const countByContact = new Map<string, number>();
      for (const row of unlocksRes.data ?? []) countByContact.set(row.contact_id, (countByContact.get(row.contact_id) ?? 0) + 1);
      const topContactIds = [...countByContact.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id]) => id);

      if (topContactIds.length) {
        const { data: contacts } = await client.from('contacts').select('id,name,category_id').in('id', topContactIds);
        const categoryIds = [...new Set((contacts ?? []).map((contact) => contact.category_id))];
        const { data: categories } = categoryIds.length ? await client.from('categories').select('id,name').in('id', categoryIds) : { data: [] as Array<{ id: string; name: string }> };
        const categoryNameById = new Map((categories ?? []).map((category) => [category.id, category.name]));
        const contactsById = new Map((contacts ?? []).map((contact) => [contact.id, contact]));

        setRanking(
          topContactIds
            .map((contactId) => {
              const contact = contactsById.get(contactId);
              if (!contact) return null;
              return {
                contactId,
                contactName: contact.name,
                categoryName: categoryNameById.get(contact.category_id) ?? '',
                unlockCount: countByContact.get(contactId) ?? 0,
              };
            })
            .filter((row): row is ContactRankingRow => row !== null),
        );
      } else {
        setRanking([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el panel de tokens.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  async function searchUser() {
    const client = ensureClient();
    const email = sanitizeEmail(searchEmail);
    if (!client || !email) return;
    setIsSearching(true);
    setSelectedProfile(null);
    setSelectedTokens(null);
    try {
      const { data, error: searchError } = await withTimeout(
        Promise.resolve(client.from('profiles').select('id,email,full_name').ilike('email', `%${email}%`).limit(10)),
        10000,
      );
      if (searchError) throw searchError;
      setSearchResults(data ?? []);
      if (!data?.length) toast.info('No se encontró ningún usuario con ese correo.');
    } catch (searchErrorCaught) {
      toast.error(searchErrorCaught instanceof Error ? searchErrorCaught.message : 'No se pudo buscar el usuario.');
    } finally {
      setIsSearching(false);
    }
  }

  async function selectProfile(profile: ProfileRow) {
    const client = ensureClient();
    if (!client) return;
    setSelectedProfile(profile);
    try {
      const { data, error: tokensError } = await withTimeout(
        Promise.resolve(client.from('user_tokens').select('balance,total_earned,total_spent').eq('user_id', profile.id).maybeSingle()),
        10000,
      );
      if (tokensError) throw tokensError;
      setSelectedTokens(data ?? { balance: 0, total_earned: 0, total_spent: 0 });
    } catch (tokensErrorCaught) {
      toast.error(tokensErrorCaught instanceof Error ? tokensErrorCaught.message : 'No se pudo leer el balance.');
    }
  }

  async function awardTokens() {
    const client = ensureClient();
    if (!client || !selectedProfile || amount === 0) return;
    if (!window.confirm(`¿Dar ${amount} token(s) a ${selectedProfile.email ?? selectedProfile.id}? Motivo: ${REASON_OPTIONS.find((option) => option.value === reason)?.label}`)) return;

    setIsAwarding(true);
    try {
      const { data, error: awardError } = await withTimeout(
        Promise.resolve(
          client.rpc('award_mission_tokens', {
            p_user_id: selectedProfile.id,
            p_amount: amount,
            p_reason: reason,
            p_description: sanitizeText(description, 300) || REASON_OPTIONS.find((option) => option.value === reason)?.label || '',
          }),
        ),
        10000,
      );
      if (awardError) throw awardError;

      const result = data as { success: boolean; error?: string; tokens_awarded?: number };
      if (!result.success) {
        toast.error(result.error ?? 'No se pudieron otorgar los tokens.');
        return;
      }

      toast.success(`${result.tokens_awarded} token(s) otorgados a ${selectedProfile.email ?? 'el usuario'}.`);
      setDescription('');
      await selectProfile(selectedProfile);
      await loadOverview();
    } catch (awardErrorCaught) {
      toast.error(awardErrorCaught instanceof Error ? awardErrorCaught.message : 'No se pudieron otorgar los tokens.');
    } finally {
      setIsAwarding(false);
    }
  }

  if (isLoading) return <LoadingState title="Cargando tokens" message="Leyendo transacciones y ranking de contactos." />;
  if (error) return <FriendlyErrorState message={error} onRetry={loadOverview} />;

  return (
    <AdminShell>
      <AdminNotice />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="dopamine-card rounded-2xl p-5">
          <h2 className="font-display text-2xl font-bold text-content">Buscar usuario</h2>
          <div className="mt-4 flex gap-2">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <input
                value={searchEmail}
                onChange={(event) => setSearchEmail(sanitizeTextInput(event.target.value, 120))}
                onKeyDown={(event) => event.key === 'Enter' && void searchUser()}
                placeholder="Buscar por email"
                className="focus-ring h-11 w-full rounded-full border border-border bg-canvas/70 pl-11 pr-4 text-sm text-content"
              />
            </label>
            <button type="button" disabled={isSearching} onClick={() => void searchUser()} className="focus-ring rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950 disabled:opacity-60">
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {searchResults.length ? (
            <div className="mt-4 grid max-h-52 gap-2 overflow-auto">
              {searchResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => void selectProfile(profile)}
                  className={`rounded-lg border p-3 text-left text-sm transition ${selectedProfile?.id === profile.id ? 'border-brand-400/60 bg-brand-400/10' : 'border-border bg-muted hover:border-brand-400/35'}`}
                >
                  <p className="font-semibold text-content">{profile.email ?? 'Sin email'}</p>
                  <p className="text-xs text-content-muted">{profile.full_name ?? 'Sin nombre'}</p>
                </button>
              ))}
            </div>
          ) : null}

          {selectedProfile ? (
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-sm font-semibold text-brand-text">{selectedProfile.email}</p>
              {selectedTokens ? (
                <div className="mt-2 flex items-center gap-4 text-sm text-content-secondary">
                  <span className="flex items-center gap-1.5 font-bold text-content"><Coins className="h-4 w-4 text-brand-text" />{selectedTokens.balance}</span>
                  <span>Ganado: {selectedTokens.total_earned}</span>
                  <span>Gastado: {selectedTokens.total_spent}</span>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase text-content-muted">Cantidad</span>
                  <input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase text-content-muted">Motivo</span>
                  <select value={reason} onChange={(event) => setReason(event.target.value)} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content">
                    {REASON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase text-content-muted">Nota (opcional)</span>
                  <input value={description} onChange={(event) => setDescription(sanitizeTextInput(event.target.value, 300))} className="focus-ring h-11 rounded-full border border-border bg-canvas/70 px-4 text-content" />
                </label>
                <button
                  type="button"
                  disabled={isAwarding || amount === 0}
                  onClick={() => void awardTokens()}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 disabled:opacity-60"
                >
                  <Gift className="h-4 w-4" />
                  {isAwarding ? 'Otorgando...' : 'Dar tokens'}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="dopamine-card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-content">Últimas 50 transacciones</h2>
            <button type="button" onClick={() => void loadOverview()} className="focus-ring rounded-full border border-border p-2 text-content">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-canvas/70 text-xs uppercase text-content-muted">
                <tr>
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Motivo</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-border">
                    <td className="max-w-[160px] truncate px-3 py-2 text-content">{transaction.userEmail}</td>
                    <td className="px-3 py-2 text-content-secondary">{transaction.reason}</td>
                    <td className={`px-3 py-2 font-bold ${transaction.amount > 0 ? 'text-brand-text' : 'text-danger'}`}>{transaction.amount > 0 ? '+' : ''}{transaction.amount}</td>
                    <td className="px-3 py-2 text-content-secondary">{formatDate(transaction.created_at)}</td>
                  </tr>
                ))}
                {!transactions.length ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-content-secondary">Todavía no hay transacciones.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="dopamine-card mt-6 rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-content">
          <TrendingUp className="h-5 w-5 text-brand-text" />
          Contactos más desbloqueados con tokens
        </h2>
        <div className="mt-4 grid gap-2">
          {ranking.map((row, index) => (
            <div key={row.contactId} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3 text-sm">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-400/15 text-xs font-bold text-brand-text">{index + 1}</span>
                <span className="min-w-0 truncate">
                  <span className="block truncate font-semibold text-content">{row.contactName}</span>
                  <span className="text-xs text-content-muted">{row.categoryName}</span>
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-brand-400/10 px-3 py-1 text-xs font-bold text-brand-text">{row.unlockCount} desbloqueo{row.unlockCount === 1 ? '' : 's'}</span>
            </div>
          ))}
          {!ranking.length ? <p className="text-sm text-content-secondary">Todavía no hay desbloqueos con tokens.</p> : null}
        </div>
      </section>
    </AdminShell>
  );
}
