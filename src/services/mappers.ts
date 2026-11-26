import type { Attachment, Career, ForumReply, ForumThread, NamedRef, Post, User, UserSummary } from '@/types';

/**
 * DTO que entrega el backend Spring Boot (IngeNote) y su conversión a los
 * tipos que usa la interfaz.
 */

export interface UsuarioDto {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  fechaRegistro?: string;
  idCarrera: string | null;
}

export interface AsignaturaDto {
  id: string;
  nombre: string;
  semestre: number | null;
}

export interface CarreraDto {
  id: string;
  nombre: string;
  asignaturas: AsignaturaDto[];
}

export interface RecursoDto {
  id: string;
  titulo: string;
  urlStorage: string;
  tipoFormato: string;
  idAsignatura: string;
  asignatura: string;
  idAutor: string;
  autor: string;
  idCarreraAutor: string | null;
  fechaSubida: string;
  promedioValoracion: number;
  cantidadValoraciones: number;
  valoracionUsuarioActual: number | null;
}

export interface AutorDto {
  id: string;
  nombre: string;
  idCarrera?: string | null;
}

export interface HiloDto {
  id: string;
  titulo: string;
  contenido: string;
  fechaCreacion: string;
  autor: AutorDto;
  asignatura: { id: string; nombre: string };
  cantidadRespuestas: number;
  idRespuestaSolucion: string | null;
}

export interface RespuestaDto {
  id: string;
  idHilo: string;
  autor: AutorDto;
  contenido: string;
  fechaCreacion: string;
}

/* ---------- Catálogo en memoria (lo llena catalogService) ---------- */

let careersCache: Career[] = [];

export function setCareersCache(careers: Career[]): void {
  careersCache = careers;
}

export function getCareersCache(): Career[] {
  return careersCache;
}

/** Ids de las asignaturas de una carrera (una asignatura puede estar en varias). */
export function subjectIdsOfCareer(careerId: string): Set<string> {
  return new Set(careersCache.find((c) => c.id === careerId)?.subjects.map((s) => s.id) ?? []);
}

const NO_CAREER: NamedRef = { id: '', name: 'Ingeniería' };

function careerRef(careerId?: string | null): NamedRef | undefined {
  const career = careerId ? careersCache.find((c) => c.id === careerId) : undefined;
  return career ? { id: career.id, name: career.name } : undefined;
}

/** Carrera que se muestra en un recurso o hilo: la del autor; si no tiene, la primera que incluye la materia. */
function careerFor(authorCareerId: string | null | undefined, subjectId: string): NamedRef {
  return (
    careerRef(authorCareerId) ??
    careerRef(careersCache.find((c) => c.subjects.some((s) => s.id === subjectId))?.id) ??
    NO_CAREER
  );
}

/* ---------- Conversión ---------- */

/** El backend guarda fechas en UTC sin zona (LocalDateTime); se marcan como UTC. */
export function toIso(fecha: string | undefined): string {
  if (!fecha) return new Date().toISOString();
  return /(Z|[+-]\d{2}:\d{2})$/.test(fecha) ? fecha : `${fecha}Z`;
}

export function toUser(u: UsuarioDto): User {
  return { id: u.id, name: u.nombre, email: u.correo, careerId: u.idCarrera ?? '', joinedAt: toIso(u.fechaRegistro) };
}

export function toUserSummary(a: AutorDto): UserSummary {
  const career = careerRef(a.idCarrera);
  return { id: a.id, name: a.nombre, careerId: career?.id ?? '', careerName: career?.name ?? 'Ingeniería' };
}

/** Nombre original del archivo: último segmento de la URL sin el prefijo UUID que agrega el backend. */
export function fileNameFromUrl(url: string): string {
  const last = url.split('/').pop() ?? 'archivo';
  let decoded = last;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    // Se deja tal cual.
  }
  return decoded.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
}

export function toPost(r: RecursoDto): Post {
  const attachment: Attachment = {
    id: `${r.id}-archivo`,
    kind: r.tipoFormato === 'PDF' ? 'pdf' : 'image',
    name: fileNameFromUrl(r.urlStorage),
    url: r.urlStorage,
  };
  return {
    id: r.id,
    title: r.titulo,
    author: toUserSummary({ id: r.idAutor, nombre: r.autor, idCarrera: r.idCarreraAutor }),
    career: careerFor(r.idCarreraAutor, r.idAsignatura),
    subject: { id: r.idAsignatura, name: r.asignatura },
    attachments: [attachment],
    createdAt: toIso(r.fechaSubida),
    ratingAvg: r.promedioValoracion ?? 0,
    ratingCount: r.cantidadValoraciones ?? 0,
    myRating: r.valoracionUsuarioActual ?? undefined,
  };
}

export function toThread(h: HiloDto): ForumThread {
  const createdAt = toIso(h.fechaCreacion);
  return {
    id: h.id,
    title: h.titulo,
    body: h.contenido,
    author: toUserSummary(h.autor),
    career: careerFor(h.autor.idCarrera, h.asignatura.id),
    subject: { id: h.asignatura.id, name: h.asignatura.nombre },
    createdAt,
    lastActivityAt: createdAt,
    replyCount: h.cantidadRespuestas,
    acceptedReplyId: h.idRespuestaSolucion ?? undefined,
  };
}

export function toReply(r: RespuestaDto): ForumReply {
  return {
    id: r.id,
    threadId: r.idHilo,
    body: r.contenido,
    author: toUserSummary(r.autor),
    createdAt: toIso(r.fechaCreacion),
  };
}
