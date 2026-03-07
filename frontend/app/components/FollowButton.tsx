"use client";

import { Button } from "@/components/ui/button";
import { useFollow, useFollowStatus } from "@/hooks/use-follow";
import { useAuth } from "@/hooks/useAuth";

interface FollowButtonProps {
  userId: string;
}

export function FollowButton({ userId }: FollowButtonProps) {
  const { user } = useAuth();
  const { data: followStatus, isLoading } = useFollowStatus(userId, !!user);
  const { followUser, unfollowUser, isFollowPending, isUnfollowPending } = useFollow();

  // 自分自身の場合は何も表示しない
  if (!user || user.id === userId) {
    return null;
  }

  const isFollowing = (followStatus as any)?.data?.is_following;
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
      <Button variant="outline" disabled>
        読み込み中...
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      onClick={handleToggleFollow}
      disabled={isPending}
    >
      {isPending
        ? (isFollowing ? "フォロー解除中..." : "フォロー中...")
        : (isFollowing ? "フォロー中" : "フォローする")
      }
    </Button>
  );
}