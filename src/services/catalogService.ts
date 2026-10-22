import { db } from '@/mocks/db';
import type { Career } from '@/types';
import { mockDelay } from './apiClient';

/**
 * Carreras y materias.
 * Backend real: GET /api/careers?include=subjects,postCount
 */
export async function getCareers(): Promise<Career[]> {
  await mockDelay(200, 400);
  const data = db();
  return data.careers.map((career) => ({
    id: career.id,
    name: career.name,
    shortName: career.shortName,
    subjects: career.subjects.map((s) => ({
      id: s.id,
      careerId: career.id,
      name: s.name,
      postCount: data.posts.filter((p) => p.subjectId === s.id).length,
    })),
  }));
}
