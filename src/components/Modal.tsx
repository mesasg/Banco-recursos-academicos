import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import { cn } from '@/utils/text';

type ModalSize = 'sm' | 'md' | 'lg';

const sizes: Record<ModalSize, string> = {
  sm: 'md:max-w-md',
  md: 'md:max-w-xl',
  lg: 'md:max-w-2xl',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /** En móvil (<768 px) ocupa toda la pantalla. */
  fullScreenOnMobile?: boolean;
  initialFocusRef?: RefObject<HTMLElement>;
  role?: 'dialog' | 'alertdialog';
  /** Oculta la X (p. ej. diálogos de confirmación). */
  hideCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  fullScreenOnMobile,
  initialFocusRef,
  role = 'dialog',
  hideCloseButton,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onKeyDown = useDialogBehavior(open, panelRef, onClose, { initialFocusRef });

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center',
        fullScreenOnMobile ? 'items-stretch md:items-center md:p-6' : 'items-end p-0 sm:items-center sm:p-6',
      )}
    >
      <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          'relative flex w-full animate-pop-in flex-col bg-surface shadow-modal focus:outline-none',
          sizes[size],
          fullScreenOnMobile
            ? 'h-full md:h-auto md:max-h-[90vh] md:rounded-xl'
            : 'max-h-[92vh] rounded-t-xl sm:max-w-md sm:rounded-xl',
        )}
      >
        <header className="flex items-start gap-3 border-b border-line px-5 py-4 md:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </div>
            )}
          </div>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          )}
        </header>
        {children && <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 md:px-6">{children}</div>}
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3 md:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
