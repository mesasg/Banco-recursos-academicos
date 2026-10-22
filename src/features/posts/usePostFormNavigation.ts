import { useCallback } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';

/** Estado que viaja con la navegación al formulario (patrón "modal route"). */
export interface PostFormLocationState {
  /** Pantalla que queda de fondo mientras el modal está abierto. */
  backgroundLocation?: Location;
  /** Materia sugerida al crear (la del filtro activo). */
  presetSubjectId?: string;
}

export function usePostFormNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Si ya hay un modal abierto, se conserva el mismo fondo.
  const background = (location.state as PostFormLocationState | null)?.backgroundLocation ?? location;

  const openCreate = useCallback(
    (presetSubjectId?: string | null) => {
      const state: PostFormLocationState = { backgroundLocation: background, presetSubjectId: presetSubjectId ?? undefined };
      navigate('/publicar', { state });
    },
    [navigate, background],
  );

  const openEdit = useCallback(
    (postId: string) => {
      const state: PostFormLocationState = { backgroundLocation: background };
      navigate(`/publicar/${postId}/editar`, { state });
    },
    [navigate, background],
  );

  return { openCreate, openEdit };
}
