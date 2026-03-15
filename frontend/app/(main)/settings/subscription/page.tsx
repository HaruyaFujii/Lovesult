'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, Crown, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const router = useRouter();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const features = [
    { name: '基本メッセージ機能', free: true, premium: true },
    { name: 'プロフィール作成', free: true, premium: true },
    { name: '投稿・リプライ', free: true, premium: true },
    { name: '性格診断', free: true, premium: true },
    { name: '無制限メッセージ', free: false, premium: true },
    { name: '高度なマッチング', free: false, premium: true },
    { name: 'プロフィール閲覧履歴', free: false, premium: true },
    { name: '既読機能', free: false, premium: true },
    { name: 'ビデオ通話', free: false, premium: true },
    { name: '広告非表示', free: false, premium: true },
  ];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/settings')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          設定に戻る
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-500" />
          サブスクリプションプラン
        </h1>
        <p className="text-gray-600 mt-2">
          あなたに最適なプランを選択してください
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 無料プラン */}
        <Card>
          <CardHeader>
            <CardTitle>無料プラン</CardTitle>
            <CardDescription>基本機能をお試しいただけます</CardDescription>
            <div className="mt-4">
              <p className="text-3xl font-bold">¥0</p>
              <p className="text-sm text-gray-500">月額</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex items-center gap-2">
                  {feature.free ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-gray-300" />
                  )}
                  <span className={feature.free ? '' : 'text-gray-400'}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="outline" className="w-full" disabled>
                現在のプラン
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* プレミアムプラン */}
        <Card className="border-yellow-500 border-2 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            おすすめ
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              プレミアムプラン
            </CardTitle>
            <CardDescription>すべての機能をご利用いただけます</CardDescription>
            <div className="mt-4">
              <p className="text-3xl font-bold">¥980</p>
              <p className="text-sm text-gray-500">月額</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className={feature.premium && !feature.free ? 'font-semibold' : ''}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                onClick={() => setShowComingSoon(true)}
              >
                プレミアムにアップグレード
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 準備中ダイアログ */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              準備中
            </DialogTitle>
            <DialogDescription>
              プレミアムプランは現在準備中です。
              サービス開始時にお知らせいたします。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button onClick={() => setShowComingSoon(false)} className="w-full">
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}