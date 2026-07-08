import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  followUser as followUserApi,
  unfollowUser as unfollowUserApi,
  getFollowStatus,
} from '@/lib/api/generated/endpoints/follows/follows';

/**
 * queryKey 統一規約:
 *   ['follow', 'status', userId] : フォロー状態
 *   ['follow', 'followers', userId] : フォロワー一覧
 *   ['follow', 'following', userId] : フォロー中一覧
 */

export const useFollow = () => {
  const queryClient = useQueryClient();

  const invalidateAfterFollowChange = (targetUserId: string) => {
    // フォロー状態
    queryClient.invalidateQueries({ queryKey: ['follow', 'status', targetUserId] });
    // 対象ユーザーおよび自分のプロフィール（フォロワー数・フォロー数の再取得）
    queryClient.invalidateQueries({ queryKey: ['user', targetUserId] });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    // フォロー中タブに影響
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const followMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await followUserApi(userId);
      // 成功系ステータス(2xx)以外はエラー扱い
      if (response.status >= 300) {
        throw new Error('Failed to follow');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      invalidateAfterFollowChange(variables.userId);
    },
    onError: (error) => {
      console.error('Follow error:', error);
      toast.error('フォローに失敗しました');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await unfollowUserApi(userId);
      if (response.status >= 300) {
        throw new Error('Failed to unfollow');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      invalidateAfterFollowChange(variables.userId);
    },
    onError: (error) => {
      console.error('Unfollow error:', error);
      toast.error('フォロー解除に失敗しました');
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
    queryKey: ['follow', 'status', userId],
    queryFn: async () => {
      const response = await getFollowStatus(userId);
      if (response.status !== 200) {
        throw new Error('Failed to fetch follow status');
      }
      return response.data as { is_following: boolean };
    },
    enabled: enabled && !!userId,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });
};
