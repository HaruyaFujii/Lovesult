import { formatDistanceToNow as originalFormatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * UTC時間文字列を日本時間（JST）に変換してからformatDistanceToNowを実行
 */
export function formatDistanceToNowJST(
  dateString: string,
  options?: Parameters<typeof originalFormatDistanceToNow>[1]
): string {
  // UTC時間文字列をDateオブジェクトに変換
  const utcDate = new Date(dateString);

  // 日本時間（UTC+9）に変換
  const jstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

  return originalFormatDistanceToNow(jstDate, {
    addSuffix: true,
    locale: ja,
    ...options,
  });
}

/**
 * UTC時間文字列を日本時間（JST）のDateオブジェクトに変換
 */
export function convertToJST(dateString: string): Date {
  const utcDate = new Date(dateString);
  return new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
}

/**
 * 現在時刻を日本時間（JST）で取得
 */
export function nowJST(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}
