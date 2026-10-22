import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

/** "foro" solo existe con una carrera o materia seleccionada. */
export type FeedView = 'recientes' | 'favoritos' | 'foro';

export interface FeedFilters {
  q: string;
  subjectId: string | null;
  careerId: string | null;
  authorId: string | null;
  view: FeedView;
}

/** `null` o '' quita el filtro. */
export type FeedFiltersPatch = { [K in keyof FeedFilters]?: FeedFilters[K] | null };

const PARAMS: Record<Exclude<keyof FeedFilters, 'view'>, string> = {
  q: 'q',
  subjectId: 'materia',
  careerId: 'carrera',
  authorId: 'autor',
};

function apply(base: URLSearchParams, patch: FeedFiltersPatch): URLSearchParams {
  const next = new URLSearchParams(base);
  // Materia y carrera son excluyentes: elegir una quita la otra.
  if (patch.subjectId) next.delete(PARAMS.careerId);
  if (patch.careerId) next.delete(PARAMS.subjectId);

  for (const key of Object.keys(PARAMS) as Array<keyof typeof PARAMS>) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value) next.set(PARAMS[key], value);
    else next.delete(PARAMS[key]);
  }
  if ('view' in patch) {
    if (patch.view && patch.view !== 'recientes') next.set('vista', patch.view);
    else next.delete('vista');
  }
  // Sin carrera ni materia no hay foro: se vuelve a "Recientes".
  if (next.get('vista') === 'foro' && !next.get(PARAMS.subjectId) && !next.get(PARAMS.careerId)) {
    next.delete('vista');
  }
  return next;
}

/**
 * Los filtros del feed viven en la URL (/?materia=sis-bases&q=normalizacion),
 * así se pueden compartir, recargar y usar con atrás/adelante.
 */
export function useFeedFilters() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const onFeed = location.pathname === '/';

  const filters = useMemo<FeedFilters>(() => {
    const subjectId = params.get(PARAMS.subjectId);
    const careerId = params.get(PARAMS.careerId);
    const vista = params.get('vista');
    const view: FeedView =
      vista === 'favoritos' ? 'favoritos' : vista === 'foro' && (subjectId || careerId) ? 'foro' : 'recientes';
    return { q: params.get(PARAMS.q) ?? '', subjectId, careerId, authorId: params.get(PARAMS.authorId), view };
  }, [params]);

  /** URL del feed con los filtros aplicados (conserva los actuales si ya estás en el feed). */
  const feedHref = useCallback(
    (patch: FeedFiltersPatch) => {
      const search = apply(onFeed ? params : new URLSearchParams(), patch).toString();
      return search ? `/?${search}` : '/';
    },
    [onFeed, params],
  );

  const setFilters = useCallback(
    (patch: FeedFiltersPatch, options: { replace?: boolean } = {}) => {
      navigate(feedHref(patch), { replace: options.replace });
    },
    [navigate, feedHref],
  );

  const clearFilters = useCallback(() => navigate('/'), [navigate]);

  return { filters, setFilters, feedHref, clearFilters, onFeed };
}
