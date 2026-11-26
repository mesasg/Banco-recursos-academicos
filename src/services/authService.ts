import type { RegisterInput, Session, User } from '@/types';
import { api, ApiError, setAuthToken } from './apiClient';
import { toUser, type UsuarioDto } from './mappers';

/**
 * Autenticación contra el backend:
 *   POST /api/auth/registro  { nombre, correo, contrasena }
 *   POST /api/auth/login     { correo, contrasena } -> { accessToken }
 *   GET  /api/auth/me        -> usuario del token
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

/** Id del usuario de la sesión activa. */
export function currentUserId(): string {
  const stored = readStored();
  if (!stored) throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  return stored.userId;
}

async function fetchMe(): Promise<User> {
  return toUser(await api.get<UsuarioDto>('/api/auth/me'));
}

export async function login(email: string, password: string, remember: boolean): Promise<Session> {
  let token: string;
  try {
    const res = await api.post<{ accessToken: string }>('/api/auth/login', {
      correo: email.trim().toLowerCase(),
      contrasena: password,
    });
    token = res.accessToken;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
      throw new ApiError('Correo o contraseña incorrectos.', 401, 'INVALID_CREDENTIALS');
    }
    throw error;
  }
  setAuthToken(token);
  const user = await fetchMe();
  writeStored({ token, userId: user.id }, remember);
  return { token, user };
}

/** Crea la cuenta e inicia sesión. */
export async function register(input: RegisterInput): Promise<Session> {
  try {
    await api.post<UsuarioDto>('/api/auth/registro', {
      nombre: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
      correo: input.email.trim().toLowerCase(),
      contrasena: input.password,
      idCarrera: input.careerId || null,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && /registrado/i.test(error.message)) {
      throw new ApiError('Ya existe una cuenta con ese correo. Inicia sesión o usa otro.', 409, 'EMAIL_TAKEN');
    }
    throw error;
  }
  return login(input.email, input.password, true);
}

/** Recupera la sesión guardada al recargar la página. */
export async function restoreSession(): Promise<Session | null> {
  const stored = readStored();
  if (!stored) return null;
  setAuthToken(stored.token);
  try {
    const user = await fetchMe();
    return { token: stored.token, user };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearStored();
      setAuthToken(null);
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  clearStored();
  setAuthToken(null);
}

const notAvailable = () => new ApiError('Esta función no está disponible en esta versión.', 501);

export async function requestPasswordReset(_email: string): Promise<void> {
  throw notAvailable();
}

/** PUT /api/usuarios/me/contrasena { actual, nueva } */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    await api.put<void>('/api/usuarios/me/contrasena', { actual: currentPassword, nueva: newPassword });
  } catch (error) {
    if (error instanceof ApiError && /actual/i.test(error.message)) {
      throw new ApiError('La contraseña actual no es correcta.', 400, 'WRONG_PASSWORD');
    }
    throw error;
  }
}

/** DELETE /api/usuarios/me: borra la cuenta y todo su contenido, y cierra la sesión. */
export async function deleteAccount(): Promise<void> {
  await api.delete<void>('/api/usuarios/me');
  clearStored();
  setAuthToken(null);
}
