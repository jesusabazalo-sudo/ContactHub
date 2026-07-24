import { Coins } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { HowToEarnTokensModal } from '../contact/UnlockWithToken';
import { useAuth } from '../../features/auth/AuthProvider';
import { useTokens } from '../../hooks/useTokens';
import { isSupabaseConfigured, supabase, withTimeout } from '../../lib/supabaseClient';

type RecentMovement = {
  id: string;
  amount: number;
  reason: string;
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

export default function TokenBadge() {
  const { user } = useAuth();
  const { balance, isLoading } = useTokens();
  const [isOpen, setIsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [movements, setMovements] = useState<RecentMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !user?.id || !supabase || !isSupabaseConfigured) return undefined;

    setIsLoadingMovements(true);
    void withTimeout(
      Promise.resolve(
        supabase
          .from('token_transactions')
          .select('id,amount,reason,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ),
      10000,
    )
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) throw error;
        setMovements((data ?? []).map((row) => ({ id: row.id, amount: row.amount, reason: row.reason, createdAt: row.created_at })));
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.error('[TokenBadge] movements:', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMovements(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.id]);

  if (!user) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Tus tokens"
        aria-expanded={isOpen}
        className="focus-ring inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-bold text-content transition hover:border-brand/40"
      >
        <Coins className="h-4 w-4 text-brand-text" />
        {isLoading ? '…' : balance}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-72 rounded-2xl border border-border bg-elevated p-4 shadow-lg">
          <p className="text-sm font-bold text-content">Tus tokens: {balance} disponible{balance === 1 ? '' : 's'}</p>
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted">Últimos movimientos</p>
            {isLoadingMovements ? (
              <p className="mt-2 text-xs text-content-secondary">Cargando...</p>
            ) : movements.length ? (
              <div className="mt-2 grid gap-2">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-content-secondary">{formatReason(movement.reason)}</span>
                    <span className={`shrink-0 font-bold ${movement.amount > 0 ? 'text-brand-text' : 'text-danger'}`}>
                      {movement.amount > 0 ? '+' : ''}
                      {movement.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-content-secondary">Todavía no tienes movimientos.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsInfoOpen(true);
              setIsOpen(false);
            }}
            className="focus-ring mt-4 w-full rounded-full border border-brand/25 bg-brand/[0.08] px-3 py-2 text-xs font-bold text-brand-text transition hover:bg-brand/[0.14]"
          >
            ¿Cómo ganar más tokens?
          </button>
        </div>
      ) : null}

      {isInfoOpen ? <HowToEarnTokensModal onClose={() => setIsInfoOpen(false)} /> : null}
    </div>
  );
}
