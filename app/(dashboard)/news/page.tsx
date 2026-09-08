"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { useNews } from "./use-news";
import { NewsDialog } from "./news-dialog";
import {
  toCreatePayload,
  toUpdatePayload,
  type NewsFormValues,
} from "@/lib/news/news-form";
import { NEWS_STATUS_LABELS, NEWS_TYPE_LABELS } from "@/lib/news/labels";
import type { NewsPost, NewsStatus, NewsType } from "@/lib/types";
import { extractError } from "@/lib/errors";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ALL_STATUS = "__all__";
const ALL_TYPE = "__all__";

export default function NewsPage() {
  const { hasRole, hydrated } = useAuth();
  const [qInput, setQInput] = useState("");
  const [filters, setFilters] = useState<{
    status?: NewsStatus;
    type?: NewsType;
    q?: string;
  }>({});

  // Debounce ô tìm kiếm 300ms — tránh gọi API mỗi phím gõ.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, q: qInput.trim() || undefined }));
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsPost | null>(null);

  const { news, isLoading, error, createMut, updateMut, statusMut, deleteMut } =
    useNews(filters);

  if (!hydrated) return null;
  if (!hasRole("admin", "editor")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const canDelete = hasRole("admin");

  const onSubmit = (values: NewsFormValues) => {
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input: toUpdatePayload(values) },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditing(null);
          },
        },
      );
    } else {
      createMut.mutate(toCreatePayload(values), {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng tin</h1>
          <p className="text-muted-foreground">
            Đăng tin tức, mẹo học và sự kiện cho học sinh
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm bài viết
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs">Trạng thái</Label>
              <Select
                value={filters.status ?? ALL_STATUS}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    status: v === ALL_STATUS ? undefined : (v as NewsStatus),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS}>Tất cả</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="published">Đã đăng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Loại bài</Label>
              <Select
                value={filters.type ?? ALL_TYPE}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    type: v === ALL_TYPE ? undefined : (v as NewsType),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TYPE}>Tất cả</SelectItem>
                  {(Object.keys(NEWS_TYPE_LABELS) as NewsType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {NEWS_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Tìm tiêu đề</Label>
              <Input
                placeholder="Nhập từ khoá..."
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Danh sách ({news?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {extractError(error)}
            </div>
          ) : !news || news.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có bài viết nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đăng</TableHead>
                  <TableHead className="w-40 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell
                      className="max-w-[320px] truncate font-medium"
                      title={n.title}
                    >
                      {n.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {NEWS_TYPE_LABELS[n.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={n.status === "published" ? "default" : "secondary"}
                      >
                        {NEWS_STATUS_LABELS[n.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {n.publishedAt
                        ? new Date(n.publishedAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={statusMut.isPending}
                          title={
                            n.status === "draft" ? "Xuất bản" : "Chuyển về nháp"
                          }
                          onClick={() =>
                            statusMut.mutate({
                              id: n.id,
                              status: n.status === "draft" ? "published" : "draft",
                            })
                          }
                        >
                          {n.status === "draft" ? (
                            <Send className="h-4 w-4 text-green-600" />
                          ) : (
                            <Undo2 className="h-4 w-4 text-amber-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Sửa bài viết"
                          onClick={() => {
                            setEditing(n);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteMut.isPending}
                            title="Xoá bài viết"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  `Xoá bài viết "${n.title}"? Thao tác này không thể hoàn tác.`,
                                )
                              ) {
                                deleteMut.mutate(n.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewsDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSubmit={onSubmit}
        submitting={createMut.isPending || updateMut.isPending}
        error={
          createMut.error
            ? extractError(createMut.error)
            : updateMut.error
              ? extractError(updateMut.error)
              : null
        }
      />
    </div>
  );
}
