export type UserStatus = 'IN_LOVE' | 'HEARTBROKEN' | 'SEEKING';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PRIVATE';
export type AgeRange = 'TEENS' | 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS';

export interface User {
  id: string;
  email: string;
  nickname?: string;
  name?: string;
  avatar_url?: string;
  status?: UserStatus;
  gender?: Gender;
  age_range?: AgeRange;
  bio?: string;
  created_at: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  user_id?: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author_status?: string;
  author_age_range?: string | null;
  author_avatar_url?: string | null;
  likes_count?: number;
  replies_count?: number;
  is_liked?: boolean;
  user?: User;
}

export interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}