import { ACCEPTED_FILE_TYPES, FEED_PAGE_SIZE, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/config';
import type { Attachment, Page, Post, PostInput, PostQuery } from '@/types';
import { normalize } from '@/utils/text';
import { api, ApiError } from './apiClient';
import { ensureCareers } from './catalogService';
import { subjectIdsOfCareer, toPost, type RecursoDto } from './mappers';
import { getFavorites } from './userService';

/**
 * Recursos académicos contra el backend:
 *   GET    /api/recursos[?idAsignatura=]            (con valoración del usuario actual)
 *   POST   /api/recursos         (multipart: archivo o enlace, idAsignatura, titulo, descripcion)
 *   PUT    /api/recursos/:id     (mismos campos; archivo o enlace solo si cambia)
 *   DELETE /api/recursos/:id
 *   PUT    /api/recursos/:id/valoraciones           { estrellas: 1..5 }
 * Búsqueda, filtro por autor y paginación se resuelven en el cliente.
 */

async function fetchAll(subjectId?: string): Promise<Post[]> {
  const path = subjectId ? `/api/recursos?idAsignatura=${encodeURIComponent(subjectId)}` : '/api/recursos';
  const [recursos] = await Promise.all([api.get<RecursoDto[]>(path), ensureCareers()]);
  return recursos.map(toPost).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function matchesQuery(post: Post, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = normalize([post.title, post.subject.name, post.career.name, post.author.name].join(' '));
  return terms.every((t) => haystack.includes(t));
}

export async function getPosts(query: PostQuery = {}): Promise<Page<Post>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? FEED_PAGE_SIZE;
  const terms = normalize(query.q ?? '').split(/\s+/).filter(Boolean);

  const careerSubjects = query.careerId ? subjectIdsOfCareer(query.careerId) : null;
  const favorites = query.onlyFavorites ? new Set((await getFavorites()).map((f) => f.id)) : null;
  const filtered = (await fetchAll(query.subjectId))
    // Una carrera agrupa los recursos de todas sus materias.
    .filter((p) => !careerSubjects || careerSubjects.has(p.subject.id))
    .filter((p) => !favorites || favorites.has(p.author.id))
    .filter((p) => !query.authorId || p.author.id === query.authorId)
    .filter((p) => matchesQuery(p, terms));

  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length,
  };
}

export async function getPost(id: string): Promise<Post> {
  const post = (await fetchAll()).find((p) => p.id === id);
  if (!post) throw new ApiError('La publicación no existe o fue eliminada.', 404, 'NOT_FOUND');
  return post;
}

/* ---------- Adjuntos ---------- */

/** Archivos elegidos en el formulario, a la espera de publicarse con el recurso. */
const pendingFiles = new Map<string, File>();

/**
 * Arma el formulario multipart. Un recurso lleva un archivo o un enlace; en la
 * edición solo se envía si cambió (si no, el backend conserva el actual).
 */
function buildForm(input: PostInput, current?: Post): FormData {
  if (!input.title.trim()) throw new ApiError('El título es obligatorio.', 400);
  if (!input.subjectId) throw new ApiError('Elige la materia.', 400);
  const form = new FormData();
  form.append('idAsignatura', input.subjectId);
  form.append('titulo', input.title.trim());
  if (input.description?.trim()) form.append('descripcion', input.description.trim());

  const fileAttachment = input.attachments.find((a) => a.kind !== 'link' && pendingFiles.has(a.id));
  const link = input.attachments.find((a) => a.kind === 'link' && a.url);
  const unchanged = current && input.attachments.some((a) => current.attachments.some((c) => c.id === a.id));

  if (fileAttachment) {
    const file = pendingFiles.get(fileAttachment.id)!;
    form.append('archivo', file, file.name);
  } else if (link && !unchanged) {
    form.append('enlace', link.url!);
  } else if (!current) {
    throw new ApiError('Adjunta un archivo o un enlace.', 400);
  }
  return form;
}

export async function createPost(input: PostInput): Promise<Post> {
  const created = await api.post<RecursoDto>('/api/recursos', buildForm(input));
  for (const a of input.attachments) pendingFiles.delete(a.id);
  return toPost(created);
}

export async function updatePost(id: string, input: PostInput): Promise<Post> {
  const current = await getPost(id);
  const updated = await api.put<RecursoDto>(`/api/recursos/${id}`, buildForm(input, current));
  for (const a of input.attachments) pendingFiles.delete(a.id);
  return toPost(updated);
}

export async function deletePost(id: string): Promise<void> {
  await api.delete<void>(`/api/recursos/${id}`);
}

export async function ratePost(id: string, value: number): Promise<Post> {
  const estrellas = Math.min(5, Math.max(1, Math.round(value)));
  await api.put(`/api/recursos/${id}/valoraciones`, { estrellas });
  return getPost(id);
}

/**
 * Valida el archivo y lo deja listo para publicarse. La subida real ocurre al
 * publicar, junto con el título y la materia, porque el backend crea el recurso
 * y guarda el archivo en una sola petición.
 */
export function uploadAttachment(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<Attachment> {
  const kind = ACCEPTED_FILE_TYPES[file.type];
  if (!kind) return Promise.reject(new ApiError('Tipo de archivo no permitido. Usa PDF o imagen.', 415));
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Promise.reject(new ApiError(`El archivo supera ${MAX_FILE_SIZE_MB} MB.`, 413));
  }
  if (signal?.aborted) return Promise.reject(new DOMException('Carga cancelada', 'AbortError'));
  const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  pendingFiles.set(id, file);
  onProgress(100);
  return Promise.resolve({
    id,
    kind,
    name: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
    url: URL.createObjectURL(file),
  });
}

/** Descarga un adjunto desde Supabase Storage. */
export async function downloadAttachment(attachment: Attachment, _post: Pick<Post, 'title' | 'subject'>): Promise<void> {
  if (!attachment.url) throw new ApiError('El archivo no está disponible.', 404);
  try {
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error(String(response.status));
    const href = URL.createObjectURL(await response.blob());
    const a = document.createElement('a');
    a.href = href;
    a.download = attachment.name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  } catch {
    // Si el navegador bloquea la descarga directa, se abre el archivo en otra pestaña.
    window.open(attachment.url, '_blank', 'noopener');
  }
}
