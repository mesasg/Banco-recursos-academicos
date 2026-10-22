import { Clock, Plus, Star } from 'lucide-react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { TabPanel, Tabs } from '@/components/Tabs';
import { useCatalog } from '@/context/CatalogContext';
import { useFavorites } from '@/context/FavoritesContext';
import { SearchBar } from '@/features/feed/SearchBar';
import { useFeedFilters, type FeedView } from '@/features/feed/useFeedFilters';
import { PostList } from '@/features/posts/PostList';
import { usePostFormNavigation } from '@/features/posts/usePostFormNavigation';
import { usePosts } from '@/features/posts/usePosts';
import { pluralize } from '@/utils/format';

const TABS_ID = 'feed';

export function HomePage() {
  const { filters, setFilters, clearFilters } = useFeedFilters();
  const { findSubject, findCareer } = useCatalog();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const { openCreate } = usePostFormNavigation();

  const onlyFavorites = filters.view === 'favoritos';
  const favoritesKey = favorites.map((f) => f.id).sort().join(',');

  const posts = usePosts(
    {
      q: filters.q || undefined,
      subjectId: filters.subjectId ?? undefined,
      careerId: filters.careerId ?? undefined,
      authorId: filters.authorId ?? undefined,
      onlyFavorites,
    },
    // En "Favoritos", agregar o quitar a alguien refresca la lista.
    { refreshToken: onlyFavorites ? favoritesKey : undefined },
  );

  const subject = findSubject(filters.subjectId);
  const career = findCareer(filters.careerId);
  const authorName =
    favorites.find((f) => f.id === filters.authorId)?.name ??
    posts.items.find((p) => p.author.id === filters.authorId)?.author.name ??
    'autor seleccionado';

  const activeFilters = [filters.subjectId, filters.careerId, filters.authorId, filters.q].filter(Boolean).length;

  const empty = (() => {
    if (onlyFavorites && !favoritesLoading && favorites.length === 0) {
      return (
        <EmptyState
          illustration="star"
          title="Aún no tienes usuarios favoritos"
          description="Toca la estrella junto al nombre de un autor y aquí verás solo lo que publica."
          action={
            <Button variant="secondary" onClick={() => setFilters({ view: 'recientes' })}>
              Ver publicaciones recientes
            </Button>
          }
        />
      );
    }
    if (filters.q) {
      return (
        <EmptyState
          illustration="search"
          title={`No encontramos resultados para “${filters.q}”`}
          description="Prueba con otras palabras, revisa la ortografía o quita algún filtro."
          action={
            <Button variant="secondary" onClick={() => setFilters({ q: null })}>
              Limpiar búsqueda
            </Button>
          }
        />
      );
    }
    if (onlyFavorites) {
      return (
        <EmptyState
          illustration="star"
          title="Tus favoritos aún no han publicado aquí"
          description="Cuando compartan recursos con estos filtros, los verás en esta pestaña."
          action={
            <Button variant="secondary" onClick={() => setFilters({ view: 'recientes' })}>
              Ver todas las publicaciones
            </Button>
          }
        />
      );
    }
    const place = subject?.name ?? career?.name;
    return (
      <EmptyState
        title={place ? `Aún no hay recursos en ${place}, ¡sé el primero!` : 'Aún no hay recursos, ¡sé el primero!'}
        description="Comparte tus apuntes, diagramas, PDFs o enlaces útiles para que otros estudiantes aprendan contigo."
        action={
          <Button onClick={() => openCreate(filters.subjectId)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Añadir recurso
          </Button>
        }
      />
    );
  })();

  return (
    <div className="mx-auto max-w-feed">
      <h1 className="sr-only">Publicaciones</h1>

      <SearchBar />

      <Tabs<FeedView>
        idBase={TABS_ID}
        label="Tipo de feed"
        value={filters.view}
        onChange={(view) => setFilters({ view })}
        fill
        className="mt-4 sm:[&>button]:flex-none"
        items={[
          { id: 'recientes', label: 'Recientes', icon: <Clock className="h-4 w-4" aria-hidden /> },
          { id: 'favoritos', label: 'Favoritos', icon: <Star className="h-4 w-4" aria-hidden /> },
        ]}
      />

      <TabPanel idBase={TABS_ID} id={filters.view} className="pt-4">
        {(activeFilters > 0 || posts.status === 'success') && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {subject && (
              <Chip onRemove={() => setFilters({ subjectId: null })} removeLabel={`Quitar filtro ${subject.name}`}>
                {subject.name}
              </Chip>
            )}
            {career && (
              <Chip onRemove={() => setFilters({ careerId: null })} removeLabel={`Quitar filtro ${career.name}`}>
                {career.name}
              </Chip>
            )}
            {filters.authorId && (
              <Chip onRemove={() => setFilters({ authorId: null })} removeLabel={`Quitar filtro de ${authorName}`}>
                De {authorName}
              </Chip>
            )}
            {activeFilters > 1 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 items-center rounded px-1 text-xs font-semibold text-primary-700 hover:underline md:min-h-8"
              >
                Limpiar filtros
              </button>
            )}
            <p className="ml-auto text-xs text-ink-muted" aria-live="polite">
              {posts.status === 'success' && pluralize(posts.total, 'recurso', 'recursos')}
            </p>
          </div>
        )}

        <PostList posts={posts} empty={empty} label={onlyFavorites ? 'Publicaciones de tus favoritos' : 'Publicaciones recientes'} />
      </TabPanel>
    </div>
  );
}
