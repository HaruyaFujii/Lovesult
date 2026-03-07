'use client';

import { UserStatus } from '@/types';

interface StatusFilterProps {
  currentStatus?: UserStatus | 'all';
  onChange: (status: UserStatus | 'all') => void;
}

export default function StatusFilter({ currentStatus = 'all', onChange }: StatusFilterProps) {
  const statuses: Array<{ value: UserStatus | 'all'; label: string; color: string }> = [
    { value: 'all', label: 'すべて', color: 'bg-gray-100 text-gray-800' },
    { value: 'IN_LOVE', label: '恋愛中', color: 'bg-pink-100 text-pink-800' },
    { value: 'HEARTBROKEN', label: '失恋中', color: 'bg-blue-100 text-blue-800' },
    { value: 'SEEKING', label: '探し中', color: 'bg-green-100 text-green-800' },
  ];

  return (
    <div className="flex space-x-2">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            currentStatus === status.value
              ? status.color
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}