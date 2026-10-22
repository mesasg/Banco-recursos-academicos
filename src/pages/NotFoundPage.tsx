import { Link } from 'react-router-dom';
import { buttonClasses } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-feed pt-6">
      <h1 className="sr-only">Página no encontrada</h1>
      <EmptyState
        illustration="search"
        title="No encontramos esta página"
        description="Puede que el enlace esté mal escrito o que el contenido ya no exista."
        action={
          <Link to="/" className={buttonClasses()}>
            Ir al inicio
          </Link>
        }
      />
    </div>
  );
}
