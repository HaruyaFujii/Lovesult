'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ReplyButtonProps {
  postId: string;
  repliesCount?: number;
  size?: 'sm' | 'default';
  showCount?: boolean;
}

export function ReplyButton({
  postId,
  repliesCount = 0,
  size = 'sm',
  showCount = true,
}: ReplyButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size}
      asChild
      className={cn('gap-1.5 transition-colors hover:text-blue-600 hover:bg-blue-50')}
    >
      <Link href={`/post/${postId}`}>
        <MessageCircle className="h-4 w-4" />
        {showCount && repliesCount > 0 && <span className="text-xs">{repliesCount}</span>}
      </Link>
    </Button>
  );
}
