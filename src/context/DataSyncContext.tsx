import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Señal compartida de "las publicaciones cambiaron". Cuando se crea, edita o
 * elimina un recurso, el feed, los contadores del sidebar y el perfil se
 * vuelven a pedir. (Con una librería de caché como TanStack Query esto sería
 * una invalidación de queries.)
 */
interface DataSyncValue {
  postsVersion: number;
  invalidatePosts: () => void;
}

const DataSyncContext = createContext<DataSyncValue | null>(null);

export function DataSyncProvider({ children }: { children: ReactNode }) {
  const [postsVersion, setPostsVersion] = useState(0);
  const invalidatePosts = useCallback(() => setPostsVersion((v) => v + 1), []);
  const value = useMemo(() => ({ postsVersion, invalidatePosts }), [postsVersion, invalidatePosts]);
  return <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>;
}

export function useDataSync(): DataSyncValue {
  const ctx = useContext(DataSyncContext);
  if (!ctx) throw new Error('useDataSync debe usarse dentro de <DataSyncProvider>');
  return ctx;
}
