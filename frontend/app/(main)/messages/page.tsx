'use client';

import { useConversations } from '@/hooks/use-dm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNowJST } from '@/lib/utils/date';
import Link from 'next/link';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PullToRefreshContainer } from '@/components/layout/PullToRefreshContainer';

export default function MessagesPage() {
  const { data, isLoading, refetch } = useConversations();

  const handleRefresh = async () => {
    await refetch();
  };

  const conversations = data?.conversations || [];

  return (
    <div className="flex flex-col h-screen">
      {/* モバイルヘッダー */}
      <MobileHeader />

      {/* メインコンテンツ */}
      <div className="flex-1">
        <PullToRefreshContainer onRefresh={handleRefresh}>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="bg-white">
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">メッセージはありません</p>
                  <p className="text-gray-400 text-sm mt-2">
                    ユーザーのプロフィールからメッセージを送信できます
                  </p>
                </div>
              ) : (
                <div className="divide-y border-gray-200">
                  {conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/messages/${conversation.id}`}
                      className="block active:bg-gray-50 transition-colors"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarImage src={conversation.partner?.avatar_url || undefined} />
                            <AvatarFallback>
                              {conversation.partner?.nickname?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {conversation.partner?.nickname || '不明なユーザー'}
                              </h3>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {conversation.last_message && (
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNowJST(conversation.last_message.created_at)}
                                  </span>
                                )}
                                {conversation.unread_count > 0 && (
                                  <div className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {conversation.unread_count > 9
                                      ? '9+'
                                      : conversation.unread_count}
                                  </div>
                                )}
                              </div>
                            </div>

                            {conversation.last_message ? (
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.last_message.is_mine && (
                                  <span className="text-gray-400">あなた: </span>
                                )}
                                {conversation.last_message.content}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400">メッセージはありません</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </PullToRefreshContainer>
      </div>
    </div>
  );
}
