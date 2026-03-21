import {
  useGetReplies,
  useCreatePost,
  useDeletePost,
} from '@/lib/api/generated/endpoints/posts/posts';

export const useReplies = (postId: string, enabled = true) => {
  return useGetReplies(postId, {
    query: {
      enabled: enabled && !!postId,
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes
    },
  });
};

export const useCreateReplyMutation = () => {
  return useCreatePost({
    mutation: {
      onSuccess: () => {},
      onError: (error) => {
        console.error('Failed to create reply:', error);
      },
    },
  });
};

export const useDeleteReplyMutation = () => {
  return useDeletePost({
    mutation: {
      onSuccess: () => {},
      onError: (error) => {
        console.error('Failed to delete reply:', error);
      },
    },
  });
};
