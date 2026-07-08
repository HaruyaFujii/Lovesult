import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deletePost } from '@/lib/api/generated/endpoints/posts/posts';

/**
 * 投稿削除ミューテーション。
 * 削除後、統一 queryKey `['posts']` `['post', id]` を無効化する。
 */
export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await deletePost(postId);
      if (response.status >= 300) {
        throw new Error('Failed to delete post');
      }
      return response;
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.removeQueries({ queryKey: ['post', postId] });
    },
    onError: (error) => {
      console.error('Failed to delete post:', error);
      toast.error('投稿の削除に失敗しました');
    },
  });
};
