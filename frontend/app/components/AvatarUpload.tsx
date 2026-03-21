'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Camera, Upload, X } from 'lucide-react';
import { customInstance } from '@/lib/api/customInstance';
import { useQueryClient } from '@tanstack/react-query';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName?: string;
  userId: string;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, userName, onAvatarUpdate }: AvatarUploadProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // propsの変更を監視
  useEffect(() => {
    setLocalAvatarUrl(currentAvatarUrl);
  }, [currentAvatarUrl]);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      return;
    }

    // SVGファイルをブロック
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      return;
    }

    setSelectedFile(file);

    // プレビュー用のData URLを作成
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await customInstance<{ data: { avatar_url: string } }>(
        '/api/v1/users/me/avatar',
        {
          method: 'POST',
          body: formData,
        }
      );

      const newAvatarUrl = response.data?.avatar_url || '';
      setLocalAvatarUrl(newAvatarUrl);

      setOpen(false);
      setPreview(null);
      setSelectedFile(null);

      onAvatarUpdate?.(newAvatarUrl);

      // クエリを無効化してデータを再取得（リロードなし）
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users'] });
    } catch (error: any) {
      console.error('Avatar upload error:', error);

      // エラーハンドリングは必要に応じて追加
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const finalImageSrc = localAvatarUrl || undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className="h-20 w-20">
            <AvatarImage src={finalImageSrc} />
            <AvatarFallback>{userName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>アバター画像を変更</DialogTitle>
          <DialogDescription>
            プロフィール画像を変更してください。ファイルサイズは5MB以下にしてください。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* プレビューまたは現在の画像 */}
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={preview || localAvatarUrl || undefined} />
              <AvatarFallback className="text-2xl">{userName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            {preview && (
              <Button
                variant="outline"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleCancel}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* ファイル選択 */}
          <div className="w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="avatar-upload"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              画像を選択
            </Button>
          </div>

          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              選択中: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button type="submit" onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? 'アップロード中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
