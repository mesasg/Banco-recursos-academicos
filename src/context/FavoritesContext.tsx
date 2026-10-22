import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToast } from '@/components/Toast';
import { errorMessage, userService } from '@/services';
import type { UserSummary } from '@/types';
import { firstName } from '@/utils/text';
import { useAuth } from './AuthContext';

interface FavoritesValue {
  favorites: UserSummary[];
  loading: boolean;
  isFavorite: (userId: string) => boolean;
  toggleFavorite: (user: UserSummary) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

/** Usuarios favoritos del usuario actual (estrella en las publicaciones). */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [favorites, setFavorites] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    let active = true;
    setLoading(true);
    userService
      .getFavorites()
      .then((list) => active && setFavorites(list))
      .catch(() => active && setFavorites([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user?.id]);

  const isFavorite = useCallback((userId: string) => favorites.some((f) => f.id === userId), [favorites]);

  const toggleFavorite = useCallback(
    async (target: UserSummary) => {
      const wasFavorite = favorites.some((f) => f.id === target.id);
      // Actualización optimista: la estrella responde al instante.
      setFavorites((list) => (wasFavorite ? list.filter((f) => f.id !== target.id) : [...list, target]));
      try {
        if (wasFavorite) await userService.removeFavorite(target.id);
        else await userService.addFavorite(target.id);
        toast.success(
          wasFavorite
            ? `${firstName(target.name)} ya no está en tus favoritos.`
            : `Agregaste a ${firstName(target.name)} a tus favoritos.`,
        );
      } catch (error) {
        setFavorites((list) => (wasFavorite ? [...list, target] : list.filter((f) => f.id !== target.id)));
        toast.error(errorMessage(error, 'No pudimos actualizar tus favoritos.'));
      }
    },
    [favorites, toast],
  );

  const value = useMemo(() => ({ favorites, loading, isFavorite, toggleFavorite }), [favorites, loading, isFavorite, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return ctx;
}
