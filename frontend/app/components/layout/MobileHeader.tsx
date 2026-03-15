'use client';

import Link from 'next/link';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b safe-area-top">
      <div className="flex items-center justify-center h-12 px-4">
        <Link href="/timeline" className="text-lg font-bold text-pink-600">
          LoveTalk
        </Link>
      </div>
    </header>
  );
}