import { Loader2 } from 'lucide-react';

export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-muted" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
