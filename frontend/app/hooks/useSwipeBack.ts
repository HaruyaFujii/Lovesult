import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Options {
  threshold?: number;  // スワイプ判定の閾値（px）
  enabled?: boolean;
}

export function useSwipeBack(options: Options = {}) {
  const { threshold = 100, enabled = true } = options;
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // 画面左端20pxからのスワイプのみ検知
      if (e.touches[0].clientX < 20) {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startX.current === null) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX.current;
      const diffY = Math.abs(currentY - (startY.current || 0));

      // 水平方向のスワイプが垂直より大きい場合のみ
      if (diffX > threshold && diffX > diffY * 2) {
        router.back();
        startX.current = null;
        startY.current = null;
      }
    };

    const handleTouchEnd = () => {
      startX.current = null;
      startY.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, router]);
}