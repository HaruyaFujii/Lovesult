import { useQuery } from '@tanstack/react-query';
import { getUserPosts } from '@/lib/api/generated/endpoints/users/users';
import { Post } from '@/types';

export interface UserPostsResponse {
  posts: Post[];
  next_cursor?: string;
}

/**
 * 特定ユーザーの投稿一覧を取得。
 * queryKey 統一規約:
 *   ['userPosts', userId, params] : ユーザー投稿一覧
 */
export function useUserPosts(
  userId: string,
  params?: {
    limit?: number;
    cursor?: string;
  },
  enabled = true
) {
  return useQuery({
    queryKey: ['userPosts', userId, params],
    queryFn: async (): Promise<UserPostsResponse> => {
      const response = await getUserPosts(userId, {
        ...(params?.limit != null && { limit: params.limit }),
        ...(params?.cursor && { cursor: params.cursor }),
      });
      if (response.status !== 200) {
        throw new Error('Failed to fetch user posts');
      }
      return response.data as unknown as UserPostsResponse;
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
