import type { ProfileUpdate, User, UserStats, UserSummary } from '@/types';
import { api, ApiError } from './apiClient';
import type { RecursoDto } from './mappers';

/**
 * Estadísticas del perfil a partir de GET /api/recursos.
 * Favoritos y edición de perfil no existen en el backend (FEATURES en config).
 */

export async function getUserStats(userId: string): Promise<UserStats> {
  const recursos = (await api.get<RecursoDto[]>('/api/recursos')).filter((r) => r.idAutor === userId);
  let sum = 0;
  let count = 0;
  for (const r of recursos) {
    sum += (r.promedioValoracion ?? 0) * (r.cantidadValoraciones ?? 0);
    count += r.cantidadValoraciones ?? 0;
  }
  return { postCount: recursos.length, ratingAvg: count ? sum / count : 0, ratingCount: count };
}

export async function getFavorites(): Promise<UserSummary[]> {
  return [];
}

const notAvailable = () => new ApiError('Esta función no está disponible en esta versión.', 501);

export async function addFavorite(_userId: string): Promise<void> {
  throw notAvailable();
}

export async function removeFavorite(_userId: string): Promise<void> {
  throw notAvailable();
}

export async function updateProfile(_update: ProfileUpdate): Promise<User> {
  throw notAvailable();
}
