import type { Career } from '@/types';
import { api } from './apiClient';
import { getCareersCache, setCareersCache, type CarreraDto, type RecursoDto } from './mappers';

/**
 * Carreras y materias.
 *   GET /api/carreras   (público; carreras con sus asignaturas)
 *   GET /api/recursos   (requiere sesión; para contar recursos por materia)
 * Una asignatura puede pertenecer a varias carreras (p. ej. Cálculo).
 */
export async function getCareers(): Promise<Career[]> {
  const [carreras, recursos] = await Promise.all([
    api.get<CarreraDto[]>('/api/carreras'),
    api.get<RecursoDto[]>('/api/recursos').catch(() => [] as RecursoDto[]),
  ]);
  const counts = new Map<string, number>();
  for (const r of recursos) counts.set(r.idAsignatura, (counts.get(r.idAsignatura) ?? 0) + 1);

  const careers: Career[] = carreras.map((c) => ({
    id: c.id,
    name: c.nombre,
    shortName: c.nombre.replace(/^Ingeniería\s+(de\s+)?/i, 'Ing. $1'),
    subjects: c.asignaturas.map((a) => ({
      id: a.id,
      careerId: c.id,
      name: a.nombre,
      postCount: counts.get(a.id) ?? 0,
    })),
  }));
  setCareersCache(careers);
  return careers;
}

/** Garantiza que el catálogo esté cargado antes de convertir recursos o hilos. */
export async function ensureCareers(): Promise<Career[]> {
  const cached = getCareersCache();
  return cached.length > 0 ? cached : getCareers();
}
