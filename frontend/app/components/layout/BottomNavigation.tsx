'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGetUnreadNotificationCount } from '@/hooks/use-notifications';

const NAV_ITEMS = [
  { href: '/timeline', icon: Home, label: 'ホーム' },
  { href: '/search', icon: Search, label: '検索' },
  { href: '/messages', icon: MessageCircle, label: 'DM' },
  { href: '/notifications', icon: Bell, label: '通知' },
  { href: '/profile', icon: User, label: 'マイページ' },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: unreadData } = useGetUnreadNotificationCount(!!user);
  const unreadCount = unreadData?.unread_count ?? 0;

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
          const isNotifications = href === '/notifications';
          const showBadge = isNotifications && unreadCount > 0;
          const badgeLabel = unreadCount >= 10 ? '9+' : String(unreadCount);

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
                {showBadge && (
                  <span
                    aria-label={`未読通知${unreadCount}件`}
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-pink-600 text-white text-[10px] font-semibold leading-none"
                  >
                    {badgeLabel}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
