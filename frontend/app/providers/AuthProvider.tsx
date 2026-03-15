'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  getAccessToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(user);
          setLoading(false);
        }
      } catch (error) {
        // AbortErrorは一般的な現象なので、コンソールログを制限
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Auth error:', error);
        }
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        const newUser = session?.user ?? null;
        const currentUserId = user?.id;
        const newUserId = newUser?.id;

        // ユーザーが変更された場合はキャッシュをクリア
        if (currentUserId !== newUserId) {
          queryClient.clear();
        }

        setUser(newUser);
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
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('Token retrieval error:', error);
        return null;
      }
      const token = session?.access_token || null;
      return token;
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
