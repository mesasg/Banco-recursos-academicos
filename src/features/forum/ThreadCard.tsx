import { Link } from 'react-router-dom';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import type { ForumThread } from '@/types';
import { formatDateTime, formatRelative, pluralize } from '@/utils/format';

export function SolvedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success-strong">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      Resuelta
    </span>
  );
}

interface ThreadCardProps {
  thread: ForumThread;
  /** En el foro de una carrera se indica de qué materia es cada pregunta. */
  showSubject?: boolean;
}

/** Tarjeta de pregunta. Toda la tarjeta lleva al hilo (el enlace está en el título). */
export function ThreadCard({ thread, showSubject }: ThreadCardProps) {
  return (
    <article className="card relative p-4 transition-shadow focus-within:shadow-raised hover:shadow-raised md:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-ink">
          <Link to={`/foro/${thread.id}`} className="rounded after:absolute after:inset-0 after:rounded-xl">
            {thread.title}
          </Link>
        </h3>
        {thread.acceptedReplyId && <SolvedBadge />}
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{thread.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <Avatar name={thread.author.name} src={thread.author.avatarUrl} size="xs" />
          <span className="font-medium text-ink">{thread.author.name}</span>
        </span>
        <time dateTime={thread.createdAt} title={formatDateTime(thread.createdAt)}>
          {formatRelative(thread.createdAt)}
        </time>
        {showSubject && (
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 font-medium text-primary-700">{thread.subject.name}</span>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5 font-medium">
          <MessageSquare className="h-4 w-4" aria-hidden />
          {pluralize(thread.replyCount, 'respuesta', 'respuestas')}
        </span>
      </div>
    </article>
  );
}
