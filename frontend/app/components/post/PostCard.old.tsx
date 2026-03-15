import { Post } from '@/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from "@/components/LikeButton";
import { ReplyButton } from "@/components/ReplyButton";
import { ReportDialog } from "@/components/ReportDialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { getUserStatusLabel, getAgeRangeLabel } from '@/lib/utils/enum-labels';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function PostCard({ post, showActions = false, onDelete, onEdit }: PostCardProps) {
  const isOptimistic = (post as any)?._optimistic;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'IN_LOVE':
        return 'bg-pink-100 text-pink-800';
      case 'HEARTBROKEN':
        return 'bg-blue-100 text-blue-800';
      case 'SEEKING':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
      isOptimistic ? 'border-pink-200 bg-pink-50/30 opacity-70' : 'border-gray-200'
    }`}>
      <div className="flex items-start space-x-3">
        {/* アバター */}
        <Link href={`/profile/${post.user?.id}`}>
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={post.user?.avatar_url || undefined} />
            <AvatarFallback>
              {post.user?.name?.charAt(0) || post.user?.nickname?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Link href={`/profile/${post.user?.id}`} className="hover:underline">
                <span className="font-medium text-gray-900">
                  {post.user?.name || post.user?.nickname || 'Unknown'}
                </span>
              </Link>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                  post.author_status ?? ''
                )}`}
              >
                {getUserStatusLabel(post.author_status as any)}
              </span>
              {post.author_age_range && (
                <span className="text-xs text-gray-500">
                  {getAgeRangeLabel(post.author_age_range as any)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {isOptimistic ? '投稿中...' : formatDate(post.created_at)}
              </span>

              {/* メニューボタン */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {showActions && (
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      削除
                    </DropdownMenuItem>
                  )}
                  <ReportDialog
                    targetType="post"
                    targetId={post.id}
                    triggerText="報告"
                    triggerIcon={false}
                    asDropdownItem={true}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Link href={`/post/${post.id}`}>
            <p className="text-gray-800 whitespace-pre-wrap break-words cursor-pointer hover:text-gray-900 mb-3">
              {post.content}
            </p>
          </Link>

          {/* アクションボタン */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LikeButton
                targetId={post.id}
                targetType="post"
                isLiked={post.is_liked || false}
                likesCount={post.likes_count || 0}
              />
              <ReplyButton
                postId={post.id}
                repliesCount={post.replies_count || 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}