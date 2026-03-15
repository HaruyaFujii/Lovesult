'use client';

import { useState } from 'react';

interface PostFormProps {
  onSubmit: (content: string) => Promise<void>;
  initialContent?: string;
  submitLabel?: string;
  placeholder?: string;
}

export default function PostForm({
  onSubmit,
  initialContent = '',
  submitLabel = '投稿',
  placeholder = '今の気持ちを共有しよう...',
}: PostFormProps) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 既に送信中の場合は何もしない（重複送信防止）
    if (loading) {
      return;
    }

    if (!content.trim()) {
      setError('投稿内容を入力してください');
      return;
    }

    if (content.length > 500) {
      setError('投稿は500文字以内で入力してください');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onSubmit(content);
      setContent('');
    } catch (err: any) {
      setError(err.message || '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
    >
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
        rows={4}
        maxLength={500}
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">{content.length}/500文字</span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 bg-pink-600 text-white font-medium rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '送信中...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
