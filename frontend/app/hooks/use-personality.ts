import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';

export interface QuestionOption {
  text: string;
  scores: Record<string, number>;
}

export interface Question {
  id: number;
  text: string;
  options: QuestionOption[];
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface PersonalityType {
  key: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  compatible_with: string[];
}

export interface PersonalityResultResponse {
  primary_type: PersonalityType;
  secondary_type?: PersonalityType | null;
  scores: Record<string, number>;
  created_at: string;
}

export interface RecommendedUser {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  personality_type: string;
  personality_emoji: string;
  compatibility_score: number;
}

export interface RecommendedUsersResponse {
  users: RecommendedUser[];
}

export function useQuestions() {
  return useQuery({
    queryKey: ['personality-questions'],
    queryFn: async (): Promise<QuestionsResponse> => {
      const response = await customInstance<{ data: QuestionsResponse }>(
        '/api/v1/personality/questions'
      );
      return response.data;
    },
    staleTime: Infinity, // 質問は変わらないのでキャッシュを永続化
  });
}

export function useMyPersonalityResult() {
  return useQuery({
    queryKey: ['personality-result'],
    queryFn: async (): Promise<PersonalityResultResponse> => {
      const response = await customInstance<{ data: PersonalityResultResponse }>(
        '/api/v1/personality/me'
      );
      return response.data;
    },
    retry: false,
  });
}

export function useSubmitPersonality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answers: number[]) => {
      const response = await customInstance<{ data: PersonalityResultResponse }>(
        '/api/v1/personality/submit',
        {
          method: 'POST',
          data: { answers },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personality-result'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-users'] });
    },
  });
}

export function useUserPersonalityResult(userId: string) {
  return useQuery({
    queryKey: ['personality-result', userId],
    queryFn: async (): Promise<PersonalityResultResponse | null> => {
      try {
        const response = await customInstance<{ data: PersonalityResultResponse }>(
          `/api/v1/personality/users/${userId}`
        );
        return response.data;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return null; // 診断結果がない場合
        }
        throw error;
      }
    },
    retry: false,
    enabled: !!userId,
  });
}

export function useRecommendedUsers(limit: number = 10) {
  return useQuery({
    queryKey: ['recommended-users', limit],
    queryFn: async (): Promise<RecommendedUsersResponse> => {
      const response = await customInstance<{ data: RecommendedUsersResponse }>(
        '/api/v1/personality/recommended-users',
        {
          params: { limit },
        }
      );
      return response.data;
    },
  });
}