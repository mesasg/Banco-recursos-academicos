export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Escribe tu correo electrónico.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'El correo no tiene un formato válido.';
  return undefined;
}

export function validateNewPassword(password: string): string | undefined {
  if (password.length < 8) return 'Debe tener al menos 8 caracteres.';
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) || !/\d/.test(password)) {
    return 'Debe combinar letras y números.';
  }
  return undefined;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Agrega https:// si el usuario escribió solo el dominio. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
