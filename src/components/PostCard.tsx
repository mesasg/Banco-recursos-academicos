import { useId, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { errorMessage, postService } from '@/services';
import type { Attachment, AttachmentKind, Post } from '@/types';
import { formatDateTime, formatFileSize, formatRating, formatRelative, pluralize } from '@/utils/format';
import { cn } from '@/utils/text';
import { Avatar } from './Avatar';
import { Chip } from './Chip';
import { Menu } from './Menu';
import { StarRatingDisplay, StarRatingInput } from './StarRating';
import { useToast } from './Toast';

const kindMeta: Record<AttachmentKind, { icon: typeof FileText; label: string; className: string }> = {
  pdf: { icon: FileText, label: 'PDF', className: 'bg-danger/10 text-danger' },
  image: { icon: ImageIcon, label: 'Imagen', className: 'bg-primary-100 text-primary-700' },
  link: { icon: Link2, label: 'Enlace', className: 'bg-success/10 text-success' },
};

export function AttachmentIcon({ kind, className }: { kind: AttachmentKind; className?: string }) {
  const { icon: Icon, className: tone } = kindMeta[kind];
  return (
    <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tone, className)} aria-hidden>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

function hostname(url?: string): string {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, '') : '';
  } catch {
    return '';
  }
}

interface AttachmentRowProps {
  attachment: Attachment;
  post: Post;
}

function AttachmentRow({ attachment, post }: AttachmentRowProps) {
  const toast = useToast();
  const meta = kindMeta[attachment.kind];
  const rowClass =
    'group flex min-h-11 w-full items-center gap-3 rounded-lg border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:border-primary-500/50 hover:bg-primary-50';

  const content = (action: 'download' | 'open') => (
    <>
      <AttachmentIcon kind={attachment.kind} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{attachment.name}</span>
        <span className="block truncate text-xs text-ink-muted">
          {meta.label}
          {attachment.kind === 'link' ? ` · ${hostname(attachment.url)}` : attachment.sizeBytes ? ` · ${formatFileSize(attachment.sizeBytes)}` : ''}
        </span>
      </span>
      {action === 'open' ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-ink-muted group-hover:text-primary-700" aria-hidden />
      ) : (
        <Download className="h-4 w-4 shrink-0 text-ink-muted group-hover:text-primary-700" aria-hidden />
      )}
    </>
  );

  if (attachment.kind === 'link') {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={rowClass}>
        {content('open')}
        <span className="sr-only">(abre en una pestaña nueva)</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      className={rowClass}
      aria-label={`Descargar ${attachment.name}`}
      onClick={() =>
        postService
          .downloadAttachment(attachment, post)
          .catch((e) => toast.error(errorMessage(e, 'No se pudo descargar el archivo.')))
      }
    >
      {content('download')}
    </button>
  );
}

export interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onFilterSubject?: (subjectId: string) => void;
  onFilterCareer?: (careerId: string) => void;
  /** Se llama cuando la publicación cambia dentro de la tarjeta (p. ej. al valorarla). */
  onPostChange?: (post: Post) => void;
}

export function PostCard({ post, onEdit, onDelete, onFilterSubject, onFilterCareer, onPostChange }: PostCardProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const toast = useToast();
  const titleId = useId();
  const [rating, setRating] = useState(false);
  const [savingRating, setSavingRating] = useState(false);

  const isMine = user?.id === post.author.id;
  const favorite = isFavorite(post.author.id);
  const images = post.attachments.filter((a) => a.kind === 'image' && a.url);

  const rate = async (value: number) => {
    setSavingRating(true);
    try {
      const updated = await postService.ratePost(post.id, value);
      onPostChange?.(updated);
      toast.success('¡Gracias! Tu valoración ayuda a otros estudiantes.');
      setRating(false);
    } catch (error) {
      toast.error(errorMessage(error, 'No pudimos guardar tu valoración.'));
    } finally {
      setSavingRating(false);
    }
  };

  return (
    <article aria-labelledby={titleId} className="card p-4 transition-shadow hover:shadow-raised md:p-5">
      <header className="flex items-start gap-3">
        <Avatar name={post.author.name} src={post.author.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-semibold text-ink">
              {post.author.name}
              {isMine && <span className="font-normal text-ink-muted"> (tú)</span>}
            </p>
            {!isMine && (
              <button
                type="button"
                onClick={() => toggleFavorite(post.author)}
                aria-pressed={favorite}
                aria-label={favorite ? `Quitar a ${post.author.name} de favoritos` : `Agregar a ${post.author.name} a favoritos`}
                title={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-warning/10 md:h-8 md:w-8"
              >
                <Star
                  className={cn('h-4 w-4', favorite ? 'text-warning' : 'text-ink-muted')}
                  fill={favorite ? 'currentColor' : 'none'}
                  aria-hidden
                />
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            {post.author.careerName} ·{' '}
            <time dateTime={post.createdAt} title={formatDateTime(post.createdAt)}>
              {formatRelative(post.createdAt)}
            </time>
            {post.updatedAt && <span> · editado</span>}
          </p>
        </div>
        {isMine && (onEdit || onDelete) && (
          <Menu
            label="Opciones de la publicación"
            trigger={<MoreHorizontal className="h-5 w-5" aria-hidden />}
            items={[
              ...(onEdit ? [{ label: 'Editar', icon: <Pencil className="h-4 w-4" aria-hidden />, onSelect: () => onEdit(post) }] : []),
              ...(onDelete
                ? [{ label: 'Eliminar', icon: <Trash2 className="h-4 w-4" aria-hidden />, onSelect: () => onDelete(post), tone: 'danger' as const }]
                : []),
            ]}
          />
        )}
      </header>

      <h3 id={titleId} className="mt-3 text-base font-semibold leading-snug text-ink md:text-lg">
        {post.title}
      </h3>
      {post.description && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-muted">{post.description}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip
          tone="neutral"
          onClick={onFilterCareer ? () => onFilterCareer(post.career.id) : undefined}
          title={onFilterCareer ? `Ver recursos de ${post.career.name}` : undefined}
        >
          {post.career.name}
        </Chip>
        <Chip
          tone="brand"
          onClick={onFilterSubject ? () => onFilterSubject(post.subject.id) : undefined}
          title={onFilterSubject ? `Ver recursos de ${post.subject.name}` : undefined}
        >
          {post.subject.name}
        </Chip>
      </div>

      {images.length > 0 && (
        <div className={cn('mt-4 grid gap-2', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3')}>
          {images.slice(0, 3).map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt={`Vista previa de ${img.name}`}
              loading="lazy"
              className={cn(
                'w-full rounded-lg border border-line bg-primary-50',
                // Una sola imagen se muestra completa (diagramas); varias, recortadas en cuadrícula.
                images.length === 1 ? 'aspect-[16/9] max-h-64 object-contain' : 'aspect-[4/3] object-cover',
              )}
            />
          ))}
        </div>
      )}

      <section className="mt-4" aria-label={`Adjuntos (${post.attachments.length})`}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {pluralize(post.attachments.length, 'adjunto', 'adjuntos')}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {post.attachments.map((a) => (
            <li key={a.id} className="min-w-0">
              <AttachmentRow attachment={a} post={post} />
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StarRatingDisplay value={post.ratingAvg} />
          <span className="text-sm font-semibold text-ink">{post.ratingCount ? formatRating(post.ratingAvg) : '—'}</span>
          <span className="text-xs text-ink-muted">
            ({post.ratingCount ? pluralize(post.ratingCount, 'valoración', 'valoraciones') : 'sin valoraciones'})
          </span>
          {!isMine && (
            <button
              type="button"
              onClick={() => setRating((v) => !v)}
              aria-expanded={rating}
              className="ml-1 inline-flex min-h-11 items-center rounded-md px-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 md:min-h-8"
            >
              {post.myRating ? `Tu voto: ${post.myRating} ★ · cambiar` : 'Valorar'}
            </button>
          )}
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <MessageSquare className="h-4 w-4" aria-hidden />
          {pluralize(post.commentCount, 'respuesta', 'respuestas')} en el foro
        </p>
        {rating && (
          <div className="flex w-full items-center gap-3 rounded-lg bg-primary-50 px-3 py-1">
            <span className="text-sm text-ink">¿Qué tan útil te resultó?</span>
            <StarRatingInput value={post.myRating} onChange={rate} disabled={savingRating} label="Valora este recurso" />
          </div>
        )}
      </footer>
    </article>
  );
}
