/** Configuración global de la app. Cambia aquí el nombre y los límites. */
export const APP_NAME = 'Notadad';
export const APP_TAGLINE = 'Banco estudiantil de recursos académicos';

/** Tamaño máximo por archivo adjunto. */
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_FILE_TYPES: Record<string, 'pdf' | 'image'> = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
};
export const ACCEPTED_FILE_EXTENSIONS = '.pdf,.png,.jpg,.jpeg';

/** Foto de perfil. */
export const MAX_AVATAR_SIZE_MB = 2;

export const POST_TITLE_MAX = 120;
export const POST_DESCRIPTION_MAX = 300;

export const FEED_PAGE_SIZE = 6;
export const SEARCH_DEBOUNCE_MS = 300;

/** Dominios aceptados para el correo institucional (terminan en .edu.co o .edu). */
export const INSTITUTIONAL_EMAIL_REGEX = /^[^\s@]+@([a-z0-9-]+\.)+(edu\.co|edu)$/i;

/** URL del backend. Vacía = modo mock. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
