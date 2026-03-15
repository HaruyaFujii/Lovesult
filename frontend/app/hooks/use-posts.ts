import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { customInstance } from '@/lib/api/customInstance';
import { Post, User } from '@/types';

export interface PostsResponse {
  posts: Post[];
  next_cursor?: string;
}

export function usePosts(params?: {
  limit?: number;
  cursor?: string;
  status?: string;
  tab?: 'all' | 'following';
}) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: async (): Promise<PostsResponse> => {
      const queryParams: Record<string, string | number> = {};

      if (params?.limit) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.status) queryParams.status = params.status;
      if (params?.tab) queryParams.tab = params.tab;

      const response = await customInstance<{ data: PostsResponse }>('/api/v1/posts', {
        params: queryParams,
      });

      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreatePost(currentUser?: User) {
  const queryClient = useQueryClient();

  // ユーザーデータをメモ化して不要な再レンダリングを防ぐ
  const optimisticUserData = useMemo(() => {
    if (!currentUser) return null;
    return {
      id: currentUser.id || 'current-user',
      nickname: currentUser.nickname || currentUser.name || 'ユーザー',
      name: currentUser.name || currentUser.nickname,
      avatar_url: currentUser.avatar_url || null,
    };
  }, [
    currentUser,
    currentUser?.id,
    currentUser?.nickname,
    currentUser?.name,
    currentUser?.avatar_url,
  ]);

  const optimisticPostData = useMemo(() => {
    if (!currentUser) return null;
    return {
      author_status: currentUser.status,
      author_age_range: currentUser.age_range,
    };
  }, [currentUser, currentUser?.status, currentUser?.age_range]);

  return useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await customInstance<{ data: Post }>('/api/v1/posts', {
        method: 'POST',
        data: data,
      });

      return response.data;
    },
    onMutate: async (newPost) => {
      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // 現在のデータを取得
      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] });

      // 楽観的更新：新しい投稿を一時的に追加
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: PostsResponse | undefined) => {
        if (!old) return old;

        const optimisticPost = {
          id: `temp-${Date.now()}`, // 一時的なID
          content: newPost.content,
          created_at: new Date().toISOString(),
          user: optimisticUserData || {
            id: 'current-user',
            nickname: 'ユーザー',
            name: 'ユーザー',
            avatar_url: null,
          },
          author_status: optimisticPostData?.author_status,
          author_age_range: optimisticPostData?.author_age_range,
          likes_count: 0,
          comments_count: 0,
          is_liked: false,
          _optimistic: true, // 楽観的更新であることを示すフラグ
        };

        return {
          ...old,
          posts: [optimisticPost, ...old.posts],
        };
      });

      return { previousPosts };
    },
    onError: (err, newPost, context) => {
      // エラー時は元の状態に戻す
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // 成功時は実際のデータで更新
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
