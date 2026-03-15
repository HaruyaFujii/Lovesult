import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Reply } from '@/types';
import { getPost } from '@/lib/api/generated/endpoints/posts/posts';

export const useReplyDetail = (replyId: string) => {
  const queryClient = useQueryClient();
  const [optimisticReply, setOptimisticReply] = useState<Reply | null>(null);

  // Fetch reply using generated API client
  const {
    data: reply,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reply', replyId],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await getPost(replyId, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch reply');
      }

      return {
        ...response.data,
        post_id: response.data.root_id || '', // Map root_id to post_id for compatibility
      } as Reply;
    },
    enabled: !!replyId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/posts/${replyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
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
