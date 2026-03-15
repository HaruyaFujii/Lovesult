'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
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
  const searchParams = useSearchParams();
  const focusReplyId = searchParams.get('focus');
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{id: string, nickname: string} | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // 再帰的にリプライを検索するヘルパー関数
  const findReplyRecursively = useCallback((
    repliesList: Reply[],
    replyId: string
  ): Reply | null => {
    for (const reply of repliesList) {
      if (reply.id === replyId) {
        return reply;
      }
      if (reply.replies && reply.replies.length > 0) {
        const found = findReplyRecursively(reply.replies, replyId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // 再帰的にリプライを追加するヘルパー関数
  const addReplyRecursively = useCallback((
    repliesList: Reply[],
    parentId: string,
    newReply: Reply
  ): Reply[] => {
    return repliesList.map(reply => {
      if (reply.id === parentId) {
        return {
          ...reply,
          replies: [...(reply.replies || []), newReply],
          replies_count: (reply.replies_count || 0) + 1,
          has_replies: true  // has_repliesを確実にtrueにする
        };
      }
      if (reply.replies && reply.replies.length > 0) {
        return {
          ...reply,
          replies: addReplyRecursively(reply.replies, parentId, newReply)
        };
      }
      return reply;
    });
  }, []);

  // 再帰的にリプライを置き換えるヘルパー関数
  const replaceReplyRecursively = useCallback((
    repliesList: Reply[],
    oldId: string,
    newReply: Reply
  ): Reply[] => {
    return repliesList.map(reply => {
      if (reply.id === oldId) {
        return { ...newReply, replies: reply.replies };
      }
      if (reply.replies && reply.replies.length > 0) {
        return {
          ...reply,
          replies: replaceReplyRecursively(reply.replies, oldId, newReply)
        };
      }
      return reply;
    });
  }, []);

  // 再帰的にリプライを削除するヘルパー関数
  const removeReplyRecursively = useCallback((
    repliesList: Reply[],
    parentId: string,
    replyIdToRemove: string
  ): Reply[] => {
    return repliesList.map(reply => {
      if (reply.id === parentId) {
        return {
          ...reply,
          replies: (reply.replies || []).filter(r => r.id !== replyIdToRemove),
          replies_count: Math.max(0, (reply.replies_count || 0) - 1)
        };
      }
      if (reply.replies && reply.replies.length > 0) {
        return {
          ...reply,
          replies: removeReplyRecursively(reply.replies, parentId, replyIdToRemove)
        };
      }
      return reply;
    });
  }, []);

  useEffect(() => {
    fetchPostAndReplies();
  }, [resolvedParams.id]);

  // 特定のリプライにフォーカス
  useEffect(() => {
    if (focusReplyId && replies.length > 0) {
      // フォーカスするリプライまでのパスを展開
      const expandPath = (targetId: string, currentReplies: Reply[], path: string[] = []): string[] | null => {
        for (const reply of currentReplies) {
          if (reply.id === targetId) {
            return path;
          }
          if (reply.replies && reply.replies.length > 0) {
            const foundPath = expandPath(targetId, reply.replies, [...path, reply.id]);
            if (foundPath) {
              return foundPath;
            }
          }
        }
        return null;
      };

      const pathToExpand = expandPath(focusReplyId, replies);
      if (pathToExpand) {
        setExpandedReplies(new Set(pathToExpand));
        // スクロールしてフォーカス
        setTimeout(() => {
          const element = document.getElementById(`reply-${focusReplyId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-blue-50');
            setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
          }
        }, 100);
      }
    }
  }, [focusReplyId, replies]);


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

      // リプライを取得（認証ヘッダーを追加してis_likedを取得）
      const repliesResponse = await fetch(
        `/api/v1/posts/${resolvedParams.id}/replies`,
        {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        }
      );

      if (repliesResponse.ok) {
        const repliesData = await repliesResponse.json();
        // バックエンドが既にネスト構造で返すため、そのまま使用
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

  const handleCreateReply = async (content: string, parentId?: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // 楽観的更新：即座にリプライを表示
    const optimisticReply: Reply = {
      id: `temp-${Date.now()}`,
      content,
      user_id: currentUser?.id || user?.id || '',
      post_id: resolvedParams.id,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      user: currentUser ? {
        id: currentUser.id,
        email: currentUser.email || user?.email || '',
        nickname: currentUser.nickname || 'Unknown',
        avatar_url: currentUser.avatar_url || undefined,
        bio: currentUser.bio || undefined,
        status: currentUser.status,
        gender: currentUser.gender,
        age_range: currentUser.age_range,
        created_at: currentUser.created_at || new Date().toISOString(),
      } : {
        id: user?.id || '',
        email: user?.email || '',
        nickname: 'Unknown',
        created_at: new Date().toISOString(),
      },
      likes_count: 0,
      replies_count: 0,
      is_liked: false,
      has_replies: false,
      _optimistic: true,
    };

    if (parentId) {
      // ネストリプライの場合：再帰的に親を探して追加
      setReplies((prev) => addReplyRecursively(prev, parentId, optimisticReply));
    } else {
      // トップレベルリプライの場合
      setReplies((prev) => [...prev, optimisticReply]);
      // 投稿のリプライカウントを楽観的更新
      setPost(prev => prev ? { ...prev, replies_count: (prev.replies_count || 0) + 1 } : prev);
    }

    try {
      const response = await fetch(
        `/api/v1/posts/${resolvedParams.id}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ content, parent_id: parentId }),
        }
      );

      if (response.ok) {
        const newReply = await response.json();

        // 楽観的更新を実際のデータで置き換え（再帰的に）
        if (parentId) {
          // ネストリプライの場合、親リプライのhas_repliesとreplies_countを更新
          setReplies((prev) => {
            const updated = replaceReplyRecursively(prev, optimisticReply.id, newReply);
            // 親リプライのhas_repliesをtrueに設定
            return updated.map(r => {
              if (r.id === parentId) {
                return { ...r, has_replies: true };
              }
              return r;
            });
          });
        } else {
          setReplies((prev) => replaceReplyRecursively(prev, optimisticReply.id, newReply));
        }

        // 通知カウントと投稿リストを更新
        queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      } else {
        // エラー時は楽観的更新を取り消し
        if (parentId) {
          setReplies((prev) => removeReplyRecursively(prev, parentId, optimisticReply.id));
        } else {
          setReplies((prev) => prev.filter(reply => reply.id !== optimisticReply.id));
          setPost(prev => prev ? { ...prev, replies_count: Math.max(0, (prev.replies_count || 0) - 1) } : prev);
        }
        throw new Error('リプライの送信に失敗しました');
      }
    } catch (error) {
      // エラー時は楽観的更新を取り消し
      if (parentId) {
        setReplies((prev) => removeReplyRecursively(prev, parentId, optimisticReply.id));
      } else {
        setReplies((prev) => prev.filter(reply => reply.id !== optimisticReply.id));
        setPost(prev => prev ? { ...prev, replies_count: Math.max(0, (prev.replies_count || 0) - 1) } : prev);
      }
      throw error;
    }
  };

  const handleDeleteReply = async (replyId: string) => {

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
    <div className="flex flex-col h-screen bg-white">
      {/* 投稿とリプライ一覧（スクロール可能エリア） */}
      <div className="flex-1 overflow-y-auto">
        {/* 投稿部分 */}
        <div className="border-b border-gray-200">
          {editing ? (
            <div className="p-4">
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

        {/* リプライ一覧 */}
        <div>
          {replies.map((reply) => (
            <div
              key={reply.id}
              id={`reply-${reply.id}`}
              className="border-b border-gray-100 last:border-b-0 transition-colors duration-500"
            >
              <ReplyCard
                reply={{
                  ...reply,
                  // 展開状態を反映
                  replies: expandedReplies.has(reply.id) ? reply.replies : [],
                }}
                showActions={user?.id === reply.user_id}
                onDelete={() => handleDeleteReply(reply.id)}
                onReply={(parentId) => {
                  // リプライボタンがクリックされたら、返信先を設定
                  const targetReply = findReplyRecursively(replies, parentId);
                  if (targetReply) {
                    setReplyingTo({ id: parentId, nickname: targetReply.user?.nickname || 'Unknown' });
                  }
                  // スクロールしてフォームを表示
                  setTimeout(() => {
                    const form = document.querySelector('#main-reply-form');
                    if (form) {
                      form.scrollIntoView({ behavior: 'smooth' });
                      const textarea = form.querySelector('textarea');
                      if (textarea) {
                        (textarea as HTMLTextAreaElement).focus();
                      }
                    }
                  }, 100);
                }}
                isOptimistic={reply._optimistic}
              />
            </div>
          ))}

          {replies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              まだリプライはありません
            </div>
          )}
        </div>
      </div>

      {/* 下部固定のリプライフォーム */}
      {user && (
        <div id="main-reply-form" className="sticky bottom-0 border-t border-gray-200 bg-white safe-area-bottom">
          <div className="p-4">
            {replyingTo && (
              <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">
                  @{replyingTo.nickname}さんに返信
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  キャンセル
                </button>
              </div>
            )}
            <ReplyForm
              onSubmit={async (content) => {
                await handleCreateReply(content, replyingTo?.id);
                setReplyingTo(null);
              }}
              placeholder={replyingTo ? `@${replyingTo.nickname}さんに返信` : "リプライを追加..."}
            />
          </div>
        </div>
      )}
    </div>
  );
}