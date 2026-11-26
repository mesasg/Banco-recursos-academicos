import { CAREER_ID, CAREER_NAME, CAREER_SHORT_NAME } from '@/config';
import type { Career } from '@/types';
import { api } from './apiClient';
import type { AsignaturaDto, RecursoDto } from './mappers';

/**
 * Carreras y materias.
 *   GET /api/asignaturas  (ordenadas por semestre)
 *   GET /api/recursos     (para contar recursos por materia)
 * Todas las asignaturas pertenecen a una sola carrera.
 */
export async function getCareers(): Promise<Career[]> {
  const [asignaturas, recursos] = await Promise.all([
    api.get<AsignaturaDto[]>('/api/asignaturas'),
    api.get<RecursoDto[]>('/api/recursos'),
  ]);
  const counts = new Map<string, number>();
  for (const r of recursos) counts.set(r.idAsignatura, (counts.get(r.idAsignatura) ?? 0) + 1);

  return [
    {
      id: CAREER_ID,
      name: CAREER_NAME,
      shortName: CAREER_SHORT_NAME,
      subjects: asignaturas.map((a) => ({
        id: a.id,
        careerId: CAREER_ID,
        name: a.nombre,
        postCount: counts.get(a.id) ?? 0,
      })),
    },
  ];
}
