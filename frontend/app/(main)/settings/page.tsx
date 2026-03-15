"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetAccountSummaryApiV1ApiV1AccountSummaryGet,
  useDeleteAccountApiV1ApiV1AccountDelete,
} from "@/lib/api/generated/endpoints/account/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Settings, Trash2, AlertTriangle, Loader2, Crown } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // アカウントサマリーを取得
  const { data: summary } = useGetAccountSummaryApiV1ApiV1AccountSummaryGet();

  // アカウント削除のミューテーション
  const deleteAccountMutation = useDeleteAccountApiV1ApiV1AccountDelete({
    mutation: {
      onSuccess: async (response) => {
        if ((response as any).data?.success) {
          await signOut();
          router.push("/");
        } else {
          setIsDeleting(false);
        }
      },
      onError: () => {
        setIsDeleting(false);
      },
    },
  });

  const handleDeleteAccount = async () => {
    if (confirmationText !== "DELETE MY ACCOUNT") {
      return;
    }

    setIsDeleting(true);
    deleteAccountMutation.mutate({
      data: {
        confirmation: confirmationText,
      },
    });
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          アカウント設定
        </h1>
      </div>

      <div className="space-y-6">
        {/* サブスクリプション設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              サブスクリプション
            </CardTitle>
            <CardDescription>
              現在のプラン: 無料プラン
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">プレミアム機能でより充実した体験を</p>
              </div>
              <Link href="/settings/subscription">
                <Button variant="outline">
                  プラン詳細
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* アカウント情報カード */}
        <Card>
          <CardHeader>
            <CardTitle>アカウント情報</CardTitle>
            <CardDescription>
              あなたのアカウントに関する統計情報
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">投稿数</p>
                  <p className="text-2xl font-bold">{(summary as any)?.data?.posts_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">リプライ数</p>
                  <p className="text-2xl font-bold">{(summary as any)?.data?.replies_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">フォロワー</p>
                  <p className="text-2xl font-bold">{(summary as any)?.data?.followers_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">フォロー中</p>
                  <p className="text-2xl font-bold">{(summary as any)?.data?.following_count || 0}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* アカウント削除カード */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              危険な操作
            </CardTitle>
            <CardDescription>
              この操作は取り消すことができません
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">アカウントを削除</h3>
                <p className="text-sm text-gray-600 mb-4">
                  アカウントを削除すると、すべての投稿、リプライ、フォロー関係、その他のデータが完全に削除されます。
                  この操作は取り消すことができません。
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  アカウントを削除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              本当にアカウントを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消すことができません。すべてのデータが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <p className="text-sm text-gray-600 mb-2">
              確認のため、以下のテキストを入力してください：
            </p>
            <p className="font-mono font-bold mb-2">DELETE MY ACCOUNT</p>
            <Input
              type="text"
              placeholder="確認テキストを入力"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              disabled={isDeleting}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmationText !== "DELETE MY ACCOUNT" || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  削除中...
                </>
              ) : (
                "アカウントを削除"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}