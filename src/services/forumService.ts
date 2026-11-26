import type { ForumReply, ForumThread, ForumThreadDetail, Page, ThreadInput, ThreadQuery } from '@/types';
import { normalize } from '@/utils/text';
import { api, ApiError } from './apiClient';
import { ensureCareers } from './catalogService';
import { subjectIdsOfCareer, toReply, toThread, type HiloDto, type RespuestaDto } from './mappers';

/**
 * Foros de preguntas y respuestas por materia, contra el backend:
 *   GET    /api/foros/hilos?idAsignatura=&pagina=&tamano=
 *   GET    /api/foros/hilos/:id                         { hilo, respuestas }
 *   POST   /api/foros/asignaturas/:idAsignatura/hilos   { titulo, contenido }
 *   DELETE /api/foros/hilos/:id
 *   POST   /api/foros/hilos/:id/respuestas              { contenido }
 *   DELETE /api/foros/respuestas/:id
 *   PATCH  /api/foros/hilos/:id/respuestas/:rid/solucion  (marca o desmarca)
 * Búsqueda y filtro por autor se resuelven en el cliente.
 */

const PAGE_SIZE = 10;
const MAX_FETCH = 100;

interface PaginaDto {
  contenido: HiloDto[];
  total: number;
}

export async function getThreads(query: ThreadQuery = {}): Promise<Page<ForumThread>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const terms = normalize(query.q ?? '').split(/\s+/).filter(Boolean);
  const params = new URLSearchParams({ pagina: '0', tamano: String(MAX_FETCH) });
  if (query.subjectId) params.set('idAsignatura', query.subjectId);

  const [data] = await Promise.all([api.get<PaginaDto>(`/api/foros/hilos?${params.toString()}`), ensureCareers()]);
  const careerSubjects = query.careerId ? subjectIdsOfCareer(query.careerId) : null;
  const filtered = data.contenido
    .map(toThread)
    .filter((t) => !careerSubjects || careerSubjects.has(t.subject.id))
    .filter((t) => !query.authorId || t.author.id === query.authorId)
    .filter((t) => {
      if (terms.length === 0) return true;
      const haystack = normalize([t.title, t.body, t.author.name, t.subject.name].join(' '));
      return terms.every((term) => haystack.includes(term));
    })
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));

  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length,
  };
}

export async function getThread(id: string): Promise<ForumThreadDetail> {
  const [data] = await Promise.all([
    api.get<{ hilo: HiloDto; respuestas: RespuestaDto[] }>(`/api/foros/hilos/${id}`),
    ensureCareers(),
  ]);
  const replies = data.respuestas.map(toReply);
  const thread = toThread(data.hilo);
  const last = replies.reduce((latest, r) => (r.createdAt > latest ? r.createdAt : latest), thread.createdAt);
  return { thread: { ...thread, lastActivityAt: last }, replies };
}

export async function createThread(input: ThreadInput): Promise<ForumThread> {
  if (!input.subjectId) throw new ApiError('Elige una materia válida.', 400);
  if (!input.title.trim() || !input.body.trim()) throw new ApiError('Completa el título y la pregunta.', 400);
  const hilo = await api.post<HiloDto>(`/api/foros/asignaturas/${input.subjectId}/hilos`, {
    titulo: input.title.trim(),
    contenido: input.body.trim(),
  });
  return toThread(hilo);
}

export async function deleteThread(id: string): Promise<void> {
  await api.delete<void>(`/api/foros/hilos/${id}`);
}

export async function createReply(threadId: string, body: string): Promise<ForumReply> {
  if (!body.trim()) throw new ApiError('Escribe tu respuesta.', 400);
  const respuesta = await api.post<RespuestaDto>(`/api/foros/hilos/${threadId}/respuestas`, {
    contenido: body.trim(),
  });
  return toReply(respuesta);
}

export async function deleteReply(replyId: string): Promise<void> {
  await api.delete<void>(`/api/foros/respuestas/${replyId}`);
}

/** El autor de la pregunta marca (o desmarca con null) la respuesta que la resolvió. */
export async function setAcceptedReply(threadId: string, replyId: string | null): Promise<ForumThread> {
  // El backend alterna: marcar la solución actual la desmarca.
  const target = replyId ?? (await getThread(threadId)).thread.acceptedReplyId;
  if (!target) return (await getThread(threadId)).thread;
  const hilo = await api.patch<HiloDto>(`/api/foros/hilos/${threadId}/respuestas/${target}/solucion`);
  return toThread(hilo);
}
