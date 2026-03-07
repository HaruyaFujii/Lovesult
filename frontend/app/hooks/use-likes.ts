import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await customInstance<{ data: any }>(`/api/v1/posts/${postId}/like`, {
        method: 'POST',
      });
      return response.data;
    },
    onSuccess: () => {
      // タイムラインのデータを無効化してリフレッシュ
      queryClient.invalidateQueries({ queryKey: ['/api/v1/posts'] });
    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      // いいね解除も同じ /like エンドポイントを DELETE メソッドで呼び出す
      const response = await customInstance<{ data: any }>(`/api/v1/posts/${postId}/like`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => {
      // タイムラインのデータを無効化してリフレッシュ
      queryClient.invalidateQueries({ queryKey: ['/api/v1/posts'] });
    },
  });
};