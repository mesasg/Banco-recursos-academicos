import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MoreHorizontal, RotateCw, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button, buttonClasses } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Menu } from '@/components/Menu';
import { Skeleton } from '@/components/Skeleton';
import { Textarea } from '@/components/Textarea';
import { useToast } from '@/components/Toast';
import { useCurrentUser } from '@/context/AuthContext';
import { SolvedBadge } from '@/features/forum/ThreadCard';
import { errorMessage, forumService } from '@/services';
import type { ForumReply, ForumThread, UserSummary } from '@/types';
import { formatDateTime, formatRelative, pluralize } from '@/utils/format';
import { cn } from '@/utils/text';

const REPLY_MAX = 2000;

function forumHref(thread: ForumThread) {
  return `/?materia=${encodeURIComponent(thread.subject.id)}&vista=foro`;
}

function Byline({ author, date, isMe }: { author: UserSummary; date: string; isMe: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={author.name} src={author.avatarUrl} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">
          {author.name}
          {isMe && <span className="font-normal text-ink-muted"> (tú)</span>}
        </p>
        <p className="text-xs text-ink-muted">
          {author.careerName && `${author.careerName} · `}
          <time dateTime={date} title={formatDateTime(date)}>
            {formatRelative(date)}
          </time>
        </p>
      </div>
    </div>
  );
}

type Pending = { kind: 'thread' } | { kind: 'reply'; reply: ForumReply };

export function ThreadPage() {
  const { threadId } = useParams();
  const user = useCurrentUser();
  const toast = useToast();
  const navigate = useNavigate();

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pending | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    forumService
      .getThread(threadId!)
      .then((data) => {
        if (!active) return;
        setThread(data.thread);
        setReplies(data.replies);
        setStatus('success');
      })
      .catch((e) => {
        if (!active) return;
        setError(errorMessage(e, 'No pudimos cargar la pregunta.'));
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [threadId, attempt]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-feed space-y-4" role="status" aria-label="Cargando pregunta">
        <Skeleton className="h-5 w-40" />
        <div className="card space-y-3 p-5">
          <Skeleton className="h-9 w-48 rounded-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="card h-28 p-5" />
      </div>
    );
  }

  if (status === 'error' || !thread) {
    return (
      <div className="mx-auto max-w-feed pt-2">
        <EmptyState
          illustration="error"
          title="No encontramos esta pregunta"
          description={error}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" onClick={() => setAttempt((a) => a + 1)} leftIcon={<RotateCw className="h-4 w-4" aria-hidden />}>
                Reintentar
              </Button>
              <Link to="/" className={buttonClasses()}>
                Ir al inicio
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const isMyThread = thread.author.id === user.id;
  // La solución aparece primero; el resto en orden de llegada.
  const ordered = [...replies].sort((a, b) =>
    a.id === thread.acceptedReplyId ? -1 : b.id === thread.acceptedReplyId ? 1 : a.createdAt.localeCompare(b.createdAt),
  );

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim().length < 2) return;
    setSending(true);
    try {
      const reply = await forumService.createReply(thread.id, draft);
      setReplies((list) => [...list, reply]);
      setThread((t) => (t ? { ...t, replyCount: t.replyCount + 1, lastActivityAt: reply.createdAt } : t));
      setDraft('');
      toast.success('Tu respuesta se publicó.');
    } catch (e) {
      toast.error(errorMessage(e, 'No pudimos publicar tu respuesta.'));
    } finally {
      setSending(false);
    }
  };

  const toggleAccepted = async (replyId: string) => {
    const next = thread.acceptedReplyId === replyId ? null : replyId;
    setAccepting(replyId);
    try {
      setThread(await forumService.setAcceptedReply(thread.id, next));
      toast.success(next ? 'Marcaste la respuesta como solución.' : 'Quitaste la marca de solución.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setAccepting(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === 'thread') {
        await forumService.deleteThread(thread.id);
        toast.success('Pregunta eliminada.');
        navigate(forumHref(thread), { replace: true });
        return;
      }
      const { reply } = pendingDelete;
      await forumService.deleteReply(reply.id);
      setReplies((list) => list.filter((r) => r.id !== reply.id));
      setThread((t) =>
        t
          ? { ...t, replyCount: t.replyCount - 1, acceptedReplyId: t.acceptedReplyId === reply.id ? undefined : t.acceptedReplyId }
          : t,
      );
      toast.success('Respuesta eliminada.');
      setPendingDelete(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-feed">
      <Link
        to={forumHref(thread)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-semibold text-primary-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Foro de {thread.subject.name}
      </Link>

      <article className="card mt-2 p-4 md:p-6" aria-labelledby="thread-title">
        <header className="flex items-start justify-between gap-3">
          <Byline author={thread.author} date={thread.createdAt} isMe={isMyThread} />
          <div className="flex items-center gap-1">
            {thread.acceptedReplyId && <SolvedBadge />}
            {isMyThread && (
              <Menu
                label="Opciones de la pregunta"
                trigger={<MoreHorizontal className="h-5 w-5" aria-hidden />}
                items={[
                  {
                    label: 'Eliminar pregunta',
                    tone: 'danger',
                    icon: <Trash2 className="h-4 w-4" aria-hidden />,
                    onSelect: () => setPendingDelete({ kind: 'thread' }),
                  },
                ]}
              />
            )}
          </div>
        </header>
        <h1 id="thread-title" className="mt-4 text-xl font-semibold leading-snug text-ink md:text-2xl">
          {thread.title}
        </h1>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink">{thread.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip tone="neutral">{thread.career.name}</Chip>
          <Chip>{thread.subject.name}</Chip>
        </div>
      </article>

      <section className="mt-6" aria-labelledby="replies-title">
        <h2 id="replies-title" className="text-base font-semibold text-ink">
          {replies.length ? pluralize(replies.length, 'respuesta', 'respuestas') : 'Aún no hay respuestas'}
        </h2>
        {isMyThread && replies.length > 0 && !thread.acceptedReplyId && (
          <p className="mt-1 text-sm text-ink-muted">Si alguna respuesta te resolvió la duda, márcala como solución.</p>
        )}

        <ul className="mt-3 space-y-3">
          {ordered.map((reply) => {
            const accepted = reply.id === thread.acceptedReplyId;
            const isMine = reply.author.id === user.id;
            return (
              <li key={reply.id}>
                <article
                  className={cn('card p-4 md:p-5', accepted && 'border-success/60 ring-1 ring-success/40')}
                  aria-label={`Respuesta de ${reply.author.name}${accepted ? ' (solución)' : ''}`}
                >
                  <header className="flex items-start justify-between gap-3">
                    <Byline author={reply.author} date={reply.createdAt} isMe={isMine} />
                    <div className="flex items-center gap-1">
                      {accepted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success-strong">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          Solución
                        </span>
                      )}
                      {isMine && (
                        <Menu
                          label="Opciones de la respuesta"
                          trigger={<MoreHorizontal className="h-5 w-5" aria-hidden />}
                          items={[
                            {
                              label: 'Eliminar respuesta',
                              tone: 'danger',
                              icon: <Trash2 className="h-4 w-4" aria-hidden />,
                              onSelect: () => setPendingDelete({ kind: 'reply', reply }),
                            },
                          ]}
                        />
                      )}
                    </div>
                  </header>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{reply.body}</p>
                  {isMyThread && !isMine && (
                    <div className="mt-3 border-t border-line pt-2">
                      <Button
                        variant={accepted ? 'ghost' : 'secondary'}
                        size="sm"
                        loading={accepting === reply.id}
                        onClick={() => toggleAccepted(reply.id)}
                        aria-pressed={accepted}
                        leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                      >
                        {accepted ? 'Quitar como solución' : 'Marcar como solución'}
                      </Button>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>

        <form onSubmit={sendReply} className="card mt-4 flex flex-col gap-3 p-4 md:p-5">
          <Textarea
            label="Tu respuesta"
            value={draft}
            maxLength={REPLY_MAX}
            showCount
            rows={4}
            placeholder="Explica tu respuesta paso a paso. Si conoces un recurso útil, menciónalo."
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={sending} loadingLabel="Publicando…" disabled={draft.trim().length < 2}>
              Publicar respuesta
            </Button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'thread' ? '¿Eliminar esta pregunta?' : '¿Eliminar tu respuesta?'}
        message={
          pendingDelete?.kind === 'thread'
            ? 'Se borrará la pregunta con todas sus respuestas. Esta acción no se puede deshacer.'
            : 'Tu respuesta se borrará del hilo. Esta acción no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
