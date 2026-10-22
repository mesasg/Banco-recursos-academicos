import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '@/services';
import type { RegisterInput, User } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string, remember: boolean) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  /** Actualiza el usuario en memoria (después de editar el perfil). */
  setUser: (user: User) => void;
  /** Cierra la sesión local después de eliminar la cuenta. */
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    authService
      .restoreSession()
      .then((session) => {
        if (!active) return;
        setUserState(session?.user ?? null);
        setStatus(session ? 'authenticated' : 'anonymous');
      })
      .catch(() => active && setStatus('anonymous'));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const session = await authService.login(email, password, remember);
    setUserState(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const session = await authService.register(input);
    setUserState(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const clearSession = useCallback(() => {
    setUserState(null);
    setStatus('anonymous');
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearSession();
  }, [clearSession]);

  const setUser = useCallback((next: User) => setUserState(next), []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, setUser, clearSession }),
    [status, user, login, register, logout, setUser, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** Para pantallas protegidas: el usuario siempre existe. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser requiere una sesión activa');
  return user;
}
