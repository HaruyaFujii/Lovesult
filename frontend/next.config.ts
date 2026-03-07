import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発環境でReact Strict Modeを無効化してSupabaseの競合問題を回避
  reactStrictMode: false,

  // APIプロキシ設定
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;