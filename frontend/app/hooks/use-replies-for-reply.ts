import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Reply } from '@/types';
import { useAuth } from './useAuth';
import { useCurrentUser } from './use-user';
import { getReplies, createPost } from '@/lib/api/generated/endpoints/posts/posts';

interface UseRepliesForReplyOptions {
  replyId: string;
  enabled?: boolean;
}

interface CreateReplyParams {
  content: string;
  parentId?: string;
}

export const useReplies = ({ replyId, enabled = true }: UseRepliesForReplyOptions) => {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [optimisticReplies, setOptimisticReplies] = useState<Reply[]>([]);

  // Fetch replies for a reply using generated API client
  const {
    data: replies = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['replies-for-reply', replyId],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await getReplies(replyId, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch replies');
      }

      // Ensure all replies have the parent_id set to the current reply
      const responseData = response.data as any;
      const replies = responseData?.replies || responseData || [];
      const repliesWithParentId = (Array.isArray(replies) ? replies : []).map((reply: any) => ({
        ...reply,
        parent_id: reply.parent_id || replyId,
        post_id: reply.root_id || reply.post_id || '', // Map root_id to post_id for compatibility
      }));
      return repliesWithParentId as Reply[];
    },
    enabled: enabled && !!replyId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Create reply mutation (reply to a reply)
  const createReplyMutation = useMutation({
    mutationFn: async ({ content, parentId }: CreateReplyParams) => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Create the reply using the unified createPost endpoint
      const response = await createPost(
        {
          content,
          parent_id: parentId, // Use the provided parentId directly
        },
        {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        }
      );

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
        post_id: '', // Will be filled when actual reply is created
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
    onSuccess: (data, variables, context) => {
      // Remove optimistic reply and add real one
      setOptimisticReplies((prev) => prev.filter((r) => r.id !== context?.optimisticReply.id));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['replies-for-reply', replyId] });
      queryClient.invalidateQueries({ queryKey: ['reply', replyId] }); // Update parent reply counts
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
    },
    onError: (error, variables, context) => {
      // Remove optimistic reply on error
      if (context?.optimisticReply) {
        setOptimisticReplies((prev) => prev.filter((r) => r.id !== context.optimisticReply.id));
      }
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (targetReplyId: string) => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/posts/${targetReplyId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['replies-for-reply', replyId] });
      queryClient.invalidateQueries({ queryKey: ['reply', replyId] }); // Update parent reply counts
    },
  });

  // Combine real and optimistic replies
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
