import {
  useGetReplies,
  useCreateReply,
  useDeleteReply,
  type CreateReplyMutationBody,
} from '@/lib/api/generated/endpoints/replies/replies';

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
  return useCreateReply({
    mutation: {
      onSuccess: () => {
        console.log('Reply created successfully');
      },
      onError: (error) => {
        console.error('Failed to create reply:', error);
      },
    },
  });
};

export const useDeleteReplyMutation = () => {
  return useDeleteReply({
    mutation: {
      onSuccess: () => {
        console.log('Reply deleted successfully');
      },
      onError: (error) => {
        console.error('Failed to delete reply:', error);
      },
    },
  });
};