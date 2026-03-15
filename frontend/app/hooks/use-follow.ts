import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';

interface FollowResponse {
  success: boolean;
  message?: string;
}

export const useFollow = () => {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await customInstance<{ data: FollowResponse }>(`/api/v1/users/${userId}/follow`, {
        method: 'POST',
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // フォロー状態のクエリを無効化
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/users/${variables.userId}/follow-status`],
      });
      // ユーザープロフィール情報を無効化（フォロワー・フォロー数更新のため）
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users/me'] });
      // タイムラインも更新（フォロー中タブの内容が変わるため）
      queryClient.invalidateQueries({ queryKey: ['/api/v1/posts'] });
      // 通知カウントを更新（フォローで通知が発生する可能性があるため）
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
    },
    onError: (error) => {
      console.error('Follow error:', error);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await customInstance<{ data: FollowResponse }>(`/api/v1/users/${userId}/follow`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // フォロー状態のクエリを無効化
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/users/${variables.userId}/follow-status`],
      });
      // ユーザープロフィール情報を無効化（フォロワー・フォロー数更新のため）
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users/me'] });
      // タイムラインも更新（フォロー中タブの内容が変わるため）
      queryClient.invalidateQueries({ queryKey: ['/api/v1/posts'] });
      // 通知カウントを更新
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
    },
    onError: (error) => {
      console.error('Unfollow error:', error);
    },
  });

  return {
    followUser: followMutation.mutate,
    unfollowUser: unfollowMutation.mutate,
    isFollowPending: followMutation.isPending,
    isUnfollowPending: unfollowMutation.isPending,
  };
};

export const useFollowStatus = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: [`/api/v1/users/${userId}/follow-status`],
    queryFn: async () => {
      const response = await customInstance<{ data: { is_following: boolean } }>(
        `/api/v1/users/${userId}/follow-status`,
        {
          method: 'GET',
        }
      );
      return response;
    },
    enabled: enabled && !!userId,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });
};
