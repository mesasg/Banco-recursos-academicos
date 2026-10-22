import { useCallback, useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[inert]'),
  );
}

let scrollLocks = 0;

function lockScroll(): () => void {
  scrollLocks += 1;
  if (scrollLocks === 1) {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
  }
  return () => {
    scrollLocks -= 1;
    if (scrollLocks === 0) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  };
}

/** Vuelve inertes (ni foco ni lector de pantalla) los hermanos del diálogo en <body>. */
function inertOthers(container: HTMLElement): () => void {
  let root: HTMLElement = container;
  while (root.parentElement && root.parentElement !== document.body) root = root.parentElement;

  const changed: HTMLElement[] = [];
  for (const child of Array.from(document.body.children) as HTMLElement[]) {
    if (child === root || child.inert || child.tagName === 'SCRIPT' || child.hasAttribute('data-toast-root')) continue;
    child.inert = true;
    changed.push(child);
  }
  return () => changed.forEach((el) => (el.inert = false));
}

interface Options {
  initialFocusRef?: RefObject<HTMLElement>;
}

/**
 * Comportamiento accesible de modales y drawers: trampa de foco, cierre con Esc,
 * fondo inerte, bloqueo de scroll y foco devuelto al elemento que lo abrió.
 * Devuelve el manejador de teclado que se pone en el contenedor del diálogo.
 */
export function useDialogBehavior(
  open: boolean,
  containerRef: RefObject<HTMLElement>,
  onClose: () => void,
  { initialFocusRef }: Options = {},
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const unlockScroll = lockScroll();
    const restoreInert = inertOthers(container);

    const target =
      initialFocusRef?.current ??
      container.querySelector<HTMLElement>('[data-autofocus]') ??
      container;
    target.focus({ preventScroll: true });

    return () => {
      restoreInert();
      unlockScroll();
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // Solo al abrir/cerrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const container = containerRef.current;
      if (!container) return;

      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab') {
        event.stopPropagation();
        const focusable = getFocusable(container);
        if (focusable.length === 0) {
          event.preventDefault();
          container.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === container)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [containerRef],
  );
}
