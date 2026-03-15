'use client';

import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface Props {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}

export function PullToRefreshContainer({ children, onRefresh }: Props) {
  const { containerRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh,
  });

  return (
    <div ref={containerRef} className="h-full overflow-y-auto hide-scrollbar">
      {/* リフレッシュインジケーター */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance }}
      >
        <RefreshCw
          size={24}
          className={`text-pink-500 transition-transform duration-200 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: `rotate(${pullProgress * 360}deg)`,
            opacity: pullProgress,
          }}
        />
      </div>

      {children}
    </div>
  );
}
