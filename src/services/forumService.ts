import { db, newId, persist } from '@/mocks/db';
import type { MockReply, MockThread } from '@/mocks/forum';
import type { ForumReply, ForumThread, ForumThreadDetail, Page, ThreadInput, ThreadQuery } from '@/types';
import { normalize } from '@/utils/text';
import { ApiError, mockDelay } from './apiClient';
import { currentUserId } from './authService';
import { careerName, toUserSummary } from './mappers';

/**
 * Foros de preguntas y respuestas por materia.
 * Backend real:
 *   GET    /api/forum/threads?careerId=&subjectId=&authorId=&q=&page=&size=
 *   GET    /api/forum/threads/:id            (incluye las respuestas)
 *   POST   /api/forum/threads                DELETE /api/forum/threads/:id
 *   POST   /api/forum/threads/:id/replies    DELETE /api/forum/replies/:id
 *   PUT    /api/forum/threads/:id/accepted   { replyId | null }
 */

const PAGE_SIZE = 10;

function authorOf(userId: string) {
  const user = db().users.find((u) => u.id === userId);
  return user
    ? toUserSummary(user)
    : { id: userId, name: 'Usuario eliminado', careerId: '', careerName: '' };
}

function subjectRef(subjectId: string) {
  const career = db().careers.find((c) => c.subjects.some((s) => s.id === subjectId));
  const subject = career?.subjects.find((s) => s.id === subjectId);
  return {
    career: { id: career?.id ?? '', name: career ? careerName(career.id) : 'Carrera' },
    subject: { id: subjectId, name: subject?.name ?? 'Materia' },
  };
}

function toThread(t: MockThread): ForumThread {
  const replies = db().replies.filter((r) => r.threadId === t.id);
  const lastActivityAt = replies.reduce((latest, r) => (r.createdAt > latest ? r.createdAt : latest), t.createdAt);
  return {
    id: t.id,
    title: t.title,
    body: t.body,
    author: authorOf(t.authorId),
    ...subjectRef(t.subjectId),
    createdAt: t.createdAt,
    lastActivityAt,
    replyCount: replies.length,
    acceptedReplyId: t.acceptedReplyId,
  };
}

function toReply(r: MockReply): ForumReply {
  return { id: r.id, threadId: r.threadId, body: r.body, author: authorOf(r.authorId), createdAt: r.createdAt };
}

function findThread(id: string): MockThread {
  const thread = db().threads.find((t) => t.id === id);
  if (!thread) throw new ApiError('La pregunta no existe o fue eliminada.', 404, 'NOT_FOUND');
  return thread;
}

export async function getThreads(query: ThreadQuery = {}): Promise<Page<ForumThread>> {
  await mockDelay();
  currentUserId();
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const terms = normalize(query.q ?? '').split(/\s+/).filter(Boolean);
  const careerSubjects = query.careerId
    ? new Set(db().careers.find((c) => c.id === query.careerId)?.subjects.map((s) => s.id) ?? [])
    : null;

  const filtered = db()
    .threads.filter((t) => !query.subjectId || t.subjectId === query.subjectId)
    .filter((t) => !careerSubjects || careerSubjects.has(t.subjectId))
    .filter((t) => !query.authorId || t.authorId === query.authorId)
    .map(toThread)
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
  await mockDelay(250, 450);
  currentUserId();
  const thread = findThread(id);
  const replies = db()
    .replies.filter((r) => r.threadId === id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toReply);
  return { thread: toThread(thread), replies };
}

export async function createThread(input: ThreadInput): Promise<ForumThread> {
  await mockDelay(400, 700);
  if (!db().careers.some((c) => c.subjects.some((s) => s.id === input.subjectId))) {
    throw new ApiError('Elige una materia válida.', 400);
  }
  if (!input.title.trim() || !input.body.trim()) throw new ApiError('Completa el título y la pregunta.', 400);
  const record: MockThread = {
    id: newId('t'),
    title: input.title.trim(),
    body: input.body.trim(),
    authorId: currentUserId(),
    subjectId: input.subjectId,
    createdAt: new Date().toISOString(),
  };
  db().threads.unshift(record);
  persist();
  return toThread(record);
}

export async function deleteThread(id: string): Promise<void> {
  await mockDelay(300, 500);
  const thread = findThread(id);
  if (thread.authorId !== currentUserId()) throw new ApiError('Solo el autor puede eliminar la pregunta.', 403);
  const data = db();
  data.threads = data.threads.filter((t) => t.id !== id);
  data.replies = data.replies.filter((r) => r.threadId !== id);
  persist();
}

export async function createReply(threadId: string, body: string): Promise<ForumReply> {
  await mockDelay(300, 600);
  findThread(threadId);
  if (!body.trim()) throw new ApiError('Escribe tu respuesta.', 400);
  const record: MockReply = {
    id: newId('r'),
    threadId,
    body: body.trim(),
    authorId: currentUserId(),
    createdAt: new Date().toISOString(),
  };
  db().replies.push(record);
  persist();
  return toReply(record);
}

export async function deleteReply(replyId: string): Promise<void> {
  await mockDelay(250, 450);
  const reply = db().replies.find((r) => r.id === replyId);
  if (!reply) throw new ApiError('La respuesta ya no existe.', 404);
  if (reply.authorId !== currentUserId()) throw new ApiError('Solo puedes eliminar tus respuestas.', 403);
  const data = db();
  data.replies = data.replies.filter((r) => r.id !== replyId);
  const thread = data.threads.find((t) => t.id === reply.threadId);
  if (thread?.acceptedReplyId === replyId) thread.acceptedReplyId = undefined;
  persist();
}

/** El autor de la pregunta marca (o desmarca con null) la respuesta que la resolvió. */
export async function setAcceptedReply(threadId: string, replyId: string | null): Promise<ForumThread> {
  await mockDelay(200, 400);
  const thread = findThread(threadId);
  if (thread.authorId !== currentUserId()) {
    throw new ApiError('Solo quien hizo la pregunta puede elegir la solución.', 403);
  }
  if (replyId && !db().replies.some((r) => r.id === replyId && r.threadId === threadId)) {
    throw new ApiError('La respuesta no pertenece a esta pregunta.', 400);
  }
  thread.acceptedReplyId = replyId ?? undefined;
  persist();
  return toThread(thread);
}
