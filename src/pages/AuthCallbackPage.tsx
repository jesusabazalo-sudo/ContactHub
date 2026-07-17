import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmailOtpType } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type CallbackState = 'loading' | 'success' | 'soft-error';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Confirmando tu cuenta...');
  const [state, setState] = useState<CallbackState>('loading');

  useEffect(() => {
    let timeoutId: number | undefined;

    const goTo = (path: string, delay = 1500) => {
      timeoutId = window.setTimeout(() => navigate(path, { replace: true }), delay);
    };

    const handleCallback = async () => {
      try {
        if (!supabase || !isSupabaseConfigured) {
          setState('soft-error');
          setStatus('Falta conectar Supabase. Intenta iniciar sesión directamente.');
          goTo('/auth', 2200);
          return;
        }

        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const tokenHash = searchParams.get('token_hash');
        const type = (searchParams.get('type') ?? 'signup') as EmailOtpType;
        const code = searchParams.get('code');
        const urlError = searchParams.get('error_description') ?? searchParams.get('error') ?? hashParams.get('error_description') ?? hashParams.get('error');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (urlError) {
          throw new Error(urlError);
        }

        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (error) throw error;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (data.session) {
          setState('success');
          setStatus('¡Cuenta confirmada! Redirigiendo a tus contactos...');
          goTo('/mis-contactos', 1500);
          return;
        }

        setStatus('Cuenta verificada. Inicia sesión para continuar.');
        goTo('/auth', 2000);
      } catch (error) {
        console.error('Auth callback error:', error);
        setState('soft-error');
        setStatus('Hubo un problema. Intenta iniciar sesión directamente.');
        goTo('/auth', 2200);
      }
    };

    void handleCallback();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas p-5 text-center text-content">
      <div className="text-5xl">{state === 'soft-error' ? '⚠️' : '✅'}</div>
      <h2 className="text-xl font-bold text-content">ContactHub</h2>
      <p className="max-w-xs text-[15px] leading-7 text-content-secondary">{status}</p>
      {state === 'loading' ? (
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand/30 border-t-brand" />
      ) : null}
    </div>
  );
}
