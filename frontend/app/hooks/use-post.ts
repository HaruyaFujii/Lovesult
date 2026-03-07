import {
  useGetPosts,
  useCreatePost,
  useGetPost,
  useUpdatePost,
  useDeletePost,
  type CreatePostMutationBody,
  type UpdatePostMutationBody,
} from '@/lib/api/generated/endpoints/posts/posts';

export const useTimeline = (status?: string, limit = 20) => {
  return useGetPosts(
    {
      ...(status && { status }),
      limit,
    },
    {
      query: {
        retry: 1,
        staleTime: 2 * 60 * 1000, // 2 minutes
      },
    }
  );
};

export const usePost = (postId: string, enabled = true) => {
  return useGetPost(postId, {
    query: {
      enabled: enabled && !!postId,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  });
};

export const useCreatePostMutation = () => {
  return useCreatePost({
    mutation: {
      onSuccess: () => {
        // 投稿作成成功
      },
      onError: (error) => {
        // 投稿作成失敗
        console.error('Failed to create post:', error);
      },
      // 重複リクエスト防止
      retry: false,
    },
  });
};

export const useUpdatePostMutation = () => {
  return useUpdatePost({
    mutation: {
      onSuccess: () => {
        console.log('Post updated successfully');
      },
      onError: (error) => {
        console.error('Failed to update post:', error);
      },
    },
  });
};

export const useDeletePostMutation = () => {
  return useDeletePost({
    mutation: {
      onSuccess: () => {
        console.log('Post deleted successfully');
      },
      onError: (error) => {
        console.error('Failed to delete post:', error);
      },
    },
  });
};