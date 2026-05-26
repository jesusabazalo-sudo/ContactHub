import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
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
  signUp: (params: { email: string; password: string; fullName?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  const user = session?.user ?? null;

  const loadAdminStatus = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setIsAdmin(false);
      return;
    }

    setIsAdminLoading(true);
    try {
      const nextIsAdmin = await resolveAdminStatus(nextSession.user.id);
      setIsAdmin(nextIsAdmin);
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
        await loadAdminStatus(data.session);
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
      setSession(nextSession);
      setAuthError(null);
      setSessionExpired(false);

      if (event === 'SIGNED_OUT') {
        const wasManualSignOut = manualSignOutRef.current;
        setIsAdmin(false);
        setSessionExpired(!wasManualSignOut);
        manualSignOutRef.current = false;
        if (!wasManualSignOut && ['/admin', '/mis-contactos'].some((path) => window.location.pathname.startsWith(path))) {
          toast.info('Tu sesión expiró. Inicia sesión de nuevo.');
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        return;
      }

      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        void loadAdminStatus(nextSession);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadAdminStatus]);

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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
      redirectTo: `${window.location.origin}/auth`,
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      manualSignOutRef.current = false;
      throw new Error(getFriendlyAuthError(error));
    }

    setSession(null);
    setIsAdmin(false);
    setSessionExpired(false);
  }, []);

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
      signUp,
      resetPassword,
      signOut,
      refreshAdminStatus,
    }),
    [authError, isAdmin, isAdminLoading, isLoading, refreshAdminStatus, resetPassword, session, sessionExpired, signIn, signOut, signUp, user],
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
