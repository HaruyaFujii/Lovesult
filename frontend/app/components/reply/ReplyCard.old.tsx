import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Reply } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowJST } from '@/lib/utils/date';
import { MoreHorizontal, Trash2, MessageCircle, Maximize2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LikeButton } from '@/components/LikeButton';

interface ReplyCardProps {
  reply: Reply;
  showActions?: boolean;
  onDelete?: () => void;
  onReply?: (parentId: string) => void;
  isOptimistic?: boolean;
  depth?: number;
}

export default function ReplyCard({
  reply,
  showActions = false,
  onDelete,
  onReply,
  isOptimistic = false,
  depth = 0
}: ReplyCardProps) {
  const router = useRouter();
  const [showNestedReplies, setShowNestedReplies] = useState(false);
  const [nestedReplies, setNestedReplies] = useState<Reply[]>([]);
  const [loadingNestedReplies, setLoadingNestedReplies] = useState(false);
  const [localRepliesCount, setLocalRepliesCount] = useState(reply.replies_count || 0);

  // リプライが更新されたときにカウントも更新
  useEffect(() => {
    setLocalRepliesCount(reply.replies_count || 0);
  }, [reply.replies_count]);

  const handleClickReply = () => {
    if (onReply) {
      onReply(reply.id);
    }
  };

  const loadNestedReplies = async () => {
    if (!reply.has_replies && localRepliesCount === 0) return;

    setLoadingNestedReplies(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/v1/replies/${reply.id}/replies`, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (response.ok) {
        const data = await response.json();
        setNestedReplies(data.replies);
        // ネストされたリプライが取得できたら、カウントを更新
        if (data.replies.length > 0) {
          setLocalRepliesCount(data.replies.length);
        }
      }
    } catch (error) {
      console.error('Failed to load nested replies:', error);
    } finally {
      setLoadingNestedReplies(false);
    }
  };

  const handleToggleNestedReplies = async () => {
    if (!showNestedReplies) {
      // 常に最新のデータを取得
      await loadNestedReplies();
      setShowNestedReplies(true);
    } else {
      setShowNestedReplies(false);
    }
  };

  return (
    <div className={`${isOptimistic ? 'opacity-75' : ''}`}>
      {/* メインのリプライ */}
      <div className={`flex items-start gap-3 p-4 hover:bg-gray-50/50 transition-colors ${depth > 0 ? 'ml-8' : ''}`}>
        {/* 縦線 */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 bg-gray-200 h-3 mb-2"></div>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={reply.user?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {reply.user?.nickname?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* リプライ内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">
              {reply.user?.nickname || 'Unknown'}
            </span>
            <span className="text-sm text-gray-500">
              {formatDistanceToNowJST(reply.created_at)}
            </span>
            {showActions && (
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-gray-200 rounded-full">
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <p className="text-gray-900 mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {reply.content}
          </p>

          {/* アクションボタン */}
          <div className="flex items-center gap-2 mt-2">
            {/* いいねボタン */}
            <LikeButton
              targetId={reply.id}
              targetType="reply"
              isLiked={reply.is_liked || false}
              likesCount={reply.likes_count || 0}
              size="sm"
            />

            {/* リプライボタン */}
            {onReply && (
              <button
                onClick={handleClickReply}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 transition-colors px-2 py-1"
              >
                <MessageCircle className="h-4 w-4" />
                {localRepliesCount > 0 && (
                  <span>{localRepliesCount}</span>
                )}
              </button>
            )}

            {/* スレッド表示ボタン（ネストが深い場合のみ） */}
            {depth > 0 && (
              <button
                onClick={() => router.push(`/post/${reply.post_id}?focus=${reply.id}`)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1"
                title="スレッドを表示"
              >
                <Maximize2 className="h-4 w-4" />
                <span>スレッド表示</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ネストされたリプライを表示するボタン */}
      {(reply.has_replies || localRepliesCount > 0) && depth === 0 && (
        <div className="ml-12 mb-2">
          <button
            onClick={handleToggleNestedReplies}
            className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            disabled={loadingNestedReplies}
          >
            {loadingNestedReplies ? (
              '読み込み中...'
            ) : showNestedReplies ? (
              'リプライを非表示'
            ) : (
              `${localRepliesCount}件のリプライを表示`
            )}
          </button>
        </div>
      )}

      {/* ネストされたリプライ */}
      {showNestedReplies && nestedReplies.length > 0 && (
        <div className="border-l-2 border-gray-100 ml-8">
          {nestedReplies.map((nestedReply) => (
            <ReplyCard
              key={nestedReply.id}
              reply={nestedReply}
              showActions={showActions}
              onDelete={onDelete}
              onReply={onReply}
              isOptimistic={nestedReply._optimistic}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}