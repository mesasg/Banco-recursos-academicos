import { API_BASE_URL } from '@/config';

/**
 * Cliente HTTP para el backend real. Hoy los servicios usan los mocks;
 * al conectar Spring Boot, cada servicio cambia su cuerpo por una llamada
 * a `api.get/post/...` y los componentes no se enteran.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;

/** Se emite cuando el backend rechaza el token (401). */
export const UNAUTHORIZED_EVENT = 'ingenotes:unauthorized';

export function setAuthToken(token: string | null): void {
  authToken = token;
}

type Body = BodyInit | Record<string, unknown> | unknown[] | undefined;

async function request<T>(method: string, path: string, body?: Body, init?: RequestInit): Promise<T> {
  const isJson = body !== undefined && !(body instanceof FormData) && !(body instanceof Blob);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method,
    headers: {
      Accept: 'application/json',
      ...(isJson ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
    body: isJson ? JSON.stringify(body) : (body as BodyInit | undefined),
  });

  if (!response.ok) {
    let message =
      response.status === 401
        ? 'Tu sesión expiró. Inicia sesión de nuevo.'
        : response.status === 403
          ? 'No tienes permiso para hacer esto.'
          : 'Ocurrió un error inesperado. Intenta de nuevo.';
    let code: string | undefined;
    if (response.status === 401 && authToken) {
      // Token vencido o inválido: avisamos para cerrar la sesión.
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    try {
      // El backend responde los errores como { "mensaje": "..." }.
      const data = (await response.json()) as { mensaje?: string; message?: string; code?: string };
      message = data.mensaje ?? data.message ?? message;
      code = data.code;
    } catch {
      // Respuesta sin cuerpo JSON.
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>('GET', path, undefined, init),
  post: <T>(path: string, body?: Body, init?: RequestInit) => request<T>('POST', path, body, init),
  put: <T>(path: string, body?: Body, init?: RequestInit) => request<T>('PUT', path, body, init),
  patch: <T>(path: string, body?: Body, init?: RequestInit) => request<T>('PATCH', path, body, init),
  delete: <T>(path: string, init?: RequestInit) => request<T>('DELETE', path, undefined, init),
};

/** Latencia simulada para que los estados de carga se vean en el modo mock. */
export function mockDelay(min = 250, max = 650): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
