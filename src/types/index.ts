export type ID = string;

export interface Subject {
  id: ID;
  careerId: ID;
  name: string;
  /** Número de publicaciones en la materia (lo calcula el backend). */
  postCount: number;
}

export interface Career {
  id: ID;
  name: string;
  shortName: string;
  subjects: Subject[];
}

export interface User {
  id: ID;
  name: string;
  email: string;
  careerId: ID;
  avatarUrl?: string;
  joinedAt: string;
}

/** Versión resumida de un usuario, la que viaja dentro de otras entidades. */
export interface UserSummary {
  id: ID;
  name: string;
  avatarUrl?: string;
  careerId: ID;
  careerName: string;
}

export interface UserStats {
  postCount: number;
  /** Promedio de las valoraciones recibidas en todas sus publicaciones (0 si no tiene). */
  ratingAvg: number;
  ratingCount: number;
}

export type AttachmentKind = 'pdf' | 'image' | 'link';

export interface Attachment {
  id: ID;
  kind: AttachmentKind;
  name: string;
  url?: string;
  sizeBytes?: number;
  mimeType?: string;
}

export interface NamedRef {
  id: ID;
  name: string;
}

export interface Post {
  id: ID;
  title: string;
  description?: string;
  author: UserSummary;
  career: NamedRef;
  subject: NamedRef;
  attachments: Attachment[];
  createdAt: string;
  updatedAt?: string;
  ratingAvg: number;
  ratingCount: number;
  /** Valoración que le dio el usuario actual (si la hay). */
  myRating?: number;
  commentCount: number;
}

export interface PostInput {
  title: string;
  description?: string;
  careerId: ID;
  subjectId: ID;
  /** Adjuntos ya subidos (archivos) o creados (enlaces). */
  attachments: Attachment[];
}

export interface PostQuery {
  q?: string;
  careerId?: ID;
  subjectId?: ID;
  authorId?: ID;
  /** Solo publicaciones de mis usuarios favoritos. */
  onlyFavorites?: boolean;
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface Session {
  token: string;
  user: User;
}

export interface ProfileUpdate {
  name: string;
  careerId: ID;
  /** Nueva foto de perfil (si se cambió). `null` = quitar la foto. */
  avatarFile?: File | null;
}
