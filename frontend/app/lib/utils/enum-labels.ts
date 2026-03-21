import type { UserStatus, Gender, AgeRange } from '@/types';

export const getUserStatusLabel = (status?: UserStatus | null): string => {
  switch (status) {
    case 'IN_LOVE':
      return '恋愛中';
    case 'HEARTBROKEN':
      return '失恋中';
    case 'SEEKING':
      return '探し中';
    default:
      return '不明';
  }
};

export const getGenderLabel = (gender?: Gender | null): string => {
  switch (gender) {
    case 'MALE':
      return '男性';
    case 'FEMALE':
      return '女性';
    case 'OTHER':
      return 'その他';
    case 'PRIVATE':
      return '非公開';
    default:
      return '非公開';
  }
};

export const getAgeRangeLabel = (ageRange?: AgeRange | null): string => {
  switch (ageRange) {
    case 'TEENS':
      return '10代';
    case 'TWENTIES':
      return '20代';
    case 'THIRTIES':
      return '30代';
    case 'FORTIES':
      return '40代';
    case 'FIFTIES_PLUS':
      return '50代以上';
    default:
      return '不明';
  }
};

export const getPersonalityTypeLabel = (typeKey?: string | null): string => {
  switch (typeKey) {
    case 'romantic':
      return 'ロマンチスト';
    case 'caring':
      return '献身タイプ';
    case 'passionate':
      return '情熱タイプ';
    case 'independent':
      return '自立タイプ';
    case 'adventurous':
      return '冒険タイプ';
    case 'rational':
      return '堅実タイプ';
    default:
      return '不明';
  }
};
