'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowJST } from '@/lib/utils/date';
import { getUserStatusLabel } from '@/lib/utils/enum-labels';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface ContentAuthor {
  id: string;
  nickname?: string;
  avatar_url?: string;
  status?: string;
  bio?: string;
}

const getStatusColor = (status?: string): string => {
  switch (status) {
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

interface ContentCardProps {
  id: string;
  content: string;
  author: ContentAuthor;
  createdAt: string;
  isOptimistic?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}

export function ContentCard({
  content,
  author,
  createdAt,
  isOptimistic = false,
  showActions = false,
  onEdit,
  onDelete,
  onClick,
  className,
  children,
}: ContentCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[data-no-navigation]')
    ) {
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <article
      className={cn(
        'flex gap-3 p-4 hover:bg-gray-50/50 transition-colors cursor-pointer',
        isOptimistic && 'opacity-75',
        className
      )}
      onClick={handleClick}
    >
      {/* Avatar */}
      <Avatar
        className="h-10 w-10 flex-shrink-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (author.id) {
            window.location.href = `/profile/${author.id}`;
          }
        }}
      >
        <AvatarImage src={author.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{author.nickname?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{author.nickname || 'Unknown'}</span>
            {author.status && (
              <span
                className={cn('text-xs px-1.5 py-0.5 rounded-full', getStatusColor(author.status))}
              >
                {getUserStatusLabel(author.status as any)}
              </span>
            )}
            <span className="text-xs text-gray-500">{formatDistanceToNowJST(createdAt)}</span>
          </div>

          {/* Actions dropdown */}
          {showActions && (onEdit || onDelete) && (
            <div data-no-navigation onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      編集
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Content text */}
        <p className="text-gray-900 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {content}
        </p>

        {/* Action buttons (likes, replies, etc) */}
        {children && (
          <div className="mt-3" data-no-navigation>
            {children}
          </div>
        )}
      </div>
    </article>
  );
}
