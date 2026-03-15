"use client";

import { useState } from "react";
import { useSearchPosts, useSearchUsers } from "@/hooks/use-search";
import PostCard from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, User } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import Link from "next/link";

export default function SearchPage() {
  const [searchType, setSearchType] = useState<"posts" | "users">("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [ageRangeFilter, setAgeRangeFilter] = useState<string | undefined>(undefined);
  const [postsCursor, setPostsCursor] = useState<string | undefined>(undefined);
  const [usersCursor, setUsersCursor] = useState<string | undefined>(undefined);

  // デバウンスされた検索クエリ
  const debouncedQuery = useDebounce(searchQuery, 500);

  // 投稿検索
  const { data: postsData, isLoading: postsLoading, error: postsError } = useSearchPosts(
    {
      q: debouncedQuery || undefined,
      status: statusFilter,
      age_range: ageRangeFilter,
      cursor: postsCursor,
      limit: 20,
    },
    searchType === "posts" && !!(debouncedQuery || statusFilter || ageRangeFilter)
  );

  // ユーザー検索
  const { data: usersData, isLoading: usersLoading, error: usersError } = useSearchUsers(
    {
      q: debouncedQuery || undefined,
      status: statusFilter,
      age_range: ageRangeFilter,
      cursor: usersCursor,
      limit: 20,
    },
    searchType === "users" && !!(debouncedQuery || statusFilter || ageRangeFilter)
  );

  const posts = postsData?.posts || [];
  const users = usersData?.users || [];
  const hasMorePosts = !!postsData?.next_cursor;
  const hasMoreUsers = !!usersData?.next_cursor;

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as "posts" | "users");
    setPostsCursor(undefined);
    setUsersCursor(undefined);
  };

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    setPostsCursor(undefined);
    setUsersCursor(undefined);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? undefined : value);
    setPostsCursor(undefined);
    setUsersCursor(undefined);
  };

  const handleAgeRangeFilterChange = (value: string) => {
    setAgeRangeFilter(value === "all" ? undefined : value);
    setPostsCursor(undefined);
    setUsersCursor(undefined);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "IN_LOVE":
        return "恋愛中";
      case "HEARTBROKEN":
        return "失恋中";
      case "SEEKING":
        return "探し中";
      default:
        return status;
    }
  };

  const getAgeRangeLabel = (ageRange: string) => {
    switch (ageRange) {
      case "TEENS":
        return "10代";
      case "TWENTIES":
        return "20代";
      case "THIRTIES":
        return "30代";
      case "FORTIES":
        return "40代";
      case "FIFTIES_PLUS":
        return "50代以上";
      default:
        return ageRange;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">

        {/* 検索フォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          <Tabs value={searchType} onValueChange={handleSearchTypeChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">投稿</TabsTrigger>
              <TabsTrigger value="users">ユーザー</TabsTrigger>
            </TabsList>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={searchType === "posts" ? "投稿を検索..." : "ユーザーを検索..."}
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ステータスフィルター */}
              <Select
                value={statusFilter || "all"}
                onValueChange={handleStatusFilterChange}
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
                onValueChange={handleAgeRangeFilterChange}
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

            <TabsContent value="posts" className="mt-6">
              {/* 投稿検索結果 */}
              {postsLoading && !postsData ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : postsError ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">検索中にエラーが発生しました</p>
                </div>
              ) : !debouncedQuery && !statusFilter && !ageRangeFilter ? (
                <div className="bg-gray-50 rounded-lg p-12">
                  <div className="text-center">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      キーワードを入力するか、フィルターを選択して検索を開始してください
                    </p>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-12">
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

                  {hasMorePosts && (
                    <div className="flex justify-center py-4">
                      <Button
                        onClick={() => setPostsCursor(postsData?.next_cursor || undefined)}
                        disabled={postsLoading}
                        variant="outline"
                      >
                        {postsLoading ? (
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
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              {/* ユーザー検索結果 */}
              {usersLoading && !usersData ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : usersError ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">検索中にエラーが発生しました</p>
                </div>
              ) : !debouncedQuery && !statusFilter && !ageRangeFilter ? (
                <div className="bg-gray-50 rounded-lg p-12">
                  <div className="text-center">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      キーワードを入力するか、フィルターを選択して検索を開始してください
                    </p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-12">
                  <div className="text-center">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">検索条件に一致するユーザーが見つかりませんでした</p>
                    <p className="text-gray-400 text-sm mt-2">
                      別のキーワードやフィルターで試してみてください
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <Link key={user.id} href={`/profile/${user.id}`}>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url} alt={user.nickname} />
                            <AvatarFallback>{user.nickname?.charAt(0)?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{user.nickname}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                                {getStatusLabel(user.status)}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {getAgeRangeLabel(user.age_range)}
                              </span>
                            </div>
                            {user.bio && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {hasMoreUsers && (
                    <div className="flex justify-center py-4">
                      <Button
                        onClick={() => setUsersCursor(usersData?.next_cursor || undefined)}
                        disabled={usersLoading}
                        variant="outline"
                      >
                        {usersLoading ? (
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}