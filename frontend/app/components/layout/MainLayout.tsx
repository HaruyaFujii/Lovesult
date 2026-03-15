'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNavigation } from './BottomNavigation';
import { FAB } from './FAB';

interface Props {
  children: ReactNode;
}

// ボトムナビを表示しないパス
const HIDE_NAV_PATHS = [
  '/login',
  '/signup',
  '/onboarding',
  '/post/',
];

// FABを表示するパス
const SHOW_FAB_PATHS = [
  '/timeline',
  '/profile',
  '/search',
];

export function MainLayout({ children }: Props) {
  const pathname = usePathname();

  const hideNav = HIDE_NAV_PATHS.some((path) => pathname.startsWith(path));
  const showFab = SHOW_FAB_PATHS.some((path) => pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-gray-50">
      <main className={hideNav ? '' : 'pb-[calc(64px+env(safe-area-inset-bottom))]'}>
        {children}
      </main>

      {!hideNav && (
        <>
          {showFab && <FAB />}
          <BottomNavigation />
        </>
      )}
    </div>
  );
}