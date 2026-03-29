'use client';

// import { useConversations } from '@/hooks/use-dm';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Loader2 } from 'lucide-react';
// import { formatDistanceToNowJST } from '@/lib/utils/date';
// import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { MobileHeader } from '@/components/layout/MobileHeader';
// import { PullToRefreshContainer } from '@/components/layout/PullToRefreshContainer';

export default function MessagesPage() {
  // const { data, isLoading, refetch } = useConversations();

  // const handleRefresh = async () => {
  //   await refetch();
  // };

  // const conversations = data?.conversations || [];

  return (
    <div className="flex flex-col h-screen">
      {/* モバイルヘッダー */}
      <MobileHeader />

      {/* メインコンテンツ */}
      <div className="flex-1 pb-16 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <MessageCircle className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            DM機能は現在ご利用いただけません
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              電気通信事業の届出が必要なため、
              <br />
              現在この機能は一時的に停止しております。
            </p>
            <p>
              届出完了後、サービスを再開予定です。
              <br />
              ご不便をおかけして申し訳ございません。
            </p>
          </div>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              ※ この制限は日本の電気通信事業法に基づくものです。
              <br />
              適切な手続き完了後、機能を提供いたします。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
