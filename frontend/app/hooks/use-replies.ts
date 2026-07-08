import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Reply } from '@/types';
import { useAuth } from './useAuth';
import { useCurrentUser } from './use-user';
import { getReplies, createPost, deletePost } from '@/lib/api/generated/endpoints/posts/posts';

interface UseRepliesOptions {
  postId: string;
  enabled?: boolean;
}

interface CreateReplyParams {
  content: string;
  parentId?: string;
}

/**
 * queryKey 統一規約:
 *   ['replies', postId]
 */
export const useReplies = ({ postId, enabled = true }: UseRepliesOptions) => {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [optimisticReplies, setOptimisticReplies] = useState<Reply[]>([]);

  // Fetch replies
  const {
    data: replies = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['replies', postId],
    queryFn: async () => {
      const response = await getReplies(postId);
      if (response.status !== 200) {
        throw new Error('Failed to fetch replies');
      }

      // Ensure all replies have the post_id
      const responseData = response.data as { replies?: unknown[] } | unknown[];
      const replyList = Array.isArray(responseData) ? responseData : (responseData?.replies ?? []);
      const repliesWithPostId = (Array.isArray(replyList) ? replyList : []).map((reply) => {
        const r = reply as Record<string, unknown>;
        return {
          ...r,
          post_id: r.root_id || r.post_id || postId,
        };
      });
      return repliesWithPostId as unknown as Reply[];
    },
    enabled: enabled && !!postId,
    staleTime: 30_000,
  });

  // Create reply mutation
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
      // Create optimistic reply
      const optimisticReply: Reply = {
        id: `temp-${Date.now()}`,
        content,
        user_id: currentUser?.id || user?.id || '',
        post_id: postId,
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
      // Remove optimistic reply and add real one
      setOptimisticReplies((prev) => prev.filter((r) => r.id !== context?.optimisticReply.id));

      // Invalidate queries with unified keys
      queryClient.invalidateQueries({ queryKey: ['replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (_error, _variables, context) => {
      if (context?.optimisticReply) {
        setOptimisticReplies((prev) => prev.filter((r) => r.id !== context.optimisticReply.id));
      }
      toast.error('リプライの投稿に失敗しました');
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      const response = await deletePost(replyId);
      if (response.status >= 300) {
        throw new Error('Failed to delete reply');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies', postId] });
    },
    onError: () => {
      toast.error('リプライの削除に失敗しました');
    },
  });

  // Load nested replies
  const loadNestedReplies = useCallback(
    async (parentReplyId: string) => {
      const response = await getReplies(parentReplyId);
      if (response.status !== 200) {
        throw new Error('Failed to load nested replies');
      }

      const responseData = response.data as { replies?: unknown[] } | unknown[];
      const replyList = Array.isArray(responseData) ? responseData : (responseData?.replies ?? []);
      const nestedRepliesWithPostId = (Array.isArray(replyList) ? replyList : []).map((reply) => {
        const r = reply as Record<string, unknown>;
        return {
          ...r,
          post_id: r.root_id || r.post_id || postId,
        };
      });
      return nestedRepliesWithPostId as unknown as Reply[];
    },
    [postId]
  );

  // Combine real and optimistic replies
  const allReplies = [...replies, ...optimisticReplies];

  return {
    replies: allReplies,
    isLoading,
    createReply: createReplyMutation.mutate,
    deleteReply: deleteReplyMutation.mutate,
    loadNestedReplies,
    refetch,
    isCreating: createReplyMutation.isPending,
    isDeleting: deleteReplyMutation.isPending,
  };
};
