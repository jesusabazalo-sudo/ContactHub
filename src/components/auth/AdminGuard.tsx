import type { PropsWithChildren } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import LoadingState from '../system/LoadingState';

export default function AdminGuard({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isAdminLoading, isLoading, session } = useAuth();

  if (isLoading || isAdminLoading) {
    return <LoadingState title="Verificando permisos" message="Estamos revisando si tu usuario tiene rol de administrador." />;
  }

  if (!session) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?redirect=${redirect}`} replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0F2027] p-6 text-white">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-bold">Acceso restringido</h2>
        <p className="text-sm text-white/50">No tienes permisos para ver esta página.</p>
        <button type="button" onClick={() => navigate('/')} className="rounded-lg bg-[#1DB47A] px-4 py-2 text-sm text-white">
          Volver al inicio
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
