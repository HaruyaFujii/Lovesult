import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { getPosts, createPost } from '@/lib/api/generated/endpoints/posts/posts';
import { Post, User } from '@/types';

export interface PostsResponse {
  posts: Post[];
  next_cursor?: string;
}

/**
 * queryKey 統一規約:
 *   ['posts'] : 全リスト（プレフィックス）
 *   ['posts', params] : パラメータごとのキャッシュ
 */
export function usePosts(params?: {
  limit?: number;
  cursor?: string;
  status?: string;
  tab?: 'all' | 'following';
}) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: async (): Promise<PostsResponse> => {
      const response = await getPosts({
        ...(params?.limit != null && { limit: params.limit }),
        ...(params?.cursor && { cursor: params.cursor }),
        ...(params?.status && { status: params.status }),
        ...(params?.tab && { tab: params.tab }),
      });
      if (response.status !== 200) {
        throw new Error('Failed to fetch posts');
      }
      return response.data as unknown as PostsResponse;
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
  }, [currentUser]);

  const optimisticPostData = useMemo(() => {
    if (!currentUser) return null;
    return {
      author_status: currentUser.status,
      author_age_range: currentUser.age_range,
    };
  }, [currentUser]);

  return useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await createPost({ content: data.content });
      if (response.status !== 201) {
        throw new Error('Failed to create post');
      }
      return response.data as unknown as Post;
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
    onError: (_err, _newPost, context) => {
      // エラー時は元の状態に戻す
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('投稿に失敗しました');
    },
    onSuccess: () => {
      // 成功時は実際のデータで更新
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
