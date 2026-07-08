import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Reply } from '@/types';
import { getPost, deletePost } from '@/lib/api/generated/endpoints/posts/posts';

/**
 * queryKey 統一規約:
 *   ['reply', replyId]
 */
export const useReplyDetail = (replyId: string) => {
  const queryClient = useQueryClient();
  const [optimisticReply] = useState<Reply | null>(null);

  // Fetch reply
  const {
    data: reply,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reply', replyId],
    queryFn: async () => {
      const response = await getPost(replyId);
      if (response.status !== 200) {
        throw new Error('Failed to fetch reply');
      }
      const data = response.data as unknown as Record<string, unknown>;
      return {
        ...data,
        post_id: (data.root_id as string | undefined) || '', // Map root_id to post_id for compatibility
      } as unknown as Reply;
    },
    enabled: !!replyId,
    staleTime: 30_000,
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async () => {
      const response = await deletePost(replyId);
      if (response.status >= 300) {
        throw new Error('Failed to delete reply');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.removeQueries({ queryKey: ['reply', replyId] });
    },
  });

  return {
    reply: optimisticReply || reply,
    isLoading,
    error,
    deleteReply: deleteReplyMutation.mutate,
    isDeleting: deleteReplyMutation.isPending,
    refetch,
  };
};
