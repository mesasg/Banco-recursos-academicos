import { Navigate, Outlet, useLocation, type Location } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';
import { useAuth } from '@/context/AuthContext';

/** Sin sesión, todo redirige a /login (recordando a dónde querías ir). */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader label="Verificando tu sesión…" />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Login y registro: si ya hay sesión, se va al inicio. */
export function PublicOnly() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }
  return <Outlet />;
}
