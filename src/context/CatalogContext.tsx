import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { catalogService, errorMessage } from '@/services';
import type { Career, Subject } from '@/types';
import { useDataSync } from './DataSyncContext';

interface CatalogValue {
  careers: Career[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  findCareer: (id?: string | null) => Career | undefined;
  findSubject: (id?: string | null) => Subject | undefined;
}

const CatalogContext = createContext<CatalogValue | null>(null);

/** Carreras y materias (con su número de publicaciones), compartidas por toda la app. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const { postsVersion } = useDataSync();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    catalogService
      .getCareers()
      .then((data) => active && setCareers(data))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [postsVersion, attempt]);

  const reload = useCallback(() => {
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  const value = useMemo<CatalogValue>(() => {
    const subjects = new Map(careers.flatMap((c) => c.subjects.map((s) => [s.id, s] as const)));
    return {
      careers,
      loading,
      error,
      reload,
      findCareer: (id) => careers.find((c) => c.id === id),
      findSubject: (id) => (id ? subjects.get(id) : undefined),
    };
  }, [careers, loading, error, reload]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog debe usarse dentro de <CatalogProvider>');
  return ctx;
}
