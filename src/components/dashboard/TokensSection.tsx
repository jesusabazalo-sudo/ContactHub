import { Coins, MessageCircle, Star, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { useTokens } from '../../hooks/useTokens';
import { formatDate } from '../../lib/format';
import { isSupabaseConfigured, supabase, withTimeout } from '../../lib/supabaseClient';

type UnlockedWithToken = {
  contactId: string;
  contactName: string;
  categoryName: string;
  categoryIcon: string;
  unlockedAt: string;
};

type TransactionRow = {
  id: string;
  amount: number;
  reason: string;
  description: string | null;
  createdAt: string;
};

const REASON_LABELS: Record<string, string> = {
  trial_inicial: 'Bienvenida',
  mision_redes: 'Seguir en redes',
  mision_recomendacion: 'Recomendación',
  unlock_contacto: 'Desbloqueo de contacto',
};

function formatReason(reason: string) {
  return REASON_LABELS[reason] ?? reason;
}

function openSupportChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function TokensSection() {
  const { user } = useAuth();
  const { balance, totalEarned, totalSpent, isLoading: isTokensLoading } = useTokens();
  const [unlocks, setUnlocks] = useState<UnlockedWithToken[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const client = supabase;

    async function load() {
      if (!user?.id || !client || !isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [unlocksRes, transactionsRes] = await withTimeout(
          Promise.all([
            Promise.resolve(client.from('contact_token_unlocks').select('contact_id,unlocked_at').eq('user_id', user.id).order('unlocked_at', { ascending: false })),
            Promise.resolve(client.from('token_transactions').select('id,amount,reason,description,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)),
          ]),
          10000,
        );
        if (cancelled) return;
        if (unlocksRes.error) throw unlocksRes.error;
        if (transactionsRes.error) throw transactionsRes.error;

        const contactIds = (unlocksRes.data ?? []).map((row) => row.contact_id);
        let unlockedRows: UnlockedWithToken[] = [];
        if (contactIds.length) {
          const { data: contacts } = await withTimeout(
            Promise.resolve(client.from('contacts').select('id,name,category_id').in('id', contactIds)),
            10000,
          );
          const categoryIds = [...new Set((contacts ?? []).map((contact) => contact.category_id))];
          const { data: categories } = categoryIds.length
            ? await withTimeout(Promise.resolve(client.from('categories').select('id,name,icon').in('id', categoryIds)), 10000)
            : { data: [] as Array<{ id: string; name: string; icon: string }> };
          const contactsById = new Map((contacts ?? []).map((contact) => [contact.id, contact]));
          const categoriesById = new Map((categories ?? []).map((category) => [category.id, category]));

          unlockedRows = (unlocksRes.data ?? [])
            .map((row) => {
              const contact = contactsById.get(row.contact_id);
              if (!contact) return null;
              const category = categoriesById.get(contact.category_id);
              return {
                contactId: row.contact_id,
                contactName: contact.name,
                categoryName: category?.name ?? '',
                categoryIcon: category?.icon ?? '📁',
                unlockedAt: row.unlocked_at,
              };
            })
            .filter((row): row is UnlockedWithToken => row !== null);
        }

        if (cancelled) return;
        setUnlocks(unlockedRows);
        setTransactions(
          (transactionsRes.data ?? []).map((row) => ({
            id: row.id,
            amount: row.amount,
            reason: row.reason,
            description: row.description,
            createdAt: row.created_at,
          })),
        );
      } catch (error) {
        if (!cancelled && import.meta.env.DEV) console.error('[TokensSection] load:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const earnActions = [
    {
      icon: UserPlus,
      title: 'Recomienda a un amigo',
      detail: '3 tokens cuando tu amigo se registre.',
      cta: 'Compartir invitación',
      onClick: () => openSupportChat('Hola, quiero saber cómo recomendar ContactHub a un amigo para ganar tokens.'),
    },
    {
      icon: MessageCircle,
      title: 'Síguenos en redes',
      detail: '2 tokens al enviar la captura de evidencia.',
      cta: 'Enviar evidencia por chat',
      onClick: () => openSupportChat('Hola, ya seguí a ContactHub en redes, aquí va mi evidencia para los 2 tokens.'),
    },
    {
      icon: Star,
      title: 'Deja una reseña',
      detail: '1 token por una reseña verificada.',
      cta: 'Dejar reseña',
      onClick: () => openSupportChat('Hola, quiero dejar una reseña de ContactHub para ganar 1 token.'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand/20 bg-brand/[0.05] p-6 text-center sm:text-left">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-text sm:justify-start">
          <Coins className="h-4 w-4" />
          Balance actual
        </p>
        <p className="mt-2 font-display text-5xl font-bold text-content">{isTokensLoading ? '…' : balance}</p>
        <div className="mt-4 flex justify-center gap-6 text-sm text-content-secondary sm:justify-start">
          <span>Total ganado: <strong className="text-content">{totalEarned}</strong></span>
          <span>Total gastado: <strong className="text-content">{totalSpent}</strong></span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg font-bold text-content">Contactos desbloqueados con tokens</h3>
        {isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton-block h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : unlocks.length ? (
          <div className="mt-4 grid gap-2">
            {unlocks.map((unlock) => (
              <div key={unlock.contactId} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-content">{unlock.contactName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-content-muted">
                    <span aria-hidden="true">{unlock.categoryIcon}</span>
                    {unlock.categoryName}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-content-muted">{formatDate(unlock.unlockedAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-content-secondary">Todavía no desbloqueaste contactos individuales con tokens.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg font-bold text-content">Historial de transacciones</h3>
        {isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton-block h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : transactions.length ? (
          <div className="mt-4 grid gap-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-content">{formatReason(transaction.reason)}</p>
                  <p className="text-xs text-content-muted">{formatDate(transaction.createdAt)}</p>
                </div>
                <span className={`shrink-0 font-bold ${transaction.amount > 0 ? 'text-brand-text' : 'text-danger'}`}>
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-content-secondary">Todavía no tienes movimientos de tokens.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg font-bold text-content">Gana más tokens</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {earnActions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.title} className="flex flex-col rounded-xl border border-border bg-muted p-4">
                <Icon className="h-5 w-5 text-brand-text" />
                <p className="mt-2 text-sm font-semibold text-content">{action.title}</p>
                <p className="mt-1 flex-1 text-xs text-content-secondary">{action.detail}</p>
                <button
                  type="button"
                  onClick={action.onClick}
                  className="focus-ring mt-3 rounded-full border border-brand/25 bg-brand/[0.08] px-3 py-2 text-xs font-bold text-brand-text transition hover:bg-brand/[0.14]"
                >
                  {action.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
