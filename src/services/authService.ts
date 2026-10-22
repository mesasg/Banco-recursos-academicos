import { db, newId, persist } from '@/mocks/db';
import type { RegisterInput, Session } from '@/types';
import { ApiError, mockDelay, setAuthToken } from './apiClient';
import { toUser } from './mappers';

/**
 * Autenticación.
 * Backend real: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me,
 * PUT /api/auth/password, DELETE /api/users/me (o Supabase Auth).
 */

const SESSION_KEY = 'ingenotes:session';

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

/** Crea la cuenta e inicia sesión. Backend real: POST /api/auth/register. */
export async function register(input: RegisterInput): Promise<Session> {
  await mockDelay(600, 1000);
  const data = db();
  const email = input.email.trim().toLowerCase();
  if (data.users.some((u) => u.email.toLowerCase() === email)) {
    throw new ApiError('Ya existe una cuenta con ese correo. Inicia sesión o usa otro.', 409, 'EMAIL_TAKEN');
  }
  if (!data.careers.some((c) => c.id === input.careerId)) {
    throw new ApiError('Elige una carrera válida.', 400);
  }
  const user = {
    id: newId('u'),
    name: `${input.firstName.trim()} ${input.lastName.trim()}`,
    email,
    careerId: input.careerId,
    joinedAt: new Date().toISOString(),
    password: input.password,
  };
  data.users.push(user);
  data.favorites[user.id] = [];
  persist();

  const token = `mock-token-${user.id}-${Date.now()}`;
  writeStored({ token, userId: user.id }, true);
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
  const removedThreads = new Set(data.threads.filter((t) => t.authorId === userId).map((t) => t.id));
  data.threads = data.threads.filter((t) => !removedThreads.has(t.id));
  data.replies = data.replies.filter((r) => r.authorId !== userId && !removedThreads.has(r.threadId));
  delete data.favorites[userId];
  for (const list of Object.keys(data.favorites)) {
    data.favorites[list] = data.favorites[list].filter((id) => id !== userId);
  }
  persist();
  clearStored();
  setAuthToken(null);
}
