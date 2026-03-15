'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreatePostModal } from '@/components/post/CreatePostModal';

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed z-40
          right-4
          w-14 h-14
          bg-pink-500 hover:bg-pink-600 active:bg-pink-700
          text-white
          rounded-full
          shadow-lg shadow-pink-500/30
          flex items-center justify-center
          transition-all duration-200
          btn-press
        "
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)',
        }}
        aria-label="投稿を作成"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <CreatePostModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}