'use client';

import { useState } from 'react';

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
}

export default function ReplyForm({
  onSubmit,
  placeholder = 'リプライを入力...',
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('リプライ内容を入力してください');
      return;
    }

    if (content.length > 300) {
      setError('リプライは300文字以内で入力してください');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onSubmit(content);
      setContent('');
    } catch (err: any) {
      setError(err.message || 'リプライの送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 border border-gray-200">
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
        rows={3}
        maxLength={300}
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {content.length}/300文字
        </span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 bg-pink-600 text-white font-medium rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? '送信中...' : 'リプライ'}
        </button>
      </div>
    </form>
  );
}