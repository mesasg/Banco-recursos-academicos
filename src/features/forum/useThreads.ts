import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, forumService } from '@/services';
import type { ForumThread, ThreadQuery } from '@/types';

type Status = 'loading' | 'success' | 'error';

/** Preguntas del foro de una carrera o materia, con "Cargar más". */
export function useThreads(query: Omit<ThreadQuery, 'page' | 'pageSize'>) {
  const [items, setItems] = useState<ForumThread[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const requestId = useRef(0);
  const key = JSON.stringify(query);

  useEffect(() => {
    const id = ++requestId.current;
    setStatus('loading');
    setError(null);
    forumService
      .getThreads({ ...(JSON.parse(key) as ThreadQuery), page: 1 })
      .then((res) => {
        if (id !== requestId.current) return;
        setItems(res.items);
        setPage(1);
        setHasMore(res.hasMore);
        setTotal(res.total);
        setStatus('success');
      })
      .catch((e) => {
        if (id !== requestId.current) return;
        setError(errorMessage(e, 'No pudimos cargar el foro.'));
        setStatus('error');
      });
  }, [key, attempt]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const res = await forumService.getThreads({ ...(JSON.parse(key) as ThreadQuery), page: page + 1 });
      if (id !== requestId.current) return;
      setItems((current) => [...current, ...res.items.filter((t) => !current.some((c) => c.id === t.id))]);
      setPage(page + 1);
      setHasMore(res.hasMore);
    } catch (e) {
      if (id === requestId.current) setError(errorMessage(e, 'No pudimos cargar más preguntas.'));
    } finally {
      if (id === requestId.current) setLoadingMore(false);
    }
  }, [key, page, hasMore, loadingMore]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { items, status, error, hasMore, total, loadingMore, loadMore, retry };
}
