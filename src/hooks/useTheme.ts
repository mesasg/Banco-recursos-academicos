import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';

/** Debe coincidir con la clave que lee el script de index.html. */
const STORAGE_KEY = 'ingenotes:theme';
/** Color de la barra del navegador en móvil: el del header (primary-500) en cada tema. */
const THEME_COLOR: Record<Theme, string> = { light: '#5B93A8', dark: '#2A5566' };

const currentTheme = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

/**
 * Tema claro/oscuro. Solo se cambia con la sesión iniciada (ThemeToggle vive en AppLayout).
 * El tema inicial lo aplica index.html antes de pintar: lo último guardado o, si no hay, el del navegador/sistema.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  const toggleTheme = useCallback(() => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Almacenamiento no disponible: el tema dura solo esta visita.
    }
    setTheme(next);
  }, []);

  return { theme, toggleTheme } as const;
}
