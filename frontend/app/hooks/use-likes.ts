import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';

interface LikeResponse {
  success: boolean;
  message?: string;
}

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await customInstance<{ data: LikeResponse }>(`/api/v1/posts/${postId}/like`, {
        method: 'POST',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/posts'] });
    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await customInstance<{ data: LikeResponse }>(`/api/v1/posts/${postId}/like`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/posts'] });
    },
  });
};

export const useLikeReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId }: { replyId: string }) => {
      const response = await customInstance<{ data: LikeResponse }>(`/api/v1/posts/${replyId}/like`, {
        method: 'POST',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useUnlikeReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId }: { replyId: string }) => {
      const response = await customInstance<{ data: LikeResponse }>(`/api/v1/posts/${replyId}/like`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
