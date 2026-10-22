import type { MockPost } from '@/mocks/posts';
import type { MockUser } from '@/mocks/users';
import { db } from '@/mocks/db';
import type { Post, User, UserSummary } from '@/types';

/**
 * Convierte los registros del mock en los DTO que entregará el backend.
 * Al conectar la API, estos mapeos los hace Spring Boot y este archivo se elimina.
 */

export function toUser(u: MockUser): User {
  const { password: _password, ...user } = u;
  return user;
}

export function careerName(careerId: string): string {
  return db().careers.find((c) => c.id === careerId)?.name ?? 'Carrera';
}

export function toUserSummary(u: MockUser): UserSummary {
  return {
    id: u.id,
    name: u.name,
    avatarUrl: u.avatarUrl,
    careerId: u.careerId,
    careerName: careerName(u.careerId),
  };
}

export function ratingOf(post: MockPost): { avg: number; count: number } {
  const votes = Object.values(db().ratings[post.id] ?? {});
  const count = post.baseRatingCount + votes.length;
  const sum = post.baseRatingSum + votes.reduce((a, b) => a + b, 0);
  return { avg: count ? sum / count : 0, count };
}

export function toPost(p: MockPost, viewerId?: string): Post {
  const data = db();
  const author = data.users.find((u) => u.id === p.authorId);
  const career = data.careers.find((c) => c.id === p.careerId);
  const subject = career?.subjects.find((s) => s.id === p.subjectId);
  const { avg, count } = ratingOf(p);

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    author: author
      ? toUserSummary(author)
      : { id: p.authorId, name: 'Usuario eliminado', careerId: p.careerId, careerName: careerName(p.careerId) },
    career: { id: p.careerId, name: career?.name ?? 'Carrera' },
    subject: { id: p.subjectId, name: subject?.name ?? 'Materia' },
    attachments: p.attachments,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    ratingAvg: avg,
    ratingCount: count,
    myRating: viewerId ? db().ratings[p.id]?.[viewerId] : undefined,
    commentCount: p.commentCount,
  };
}
