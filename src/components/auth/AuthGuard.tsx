import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import FriendlyErrorState from '../system/FriendlyErrorState';
import LoadingState from '../system/LoadingState';

export default function AuthGuard({ children }: PropsWithChildren) {
  const location = useLocation();
  const { authError, isLoading, session, sessionExpired } = useAuth();

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
    return <Navigate to={`/auth?redirect=${redirect}`} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
