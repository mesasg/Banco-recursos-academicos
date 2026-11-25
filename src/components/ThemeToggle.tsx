import { Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/text';

/** Interruptor de modo oscuro (sidebar en desktop, drawer en móvil). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={toggleTheme}
      className={cn(
        'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-ink transition-colors hover:bg-primary-100/60 md:min-h-10',
        className,
      )}
    >
      <Moon className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
      <span className="flex-1 text-left">Modo oscuro</span>
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          dark ? 'bg-primary-600' : 'bg-ink-muted/40',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-card transition-transform',
            dark && 'translate-x-4',
          )}
        />
      </span>
    </button>
  );
}
