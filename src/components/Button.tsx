import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-700',
  secondary: 'border border-line bg-surface text-ink hover:border-primary-500/50 hover:bg-primary-50',
  ghost: 'text-primary-700 hover:bg-primary-100',
  danger: 'bg-danger text-white shadow-sm hover:bg-danger/90',
  'danger-ghost': 'text-danger hover:bg-danger/10',
};

// Todos llegan a 44 px de alto en pantallas táctiles; "sm" se compacta desde md.
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-sm md:min-h-9',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
  icon: 'h-11 w-11 shrink-0',
};

interface ClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Clases de botón, también para <Link> con aspecto de botón. */
export function buttonClasses({ variant = 'primary', size = 'md', fullWidth, className }: ClassOptions = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ClassOptions {
  loading?: boolean;
  /** Texto para lectores de pantalla mientras carga. */
  loadingLabel?: string;
  leftIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, className, loading, loadingLabel, leftIcon, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
});
