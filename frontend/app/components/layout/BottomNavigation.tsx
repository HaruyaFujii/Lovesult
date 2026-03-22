'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/timeline', icon: Home, label: 'ホーム' },
  { href: '/search', icon: Search, label: '検索' },
  { href: '/messages', icon: MessageCircle, label: 'DM' },
  { href: '/notifications', icon: Bell, label: '通知' },
  { href: '/profile', icon: User, label: 'マイページ' },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  const isActivePath = (href: string) => {
    if (href === '/timeline') {
      return pathname === '/' || pathname === '/timeline';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = isActivePath(href);

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center
                w-full h-full py-2
                transition-colors duration-200
                ${isActive ? 'text-pink-500' : 'text-gray-500'}
                btn-press no-select
                active:bg-gray-50 rounded-lg
              `}
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                />
                {/* TODO: 未読バッジを後で追加 */}
              </div>
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
