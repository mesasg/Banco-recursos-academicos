import { Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PostList } from '@/features/posts/PostList';
import { usePostFormNavigation } from '@/features/posts/usePostFormNavigation';
import { usePosts } from '@/features/posts/usePosts';

export function MyPostsTab({ userId }: { userId: string }) {
  const posts = usePosts({ authorId: userId });
  const { openCreate } = usePostFormNavigation();

  return (
    <PostList
      posts={posts}
      label="Mis publicaciones"
      empty={
        <EmptyState
          title="Todavía no has publicado recursos"
          description="Tus apuntes, diagramas o enlaces pueden ser justo lo que otro estudiante necesita para entender un tema."
          action={
            <Button onClick={() => openCreate()} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
              Crear mi primera publicación
            </Button>
          }
        />
      }
    />
  );
}
