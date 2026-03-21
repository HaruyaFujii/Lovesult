'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';

interface ReportDialogProps {
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  triggerText?: string;
  triggerIcon?: boolean;
  asDropdownItem?: boolean;
}

export function ReportDialog({
  targetType,
  targetId,
  triggerText = '報告',
  triggerIcon = true,
  asDropdownItem = false,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<string>('');
  const [reason, setReason] = useState('');

  const createReportMutation = useMutation({
    mutationFn: async (data: {
      target_type: string;
      target_id: string;
      report_type: string;
      reason: string;
    }) => {
      const response = await customInstance<any>('/api/v1/reports', {
        method: 'POST',
        data,
      });
      return response;
    },
    onSuccess: () => {
      setOpen(false);
      setReportType('');
      setReason('');
    },
    onError: () => {
      // エラーハンドリングはフォーム内で処理
    },
  });

  const handleSubmit = () => {
    if (!reportType || !reason.trim()) {
      return;
    }

    createReportMutation.mutate({
      target_type: targetType,
      target_id: targetId,
      report_type: reportType as any,
      reason: reason.trim(),
    });
  };

  const getTargetTypeLabel = () => {
    switch (targetType) {
      case 'post':
        return '投稿';
      case 'reply':
        return '返信';
      case 'user':
        return 'ユーザー';
      default:
        return 'コンテンツ';
    }
  };

  const TriggerComponent = asDropdownItem ? (
    <DropdownMenuItem
      onSelect={(e: { preventDefault: () => void }) => {
        e.preventDefault();
        setOpen(true);
      }}
    >
      {triggerIcon && <Flag className="h-4 w-4 mr-1" />}
      {triggerText}
    </DropdownMenuItem>
  ) : (
    <DialogTrigger asChild>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        {triggerIcon && <Flag className="h-4 w-4 mr-1" />}
        {triggerText}
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {TriggerComponent}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTargetTypeLabel()}を報告</DialogTitle>
          <DialogDescription>
            不適切な内容や規約違反を報告してください。 虚偽の報告は処罰の対象となる場合があります。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="report-type">報告の種類</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">スパム</SelectItem>
                <SelectItem value="harassment">ハラスメント・嫌がらせ</SelectItem>
                <SelectItem value="inappropriate">不適切な内容</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">詳細な理由</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="報告の理由を詳しく説明してください"
              className="resize-none"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{reason.length}/1000</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!reportType || !reason.trim() || createReportMutation.isPending}
          >
            {createReportMutation.isPending ? '送信中...' : '報告を送信'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
