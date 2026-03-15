'use client';

import Link from 'next/link';

export function TimelineHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b safe-area-top">
      <div className="flex items-center justify-center px-4 h-12">
        <Link href="/timeline" className="text-xl font-bold text-pink-600">
          LoveTalk
        </Link>
      </div>
    </header>
  );
}