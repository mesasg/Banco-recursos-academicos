import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { SEARCH_DEBOUNCE_MS } from '@/config';
import { useDebounce } from '@/hooks/useDebounce';
import { useFeedFilters } from './useFeedFilters';

/** Búsqueda del feed: escribe en la URL (?q=) con debounce de 300 ms. */
export function SearchBar() {
  const { filters, setFilters } = useFeedFilters();
  const [value, setValue] = useState(filters.q);
  const debounced = useDebounce(value, SEARCH_DEBOUNCE_MS);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPushed = useRef(filters.q);
  const setFiltersRef = useRef(setFilters);
  setFiltersRef.current = setFilters;

  const push = (q: string) => {
    lastPushed.current = q;
    setFiltersRef.current({ q: q || null }, { replace: true });
  };

  // URL → input (atrás/adelante, "Limpiar búsqueda" desde el estado vacío).
  useEffect(() => {
    if (filters.q !== lastPushed.current) {
      lastPushed.current = filters.q;
      setValue(filters.q);
    }
  }, [filters.q]);

  // input → URL, con debounce.
  useEffect(() => {
    const q = debounced.trim();
    if (q !== lastPushed.current) push(q);
  }, [debounced]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = value.trim();
    if (q !== lastPushed.current) push(q);
  };

  const clear = () => {
    setValue('');
    push('');
    inputRef.current?.focus();
  };

  return (
    <form role="search" onSubmit={onSubmit} className="relative">
      <label htmlFor="feed-search" className="sr-only">
        Buscar recursos
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
      <input
        ref={inputRef}
        id="feed-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Busca título, materia o autor…"
        title="Busca por título, descripción, materia o autor"
        autoComplete="off"
        enterKeyHint="search"
        className="h-12 w-full rounded-xl border border-line bg-surface pl-12 pr-12 text-[15px] text-ink shadow-card placeholder:text-ink-muted/80 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpiar búsqueda"
          className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}
    </form>
  );
}
