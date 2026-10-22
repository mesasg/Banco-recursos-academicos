/**
 * Punto único de acceso a datos. Los componentes importan desde aquí y no
 * saben si la respuesta viene del mock o del backend.
 */
export * as authService from './authService';
export * as catalogService from './catalogService';
export * as postService from './postService';
export * as userService from './userService';
export { ApiError } from './apiClient';

/** Mensaje legible para mostrar en la UI a partir de cualquier error. */
export function errorMessage(error: unknown, fallback = 'Ocurrió un error inesperado. Intenta de nuevo.'): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
