import { useQuery } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';

export interface User {
  id: string;
  email: string;
  nickname: string;
  status: 'in_love' | 'heartbroken' | 'seeking';
  gender?: 'male' | 'female' | 'other' | 'private';
  age_range?: '10s' | '20s' | '30s' | '40s' | '50s_plus';
  bio?: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UsersResponse> => {
      const response = await customInstance<{ data: UsersResponse }>('/api/v1/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });
}
