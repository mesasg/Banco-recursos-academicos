import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Plus, UserRound } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { buttonClasses } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Logo } from '@/components/Logo';
import { useToast } from '@/components/Toast';
import { useAuth, useCurrentUser } from '@/context/AuthContext';
import { SubjectSidebar } from '@/features/feed/SubjectSidebar';
import { useFeedFilters } from '@/features/feed/useFeedFilters';
import { usePostFormNavigation } from '@/features/posts/usePostFormNavigation';
import { breakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { Header } from './Header';
import { RightAside } from './RightAside';

const SIDEBAR_ID = 'sidebar-materias';

/**
 * Estructura principal (mock-up): header fijo, sidebar de carreras a la
 * izquierda, contenido al centro y accesos rápidos a la derecha.
 *  ≥1280: 3 columnas · 1024–1279: sidebar colapsable, "Añadir" en el header
 *  <1024: sidebar en drawer y botón flotante (FAB).
 */
export function AppLayout() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { filters, onFeed } = useFeedFilters();
  const { openCreate } = usePostFormNavigation();

  const isDesktop = useMediaQuery(breakpoints.lg);
  const [collapsed, setCollapsed] = useLocalStorageState('ingenotes:sidebar-collapsed', false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Al pasar a desktop el drawer no tiene sentido.
  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  // Cambiar de página cierra el drawer.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const addResource = () => openCreate(onFeed ? filters.subjectId : null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    toast.info('Cerraste sesión. ¡Hasta pronto!');
  };

  return (
    <div className="min-h-screen">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>

      <Header
        user={user}
        isDesktop={isDesktop}
        sidebarOpen={isDesktop ? !collapsed : drawerOpen}
        sidebarId={SIDEBAR_ID}
        onToggleSidebar={() => (isDesktop ? setCollapsed((c) => !c) : setDrawerOpen(true))}
        onAddResource={addResource}
        onLogout={handleLogout}
      />

      <div className="mx-auto flex w-full max-w-[1440px]">
        {isDesktop && !collapsed && (
          <aside
            id={SIDEBAR_ID}
            aria-label="Materias"
            className="scrollbar-thin sticky top-16 h-[calc(100vh-4rem)] w-[260px] shrink-0 overflow-y-auto border-r border-line bg-primary-50"
          >
            <SubjectSidebar />
          </aside>
        )}

        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-28 pt-4 focus:outline-none md:px-6 md:pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>

        <RightAside onAddResource={addResource} className="hidden xl:flex" />
      </div>

      {!isDesktop && (
        <Drawer
          id={SIDEBAR_ID}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Materias"
          header={<Logo />}
          footer={
            <div className="flex flex-col gap-2">
              <Link to="/cuenta" className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-canvas">
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    <UserRound className="h-3.5 w-3.5" aria-hidden /> Mi cuenta
                  </span>
                </span>
              </Link>
              <button type="button" onClick={handleLogout} className={buttonClasses({ variant: 'secondary', fullWidth: true })}>
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesión
              </button>
            </div>
          }
        >
          <SubjectSidebar onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      {/* FAB: en móvil y tablet (<1024 px). */}
      <button
        type="button"
        onClick={addResource}
        aria-label="Añadir recurso"
        className="fixed bottom-5 right-5 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-primary-600 px-4 font-semibold text-white shadow-raised transition-colors hover:bg-primary-700 md:px-5 lg:hidden"
      >
        <Plus className="h-6 w-6" aria-hidden />
        <span className="hidden md:inline" aria-hidden>
          Añadir recurso
        </span>
      </button>
    </div>
  );
}
