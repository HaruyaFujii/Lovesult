import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';

export interface PostsResponse {
  posts: any[];
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
      const queryParams: any = {};

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

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await customInstance<{ data: any }>('/api/v1/posts', {
        method: 'POST',
        data: data,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}