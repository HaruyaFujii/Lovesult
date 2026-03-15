import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types';

export const usePost = (postId: string) => {
  const queryClient = useQueryClient();
  const [optimisticPost, setOptimisticPost] = useState<Post | null>(null);

  // Fetch post
  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/posts/${postId}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }

      const postData = await response.json();
      return postData as Post;
    },
    enabled: !!postId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't garbage collect (replaces cacheTime)
    refetchOnMount: 'always', // Force refetch on mount
    refetchOnWindowFocus: true, // Refetch on window focus
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (content: string) => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      return response.json();
    },
    onMutate: async (content) => {
      // Optimistic update
      if (post) {
        const updatedPost = { ...post, content };
        setOptimisticPost(updatedPost);
        return { previousPost: post };
      }
    },
    onSuccess: (data) => {
      setOptimisticPost(null);
      queryClient.setQueryData(['post', postId], data);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        setOptimisticPost(null);
      }
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.removeQueries({ queryKey: ['post', postId] });
    },
  });

  return {
    post: optimisticPost || post,
    isLoading,
    error,
    updatePost: updatePostMutation.mutate,
    deletePost: deletePostMutation.mutate,
    isUpdating: updatePostMutation.isPending,
    isDeleting: deletePostMutation.isPending,
    refetch,
  };
};
