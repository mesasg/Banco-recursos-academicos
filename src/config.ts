/** Configuración global de la app. Cambia aquí el nombre y los límites. */
export const APP_NAME = 'IngeNotes';
export const APP_TAGLINE = 'Banco estudiantil de recursos académicos';

/** Tamaño máximo por archivo adjunto (el backend acepta hasta 20 MB). */
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_FILE_TYPES: Record<string, 'pdf' | 'image'> = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
};
export const ACCEPTED_FILE_EXTENSIONS = '.pdf,.png,.jpg,.jpeg,.webp,.gif';

/** Un recurso del backend lleva exactamente un archivo. */
export const MAX_ATTACHMENTS = 1;

/** Carrera a la que pertenecen todas las asignaturas del backend. */
export const CAREER_ID = 'sis';
export const CAREER_NAME = 'Ingeniería de Sistemas';
export const CAREER_SHORT_NAME = 'Ing. de Sistemas';

/**
 * Funciones disponibles en esta versión (MVP). Las que están en false no tienen
 * soporte en el backend todavía: su código sigue en la interfaz pero se oculta.
 * Para reactivar una, se implementa en el backend y se cambia aquí a true.
 */
export const FEATURES = {
  /** Recuadro "Cuenta de prueba" del login (solo útil con datos mock). */
  demoAccount: false,
  favorites: true,
  editPost: true,
  postDescription: true,
  /** Un recurso lleva un archivo o un enlace (MAX_ATTACHMENTS = 1). */
  links: true,
  /** Editar nombre y carrera. La foto de perfil se controla con `avatar`. */
  profileEdit: true,
  avatar: false,
  changePassword: true,
  deleteAccount: true,
  /** Requiere un servicio de envío de correos. */
  passwordReset: false,
} as const;

/** Foto de perfil. */
export const MAX_AVATAR_SIZE_MB = 2;

export const POST_TITLE_MAX = 120;
export const POST_DESCRIPTION_MAX = 300;

export const FEED_PAGE_SIZE = 6;
export const SEARCH_DEBOUNCE_MS = 300;

/** URL del backend. Vacía = modo mock. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
