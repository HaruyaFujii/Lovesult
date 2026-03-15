import {
  useGetUser,
  type UpdateCurrentUserMutationBody,
} from '@/lib/api/generated/endpoints/users/users';
import { customInstance } from '@/lib/api/customInstance';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { UserUpdate, UserResponse } from '@/lib/api/generated/models';

export const useCurrentUser = (enabled = true) => {
  return useQuery({
    queryKey: ['/api/v1/users/me'],
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

export const useUserProfile = (userId: string, enabled = true) => {
  return useGetUser(userId, {
    query: {
      enabled: enabled && !!userId,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
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
