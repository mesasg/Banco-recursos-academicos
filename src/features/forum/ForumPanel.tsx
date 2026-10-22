import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessagesSquare, Plus, RotateCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useCatalog } from '@/context/CatalogContext';
import { pluralize } from '@/utils/format';
import { NewThreadDialog } from './NewThreadDialog';
import { ThreadCard } from './ThreadCard';
import { useThreads } from './useThreads';

interface ForumPanelProps {
  subjectId?: string | null;
  careerId?: string | null;
  authorId?: string | null;
  q?: string;
}

function ThreadSkeleton() {
  return (
    <div className="card p-4 md:p-5" aria-hidden>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-3 h-3.5 w-full" />
      <Skeleton className="mt-2 h-3.5 w-1/2" />
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

/** Foro de preguntas y respuestas de la materia o carrera seleccionada. */
export function ForumPanel({ subjectId, careerId, authorId, q }: ForumPanelProps) {
  const { findSubject, findCareer } = useCatalog();
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const threads = useThreads({
    subjectId: subjectId ?? undefined,
    careerId: careerId ?? undefined,
    authorId: authorId ?? undefined,
    q: q || undefined,
  });
  const filtered = Boolean(q || authorId);

  const place = findSubject(subjectId)?.name ?? findCareer(careerId)?.name ?? 'esta materia';
  const askButton = (
    <Button onClick={() => setAsking(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
      Hacer una pregunta
    </Button>
  );

  return (
    <section aria-labelledby="forum-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary-50 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <MessagesSquare className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="forum-title" className="text-base font-semibold text-ink">
              Foro de {place}
            </h2>
            <p className="text-sm text-ink-muted">
              {threads.status === 'success'
                ? `${pluralize(threads.total, 'pregunta', 'preguntas')} · resuelve dudas con tus compañeros`
                : 'Resuelve dudas con tus compañeros'}
            </p>
          </div>
        </div>
        {askButton}
      </div>

      {threads.status === 'loading' && (
        <div className="space-y-3" role="status" aria-label="Cargando preguntas">
          {[0, 1, 2].map((i) => (
            <ThreadSkeleton key={i} />
          ))}
        </div>
      )}

      {threads.status === 'error' && (
        <EmptyState
          illustration="error"
          title="No pudimos cargar el foro"
          description={threads.error ?? 'Revisa tu conexión e intenta de nuevo.'}
          action={
            <Button variant="secondary" onClick={threads.retry} leftIcon={<RotateCw className="h-4 w-4" aria-hidden />}>
              Reintentar
            </Button>
          }
        />
      )}

      {threads.status === 'success' && threads.items.length === 0 && (
        <EmptyState
          illustration={filtered ? 'search' : 'folder'}
          title={
            q ? `No hay preguntas que coincidan con “${q}”` : filtered ? 'No hay preguntas con estos filtros' : `Aún no hay preguntas en ${place}`
          }
          description={
            filtered ? 'Prueba con otras palabras, quita algún filtro o haz tú la pregunta.' : '¿Tienes una duda? Hazla primero: seguro alguien más la tiene.'
          }
          action={askButton}
        />
      )}

      {threads.status === 'success' && threads.items.length > 0 && (
        <>
          <ul className="space-y-3" aria-label={`Preguntas del foro de ${place}`}>
            {threads.items.map((t) => (
              <li key={t.id}>
                <ThreadCard thread={t} showSubject={!subjectId} />
              </li>
            ))}
          </ul>
          {threads.hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" onClick={threads.loadMore} loading={threads.loadingMore} loadingLabel="Cargando…">
                Cargar más preguntas
              </Button>
            </div>
          )}
        </>
      )}

      <NewThreadDialog
        open={asking}
        onClose={() => setAsking(false)}
        onCreated={(thread) => {
          setAsking(false);
          navigate(`/foro/${thread.id}`);
        }}
        subjectId={subjectId}
        careerId={careerId}
      />
    </section>
  );
}
