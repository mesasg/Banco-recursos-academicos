import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { useFavorites } from '@/context/FavoritesContext';
import { useFeedFilters } from '@/features/feed/useFeedFilters';
import { cn } from '@/utils/text';

/** Columna derecha (≥1280 px): usuarios favoritos arriba y "Añadir recurso" abajo, como en el mock-up. */
export function RightAside({ onAddResource, className }: { onAddResource: () => void; className?: string }) {
  const { favorites, loading } = useFavorites();
  const { feedHref, filters, onFeed } = useFeedFilters();

  return (
    <aside
      aria-label="Accesos rápidos"
      className={cn('sticky top-16 h-[calc(100vh-4rem)] w-[280px] shrink-0 flex-col gap-4 overflow-y-auto p-4', className)}
    >
      <section className="card p-4" aria-labelledby="favorites-title">
        <div className="flex items-center justify-between">
          <h2 id="favorites-title" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Star className="h-4 w-4 text-warning" fill="currentColor" aria-hidden />
            Usuarios favoritos
          </h2>
          <Link to="/cuenta?tab=favoritos" className="rounded text-xs font-semibold text-primary-700 hover:underline">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="mt-3 space-y-3" role="status" aria-label="Cargando favoritos">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Marca la estrella junto al nombre de un autor para seguir sus recursos desde aquí.
          </p>
        ) : (
          <ul className="mt-2 -mx-2">
            {favorites.map((f) => {
              const active = onFeed && filters.authorId === f.id;
              return (
                <li key={f.id}>
                  <Link
                    to={feedHref({ authorId: f.id })}
                    aria-current={active ? 'page' : undefined}
                    title={`Ver publicaciones de ${f.name}`}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 transition-colors',
                      active ? 'bg-primary-100' : 'hover:bg-canvas',
                    )}
                  >
                    <Avatar name={f.name} src={f.avatarUrl} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{f.name}</span>
                      <span className="block truncate text-xs text-ink-muted">{f.careerName}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-auto">
        <Button size="lg" fullWidth onClick={onAddResource} leftIcon={<Plus className="h-5 w-5" aria-hidden />} className="shadow-raised">
          Añadir recurso
        </Button>
      </div>
    </aside>
  );
}
