import { CAREER_ID, CAREER_NAME } from '@/config';
import type { Attachment, ForumReply, ForumThread, NamedRef, Post, User, UserSummary } from '@/types';

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
}

export interface AsignaturaDto {
  id: string;
  nombre: string;
  semestre: number | null;
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
  fechaSubida: string;
  promedioValoracion: number;
  cantidadValoraciones: number;
  valoracionUsuarioActual: number | null;
}

export interface AutorDto {
  id: string;
  nombre: string;
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

export const CAREER_REF: NamedRef = { id: CAREER_ID, name: CAREER_NAME };

/** El backend guarda fechas en UTC sin zona (LocalDateTime); se marcan como UTC. */
export function toIso(fecha: string | undefined): string {
  if (!fecha) return new Date().toISOString();
  return /(Z|[+-]\d{2}:\d{2})$/.test(fecha) ? fecha : `${fecha}Z`;
}

export function toUser(u: UsuarioDto): User {
  return { id: u.id, name: u.nombre, email: u.correo, careerId: CAREER_ID, joinedAt: toIso(u.fechaRegistro) };
}

export function toUserSummary(a: AutorDto): UserSummary {
  return { id: a.id, name: a.nombre, careerId: CAREER_ID, careerName: CAREER_NAME };
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
    author: toUserSummary({ id: r.idAutor, nombre: r.autor }),
    career: CAREER_REF,
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
    career: CAREER_REF,
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
