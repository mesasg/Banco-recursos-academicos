const LOCALE = 'es-CO';

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto', style: 'short' });
const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeStyle: 'short' });
const decimal = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "hace 2 h", "ayer", "hace 3 sem.". */
export function formatRelative(iso: string, now = Date.now()): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return 'justo ahora';
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diffSeconds / 86400), 'day');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeconds / (86400 * 7)), 'week');
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSeconds / (86400 * 30)), 'month');
  return rtf.format(Math.round(diffSeconds / (86400 * 365)), 'year');
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

export function formatRating(value: number): string {
  return decimal.format(value);
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${decimal.format(bytes / (1024 * 1024))} MB`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
