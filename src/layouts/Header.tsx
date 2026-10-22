import { Link, NavLink } from 'react-router-dom';
import { LogOut, Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Logo } from '@/components/Logo';
import { APP_NAME } from '@/config';
import type { User } from '@/types';
import { cn } from '@/utils/text';

interface HeaderProps {
  user: User;
  /** En desktop el botón colapsa el sidebar; en móvil/tablet abre el drawer. */
  isDesktop: boolean;
  sidebarOpen: boolean;
  sidebarId: string;
  onToggleSidebar: () => void;
  onAddResource: () => void;
  onLogout: () => void;
}

const iconButton =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15';

export function Header({ user, isDesktop, sidebarOpen, sidebarId, onToggleSidebar, onAddResource, onLogout }: HeaderProps) {
  const ToggleIcon = isDesktop ? (sidebarOpen ? PanelLeftClose : PanelLeftOpen) : MenuIcon;

  return (
    <header className="on-brand sticky top-0 z-40 h-16 bg-primary-500 shadow-sm">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-2 px-2 md:px-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls={sidebarId}
          aria-label={isDesktop ? (sidebarOpen ? 'Ocultar materias' : 'Mostrar materias') : 'Abrir menú de materias'}
          title={isDesktop ? (sidebarOpen ? 'Ocultar materias' : 'Mostrar materias') : undefined}
          className={iconButton}
        >
          <ToggleIcon className="h-6 w-6" aria-hidden />
        </button>

        <Link to="/" aria-label={`${APP_NAME}, ir al inicio`} className="rounded-lg px-1 py-1">
          <Logo />
        </Link>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {/* 1024–1279 px: la acción de la columna derecha pasa al header. */}
          <button
            type="button"
            onClick={onAddResource}
            className="hidden min-h-11 items-center gap-2 rounded-lg bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-700/85 lg:inline-flex xl:hidden"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Añadir recurso
          </button>

          <NavLink
            to="/cuenta"
            aria-label="Mi cuenta"
            title="Mi cuenta"
            className={({ isActive }) =>
              cn('inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/15', isActive && 'bg-white/20')
            }
          >
            <Avatar name={user.name} src={user.avatarUrl} size="sm" className="ring-white/70" />
          </NavLink>

          <button
            type="button"
            onClick={onLogout}
            className="hidden min-h-11 items-center gap-2 rounded-lg bg-primary-700 px-3 text-sm font-semibold text-white hover:bg-primary-700/85 md:inline-flex"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
