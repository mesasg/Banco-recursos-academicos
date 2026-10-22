import type { ReactNode } from 'react';
import { cn } from '@/utils/text';

interface FieldProps {
  id: string;
  label: string;
  hideLabel?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  /** Contador "34/120". */
  count?: { value: number; max: number };
  children: ReactNode;
  className?: string;
}

/** Envoltorio común de label, ayuda, error y contador para los campos. */
export function Field({ id, label, hideLabel, required, hint, error, count, children, className }: FieldProps) {
  const over = count ? count.value > count.max : false;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-medium text-ink', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {' '}*
          </span>
        )}
      </label>
      {children}
      {(hint || error || count) && (
        <div className="flex items-start justify-between gap-3 text-xs">
          <div>
            {error ? (
              <p id={`${id}-error`} className="font-medium text-danger">
                {error}
              </p>
            ) : (
              hint && (
                <p id={`${id}-hint`} className="text-ink-muted">
                  {hint}
                </p>
              )
            )}
          </div>
          {count && (
            <p id={`${id}-count`} className={cn('shrink-0 tabular-nums', over ? 'font-medium text-danger' : 'text-ink-muted')}>
              {count.value}/{count.max}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function describedBy(id: string, { hint, error, count }: { hint?: string; error?: string; count?: unknown }) {
  const ids = [error ? `${id}-error` : hint ? `${id}-hint` : null, count ? `${id}-count` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

export const controlClasses = (invalid?: boolean) =>
  cn(
    'w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/80 transition-colors',
    'focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/25',
    'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-muted',
    invalid ? 'border-danger' : 'border-line hover:border-ink-muted/50',
  );
