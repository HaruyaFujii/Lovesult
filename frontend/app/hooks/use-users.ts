import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/lib/api/generated/endpoints/users/users';

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

/**
 * queryKey 統一規約:
 *   ['users'] : ユーザー一覧
 */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UsersResponse> => {
      const response = await getUsers();
      if (response.status !== 200) {
        throw new Error('Failed to fetch users');
      }
      return response.data as unknown as UsersResponse;
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });
}
