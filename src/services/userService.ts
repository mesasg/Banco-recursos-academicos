import type { ProfileUpdate, User, UserStats, UserSummary } from '@/types';
import { api } from './apiClient';
import { toUser, toUserSummary, type AutorDto, type RecursoDto, type UsuarioDto } from './mappers';

/**
 * Perfil, estadísticas y usuarios favoritos:
 *   GET    /api/recursos                         (estadísticas del perfil)
 *   PUT    /api/usuarios/me                      { nombre, idCarrera }
 *   GET    /api/usuarios/me/favoritos
 *   PUT    /api/usuarios/me/favoritos/:idUsuario
 *   DELETE /api/usuarios/me/favoritos/:idUsuario
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
  const favoritos = await api.get<AutorDto[]>('/api/usuarios/me/favoritos');
  return favoritos.map(toUserSummary);
}

export async function addFavorite(userId: string): Promise<void> {
  await api.put<void>(`/api/usuarios/me/favoritos/${userId}`);
}

export async function removeFavorite(userId: string): Promise<void> {
  await api.delete<void>(`/api/usuarios/me/favoritos/${userId}`);
}

/** Actualiza nombre y carrera. La foto de perfil no se envía (FEATURES.avatar). */
export async function updateProfile(update: ProfileUpdate): Promise<User> {
  const usuario = await api.put<UsuarioDto>('/api/usuarios/me', {
    nombre: update.name.trim(),
    idCarrera: update.careerId || null,
  });
  return toUser(usuario);
}
