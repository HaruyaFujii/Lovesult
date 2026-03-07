'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import PostCard from '@/components/post/PostCard';
import PostForm from '@/components/post/PostForm';
import ReplyCard from '@/components/reply/ReplyCard';
import ReplyForm from '@/components/reply/ReplyForm';
import { Post, Reply } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchPostAndReplies();
  }, [resolvedParams.id]);

  const fetchPostAndReplies = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // 投稿を取得
      const postResponse = await fetch(
        `/api/v1/posts/${resolvedParams.id}`,
        {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        }
      );

      if (!postResponse.ok) {
        router.push('/timeline');
        return;
      }

      const postData = await postResponse.json();
      setPost(postData);

      // リプライを取得
      const repliesResponse = await fetch(
        `/api/v1/posts/${resolvedParams.id}/replies`
      );

      if (repliesResponse.ok) {
        const repliesData = await repliesResponse.json();
        setReplies(repliesData.replies || []);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
      router.push('/timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async (content: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `/api/v1/posts/${resolvedParams.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    if (response.ok) {
      const updatedPost = await response.json();
      setPost(updatedPost);
      setEditing(false);
    } else {
      throw new Error('投稿の更新に失敗しました');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('この投稿を削除しますか？')) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `/api/v1/posts/${resolvedParams.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      }
    );

    if (response.ok) {
      router.push('/timeline');
    }
  };

  const handleCreateReply = async (content: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `/api/v1/posts/${resolvedParams.id}/replies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    if (response.ok) {
      const newReply = await response.json();
      setReplies((prev) => [...prev, newReply]);
      // 通知カウントを更新（リプライで通知が発生する可能性があるため）
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
    } else {
      throw new Error('リプライの送信に失敗しました');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('このリプライを削除しますか？')) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `/api/v1/replies/${replyId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      }
    );

    if (response.ok) {
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">投稿が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push('/timeline')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
        >
          ← タイムラインに戻る
        </button>

        {editing ? (
          <div>
            <PostForm
              onSubmit={handleUpdatePost}
              initialContent={post.content}
              submitLabel="更新"
            />
            <button
              onClick={() => setEditing(false)}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <PostCard
            post={post}
            showActions={user?.id === post.user_id}
            onEdit={() => setEditing(true)}
            onDelete={handleDeletePost}
          />
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          リプライ ({replies.length})
        </h2>

        {user && (
          <ReplyForm onSubmit={handleCreateReply} />
        )}

        <div className="space-y-3">
          {replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              showActions={user?.id === reply.user_id}
              onDelete={() => handleDeleteReply(reply.id)}
            />
          ))}

          {replies.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              まだリプライがありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}