"use client";

import { useState } from "react";
import { useSearchPostsApiV1ApiV1SearchPostsGet } from "@/lib/api/generated/endpoints/search/search";
import PostCard from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [ageRangeFilter, setAgeRangeFilter] = useState<string | undefined>(undefined);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // デバウンスされた検索クエリ
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { data, isLoading, error } = useSearchPostsApiV1ApiV1SearchPostsGet(
    {
      q: debouncedQuery || undefined,
      status: statusFilter,
      age_range: ageRangeFilter,
      cursor,
      limit: 20,
    },
    {
      query: {
        enabled: !!(debouncedQuery || statusFilter || ageRangeFilter),
        placeholderData: (previousData) => previousData,
      }
    }
  );

  const posts = (data as any)?.data?.posts || [];
  const hasMore = !!(data as any)?.data?.next_cursor;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Search className="h-6 w-6" />
          投稿を検索
        </h1>

        {/* 検索フォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="キーワードで検索..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCursor(undefined); // 新しい検索でカーソルをリセット
              }}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ステータスフィルター */}
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => {
                setStatusFilter(value === "all" ? undefined : value);
                setCursor(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="ステータスで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="IN_LOVE">恋愛中</SelectItem>
                <SelectItem value="HEARTBROKEN">失恋中</SelectItem>
                <SelectItem value="SEEKING">探し中</SelectItem>
              </SelectContent>
            </Select>

            {/* 年齢範囲フィルター */}
            <Select
              value={ageRangeFilter || "all"}
              onValueChange={(value) => {
                setAgeRangeFilter(value === "all" ? undefined : value);
                setCursor(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="年齢で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての年齢</SelectItem>
                <SelectItem value="TEENS">10代</SelectItem>
                <SelectItem value="TWENTIES">20代</SelectItem>
                <SelectItem value="THIRTIES">30代</SelectItem>
                <SelectItem value="FORTIES">40代</SelectItem>
                <SelectItem value="FIFTIES_PLUS">50代以上</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 検索結果 */}
      {isLoading && !data ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-gray-500">検索中にエラーが発生しました</p>
        </div>
      ) : !debouncedQuery && !statusFilter && !ageRangeFilter ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              キーワードを入力するか、フィルターを選択して検索を開始してください
            </p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">検索条件に一致する投稿が見つかりませんでした</p>
            <p className="text-gray-400 text-sm mt-2">
              別のキーワードやフィルターで試してみてください
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                onClick={() => setCursor((data as any)?.data?.next_cursor || undefined)}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    読み込み中...
                  </>
                ) : (
                  "もっと見る"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}