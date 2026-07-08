'use client';

import { useState } from 'react';
import { useFollow, useFollowStatus } from '@/hooks/use-follow';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
}

export function FollowButton({ userId }: FollowButtonProps) {
  const { user } = useAuth();
  const { data: followStatus, isLoading } = useFollowStatus(userId, !!user);
  const { followUser, unfollowUser, isFollowPending, isUnfollowPending } = useFollow();
  const [isHovering, setIsHovering] = useState(false);

  // 自分自身の場合は何も表示しない
  if (!user || user.id === userId) {
    return null;
  }

  const isFollowing = followStatus?.is_following;
  const isPending = isFollowPending || isUnfollowPending;

  const handleToggleFollow = () => {
    if (isFollowing) {
      unfollowUser({ userId });
    } else {
      followUser({ userId });
    }
  };

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-bold text-gray-500"
      >
        読み込み中...
      </button>
    );
  }

  // フォロー中: 白地 + ボーダー、hoverで「フォロー解除」+ 赤系
  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={handleToggleFollow}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isPending}
        className={cn(
          'rounded-full border px-4 py-1.5 text-sm font-bold transition-colors focus:outline-none disabled:opacity-60',
          isHovering
            ? 'border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100'
            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
        )}
      >
        {isPending ? 'フォロー解除中...' : isHovering ? 'フォロー解除' : 'フォロー中'}
      </button>
    );
  }

  // 未フォロー: ブランドピンクの塗り
  return (
    <button
      type="button"
      onClick={handleToggleFollow}
      disabled={isPending}
      className="rounded-full bg-pink-600 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-pink-700 focus:outline-none disabled:opacity-60"
    >
      {isPending ? 'フォロー中...' : 'フォローする'}
    </button>
  );
}
