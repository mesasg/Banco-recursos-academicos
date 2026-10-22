import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/utils/text';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Prefijo para enlazar pestañas y paneles (aria-controls). */
  idBase: string;
  label: string;
  className?: string;
  /** "fill": las pestañas reparten el ancho (útil en móvil). */
  fill?: boolean;
  /** En móvil oculta los íconos y reduce el padding para que quepan las etiquetas largas. */
  compact?: boolean;
}

export const tabId = (base: string, id: string) => `${base}-tab-${id}`;
export const panelId = (base: string, id: string) => `${base}-panel-${id}`;

/** Pestañas accesibles: flechas, Inicio y Fin cambian de pestaña. */
export function Tabs<T extends string>({ items, value, onChange, idBase, label, className, fill, compact }: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  };

  return (
    // La línea inferior es una sombra interna (no un borde) para que la lista pueda
    // desplazarse horizontalmente en pantallas muy angostas sin recortar el indicador.
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_rgb(var(--color-line))] [scrollbar-width:none]', className)}
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => (refs.current[index] = el)}
            type="button"
            role="tab"
            id={tabId(idBase, item.id)}
            aria-selected={selected}
            aria-controls={panelId(idBase, item.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 font-semibold transition-colors sm:gap-2',
              compact ? 'px-1 text-[13px] sm:px-3 sm:text-sm' : 'px-3 text-sm',
              fill && 'flex-1',
              selected
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-ink-muted hover:border-line hover:text-ink',
            )}
          >
            {item.icon && <span className={compact ? 'hidden sm:inline-flex' : 'inline-flex'}>{item.icon}</span>}
            {item.label}
            {item.badge !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs tabular-nums',
                  selected ? 'bg-primary-100 text-primary-700' : 'bg-canvas text-ink-muted',
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  idBase: string;
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ idBase, id, children, className }: TabPanelProps) {
  return (
    <div role="tabpanel" id={panelId(idBase, id)} aria-labelledby={tabId(idBase, id)} tabIndex={0} className={cn('focus:outline-none focus-visible:outline-2', className)}>
      {children}
    </div>
  );
}
