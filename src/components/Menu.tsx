import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/utils/text';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
}

interface MenuProps {
  /** Contenido del botón disparador (normalmente un ícono). */
  trigger: ReactNode;
  label: string;
  items: MenuItem[];
  align?: 'left' | 'right';
}

/** Menú desplegable accesible (patrón "menu button" de WAI-ARIA). */
export function Menu({ trigger, label, items, align = 'right' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const focusItem = (index: number) => {
    const elements = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    if (!elements?.length) return;
    elements[(index + elements.length) % elements.length].focus();
  };

  useEffect(() => {
    if (!open) return;
    focusItem(0);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!listRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const elements = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const index = elements.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown') focusItem(index + 1);
    else if (event.key === 'ArrowUp') focusItem(index - 1);
    else if (event.key === 'Home') focusItem(0);
    else if (event.key === 'End') focusItem(elements.length - 1);
    else if (event.key === 'Escape') close();
    else if (event.key === 'Tab') close(false);
    else return;
    if (event.key !== 'Tab') {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-ink md:h-9 md:w-9"
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className={cn(
            'absolute z-30 mt-1 min-w-44 animate-pop-in rounded-lg border border-line bg-surface py-1 shadow-raised',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close(false);
                item.onSelect();
              }}
              className={cn(
                'flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm font-medium focus:bg-canvas focus:outline-none md:min-h-9',
                item.tone === 'danger' ? 'text-danger hover:bg-danger/5' : 'text-ink hover:bg-canvas',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
