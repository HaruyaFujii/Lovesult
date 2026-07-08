import { useQuery } from '@tanstack/react-query';
import {
  searchPostsApiV1SearchPostsGet,
  searchUsersApiV1SearchUsersGet,
} from '@/lib/api/generated/endpoints/search/search';
import { Post, User } from '@/types';

export interface PostSearchResponse {
  posts: Post[];
  next_cursor?: string;
  total_count?: number;
}

export interface UserSearchResponse {
  users: User[];
  next_cursor?: string;
  total_count?: number;
}

export interface SearchParams {
  q?: string;
  status?: string;
  age_range?: string;
  cursor?: string;
  limit?: number;
}

/**
 * queryKey 統一規約:
 *   ['search', 'posts', params]
 *   ['search', 'users', params]
 */
export function useSearchPosts(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['search', 'posts', params],
    queryFn: async (): Promise<PostSearchResponse> => {
      const response = await searchPostsApiV1SearchPostsGet({
        ...(params.q && { q: params.q }),
        ...(params.status && { status: params.status }),
        ...(params.age_range && { age_range: params.age_range }),
        ...(params.cursor && { cursor: params.cursor }),
        ...(params.limit != null && { limit: params.limit }),
      });
      if (response.status !== 200) {
        throw new Error('Failed to search posts');
      }
      return response.data as unknown as PostSearchResponse;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSearchUsers(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['search', 'users', params],
    queryFn: async (): Promise<UserSearchResponse> => {
      const response = await searchUsersApiV1SearchUsersGet({
        ...(params.q && { q: params.q }),
        ...(params.status && { status: params.status }),
        ...(params.age_range && { age_range: params.age_range }),
        ...(params.cursor && { cursor: params.cursor }),
        ...(params.limit != null && { limit: params.limit }),
      });
      if (response.status !== 200) {
        throw new Error('Failed to search users');
      }
      return response.data as unknown as UserSearchResponse;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
