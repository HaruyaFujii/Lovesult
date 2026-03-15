import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Reply } from '@/types';
import { useAuth } from './useAuth';
import { useCurrentUser } from './use-user';

interface UseRepliesOptions {
  postId: string;
  enabled?: boolean;
}

interface CreateReplyParams {
  content: string;
  parentId?: string;
}

export const useReplies = ({ postId, enabled = true }: UseRepliesOptions) => {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [optimisticReplies, setOptimisticReplies] = useState<Reply[]>([]);

  // Fetch replies
  const { data: replies = [], isLoading, refetch } = useQuery({
    queryKey: ['replies', postId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/posts/${postId}/replies`, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }

      const data = await response.json();
      // Ensure all replies have the post_id
      const repliesWithPostId = (data.replies || []).map((reply: Reply) => ({
        ...reply,
        post_id: reply.post_id || postId,
      }));
      return repliesWithPostId as Reply[];
    },
    enabled: enabled && !!postId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't garbage collect (replaces cacheTime)
    refetchOnMount: 'always', // Force refetch on mount
    refetchOnWindowFocus: true, // Refetch on window focus
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async ({ content, parentId }: CreateReplyParams) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ content, parent_id: parentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create reply');
      }

      return response.json();
    },
    onMutate: async ({ content, parentId }) => {
      // Create optimistic reply
      const optimisticReply: Reply = {
        id: `temp-${Date.now()}`,
        content,
        user_id: currentUser?.id || user?.id || '',
        post_id: postId, // Ensure post_id is set
        parent_id: parentId,
        created_at: new Date().toISOString(),
        user: currentUser ? {
          id: currentUser.id,
          email: currentUser.email || user?.email || '',
          nickname: currentUser.nickname || 'Unknown',
          avatar_url: currentUser.avatar_url || undefined,
          bio: currentUser.bio || undefined,
          status: currentUser.status,
          gender: currentUser.gender,
          age_range: currentUser.age_range,
          created_at: currentUser.created_at || new Date().toISOString(),
        } : {
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

      setOptimisticReplies(prev => [...prev, optimisticReply]);
      return { optimisticReply };
    },
    onSuccess: (data, variables, context) => {
      // Remove optimistic reply and add real one
      setOptimisticReplies(prev => prev.filter(r => r.id !== context?.optimisticReply.id));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error, variables, context) => {
      // Remove optimistic reply on error
      if (context?.optimisticReply) {
        setOptimisticReplies(prev => prev.filter(r => r.id !== context.optimisticReply.id));
      }
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/replies/${replyId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['replies', postId] });
    },
  });

  // Load nested replies
  const loadNestedReplies = useCallback(async (parentReplyId: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`/api/v1/replies/${parentReplyId}/replies`, {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    });

    if (!response.ok) {
      throw new Error('Failed to load nested replies');
    }

    const data = await response.json();
    // Ensure all nested replies have the post_id
    const nestedRepliesWithPostId = (data.replies || []).map((reply: Reply) => ({
      ...reply,
      post_id: reply.post_id || postId,
    }));
    return nestedRepliesWithPostId as Reply[];
  }, [postId]);

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