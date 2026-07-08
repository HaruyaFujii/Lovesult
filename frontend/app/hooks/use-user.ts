import { useMutation, useQuery } from '@tanstack/react-query';
import { getUser } from '@/lib/api/generated/endpoints/users/users';
import { customInstance } from '@/lib/api/customInstance';
import type { UserUpdate, UserResponse } from '@/lib/api/generated/models';

/**
 * 現在のログインユーザー。
 * queryKey は `['currentUser']` に統一。
 */
export const useCurrentUser = (enabled = true) => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await customInstance<{ data: UserResponse }>('/api/v1/users/me', {
          method: 'GET',
          skipAuthRedirect: true, // 401エラーでも自動サインアウトしない
        });
        return response.data;
      } catch (error: unknown) {
        // 401エラーの場合はnullを返す（未認証状態を示す）
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    enabled,
    retry: false, // 認証エラーの場合はリトライしない
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動リクエストを無効
  });
};

/**
 * ユーザープロフィール。
 * queryKey は `['user', userId]` に統一。
 * 生成された getUser 関数を利用。auth ヘッダは FetchInterceptor が付与する。
 */
export const useUserProfile = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await getUser(userId);
      if (response.status !== 200) {
        throw new Error('Failed to fetch user');
      }
      return response.data as UserResponse;
    },
    enabled: enabled && !!userId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (data: UserUpdate) => {
      const response = await customInstance<{ data: UserResponse }>('/api/v1/users/me', {
        method: 'PUT',
        data,
      });
      return response.data;
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
};
