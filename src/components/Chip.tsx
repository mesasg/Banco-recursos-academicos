import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/text';

type ChipTone = 'brand' | 'neutral';

interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
  icon?: ReactNode;
  /** Si existe, el chip es un botón (p. ej. aplicar un filtro). */
  onClick?: () => void;
  /** Si existe, muestra la ✕ para quitarlo. */
  onRemove?: () => void;
  removeLabel?: string;
  title?: string;
  className?: string;
}

const tones: Record<ChipTone, string> = {
  brand: 'bg-primary-100 text-primary-700',
  neutral: 'bg-canvas text-ink-muted border border-line',
};

const interactiveTones: Record<ChipTone, string> = {
  brand: 'hover:bg-primary-500/25',
  neutral: 'hover:border-primary-500/50 hover:text-ink',
};

export function Chip({ children, tone = 'brand', icon, onClick, onRemove, removeLabel, title, className }: ChipProps) {
  const base = cn(
    'inline-flex max-w-full items-center gap-1.5 rounded-full text-xs font-medium',
    tones[tone],
    className,
  );
  const content = (
    <>
      {icon}
      <span className="truncate">{children}</span>
    </>
  );

  if (onRemove) {
    return (
      <span className={cn(base, 'py-1 pl-3 pr-1')} title={title}>
        {content}
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? 'Quitar'}
          className="-my-2 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary-500/25"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={cn(base, interactiveTones[tone], 'px-3 py-1.5 transition-colors')}>
        {content}
      </button>
    );
  }

  return (
    <span className={cn(base, 'px-3 py-1')} title={title}>
      {content}
    </span>
  );
}
