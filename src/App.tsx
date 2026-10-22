import { matchPath, Route, Routes, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicOnly, RequireAuth } from '@/features/auth/RouteGuards';
import type { PostFormLocationState } from '@/features/posts/usePostFormNavigation';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AccountPage } from '@/pages/AccountPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PostFormPage } from '@/pages/PostFormPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ThreadPage } from '@/pages/ThreadPage';

const POST_FORM_PATHS = ['/publicar', '/publicar/:postId/editar'];

/** Si se entra directo a /publicar (enlace o recarga sin historial), el feed queda de fondo. */
const FEED_BACKGROUND: Location = { pathname: '/', search: '', hash: '', state: null, key: 'feed-background' };

/**
 * Rutas. Crear/editar usa el patrón "modal route": la URL cambia a /publicar,
 * pero la pantalla anterior sigue renderizada debajo del modal.
 */
export function App() {
  const location = useLocation();
  const { status } = useAuth();

  const isPostForm = POST_FORM_PATHS.some((path) => matchPath(path, location.pathname));
  const background = isPostForm
    ? (location.state as PostFormLocationState | null)?.backgroundLocation ?? FEED_BACKGROUND
    : undefined;

  return (
    <>
      <Routes location={background ?? location}>
        <Route element={<PublicOnly />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/recuperar" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/cuenta" element={<AccountPage />} />
            <Route path="/foro/:threadId" element={<ThreadPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>

      {background && status === 'authenticated' && (
        <Routes>
          <Route path="/publicar" element={<PostFormPage />} />
          <Route path="/publicar/:postId/editar" element={<PostFormPage />} />
        </Routes>
      )}
    </>
  );
}
