import { ACCEPTED_FILE_TYPES, FEED_PAGE_SIZE } from '@/config';
import { buildMockPdf } from '@/mocks/assets';
import { db, newId, persist } from '@/mocks/db';
import type { MockPost } from '@/mocks/posts';
import type { Attachment, Page, Post, PostInput, PostQuery } from '@/types';
import { normalize } from '@/utils/text';
import { ApiError, mockDelay } from './apiClient';
import { currentUserId } from './authService';
import { toPost } from './mappers';

/**
 * Publicaciones (recursos).
 * Backend real:
 *   GET    /api/posts?q=&careerId=&subjectId=&authorId=&favorites=&page=&size=
 *   GET    /api/posts/:id
 *   POST   /api/posts            PUT /api/posts/:id        DELETE /api/posts/:id
 *   PUT    /api/posts/:id/rating { value }
 *   POST   /api/attachments      (multipart, devuelve el Attachment con su URL en Supabase Storage)
 */

function matchesQuery(p: MockPost, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const post = toPost(p);
  const haystack = normalize(
    [post.title, post.description ?? '', post.subject.name, post.career.name, post.author.name].join(' '),
  );
  return terms.every((t) => haystack.includes(t));
}

export async function getPosts(query: PostQuery = {}): Promise<Page<Post>> {
  await mockDelay();
  const viewerId = currentUserId();
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? FEED_PAGE_SIZE;
  const terms = normalize(query.q ?? '').split(/\s+/).filter(Boolean);
  const favorites = query.onlyFavorites ? db().favorites[viewerId] ?? [] : null;

  const filtered = db()
    .posts.filter((p) => !query.careerId || p.careerId === query.careerId)
    .filter((p) => !query.subjectId || p.subjectId === query.subjectId)
    .filter((p) => !query.authorId || p.authorId === query.authorId)
    .filter((p) => !favorites || favorites.includes(p.authorId))
    .filter((p) => matchesQuery(p, terms))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize).map((p) => toPost(p, viewerId)),
    page,
    pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length,
  };
}

function findOwnPost(id: string): MockPost {
  const post = db().posts.find((p) => p.id === id);
  if (!post) throw new ApiError('La publicación no existe o fue eliminada.', 404, 'NOT_FOUND');
  if (post.authorId !== currentUserId()) {
    throw new ApiError('Solo el autor puede modificar esta publicación.', 403, 'FORBIDDEN');
  }
  return post;
}

export async function getPost(id: string): Promise<Post> {
  await mockDelay(200, 400);
  const post = db().posts.find((p) => p.id === id);
  if (!post) throw new ApiError('La publicación no existe o fue eliminada.', 404, 'NOT_FOUND');
  return toPost(post, currentUserId());
}

function validateInput(input: PostInput): void {
  const career = db().careers.find((c) => c.id === input.careerId);
  if (!input.title.trim()) throw new ApiError('El título es obligatorio.', 400);
  if (!career?.subjects.some((s) => s.id === input.subjectId)) {
    throw new ApiError('La materia no pertenece a la carrera seleccionada.', 400);
  }
  if (input.attachments.length === 0) throw new ApiError('Agrega al menos un archivo o enlace.', 400);
}

export async function createPost(input: PostInput): Promise<Post> {
  await mockDelay(500, 900);
  validateInput(input);
  const record: MockPost = {
    id: newId('p'),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    authorId: currentUserId(),
    careerId: input.careerId,
    subjectId: input.subjectId,
    attachments: input.attachments,
    createdAt: new Date().toISOString(),
    commentCount: 0,
    baseRatingSum: 0,
    baseRatingCount: 0,
  };
  db().posts.unshift(record);
  persist();
  return toPost(record, record.authorId);
}

export async function updatePost(id: string, input: PostInput): Promise<Post> {
  await mockDelay(500, 900);
  validateInput(input);
  const post = findOwnPost(id);
  Object.assign(post, {
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    careerId: input.careerId,
    subjectId: input.subjectId,
    attachments: input.attachments,
    updatedAt: new Date().toISOString(),
  });
  persist();
  return toPost(post, post.authorId);
}

export async function deletePost(id: string): Promise<void> {
  await mockDelay(400, 700);
  findOwnPost(id);
  const data = db();
  data.posts = data.posts.filter((p) => p.id !== id);
  delete data.ratings[id];
  persist();
}

export async function ratePost(id: string, value: number): Promise<Post> {
  await mockDelay(200, 400);
  const userId = currentUserId();
  const post = db().posts.find((p) => p.id === id);
  if (!post) throw new ApiError('La publicación no existe o fue eliminada.', 404);
  if (post.authorId === userId) throw new ApiError('No puedes valorar tus propios recursos.', 400);
  const ratings = (db().ratings[id] ??= {});
  ratings[userId] = Math.min(5, Math.max(1, Math.round(value)));
  persist();
  return toPost(post, userId);
}

/* ---------- Adjuntos ---------- */

/** Reduce imágenes para guardarlas en el mock sin llenar localStorage. */
async function downscaleImage(file: File, maxSide = 960): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Sube un archivo y devuelve el adjunto creado. El progreso es simulado
 * (con la API real se usa XMLHttpRequest.upload.onprogress).
 */
export function uploadAttachment(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<Attachment> {
  const kind = ACCEPTED_FILE_TYPES[file.type];
  return new Promise((resolve, reject) => {
    if (!kind) {
      reject(new ApiError('Tipo de archivo no permitido.', 415));
      return;
    }
    let percent = 0;
    const totalMs = Math.min(2600, 700 + file.size / 6000);
    const timer = window.setInterval(async () => {
      percent = Math.min(100, percent + 100 / (totalMs / 120));
      onProgress(Math.round(percent));
      if (percent < 100) return;
      window.clearInterval(timer);
      try {
        const url = kind === 'image' ? await downscaleImage(file) : URL.createObjectURL(file);
        resolve({ id: newId('a'), kind, name: file.name, sizeBytes: file.size, mimeType: file.type, url });
      } catch {
        reject(new ApiError('No se pudo procesar el archivo.', 422));
      }
    }, 120);
    signal?.addEventListener('abort', () => {
      window.clearInterval(timer);
      reject(new DOMException('Carga cancelada', 'AbortError'));
    });
  });
}

/** Descarga un adjunto de archivo (PDF o imagen). */
export async function downloadAttachment(attachment: Attachment, post: Pick<Post, 'title' | 'subject'>): Promise<void> {
  let href = attachment.url;
  let revoke = false;
  if (!href) {
    // En el mock los PDF de ejemplo no existen: se genera uno al vuelo.
    href = URL.createObjectURL(buildMockPdf(post.title, `${post.subject.name} · ${attachment.name}`));
    revoke = true;
  }
  const a = document.createElement('a');
  a.href = href;
  a.download = attachment.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href!), 4000);
}
