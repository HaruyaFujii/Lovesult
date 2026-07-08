import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead as markNotificationAsReadApi,
  markAllNotificationsAsRead as markAllNotificationsAsReadApi,
} from '@/lib/api/generated/endpoints/notifications/notifications';
import type { NotificationListResponse } from '@/lib/api/generated/models';

/**
 * queryKey 統一規約:
 *   ['notifications', 'unread-count']
 *   ['notifications', 'list', { limit }]
 */

export const useGetUnreadNotificationCount = (enabled = true) => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await getUnreadNotificationCount();
      if (response.status !== 200) {
        throw new Error('Failed to fetch unread count');
      }
      return response.data as { unread_count: number };
    },
    enabled,
    refetchInterval: 60_000, // 60秒ごとに更新（負荷軽減）
    retry: 1,
  });
};

export const useGetNotifications = (limit = 10, enabled = true) => {
  return useQuery({
    queryKey: ['notifications', 'list', { limit }],
    queryFn: async () => {
      const response = await getNotifications({ limit });
      if (response.status !== 200) {
        throw new Error('Failed to fetch notifications');
      }
      return response.data as NotificationListResponse;
    },
    enabled,
    retry: 1,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId }: { notificationId: string }) => {
      const response = await markNotificationAsReadApi(notificationId);
      return response.data;
    },
    onSuccess: () => {
      // 通知リストと未読数を更新（プレフィックス一致で両方カバー）
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await markAllNotificationsAsReadApi();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
