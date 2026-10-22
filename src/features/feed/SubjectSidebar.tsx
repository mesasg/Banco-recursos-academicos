import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LayoutGrid, Search, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import type { Career } from '@/types';
import { cn, normalize } from '@/utils/text';
import { useFeedFilters } from './useFeedFilters';

interface SubjectSidebarProps {
  /** Se llama al elegir un filtro (para cerrar el drawer en móvil). */
  onNavigate?: () => void;
}

const itemClass = (active: boolean) =>
  cn(
    'flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors md:min-h-9',
    active ? 'bg-primary-100 font-semibold text-primary-700' : 'text-ink hover:bg-primary-100/60',
  );

function CountBadge({ value, active }: { value: number; active?: boolean }) {
  return (
    <span
      className={cn(
        'ml-auto min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs tabular-nums',
        active ? 'bg-primary-600 text-white' : 'bg-surface text-ink-muted ring-1 ring-line',
      )}
    >
      {value}
    </span>
  );
}

/** Lista de carreras (acordeón) con sus materias. Funciona como filtro del feed. */
export function SubjectSidebar({ onNavigate }: SubjectSidebarProps) {
  const { careers, loading, error, reload, findSubject } = useCatalog();
  const { user } = useAuth();
  const { filters, feedHref, onFeed } = useFeedFilters();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(user ? [user.careerId] : []));

  const activeSubject = onFeed ? filters.subjectId : null;
  const activeCareer = onFeed ? filters.careerId : null;

  // Abre la carrera del filtro activo (p. ej. al llegar con un enlace /?materia=...).
  const activeCareerId = findSubject(activeSubject)?.careerId ?? activeCareer;
  useEffect(() => {
    if (activeCareerId) setExpanded((prev) => (prev.has(activeCareerId) ? prev : new Set(prev).add(activeCareerId)));
  }, [activeCareerId]);

  const term = normalize(search);
  const visible = useMemo<Career[]>(() => {
    if (!term) return careers;
    return careers
      .map((c) =>
        normalize(c.name).includes(term) ? c : { ...c, subjects: c.subjects.filter((s) => normalize(s.name).includes(term)) },
      )
      .filter((c) => c.subjects.length > 0);
  }, [careers, term]);

  const total = careers.reduce((sum, c) => sum + c.subjects.reduce((s, x) => s + x.postCount, 0), 0);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <nav aria-label="Carreras y materias" className="flex flex-col gap-3 p-3">
      <div className="relative">
        <label htmlFor="sidebar-search" className="sr-only">
          Buscar materia o carrera
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          id="sidebar-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar materia…"
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-line bg-surface pl-9 pr-10 text-sm placeholder:text-ink-muted/80 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/25 md:h-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda de materias"
            className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-ink-muted hover:text-ink md:h-10 md:w-10"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {!term && (
        <Link
          to={feedHref({ subjectId: null, careerId: null })}
          onClick={onNavigate}
          aria-current={onFeed && !activeSubject && !activeCareer ? 'page' : undefined}
          className={itemClass(onFeed && !activeSubject && !activeCareer)}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
          Todas las materias
          {!loading && <CountBadge value={total} active={onFeed && !activeSubject && !activeCareer} />}
        </Link>
      )}

      <h2 className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Carreras</h2>

      {loading && careers.length === 0 && (
        <div className="space-y-2 px-1" aria-label="Cargando materias" role="status">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      )}

      {error && careers.length === 0 && (
        <div className="rounded-lg border border-danger/30 bg-surface p-3 text-sm">
          <p className="text-danger">No pudimos cargar las materias.</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={reload}>
            Reintentar
          </Button>
        </div>
      )}

      {term && visible.length === 0 && (
        <p className="px-3 text-sm text-ink-muted">No hay materias que coincidan con “{search}”.</p>
      )}

      <ul className="flex flex-col gap-1">
        {visible.map((career) => {
          const isOpen = Boolean(term) || expanded.has(career.id);
          const listId = `career-${career.id}`;
          const count = career.subjects.reduce((s, x) => s + x.postCount, 0);
          const careerActive = activeCareer === career.id;
          return (
            <li key={career.id}>
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(career.id)}
                  aria-expanded={isOpen}
                  aria-controls={listId}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-primary-100/60"
                >
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-ink-muted transition-transform', !isOpen && '-rotate-90')}
                    aria-hidden
                  />
                  <span className="flex-1">{career.name}</span>
                </button>
              </h3>
              {isOpen && (
                <ul id={listId} className="ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-line pl-2">
                  {!term && (
                    <li>
                      <Link
                        to={feedHref({ careerId: career.id })}
                        onClick={onNavigate}
                        aria-current={careerActive ? 'page' : undefined}
                        className={itemClass(careerActive)}
                      >
                        <span className="flex-1">Todo {career.shortName}</span>
                        <CountBadge value={count} active={careerActive} />
                      </Link>
                    </li>
                  )}
                  {career.subjects.map((subject) => {
                    const active = activeSubject === subject.id;
                    return (
                      <li key={subject.id}>
                        <Link
                          to={feedHref({ subjectId: subject.id })}
                          onClick={onNavigate}
                          aria-current={active ? 'page' : undefined}
                          className={itemClass(active)}
                        >
                          <span className="flex-1">{subject.name}</span>
                          <CountBadge value={subject.postCount} active={active} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
