import { useEffect, useRef, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PostCard } from '@/components/PostCard';
import { FeedSkeleton } from '@/components/Skeleton';
import { useFeedFilters } from '@/features/feed/useFeedFilters';
import { useDeletePost } from './useDeletePost';
import { usePostFormNavigation } from './usePostFormNavigation';
import type { usePosts } from './usePosts';

interface PostListProps {
  posts: ReturnType<typeof usePosts>;
  /** Estado vacío según el contexto (materia, búsqueda, favoritos…). */
  empty: ReactNode;
  label: string;
}

/** Lista de PostCard con skeleton, error, vacío y scroll infinito (+ botón "Cargar más"). */
export function PostList({ posts, empty, label }: PostListProps) {
  const { items, status, error, hasMore, loadingMore, loadMore, retry, updateItem } = posts;
  const { setFilters } = useFeedFilters();
  const { openEdit } = usePostFormNavigation();
  const { requestDelete, dialog } = useDeletePost();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Scroll infinito: al acercarse al final se pide la siguiente página.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || status !== 'success') return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: '400px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, status, loadMore]);

  const applyFilter = (patch: Parameters<typeof setFilters>[0]) => {
    setFilters(patch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'loading') return <FeedSkeleton />;

  if (status === 'error') {
    return (
      <EmptyState
        illustration="error"
        title="No pudimos cargar las publicaciones"
        description={error ?? 'Revisa tu conexión e intenta de nuevo.'}
        action={
          <Button variant="secondary" onClick={retry} leftIcon={<RotateCw className="h-4 w-4" aria-hidden />}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (items.length === 0) return <>{empty}</>;

  return (
    <>
      <ul className="space-y-4" aria-label={label}>
        {items.map((post) => (
          <li key={post.id}>
            <PostCard
              post={post}
              onEdit={(p) => openEdit(p.id)}
              onDelete={requestDelete}
              onFilterSubject={(subjectId) => applyFilter({ subjectId })}
              onFilterCareer={(careerId) => applyFilter({ careerId })}
              onPostChange={updateItem}
            />
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} className="mt-6 flex flex-col items-center gap-2">
        {hasMore ? (
          <Button variant="secondary" onClick={loadMore} loading={loadingMore} loadingLabel="Cargando…">
            Cargar más
          </Button>
        ) : (
          <p className="text-sm text-ink-muted">Llegaste al final. ¡Estás al día!</p>
        )}
        {error && status === 'success' && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      {dialog}
    </>
  );
}
