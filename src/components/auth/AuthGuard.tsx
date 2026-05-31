import type { PropsWithChildren } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthProvider';
import FriendlyErrorState from '../system/FriendlyErrorState';
import LoadingState from '../system/LoadingState';

export default function AuthGuard({ children }: PropsWithChildren) {
  const location = useLocation();
  const { authError, isLoading, session, sessionExpired, signInWithGoogle } = useAuth();

  if (isLoading) {
    return <LoadingState title="Verificando tu sesión" message="Estamos revisando tu acceso privado a ContactHub." />;
  }

  if (authError && sessionExpired) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?redirect=${redirect}&reason=session-expired`} replace state={{ from: location }} />;
  }

  if (authError && session) {
    return <FriendlyErrorState message={authError} />;
  }

  if (!session) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return (
      <div className="min-h-screen bg-[#0F2027] px-4 py-10 text-white">
        <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-2xl place-items-center">
          <div className="w-full rounded-3xl border border-brand-400/25 bg-[rgba(15,32,39,0.94)] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-400/15 text-2xl">🔐</div>
            <h1 className="mt-5 font-display text-2xl font-bold text-white">Para guardar tu acceso necesitamos que inicies sesión.</h1>
            <p className="mt-4 text-sm leading-6 text-gray-300">
              Tu correo nos permite activar carpetas, guardar tu prueba gratis y proteger lo que desbloqueas. Puedes explorar ContactHub sin registrarte y crear cuenta cuando quieras guardar un acceso.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  void signInWithGoogle().catch((error) => {
                    const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google.';
                    toast.error(message);
                  });
                }}
                className="focus-ring inline-flex h-12 items-center justify-center rounded-2xl bg-brand-400 px-5 text-sm font-black text-ink-950 transition hover:bg-white"
              >
                Continuar con Google
              </button>
              <Link to="/catalogo" className="focus-ring inline-flex h-12 items-center justify-center rounded-2xl border border-line bg-white/5 px-5 text-sm font-bold text-white transition hover:border-brand-400/40">
                Explorar catálogo sin registrarme
              </Link>
            </div>
            <Link to={`/auth?redirect=${redirect}&mode=register`} state={{ from: location }} className="mt-4 inline-flex text-xs font-semibold text-brand-200 hover:text-white">
              Prefiero crear cuenta con correo
            </Link>
            <p className="mt-5 text-xs leading-5 text-gray-500">Registro necesario solo para guardar tus accesos. Tu correo funciona como tu llave de entrada.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
