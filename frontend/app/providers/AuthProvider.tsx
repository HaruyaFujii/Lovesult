'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  session: { access_token?: string } | null;
  getAccessToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    // 初回のセッション取得
    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Auth initialization error:', error);
        }
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (isMounted) {
        const newUser = newSession?.user ?? null;
        const currentUserId = user?.id;
        const newUserId = newUser?.id;

        // ユーザーが変更された場合はキャッシュをクリア
        if (currentUserId !== newUserId) {
          queryClient.clear();
        }

        setSession(newSession);
        setUser(newUser);

        // ログアウト時はloadingをfalseに
        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, queryClient, user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // サインアウト時にもキャッシュをクリア
    queryClient.clear();
  };

  const getAccessToken = async (): Promise<string | null> => {
    // キャッシュされたセッションから直接トークンを取得
    if (session) {
      return session.access_token || null;
    }

    // セッションがない場合のみ、新たに取得を試みる
    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('Token retrieval error:', error);
        return null;
      }
      if (newSession) {
        setSession(newSession);
      }
      return newSession?.access_token || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        session,
        getAccessToken,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
