import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';

export const useGetUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ['/api/v1/notifications/unread-count'],
    queryFn: async () => {
      const response = await customInstance<{ data: { unread_count: number } }>(
        '/api/v1/notifications/unread-count',
        {
          method: 'GET',
        }
      );
      return response;
    },
    refetchInterval: 30000, // 30秒ごとに更新
    retry: 1,
  });
};

export const useGetNotifications = (limit = 10, enabled = true) => {
  return useQuery({
    queryKey: ['/api/v1/notifications', { limit }],
    queryFn: async () => {
      const response = await customInstance<{
        data: { notifications: any[]; next_cursor?: string };
      }>(`/api/v1/notifications?limit=${limit}`, {
        method: 'GET',
      });
      return response;
    },
    enabled,
    retry: 1,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId }: { notificationId: string }) => {
      const response = await customInstance<{ data: any }>(
        `/api/v1/notifications/${notificationId}/read`,
        {
          method: 'PUT',
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // 通知リストと未読数を更新
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await customInstance<{ data: any }>('/api/v1/notifications/read-all', {
        method: 'PUT',
      });
      return response.data;
    },
    onSuccess: () => {
      // 通知リストと未読数を更新
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
    },
  });
};
