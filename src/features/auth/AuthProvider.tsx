import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { ensureAutofillProfile } from '../../lib/autofillProfile';
import { getFriendlyAuthError, isExpiredSessionError } from '../../lib/authErrors';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAdminLoading: boolean;
  authError: string | null;
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (params: { email: string; password: string; fullName?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getSiteUrl() {
  const configuredUrl = import.meta.env.VITE_SITE_URL?.trim();
  const fallbackUrl = typeof window !== 'undefined' ? window.location.origin : 'https://contact-hub-knmq.vercel.app';
  return (configuredUrl || fallbackUrl).replace(/\/+$/, '');
}

function getAuthCallbackUrl() {
  return `${getSiteUrl()}/auth/callback`;
}

async function resolveAdminStatus(userId: string) {
  if (!supabase || !isSupabaseConfigured) return false;

  const rpcResult = await supabase.rpc('is_admin', { user_id: userId });
  if (!rpcResult.error && typeof rpcResult.data === 'boolean') {
    return rpcResult.data;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('Admin role check is prepared, but Supabase returned:', error.message);
    }
    return false;
  }

  return data?.role === 'admin';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const manualSignOutRef = useRef(false);
  const onlineIncrementedRef = useRef<string | null>(null);
  const adminStatusUserRef = useRef<string | null>(null);
  const isAdminRef = useRef(false);

  const user = session?.user ?? null;

  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  const loadAdminStatus = useCallback(async (nextSession: Session | null, force = false) => {
    if (!nextSession?.user) {
      setIsAdmin(false);
      adminStatusUserRef.current = null;
      return;
    }

    if (!force && adminStatusUserRef.current === nextSession.user.id) return;

    if (!isAdminRef.current) setIsAdminLoading(true);
    try {
      const nextIsAdmin = await resolveAdminStatus(nextSession.user.id);
      setIsAdmin(nextIsAdmin);
      adminStatusUserRef.current = nextSession.user.id;
    } finally {
      setIsAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSession() {
      if (!supabase || !isSupabaseConfigured) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!isMounted) return;
        setSession(data.session);
        setSessionExpired(false);
        if (data.session?.user) void ensureAutofillProfile(data.session.user);
        await loadAdminStatus(data.session, true);
      } catch (error) {
        if (!isMounted) return;
        setAuthError(getFriendlyAuthError(error));
        setSessionExpired(isExpiredSessionError(error));
        setSession(null);
        setIsAdmin(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialSession();

    if (!supabase || !isSupabaseConfigured) {
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setAuthError(null);
      setSessionExpired(false);

      if (event === 'TOKEN_REFRESHED') {
        setSession(nextSession);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        const wasManualSignOut = manualSignOutRef.current;
        setIsAdmin(false);
        adminStatusUserRef.current = null;
        setSessionExpired(!wasManualSignOut);
        manualSignOutRef.current = false;
        if (!wasManualSignOut && ['/admin', '/mis-contactos'].some((path) => window.location.pathname.startsWith(path))) {
          toast.info('Tu sesión expiró. Inicia sesión de nuevo.');
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        return;
      }

      setSession(nextSession);

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (nextSession?.user) void ensureAutofillProfile(nextSession.user);
        void loadAdminStatus(nextSession);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadAdminStatus]);

  useEffect(() => {
    if (!user?.id || !supabase || !isSupabaseConfigured) return;
    const userId = user.id;
    const client = supabase as unknown as { from: (table: string) => any };
    let cancelled = false;

    async function markOnline(incrementSession = false) {
      try {
        const updates: Record<string, unknown> = {
          is_online: true,
          last_seen: new Date().toISOString(),
        };

        if (incrementSession) {
          const { data } = await client.from('profiles').select('session_count').eq('id', userId).maybeSingle();
          updates.session_count = Number(data?.session_count ?? 0) + 1;
        }

        if (!cancelled) await client.from('profiles').update(updates).eq('id', userId);
      } catch (error) {
        if (import.meta.env.DEV) console.warn('No se pudo marcar usuario online:', error);
      }
    }

    async function markOffline() {
      try {
        await client
          .from('profiles')
          .update({
            is_online: false,
            last_seen: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch (error) {
        if (import.meta.env.DEV) console.warn('No se pudo marcar usuario offline:', error);
      }
    }

    const shouldIncrement = onlineIncrementedRef.current !== userId;
    onlineIncrementedRef.current = userId;
    void markOnline(shouldIncrement);
    const interval = window.setInterval(() => void markOnline(false), 60000);
    window.addEventListener('beforeunload', markOffline);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', markOffline);
      void markOffline();
    };
  }, [user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Falta conectar Supabase. Crea un archivo .env.local en la raíz del proyecto con las variables necesarias.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (isExpiredSessionError(error)) {
        setSessionExpired(true);
      }
      throw new Error(getFriendlyAuthError(error));
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Falta conectar Supabase. Crea un archivo .env.local en la raíz del proyecto con las variables necesarias.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      throw new Error(getFriendlyAuthError(error));
    }
  }, []);

  const signUp = useCallback(async ({ email, password, fullName }: { email: string; password: string; fullName?: string }) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Falta conectar Supabase. Crea un archivo .env.local en la raíz del proyecto con las variables necesarias.');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });

    if (error) {
      throw new Error(getFriendlyAuthError(error));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Conecta Supabase antes de enviar recuperación de contraseña.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth`,
    });

    if (error) {
      throw new Error(getFriendlyAuthError(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setSession(null);
      setIsAdmin(false);
      setSessionExpired(false);
      return;
    }

    manualSignOutRef.current = true;
    if (user?.id) {
      const client = supabase as unknown as { from: (table: string) => any };
      await client.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', user.id);
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      manualSignOutRef.current = false;
      throw new Error(getFriendlyAuthError(error));
    }

    setSession(null);
    setIsAdmin(false);
    setSessionExpired(false);
    onlineIncrementedRef.current = null;
  }, [user?.id]);

  const refreshAdminStatus = useCallback(async () => {
    await loadAdminStatus(session);
  }, [loadAdminStatus, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isAdmin,
      isLoading,
      isAdminLoading,
      authError,
      sessionExpired,
      signIn,
      signInWithGoogle,
      signUp,
      resetPassword,
      signOut,
      refreshAdminStatus,
    }),
    [authError, isAdmin, isAdminLoading, isLoading, refreshAdminStatus, resetPassword, session, sessionExpired, signIn, signInWithGoogle, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
