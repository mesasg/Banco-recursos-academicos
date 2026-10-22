import { db, persist } from '@/mocks/db';
import type { ProfileUpdate, User, UserStats, UserSummary } from '@/types';
import { ApiError, mockDelay } from './apiClient';
import { currentUserId } from './authService';
import { ratingOf, toUser, toUserSummary } from './mappers';

/**
 * Perfil y usuarios favoritos.
 * Backend real:
 *   PUT    /api/users/me              (multipart con la foto)
 *   GET    /api/users/:id/stats
 *   GET    /api/users/me/favorites    POST/DELETE /api/users/me/favorites/:userId
 */

export async function getUserStats(userId: string): Promise<UserStats> {
  await mockDelay(200, 400);
  const posts = db().posts.filter((p) => p.authorId === userId);
  let sum = 0;
  let count = 0;
  for (const p of posts) {
    const r = ratingOf(p);
    sum += r.avg * r.count;
    count += r.count;
  }
  return { postCount: posts.length, ratingAvg: count ? sum / count : 0, ratingCount: count };
}

export async function getFavorites(): Promise<UserSummary[]> {
  await mockDelay(200, 400);
  const ids = db().favorites[currentUserId()] ?? [];
  return ids
    .map((id) => db().users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map(toUserSummary);
}

export async function addFavorite(userId: string): Promise<void> {
  await mockDelay(150, 300);
  const me = currentUserId();
  if (userId === me) throw new ApiError('No puedes agregarte a ti mismo como favorito.', 400);
  const list = (db().favorites[me] ??= []);
  if (!list.includes(userId)) list.push(userId);
  persist();
}

export async function removeFavorite(userId: string): Promise<void> {
  await mockDelay(150, 300);
  const me = currentUserId();
  db().favorites[me] = (db().favorites[me] ?? []).filter((id) => id !== userId);
  persist();
}

/** Recorta la foto a un cuadrado de 256 px para el avatar. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  canvas
    .getContext('2d')
    ?.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

export async function updateProfile(update: ProfileUpdate): Promise<User> {
  await mockDelay(500, 800);
  const user = db().users.find((u) => u.id === currentUserId());
  if (!user) throw new ApiError('Usuario no encontrado.', 404);
  if (!update.name.trim()) throw new ApiError('El nombre es obligatorio.', 400);
  user.name = update.name.trim();
  user.careerId = update.careerId;
  if (update.avatarFile === null) user.avatarUrl = undefined;
  else if (update.avatarFile) user.avatarUrl = await toAvatarDataUrl(update.avatarFile);
  persist();
  return toUser(user);
}
