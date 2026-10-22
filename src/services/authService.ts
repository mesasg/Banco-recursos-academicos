import { db, persist } from '@/mocks/db';
import type { Session } from '@/types';
import { ApiError, mockDelay, setAuthToken } from './apiClient';
import { toUser } from './mappers';

/**
 * Autenticación.
 * Backend real: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me,
 * PUT /api/auth/password, DELETE /api/users/me (o Supabase Auth).
 */

const SESSION_KEY = 'notadad:session';

interface StoredSession {
  token: string;
  userId: string;
}

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStored(session: StoredSession, remember: boolean): void {
  try {
    clearStored();
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Sin almacenamiento: la sesión dura lo que dure la pestaña.
  }
}

function clearStored(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nada que limpiar.
  }
}

/** userId de la sesión activa; los servicios mock lo usan como "usuario autenticado". */
export function currentUserId(): string {
  const stored = readStored();
  if (!stored) throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  return stored.userId;
}

export async function login(email: string, password: string, remember: boolean): Promise<Session> {
  await mockDelay(500, 900);
  const user = db().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError('Correo o contraseña incorrectos.', 401, 'INVALID_CREDENTIALS');
  }
  const token = `mock-token-${user.id}-${Date.now()}`;
  writeStored({ token, userId: user.id }, remember);
  setAuthToken(token);
  return { token, user: toUser(user) };
}

/** Recupera la sesión guardada al recargar la página. */
export async function restoreSession(): Promise<Session | null> {
  const stored = readStored();
  if (!stored) return null;
  await mockDelay(150, 300);
  const user = db().users.find((u) => u.id === stored.userId);
  if (!user) {
    clearStored();
    return null;
  }
  setAuthToken(stored.token);
  return { token: stored.token, user: toUser(user) };
}

export async function logout(): Promise<void> {
  clearStored();
  setAuthToken(null);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await mockDelay(600, 900);
  // Por seguridad la respuesta es la misma exista o no el correo.
  void email;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await mockDelay();
  const user = db().users.find((u) => u.id === currentUserId());
  if (!user) throw new ApiError('Usuario no encontrado.', 404);
  if (user.password !== currentPassword) {
    throw new ApiError('La contraseña actual no es correcta.', 400, 'WRONG_PASSWORD');
  }
  user.password = newPassword;
  persist();
}

export async function deleteAccount(): Promise<void> {
  await mockDelay(600, 900);
  const data = db();
  const userId = currentUserId();
  data.users = data.users.filter((u) => u.id !== userId);
  data.posts = data.posts.filter((p) => p.authorId !== userId);
  delete data.favorites[userId];
  for (const list of Object.keys(data.favorites)) {
    data.favorites[list] = data.favorites[list].filter((id) => id !== userId);
  }
  persist();
  clearStored();
  setAuthToken(null);
}
