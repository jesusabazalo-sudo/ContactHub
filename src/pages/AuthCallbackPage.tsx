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
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

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
          setStatus('¡Cuenta confirmada! Redirigiendo...');
          goTo('/', 1500);
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
    <div
      style={{
        minHeight: '100vh',
        background: '#0F2027',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        color: '#fff',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '48px' }}>{state === 'soft-error' ? '⚠️' : '✅'}</div>
      <h2 style={{ fontSize: '22px', fontWeight: 700 }}>ContactHub</h2>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', maxWidth: '320px', lineHeight: 1.6 }}>{status}</p>
      {state === 'loading' ? (
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(29,180,122,0.3)',
            borderTop: '3px solid #1DB47A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      ) : null}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
