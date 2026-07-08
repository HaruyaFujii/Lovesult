import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Post } from '@/types';
import {
  getPost as getPostApi,
  updatePost as updatePostApi,
  deletePost as deletePostApi,
} from '@/lib/api/generated/endpoints/posts/posts';

/**
 * queryKey 統一規約:
 *   ['post', postId]
 */
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
      const response = await getPostApi(postId);
      if (response.status !== 200) {
        throw new Error('Failed to fetch post');
      }
      return response.data as unknown as Post;
    },
    enabled: !!postId,
    staleTime: 30_000,
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await updatePostApi(postId, { content });
      if (response.status !== 200) {
        throw new Error('Failed to update post');
      }
      return response.data;
    },
    onMutate: async (content) => {
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
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        setOptimisticPost(null);
      }
      toast.error('投稿の更新に失敗しました');
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await deletePostApi(postId);
      if (response.status >= 300) {
        throw new Error('Failed to delete post');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.removeQueries({ queryKey: ['post', postId] });
    },
    onError: () => {
      toast.error('投稿の削除に失敗しました');
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
