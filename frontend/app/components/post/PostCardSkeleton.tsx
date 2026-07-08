'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface PostCardSkeletonProps {
  count?: number;
}

function SinglePostCardSkeleton() {
  return (
    <article aria-hidden className="flex gap-3 border-b border-gray-200 px-4 py-3">
      {/* アバター */}
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

      {/* 右カラム */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* ヘッダー行 */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-12 rounded-full" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>

        {/* 本文 2行 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>

        {/* アクションバー */}
        <div className="mt-2 flex items-center gap-12 -ml-2 pt-1">
          <Skeleton className="h-6 w-10 rounded-full" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      </div>
    </article>
  );
}

export default function PostCardSkeleton({ count = 3 }: PostCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SinglePostCardSkeleton key={i} />
      ))}
    </>
  );
}
