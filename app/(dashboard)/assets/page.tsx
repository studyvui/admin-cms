"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Music,
  Search,
  Loader2,
} from "lucide-react";
import { assetsApi } from "@/lib/api/assets";
import type { AssetItem, AssetType } from "@/lib/types";
import { extractError } from "@/lib/errors";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const COMMON_PREFIXES = [
  "grade1/english/",
  "grade1/math/master/",
  "grade2/english/",
  "grade2/math/",
  "audio/grade1/english/",
  "uploads/",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface PendingFile {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  message?: string;
  result?: AssetItem;
}

export default function AssetsPage() {
  const { hasRole, hydrated } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [search, setSearch] = useState("");
  const [prefix, setPrefix] = useState("grade1/english/");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["assets", "all"],
    queryFn: () => assetsApi.list({}),
    enabled: hydrated,
  });

  const deleteMut = useMutation({
    mutationFn: (key: string) => assetsApi.delete(key),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = data;
    if (typeFilter !== "all") {
      items = items.filter((a) => a.type === typeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) items = items.filter((a) => a.key.toLowerCase().includes(q));
    return items;
  }, [data, typeFilter, search]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const next: PendingFile[] = arr.map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        status:
          f.size > MAX_FILE_SIZE
            ? "error"
            : ("queued" as PendingFile["status"]),
        message:
          f.size > MAX_FILE_SIZE
            ? `File quá lớn (${(f.size / 1024 / 1024).toFixed(1)} MB > 10 MB)`
            : undefined,
      }));
      setPending((prev) => [...prev, ...next]);

      // Start uploading queued files sequentially
      next
        .filter((p) => p.status === "queued")
        .forEach((p) => {
          setPending((prev) =>
            prev.map((x) =>
              x.id === p.id ? { ...x, status: "uploading" } : x,
            ),
          );
          assetsApi
            .upload(p.file, prefix)
            .then((result) => {
              setPending((prev) =>
                prev.map((x) =>
                  x.id === p.id
                    ? { ...x, status: "done", result }
                    : x,
                ),
              );
              queryClient.invalidateQueries({ queryKey: ["assets"] });
            })
            .catch((err) => {
              setPending((prev) =>
                prev.map((x) =>
                  x.id === p.id
                    ? { ...x, status: "error", message: extractError(err) }
                    : x,
                ),
              );
            });
        });
    },
    [prefix, queryClient],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  if (!hydrated) return null;
  if (!hasRole("admin", "editor", "qa")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const canUpload = hasRole("admin", "editor");
  const canDelete = hasRole("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kho asset</h1>
        <p className="text-muted-foreground">
          Quản lý ảnh và audio trong Cloudflare R2 — tự upload từ trình duyệt
        </p>
      </div>

      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tải lên file mới</CardTitle>
            <CardDescription>
              Kéo thả file vào ô bên dưới hoặc bấm để chọn. Chấp nhận: PNG,
              WebP, JPG, GIF, SVG, MP3, OGG, WAV, M4A. Tối đa 10 MB/file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-xs">
                  Thư mục lưu (prefix R2)
                </Label>
                <Select value={prefix} onValueChange={setPrefix}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_PREFIXES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">
                  Hoặc gõ prefix tuỳ ý
                </Label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="grade1/english/"
                />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center transition",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/60",
              )}
            >
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                Kéo thả file vào đây hoặc bấm để chọn
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Có thể chọn nhiều file cùng lúc
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,audio/*"
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {pending.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">
                  Hàng đợi upload ({pending.length}):
                </Label>
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                  {pending.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded px-2 py-1 text-xs"
                    >
                      <span className="flex-1 truncate font-mono">
                        {p.file.name}
                      </span>
                      <span className="text-muted-foreground">
                        {(p.file.size / 1024).toFixed(0)} KB
                      </span>
                      {p.status === "uploading" && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      {p.status === "queued" && (
                        <Badge variant="outline">Chờ</Badge>
                      )}
                      {p.status === "done" && (
                        <Badge>Xong</Badge>
                      )}
                      {p.status === "error" && (
                        <Badge
                          variant="destructive"
                          title={p.message}
                          className="max-w-[200px] truncate"
                        >
                          {p.message ?? "Lỗi"}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPending((prev) =>
                      prev.filter((p) => p.status === "uploading"),
                    )
                  }
                >
                  Xoá danh sách đã xong
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-lg">
                Tất cả asset ({data?.length ?? 0})
              </CardTitle>
              <CardDescription>
                Hiển thị {filtered.length} / {data?.length ?? 0} mục
              </CardDescription>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <Label className="mb-1.5 block text-xs">Loại</Label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) =>
                    setTypeFilter(v as AssetType | "all")
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="image">Ảnh</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Lọc theo tên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {extractError(error)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Không có asset nào khớp bộ lọc.
            </p>
          ) : (
            <AssetGrid
              items={filtered}
              canDelete={canDelete}
              onDelete={(key) => {
                if (confirm(`Xoá vĩnh viễn "${key}"?`)) {
                  deleteMut.mutate(key);
                }
              }}
              deleting={deleteMut.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AssetGrid({
  items,
  canDelete,
  onDelete,
  deleting,
}: {
  items: AssetItem[];
  canDelete: boolean;
  onDelete: (key: string) => void;
  deleting: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((a) => (
        <div
          key={a.key}
          className="group relative overflow-hidden rounded-md border"
        >
          {a.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.url}
              alt={a.key}
              loading="lazy"
              className="aspect-square w-full object-cover bg-muted"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-muted">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div className="border-t bg-background p-2 text-xs">
            <p className="truncate font-mono" title={a.key}>
              {a.key.split("/").pop()}
            </p>
            <p className="mt-0.5 flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                {a.type === "image" ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <Music className="h-3 w-3" />
                )}
                {(a.size / 1024).toFixed(0)} KB
              </span>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(a.key)}
                  disabled={deleting}
                  className="text-destructive hover:underline disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
