import { cn, initials } from '@/utils/text';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<AvatarSize, string> = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-24 w-24 text-3xl',
};

// Todos los fondos tienen contraste AA con texto blanco.
const palette = ['#3F7489', '#2F5C6E', '#4A5D8F', '#6E4C85', '#2E7563', '#8A5A2B'];

function colorFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
  /** Decorativo cuando el nombre ya está escrito al lado. */
  decorative?: boolean;
}

export function Avatar({ name, src, size = 'md', className, decorative = true }: AvatarProps) {
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': name };
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-white',
        sizes[size],
        className,
      )}
      style={src ? undefined : { backgroundColor: colorFor(name) }}
      {...a11y}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}
