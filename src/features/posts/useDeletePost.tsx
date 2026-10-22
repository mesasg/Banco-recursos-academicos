import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useDataSync } from '@/context/DataSyncContext';
import { errorMessage, postService } from '@/services';
import type { Post } from '@/types';

/**
 * Flujo de eliminación con confirmación. Devuelve la función para pedirla
 * y el diálogo que hay que renderizar.
 */
export function useDeletePost(onDeleted?: (post: Pick<Post, 'id' | 'title'>) => void) {
  const toast = useToast();
  const { invalidatePosts } = useDataSync();
  const [target, setTarget] = useState<Pick<Post, 'id' | 'title'> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await postService.deletePost(target.id);
      toast.success('Publicación eliminada.');
      setTarget(null);
      invalidatePosts();
      onDeleted?.(target);
    } catch (error) {
      toast.error(errorMessage(error, 'No pudimos eliminar la publicación.'));
    } finally {
      setDeleting(false);
    }
  };

  const dialog = (
    <ConfirmDialog
      open={target !== null}
      title="¿Eliminar esta publicación?"
      message={
        <>
          Se borrará <strong className="font-semibold text-ink">“{target?.title}”</strong> con todos sus adjuntos. Esta
          acción no se puede deshacer.
        </>
      }
      confirmLabel="Eliminar"
      loading={deleting}
      onConfirm={confirm}
      onCancel={() => setTarget(null)}
    />
  );

  return { requestDelete: setTarget, dialog };
}
