import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Reply } from '@/types';
import { useAuth } from './useAuth';
import { useCurrentUser } from './use-user';
import { getReplies, createPost, deletePost } from '@/lib/api/generated/endpoints/posts/posts';

interface UseRepliesForReplyOptions {
  replyId: string;
  enabled?: boolean;
}

interface CreateReplyParams {
  content: string;
  parentId?: string;
}

/**
 * queryKey 統一規約:
 *   ['replies', 'for-reply', replyId] : リプライへのリプライ一覧
 */
export const useReplies = ({ replyId, enabled = true }: UseRepliesForReplyOptions) => {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [optimisticReplies, setOptimisticReplies] = useState<Reply[]>([]);

  const {
    data: replies = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['replies', 'for-reply', replyId],
    queryFn: async () => {
      const response = await getReplies(replyId);
      if (response.status !== 200) {
        throw new Error('Failed to fetch replies');
      }

      const responseData = response.data as { replies?: unknown[] } | unknown[];
      const replyList = Array.isArray(responseData) ? responseData : (responseData?.replies ?? []);
      const repliesWithParentId = (Array.isArray(replyList) ? replyList : []).map((reply) => {
        const r = reply as Record<string, unknown>;
        return {
          ...r,
          parent_id: r.parent_id || replyId,
          post_id: r.root_id || r.post_id || '',
        };
      });
      return repliesWithParentId as unknown as Reply[];
    },
    enabled: enabled && !!replyId,
    staleTime: 30_000,
  });

  // Create reply mutation (reply to a reply)
  const createReplyMutation = useMutation({
    mutationFn: async ({ content, parentId }: CreateReplyParams) => {
      const response = await createPost({
        content,
        parent_id: parentId,
      });

      if (response.status !== 201) {
        throw new Error('Failed to create reply');
      }

      return response.data;
    },
    onMutate: async ({ content, parentId }) => {
      const optimisticReply: Reply = {
        id: `temp-${Date.now()}`,
        content,
        user_id: currentUser?.id || user?.id || '',
        post_id: '',
        parent_id: parentId,
        created_at: new Date().toISOString(),
        user: currentUser
          ? {
              id: currentUser.id,
              email: currentUser.email || user?.email || '',
              nickname: currentUser.nickname || 'Unknown',
              avatar_url: currentUser.avatar_url || undefined,
              bio: currentUser.bio || undefined,
              status: currentUser.status,
              gender: currentUser.gender,
              age_range: currentUser.age_range,
              created_at: currentUser.created_at || new Date().toISOString(),
            }
          : {
              id: user?.id || '',
              email: user?.email || '',
              nickname: 'Unknown',
              created_at: new Date().toISOString(),
            },
        likes_count: 0,
        replies_count: 0,
        is_liked: false,
        has_replies: false,
        _optimistic: true,
      };

      setOptimisticReplies((prev) => [...prev, optimisticReply]);
      return { optimisticReply };
    },
    onSuccess: (_data, _variables, context) => {
      setOptimisticReplies((prev) => prev.filter((r) => r.id !== context?.optimisticReply.id));

      queryClient.invalidateQueries({ queryKey: ['replies', 'for-reply', replyId] });
      queryClient.invalidateQueries({ queryKey: ['reply', replyId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (_error, _variables, context) => {
      if (context?.optimisticReply) {
        setOptimisticReplies((prev) => prev.filter((r) => r.id !== context.optimisticReply.id));
      }
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (targetReplyId: string) => {
      const response = await deletePost(targetReplyId);
      if (response.status >= 300) {
        throw new Error('Failed to delete reply');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies', 'for-reply', replyId] });
      queryClient.invalidateQueries({ queryKey: ['reply', replyId] });
    },
  });

  const allReplies = [...replies, ...optimisticReplies];

  return {
    replies: allReplies,
    isLoading,
    createReply: createReplyMutation.mutate,
    deleteReply: deleteReplyMutation.mutate,
    refetch,
    isCreating: createReplyMutation.isPending,
    isDeleting: deleteReplyMutation.isPending,
  };
};
