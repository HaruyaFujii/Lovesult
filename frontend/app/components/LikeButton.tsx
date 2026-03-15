"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { customInstance } from "@/lib/api/customInstance";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  targetId: string;
  targetType?: 'post' | 'reply';
  isLiked: boolean;
  likesCount?: number;
  size?: "sm" | "default";
  showCount?: boolean;
  // 後方互換性のため
  postId?: string;
}

export function LikeButton({
  targetId,
  targetType = 'post',
  isLiked: initialIsLiked,
  likesCount = 0,
  size = "sm",
  showCount = true,
  postId,
}: LikeButtonProps) {
  // 後方互換性：postIdが指定されていればtargetIdとして使用
  const id = postId || targetId;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(likesCount);
  const queryClient = useQueryClient();

  // propsが変更された時に状態を更新
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  useEffect(() => {
    setCount(likesCount);
  }, [likesCount]);

  // 各ボタンに固有のmutationを作成
  const likeMutation = useMutation({
    mutationFn: async () => {
      const endpoint = targetType === 'post'
        ? `/api/v1/posts/${id}/like`
        : `/api/v1/replies/${id}/like`;
      await customInstance(endpoint, { method: 'POST' });
    },
    onMutate: () => {
      // 楽観的更新
      setIsLiked(true);
      setCount((prev) => prev + 1);
    },
    onError: () => {
      // エラー時はロールバック
      setIsLiked(false);
      setCount((prev) => Math.max(0, prev - 1));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      const endpoint = targetType === 'post'
        ? `/api/v1/posts/${id}/like`
        : `/api/v1/replies/${id}/like`;
      await customInstance(endpoint, { method: 'DELETE' });
    },
    onMutate: () => {
      // 楽観的更新
      setIsLiked(false);
      setCount((prev) => Math.max(0, prev - 1));
    },
    onError: () => {
      // エラー時はロールバック
      setIsLiked(true);
      setCount((prev) => prev + 1);
    },
  });

  const handleClick = useCallback(() => {
    if (likeMutation.isPending || unlikeMutation.isPending) return;

    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  }, [isLiked, likeMutation, unlikeMutation]);

  const isLoading = likeMutation.isPending || unlikeMutation.isPending;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant="ghost"
      size={size}
      className={cn(
        "gap-1.5 transition-colors",
        isLiked && "text-red-500 hover:text-red-600"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isLiked && "fill-current"
        )}
      />
      {showCount && count > 0 && (
        <span className="text-xs">{count}</span>
      )}
    </Button>
  );
}