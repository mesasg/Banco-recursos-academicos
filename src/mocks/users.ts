import type { User } from '@/types';

export interface MockUser extends User {
  /** Solo existe en el mock: el backend real nunca expone contraseñas. */
  password: string;
}

/** Contraseña de todas las cuentas de prueba. */
export const DEMO_PASSWORD = 'Demo1234';
export const DEMO_EMAIL = 'laura.gomez@unicampus.edu.co';

export const mockUsers: MockUser[] = [
  {
    id: 'u1',
    name: 'Laura Gómez',
    email: DEMO_EMAIL,
    careerId: 'sis',
    joinedAt: '2024-02-05T14:00:00.000Z',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u2',
    name: 'Andrés Rodríguez',
    email: 'andres.rodriguez@unicampus.edu.co',
    careerId: 'ind',
    joinedAt: '2023-08-14T14:00:00.000Z',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u3',
    name: 'Valentina Ríos',
    email: 'valentina.rios@unicampus.edu.co',
    careerId: 'ele',
    joinedAt: '2023-02-20T14:00:00.000Z',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u4',
    name: 'Santiago Martínez',
    email: 'santiago.martinez@unicampus.edu.co',
    careerId: 'sis',
    joinedAt: '2022-08-08T14:00:00.000Z',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u5',
    name: 'Camila Herrera',
    email: 'camila.herrera@unicampus.edu.co',
    careerId: 'civ',
    joinedAt: '2024-08-12T14:00:00.000Z',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u6',
    name: 'Juan Pablo Ortiz',
    email: 'juanpablo.ortiz@unicampus.edu.co',
    careerId: 'ele',
    joinedAt: '2023-08-14T14:00:00.000Z',
    password: DEMO_PASSWORD,
  },
];

/** Usuarios favoritos iniciales de cada cuenta. */
export const mockFavorites: Record<string, string[]> = {
  u1: ['u4', 'u3'],
  u2: ['u1'],
  u3: ['u6'],
  u4: ['u1', 'u2'],
  u5: [],
  u6: ['u3'],
};
