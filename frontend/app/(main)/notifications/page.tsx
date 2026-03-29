'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PullToRefreshContainer } from '@/components/layout/PullToRefreshContainer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Heart, MessageCircle, Users, Star } from 'lucide-react';
import { formatDistanceToNowJST } from '@/lib/utils/date';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'personality';
  user: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
  content?: string;
  post?: {
    id: string;
    content: string;
  };
  created_at: string;
  is_read: boolean;
}

const getInitialNotifications = (): Notification[] => {
  const now = Date.now();
  return [
    // ダミーデータ
    {
      id: '1',
      type: 'like',
      user: {
        id: 'user1',
        nickname: '田中さん',
        avatar_url: undefined,
      },
      post: {
        id: 'post1',
        content: '今日は良い天気ですね！',
      },
      created_at: new Date(now - 60000 * 30).toISOString(), // 30分前
      is_read: false,
    },
    {
      id: '2',
      type: 'comment',
      user: {
        id: 'user2',
        nickname: '佐藤さん',
        avatar_url: undefined,
      },
      content: 'とても素敵な投稿ですね！',
      post: {
        id: 'post2',
        content: '恋愛について思うこと',
      },
      created_at: new Date(now - 60000 * 60 * 2).toISOString(), // 2時間前
      is_read: false,
    },
    {
      id: '3',
      type: 'follow',
      user: {
        id: 'user3',
        nickname: '山田さん',
        avatar_url: undefined,
      },
      created_at: new Date(now - 60000 * 60 * 24).toISOString(), // 1日前
      is_read: true,
    },
  ];
};

export default function NotificationsPage() {
  const {} = useAuth();
  const [notifications] = useState<Notification[]>(getInitialNotifications);

  const handleRefresh = async () => {
    // 実際の実装では通知データを再取得
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-pink-500" />;
      case 'personality':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.user.nickname}があなたの投稿にいいねしました`;
      case 'comment':
        return `${notification.user.nickname}があなたの投稿にコメントしました`;
      case 'follow':
        return `${notification.user.nickname}があなたをフォローしました`;
      case 'message':
        return `${notification.user.nickname}からメッセージが届きました`;
      case 'personality':
        return `${notification.user.nickname}と性格の相性が良いです`;
      default:
        return '通知があります';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* モバイルヘッダー */}
      <MobileHeader />

      {/* メインコンテンツ */}
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="pb-20">
          <div className="bg-white">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">通知はありません</p>
                <p className="text-gray-400 text-sm mt-2">新しい通知があるとここに表示されます</p>
              </div>
            ) : (
              <div className="divide-y border-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      !notification.is_read ? 'bg-pink-50' : 'bg-white'
                    } active:bg-gray-50`}
                  >
                    <div className="flex items-start gap-3">
                      {/* アバター */}
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={notification.user.avatar_url || undefined} />
                        <AvatarFallback>
                          {notification.user.nickname?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {/* 通知内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {getNotificationText(notification)}
                            </p>
                            {notification.content && (
                              <p className="text-sm text-gray-600 mt-1">
                                「{notification.content}」
                              </p>
                            )}
                            {notification.post && (
                              <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded p-2">
                                {notification.post.content.length > 50
                                  ? `${notification.post.content.substring(0, 50)}...`
                                  : notification.post.content}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNowJST(notification.created_at)}
                          </span>
                          {!notification.is_read && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-pink-100 text-pink-600"
                            >
                              新着
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PullToRefreshContainer>
    </div>
  );
}
