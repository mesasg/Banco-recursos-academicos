import { useId, useState } from 'react';
import { Star } from 'lucide-react';
import { formatRating } from '@/utils/format';
import { cn } from '@/utils/text';

const STARS = [1, 2, 3, 4, 5];

/** Muestra un promedio con estrellas parcialmente llenas. */
export function StarRatingDisplay({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const px = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <span className="inline-flex items-center" role="img" aria-label={`Valoración promedio ${formatRating(value)} de 5`}>
      {STARS.map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className={cn('relative inline-block', px)} aria-hidden>
            <Star className={cn('absolute inset-0 text-line', px)} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn('text-warning', px)} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

interface StarRatingInputProps {
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

/** Selector de 1 a 5 estrellas con radios nativos (flechas del teclado incluidas). */
export function StarRatingInput({ value, onChange, disabled, label = 'Tu valoración' }: StarRatingInputProps) {
  const name = useId();
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <fieldset className="flex items-center" disabled={disabled} onMouseLeave={() => setHover(null)}>
      <legend className="sr-only">{label}</legend>
      {STARS.map((n) => (
        <label
          key={n}
          className="group relative inline-flex h-11 w-9 cursor-pointer items-center justify-center md:h-9 md:w-8"
          onMouseEnter={() => setHover(n)}
        >
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="peer sr-only"
          />
          <span className="sr-only">
            {n} {n === 1 ? 'estrella' : 'estrellas'}
          </span>
          <Star
            aria-hidden
            className={cn(
              'h-6 w-6 rounded transition-transform peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-600',
              n <= shown ? 'text-warning' : 'text-line',
              !disabled && 'group-hover:scale-110',
            )}
            fill="currentColor"
            strokeWidth={0}
          />
        </label>
      ))}
    </fieldset>
  );
}
