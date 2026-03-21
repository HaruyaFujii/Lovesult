'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LikeButton } from '@/components/LikeButton';
import { ReportDialog } from '@/components/ReportDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNowJST } from '@/lib/utils/date';
import { getUserStatusLabel, getAgeRangeLabel } from '@/lib/utils/enum-labels';

export interface ContentData {
  id: string;
  content: string;
  created_at: string;
  user_id?: string;
  user?: {
    id: string;
    nickname?: string;
    avatar_url?: string;
  };
  // 投稿用
  author_status?: string;
  author_age_range?: string | null;
  author_avatar_url?: string | null;
  // 共通
  likes_count?: number;
  replies_count?: number;
  is_liked?: boolean;
  // リプライ用
  parent_id?: string;
  replies?: ContentData[];
  // 楽観的更新用
  _optimistic?: boolean;
}

interface ContentCardProps {
  data: ContentData;
  type: 'post' | 'reply';
  currentUserId?: string;
  onDelete?: () => void;
  onReply?: (content: string, parentId?: string) => Promise<void>;
  depth?: number;
  maxDepth?: number;
  showReplyForm?: boolean;
}

export function ContentCard({
  data,
  type,
  currentUserId,
  onDelete,
  onReply,
  depth = 0,
  maxDepth = 2,
  showReplyForm = true,
}: ContentCardProps) {
  const [isReplyFormOpen, setIsReplyFormOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOptimistic = data._optimistic;
  const isOwner =
    currentUserId && (data.user_id === currentUserId || data.user?.id === currentUserId);
  const canReply = onReply && depth < maxDepth;

  // 投稿用のユーザー情報
  const avatarUrl =
    type === 'post' ? data.author_avatar_url || data.user?.avatar_url : data.user?.avatar_url;
  const nickname = data.user?.nickname || 'Unknown';
  const status = type === 'post' ? data.author_status : undefined;
  const ageRange = type === 'post' ? data.author_age_range : undefined;

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting || !onReply) return;

    setIsSubmitting(true);
    try {
      await onReply(replyContent.trim(), data.id);
      setReplyContent('');
      setIsReplyFormOpen(false);
    } catch {
      // サイレントエラー
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_LOVE':
        return 'bg-pink-100 text-pink-800';
      case 'HEARTBROKEN':
        return 'bg-blue-100 text-blue-800';
      case 'SEEKING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const contentElement = (
    <p
      className={`whitespace-pre-wrap break-words ${type === 'post' ? 'text-gray-800 mb-3' : 'text-gray-900 mt-1 text-sm leading-relaxed'}`}
    >
      {data.content}
    </p>
  );

  return (
    <div className={`${isOptimistic ? 'opacity-75' : ''}`}>
      <div
        className={`flex items-start gap-3 p-4 hover:bg-gray-50/50 transition-colors ${type === 'reply' && depth > 0 ? 'ml-8' : ''}`}
      >
        {/* アバター部分 */}
        <div className="flex flex-col items-center">
          {type === 'reply' && <div className="w-0.5 bg-gray-200 h-3 mb-2" />}
          <Avatar className={type === 'post' ? 'h-10 w-10' : 'h-8 w-8'}>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className={type === 'post' ? '' : 'text-xs'}>
              {nickname.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* コンテンツ部分 */}
        <div className="flex-1 min-w-0">
          {/* ヘッダー */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-semibold ${type === 'post' ? 'text-gray-900' : 'text-sm text-gray-900'}`}
            >
              {nickname}
            </span>
            {status && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
                {getUserStatusLabel(status as any)}
              </span>
            )}
            {ageRange && (
              <span className="text-xs text-gray-500">{getAgeRangeLabel(ageRange as any)}</span>
            )}
            <span className="text-sm text-gray-500">
              {isOptimistic ? '投稿中...' : formatDistanceToNowJST(data.created_at)}
            </span>

            {/* メニュー */}
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </DropdownMenuItem>
                  )}
                  <ReportDialog
                    targetType={type}
                    targetId={data.id}
                    triggerText="報告"
                    triggerIcon={false}
                    asDropdownItem={true}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* コンテンツ */}
          {type === 'post' ? (
            <Link href={`/post/${data.id}`}>
              <div className="cursor-pointer hover:text-gray-900">{contentElement}</div>
            </Link>
          ) : (
            contentElement
          )}

          {/* アクションボタン */}
          <div className="flex items-center gap-1 mt-2">
            <LikeButton
              targetId={data.id}
              targetType={type}
              isLiked={data.is_liked || false}
              likesCount={data.likes_count || 0}
              size="sm"
            />

            {type === 'post' ? (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-1.5 transition-colors hover:text-blue-600 hover:bg-blue-50"
              >
                <Link href={`/post/${data.id}`}>
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{data.replies_count || 0}</span>
                </Link>
              </Button>
            ) : (
              canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplyFormOpen(!isReplyFormOpen)}
                  className="gap-1.5 transition-colors hover:text-blue-600 hover:bg-blue-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  {(data.replies_count || 0) > 0 && (
                    <span className="text-xs">{data.replies_count}</span>
                  )}
                </Button>
              )
            )}
          </div>

          {/* インラインリプライフォーム（リプライ用） */}
          {type === 'reply' && isReplyFormOpen && showReplyForm && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <div className="flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`@${nickname}さんに返信`}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  rows={2}
                  maxLength={300}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-xs ${replyContent.length > 280 ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {replyContent.length > 0 && `${replyContent.length}/300`}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplyFormOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !replyContent.trim()}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    {isSubmitting ? '送信中...' : '返信'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ネストされたリプライ */}
      {type === 'reply' && data.replies && data.replies.length > 0 && (
        <div className="border-l-2 border-gray-100 ml-4">
          {data.replies.map((nestedReply) => (
            <ContentCard
              key={nestedReply.id}
              data={nestedReply}
              type="reply"
              currentUserId={currentUserId}
              onDelete={onDelete}
              onReply={onReply}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}
