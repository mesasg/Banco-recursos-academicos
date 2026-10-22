import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Contenido extra en la cabecera (p. ej. el logo). */
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  id?: string;
}

/** Panel lateral izquierdo: pantalla completa en móvil, 320 px desde md. */
export function Drawer({ open, onClose, title, header, children, footer, id }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onKeyDown = useDialogBehavior(open, panelRef, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="absolute inset-y-0 left-0 flex w-full animate-slide-in-left flex-col bg-primary-50 shadow-modal focus:outline-none md:w-80"
      >
        <div className="on-brand flex h-16 shrink-0 items-center gap-3 bg-primary-500 px-3 text-white">
          <div className="min-w-0 flex-1">
            {header}
            <h2 id={titleId} className={header ? 'sr-only' : 'px-2 text-lg font-semibold'}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/15"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-surface p-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
