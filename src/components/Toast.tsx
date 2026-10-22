import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/utils/text';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 4500;

const toneStyles: Record<ToastTone, { icon: ReactNode; className: string }> = {
  success: { icon: <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />, className: 'border-l-success' },
  error: { icon: <AlertCircle className="h-5 w-5 text-danger" aria-hidden />, className: 'border-l-danger' },
  info: { icon: <Info className="h-5 w-5 text-primary-600" aria-hidden />, className: 'border-l-primary-600' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        // data-toast-root: los modales no lo vuelven inerte, así se puede cerrar el aviso.
        <div
          data-toast-root
          aria-live="polite"
          aria-relevant="additions"
          className="pointer-events-none fixed inset-x-4 top-[76px] z-[60] flex flex-col items-stretch gap-2 md:left-auto md:right-6 md:w-96"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex animate-toast-in items-start gap-3 rounded-lg border border-l-4 border-line bg-surface p-3 pr-1 shadow-raised',
                toneStyles[t.tone].className,
              )}
            >
              <span className="mt-0.5">{toneStyles[t.tone].icon}</span>
              <p className="flex-1 py-0.5 text-sm text-ink">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar aviso"
                className="-my-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
