import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発環境でReact Strict Modeを無効化してSupabaseの競合問題を回避
  reactStrictMode: false,

  // APIプロキシ設定
  async rewrites() {
    // 環境変数が設定されている場合（本番環境）はrewritesを使わない
    // クライアントサイドでAPIのURLを直接使用する
    if (process.env.NEXT_PUBLIC_API_URL) {
      console.log('[Next.js Config] Production mode - API URL:', process.env.NEXT_PUBLIC_API_URL);
      return [];
    }

    // 環境変数が設定されていない場合（開発環境）はローカルAPIにプロキシ
    console.log('[Next.js Config] Development mode - Using local API proxy');
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;