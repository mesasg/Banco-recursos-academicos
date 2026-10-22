import { Link } from 'react-router-dom';
import { StarOff } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button, buttonClasses } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useFavorites } from '@/context/FavoritesContext';

export function FavoritesTab() {
  const { favorites, loading, toggleFavorite } = useFavorites();

  if (loading) {
    return (
      <div className="card divide-y divide-line" role="status" aria-label="Cargando favoritos">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        illustration="star"
        title="Aún no tienes usuarios favoritos"
        description="En el feed, toca la estrella junto al nombre de un autor para seguir sus recursos."
        action={
          <Link to="/" className={buttonClasses({ variant: 'secondary' })}>
            Ir al feed
          </Link>
        }
      />
    );
  }

  return (
    <ul className="card divide-y divide-line" aria-label="Usuarios favoritos">
      {favorites.map((f) => (
        <li key={f.id} className="flex flex-wrap items-center gap-3 p-4">
          <Avatar name={f.name} src={f.avatarUrl} />
          {/* min-w-40: en móvil los botones bajan a otra línea en vez de aplastar el nombre. */}
          <div className="min-w-40 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{f.name}</p>
            <p className="truncate text-xs text-ink-muted">{f.careerName}</p>
          </div>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <Link to={`/?autor=${encodeURIComponent(f.id)}`} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
              Ver publicaciones
            </Link>
            <Button
              variant="danger-ghost"
              size="sm"
              onClick={() => toggleFavorite(f)}
              leftIcon={<StarOff className="h-4 w-4" aria-hidden />}
              aria-label={`Quitar a ${f.name} de favoritos`}
            >
              Quitar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
