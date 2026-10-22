import type { ReactNode } from 'react';
import { cn } from '@/utils/text';

type Illustration = 'folder' | 'search' | 'star' | 'error';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  illustration?: Illustration;
  className?: string;
}

function Art({ kind }: { kind: Illustration }) {
  const stroke = kind === 'error' ? 'rgb(var(--color-danger))' : 'rgb(var(--color-primary-600))';
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-36" aria-hidden>
      <ellipse cx="80" cy="108" rx="56" ry="6" fill="rgb(var(--color-line))" />
      {kind === 'folder' && (
        <g strokeWidth="3" strokeLinejoin="round" stroke={stroke}>
          <path d="M30 36h34l8 9h58v52a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4z" fill="rgb(var(--color-primary-100))" />
          <path d="M30 55h100" fill="none" />
          <path d="M70 76h20M80 66v20" strokeLinecap="round" />
        </g>
      )}
      {kind === 'search' && (
        <g strokeWidth="3" stroke={stroke} fill="none" strokeLinecap="round">
          <circle cx="72" cy="56" r="26" fill="rgb(var(--color-primary-100))" />
          <path d="M91 75l22 22" strokeWidth="6" />
          <path d="M62 52h20M62 62h12" />
        </g>
      )}
      {kind === 'star' && (
        <g strokeWidth="3" stroke={stroke} strokeLinejoin="round">
          <path
            d="M80 20l14 29 31 4-23 21 6 31-28-15-28 15 6-31-23-21 31-4z"
            fill="rgb(var(--color-primary-100))"
          />
        </g>
      )}
      {kind === 'error' && (
        <g strokeWidth="3" stroke={stroke} strokeLinecap="round">
          <path d="M80 18l50 84H30z" fill="#FBEAE8" strokeLinejoin="round" />
          <path d="M80 50v24" />
          <circle cx="80" cy="86" r="2" fill={stroke} />
        </g>
      )}
    </svg>
  );
}

export function EmptyState({ title, description, action, illustration = 'folder', className }: EmptyStateProps) {
  return (
    <div className={cn('card flex flex-col items-center px-6 py-10 text-center', className)}>
      <Art kind={illustration} />
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
