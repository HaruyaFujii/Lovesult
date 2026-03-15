import { useQuery } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';
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

export function useSearchPosts(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['search', 'posts', params],
    queryFn: async (): Promise<PostSearchResponse> => {
      const queryParams: Record<string, string | number> = {};

      if (params.q) queryParams.q = params.q;
      if (params.status) queryParams.status = params.status;
      if (params.age_range) queryParams.age_range = params.age_range;
      if (params.cursor) queryParams.cursor = params.cursor;
      if (params.limit) queryParams.limit = params.limit;

      const response = await customInstance<{ data: PostSearchResponse }>('/api/v1/search/posts', {
        params: queryParams,
      });

      return response.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSearchUsers(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['search', 'users', params],
    queryFn: async (): Promise<UserSearchResponse> => {
      const queryParams: Record<string, string | number> = {};

      if (params.q) queryParams.q = params.q;
      if (params.status) queryParams.status = params.status;
      if (params.age_range) queryParams.age_range = params.age_range;
      if (params.cursor) queryParams.cursor = params.cursor;
      if (params.limit) queryParams.limit = params.limit;

      const response = await customInstance<{ data: UserSearchResponse }>('/api/v1/search/users', {
        params: queryParams,
      });

      return response.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
