import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase, withTimeout } from '../lib/supabaseClient';
import { queryCache } from '../lib/queryCache';

type TokensSnapshot = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  unlockedIds: string[];
};

export type TokenTransaction = {
  id: string;
  amount: number;
  reason: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
};

export type SpendTokenResult =
  | { status: 'success'; contactName: string; newBalance: number }
  | { status: 'already_unlocked' }
  | { status: 'insufficient_tokens'; balance: number }
  | { status: 'error'; message: string };

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const isSpendingRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const client = supabase;
    if (!user?.id || !client || !isSupabaseConfigured) {
      setBalance(0);
      setTotalEarned(0);
      setTotalSpent(0);
      setUnlockedIds(new Set());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userId = user.id;
      const snapshot = await queryCache.withCache<TokensSnapshot>(`tokens:${userId}`, 15_000, async () => {
        const [tokensRes, unlocksRes] = await withTimeout(
          Promise.all([
            Promise.resolve(client.from('user_tokens').select('balance,total_earned,total_spent').eq('user_id', userId).maybeSingle()),
            Promise.resolve(client.from('contact_token_unlocks').select('contact_id').eq('user_id', userId)),
          ]),
          10000,
        );

        if (tokensRes.error) throw tokensRes.error;
        if (unlocksRes.error) throw unlocksRes.error;

        return {
          balance: tokensRes.data?.balance ?? 0,
          totalEarned: tokensRes.data?.total_earned ?? 0,
          totalSpent: tokensRes.data?.total_spent ?? 0,
          unlockedIds: (unlocksRes.data ?? []).map((row) => row.contact_id),
        };
      });

      setBalance(snapshot.balance);
      setTotalEarned(snapshot.totalEarned);
      setTotalSpent(snapshot.totalSpent);
      setUnlockedIds(new Set(snapshot.unlockedIds));
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useTokens] load:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const isContactUnlocked = useCallback((contactId: string) => unlockedIds.has(contactId), [unlockedIds]);

  const spendToken = useCallback(
    async (contactId: string): Promise<SpendTokenResult> => {
      if (!user?.id || !supabase || !isSupabaseConfigured) {
        return { status: 'error', message: 'Inicia sesión para desbloquear con tokens.' };
      }
      if (isSpendingRef.current.has(contactId)) {
        return { status: 'error', message: 'Ya se está procesando este desbloqueo.' };
      }

      isSpendingRef.current.add(contactId);
      try {
        const { data, error } = await withTimeout(
          Promise.resolve(supabase.rpc('spend_token_to_unlock', { p_contact_id: contactId })),
          10000,
        );
        if (error) throw error;

        const result = data as { success: boolean; error?: string; balance?: number; contact_name?: string; new_balance?: number };

        if (result.success) {
          queryCache.invalidate(`tokens:${user.id}`);
          setBalance(result.new_balance ?? 0);
          setTotalSpent((current) => current + 1);
          setUnlockedIds((current) => new Set(current).add(contactId));
          return { status: 'success', contactName: result.contact_name ?? '', newBalance: result.new_balance ?? 0 };
        }

        if (result.error === 'already_unlocked') {
          setUnlockedIds((current) => new Set(current).add(contactId));
          return { status: 'already_unlocked' };
        }

        if (result.error === 'insufficient_tokens') {
          return { status: 'insufficient_tokens', balance: result.balance ?? 0 };
        }

        return { status: 'error', message: result.error ?? 'No se pudo desbloquear el contacto.' };
      } catch (error) {
        const isTimeout = error instanceof Error && error.message === 'timeout';
        return { status: 'error', message: isTimeout ? 'La conexión tardó demasiado. Intenta de nuevo.' : error instanceof Error ? error.message : 'No se pudo desbloquear el contacto.' };
      } finally {
        isSpendingRef.current.delete(contactId);
      }
    },
    [user?.id],
  );

  const refresh = useCallback(async () => {
    if (user?.id) queryCache.invalidate(`tokens:${user.id}`);
    await load();
  }, [load, user?.id]);

  return { balance, totalEarned, totalSpent, isLoading, unlockedIds, isContactUnlocked, spendToken, refresh };
}
