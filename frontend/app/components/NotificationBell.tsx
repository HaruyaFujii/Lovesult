"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useGetNotifications, useGetUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // ページ表示時に一度データを取得
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
  }, [queryClient]);

  // 未読数を取得
  const { data: unreadData } = useGetUnreadNotificationCount();

  // 通知一覧を取得
  const { data: notificationsData, refetch } = useGetNotifications(10, isOpen);

  const markAsReadMutation = useMarkNotificationAsRead();

  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const handleNotificationClick = async (notification: any) => {
    // 通知を既読にする
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync({ notificationId: notification.id });
    }

    // 適切なページに遷移
    if (notification.post?.id) {
      router.push(`/post/${notification.post.id}`);
    } else if (notification.actor?.id) {
      router.push(`/profile/${notification.actor.id}`);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "reply":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case "like":
        return "があなたの投稿にいいねしました";
      case "reply":
        return "があなたの投稿に返信しました";
      case "follow":
        return "があなたをフォローしました";
      default:
        return "";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadData?.data?.unread_count && unreadData.data.unread_count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadData.data.unread_count > 99 ? "99+" : unreadData.data.unread_count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">通知</h3>
          {unreadData?.data?.unread_count && unreadData.data.unread_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              すべて既読にする
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {!notificationsData?.data || !('notifications' in notificationsData.data) || notificationsData.data.notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              通知はありません
            </div>
          ) : (
            notificationsData.data.notifications.map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3 w-full">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate">
                        {notification.actor?.name || "ユーザー"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {getNotificationMessage(notification)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}