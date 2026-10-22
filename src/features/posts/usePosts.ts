import { useCallback, useEffect, useRef, useState } from 'react';
import { FEED_PAGE_SIZE } from '@/config';
import { useDataSync } from '@/context/DataSyncContext';
import { errorMessage, postService } from '@/services';
import type { Post, PostQuery } from '@/types';

type Status = 'loading' | 'success' | 'error';

function mergeUnique(current: Post[], incoming: Post[]): Post[] {
  const seen = new Set(current.map((p) => p.id));
  return [...current, ...incoming.filter((p) => !seen.has(p.id))];
}

/**
 * Lista paginada de publicaciones. Muestra skeleton cuando cambian los filtros
 * y se refresca en silencio cuando otra pantalla crea/edita/elimina un recurso.
 */
export function usePosts(
  query: Omit<PostQuery, 'page' | 'pageSize'>,
  {
    enabled = true,
    refreshToken,
  }: {
    enabled?: boolean;
    /** Si cambia, se refresca en silencio (p. ej. al cambiar la lista de favoritos). */
    refreshToken?: string | number;
  } = {},
) {
  const { postsVersion } = useDataSync();
  const [items, setItems] = useState<Post[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const key = JSON.stringify(query);
  const lastKey = useRef<string | null>(null);
  const requestId = useRef(0);
  const loadedPages = useRef(1);

  useEffect(() => {
    if (!enabled) return;
    const id = ++requestId.current;
    const filtersChanged = lastKey.current !== key;
    lastKey.current = key;

    // Filtros nuevos → skeleton y página 1. Mismo filtro → refresco silencioso de lo ya cargado.
    const pages = filtersChanged ? 1 : loadedPages.current;
    if (filtersChanged) {
      setStatus('loading');
      setItems([]);
    }
    setError(null);

    postService
      .getPosts({ ...(JSON.parse(key) as PostQuery), page: 1, pageSize: pages * FEED_PAGE_SIZE })
      .then((res) => {
        if (id !== requestId.current) return;
        loadedPages.current = pages;
        setItems(res.items);
        setPage(pages);
        setHasMore(res.hasMore);
        setTotal(res.total);
        setStatus('success');
      })
      .catch((e) => {
        if (id !== requestId.current) return;
        setError(errorMessage(e, 'No pudimos cargar las publicaciones.'));
        setStatus('error');
      });
  }, [key, postsVersion, attempt, enabled, refreshToken]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const res = await postService.getPosts({ ...(JSON.parse(key) as PostQuery), page: page + 1, pageSize: FEED_PAGE_SIZE });
      if (id !== requestId.current) return;
      loadedPages.current = page + 1;
      setItems((current) => mergeUnique(current, res.items));
      setPage(page + 1);
      setHasMore(res.hasMore);
      setTotal(res.total);
    } catch (e) {
      if (id === requestId.current) setError(errorMessage(e, 'No pudimos cargar más publicaciones.'));
    } finally {
      if (id === requestId.current) setLoadingMore(false);
    }
  }, [key, page, hasMore, loadingMore]);

  const retry = useCallback(() => {
    lastKey.current = null;
    setAttempt((a) => a + 1);
  }, []);

  const updateItem = useCallback((post: Post) => {
    setItems((current) => current.map((p) => (p.id === post.id ? post : p)));
  }, []);

  return { items, status, error, hasMore, total, loadingMore, loadMore, retry, updateItem };
}
