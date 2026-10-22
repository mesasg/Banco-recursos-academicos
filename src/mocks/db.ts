import { mockCareers, type MockCareer } from './careers';
import { createMockForum, type MockReply, type MockThread } from './forum';
import { createMockPosts, type MockPost } from './posts';
import { mockFavorites, mockUsers, type MockUser } from './users';

/**
 * "Base de datos" del modo mock. Vive en memoria y se guarda en localStorage
 * para que lo que publiques sobreviva a una recarga. Se reemplaza por el
 * backend real (Spring Boot + Supabase) sin tocar los componentes.
 */
export interface MockDb {
  version: number;
  careers: MockCareer[];
  users: MockUser[];
  posts: MockPost[];
  /** userId → ids de sus usuarios favoritos. */
  favorites: Record<string, string[]>;
  /** postId → (userId → valoración 1..5). */
  ratings: Record<string, Record<string, number>>;
  threads: MockThread[];
  replies: MockReply[];
}

const STORAGE_KEY = 'ingenotes:mock-db';
const DB_VERSION = 2;

function seed(): MockDb {
  return {
    version: DB_VERSION,
    ...createMockForum(),
    careers: mockCareers,
    users: mockUsers.map((u) => ({ ...u })),
    posts: createMockPosts(),
    favorites: structuredClone(mockFavorites),
    ratings: {
      p1: { u1: 5, u2: 4 },
      p2: { u1: 5 },
      p7: { u1: 4, u2: 5 },
      p4: { u4: 5, u3: 4 },
      p10: { u4: 4 },
    },
  };
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb;
      if (parsed.version === DB_VERSION) return parsed;
      // v1 → v2: se agregan los foros sin perder cuentas ni publicaciones creadas.
      if (parsed.version === 1) return { ...parsed, ...createMockForum(), version: DB_VERSION };
    }
  } catch {
    // Almacenamiento no disponible o datos corruptos: se usa la semilla.
  }
  return seed();
}

let state: MockDb = load();

export function db(): MockDb {
  return state;
}

/** Guarda el estado. Las URL blob: mueren al recargar, así que no se persisten. */
export function persist(): void {
  try {
    const snapshot: MockDb = {
      ...state,
      posts: state.posts.map((p) => ({
        ...p,
        attachments: p.attachments.map((a) => (a.url?.startsWith('blob:') ? { ...a, url: undefined } : a)),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Sin espacio o almacenamiento bloqueado: el mock sigue funcionando en memoria.
  }
}

/** Vuelve a los datos de ejemplo (útil para demos). */
export function resetDb(): void {
  state = seed();
  persist();
}

export function newId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}
