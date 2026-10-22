import { APP_NAME } from '@/config';
import { cn } from '@/utils/text';

/** Marca: ícono + nombre. En el header va en blanco sobre primary-500 (texto ≥18 px seminegrita). */
export function Logo({ tone = 'light', className, compact }: { tone?: 'light' | 'dark'; className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill={tone === 'light' ? '#fff' : 'rgb(var(--color-primary-600))'} />
        <path
          d="M9 8h10l4 4v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
          fill={tone === 'light' ? 'rgb(var(--color-primary-600))' : '#fff'}
        />
        <path
          d="M12 15h8M12 19h8M12 23h5"
          stroke={tone === 'light' ? '#fff' : 'rgb(var(--color-primary-600))'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className={cn('text-xl font-semibold tracking-tight', tone === 'light' ? 'text-white' : 'text-ink')}>
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
