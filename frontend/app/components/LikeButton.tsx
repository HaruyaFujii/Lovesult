"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLikePost, useUnlikePost } from "@/hooks/use-likes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  isLiked: boolean;
  likesCount?: number;
  size?: "sm" | "default";
  showCount?: boolean;
}

export function LikeButton({
  postId,
  isLiked: initialIsLiked,
  likesCount = 0,
  size = "sm",
  showCount = true,
}: LikeButtonProps) {
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

  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();

  // ローカルステート更新のためのハンドラー
  useEffect(() => {
    if (likeMutation.isSuccess) {
      setIsLiked(true);
      setCount((prev) => prev + 1);
      // 通知カウントを更新（いいねで通知が発生する可能性があるため）
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
    }
  }, [likeMutation.isSuccess, queryClient]);

  useEffect(() => {
    if (unlikeMutation.isSuccess) {
      setIsLiked(false);
      setCount((prev) => Math.max(0, prev - 1));
    }
  }, [unlikeMutation.isSuccess]);

  useEffect(() => {
    if (likeMutation.isError) {
      toast.error("いいねに失敗しました");
    }
  }, [likeMutation.isError]);

  useEffect(() => {
    if (unlikeMutation.isError) {
      toast.error("いいね解除に失敗しました");
    }
  }, [unlikeMutation.isError]);

  const handleClick = () => {
    if (isLiked) {
      unlikeMutation.mutate({ postId });
    } else {
      likeMutation.mutate({ postId });
    }
  };

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