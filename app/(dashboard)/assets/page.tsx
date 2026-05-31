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
  Folder,
  FolderOpen,
  LayoutList,
  ChevronRight,
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

function getFolderFromKey(key: string): string {
  const lastSlash = key.lastIndexOf("/");
  if (lastSlash === -1) return "(gốc)";
  return key.slice(0, lastSlash + 1);
}

export default function AssetsPage() {
  const { hasRole, hydrated } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [search, setSearch] = useState("");
  const [prefix, setPrefix] = useState("grade1/english/");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"flat" | "folder">("flat");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
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

  // folder mode: map folder → assets (from filtered list)
  const folderMap = useMemo(() => {
    const map = new Map<string, AssetItem[]>();
    for (const item of filtered) {
      const folder = getFolderFromKey(item.key);
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(item);
    }
    const sorted = Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return new Map<string, AssetItem[]>(sorted);
  }, [filtered]);

  // assets shown inside a selected folder
  const folderItems = useMemo(
    () =>
      selectedFolder
        ? filtered.filter((a) => getFolderFromKey(a.key) === selectedFolder)
        : [],
    [filtered, selectedFolder],
  );

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
                  x.id === p.id ? { ...x, status: "done", result } : x,
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

  // counts for header
  const displayCount =
    viewMode === "flat"
      ? filtered.length
      : selectedFolder
        ? folderItems.length
        : folderMap.size;

  const totalCount = data?.length ?? 0;

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
                      {p.status === "done" && <Badge>Xong</Badge>}
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
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {viewMode === "folder" && selectedFolder ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedFolder(null)}
                    >
                      Folder
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-base">{selectedFolder}</span>
                  </span>
                ) : (
                  `Tất cả asset (${totalCount})`
                )}
              </CardTitle>
              <CardDescription>
                {viewMode === "flat"
                  ? `Hiển thị ${displayCount} / ${totalCount} mục`
                  : selectedFolder
                    ? `${displayCount} asset trong folder này`
                    : `${displayCount} folder · ${filtered.length} asset`}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              {/* View mode toggle */}
              <div className="flex overflow-hidden rounded-md border">
                <Button
                  variant={viewMode === "flat" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => {
                    setViewMode("flat");
                    setSelectedFolder(null);
                  }}
                >
                  <LayoutList className="mr-1.5 h-3.5 w-3.5" />
                  Tất cả
                </Button>
                <Button
                  variant={viewMode === "folder" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none border-0 border-l"
                  onClick={() => {
                    setViewMode("folder");
                    setSelectedFolder(null);
                  }}
                >
                  <Folder className="mr-1.5 h-3.5 w-3.5" />
                  Theo folder
                </Button>
              </div>

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
          ) : viewMode === "folder" && !selectedFolder ? (
            <FolderGrid
              folderMap={folderMap}
              onSelectFolder={setSelectedFolder}
            />
          ) : (
            <>
              {viewMode === "folder" && selectedFolder && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4 -ml-2"
                  onClick={() => setSelectedFolder(null)}
                >
                  ← Quay lại danh sách folder
                </Button>
              )}
              {(viewMode === "flat" ? filtered : folderItems).length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Không có asset nào khớp bộ lọc.
                </p>
              ) : (
                <AssetGrid
                  items={viewMode === "flat" ? filtered : folderItems}
                  canDelete={canDelete}
                  onDelete={(key) => {
                    if (confirm(`Xoá vĩnh viễn "${key}"?`)) {
                      deleteMut.mutate(key);
                    }
                  }}
                  deleting={deleteMut.isPending}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FolderGrid({
  folderMap,
  onSelectFolder,
}: {
  folderMap: Map<string, AssetItem[]>;
  onSelectFolder: (folder: string) => void;
}) {
  if (folderMap.size === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Không có folder nào khớp bộ lọc.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from(folderMap.entries()).map(([folder, items]) => {
        const imageCount = items.filter((a: AssetItem) => a.type === "image").length;
        const audioCount = items.filter((a: AssetItem) => a.type === "audio").length;
        const previewImage = items.find((a: AssetItem) => a.type === "image");

        return (
          <button
            key={folder}
            type="button"
            onClick={() => onSelectFolder(folder)}
            className="group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition hover:border-primary/60 hover:shadow-sm"
          >
            {/* Thumbnail strip */}
            <div className="relative flex h-24 items-center justify-center overflow-hidden bg-muted">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImage.url}
                  alt={folder}
                  className="h-full w-full object-cover opacity-60 transition group-hover:opacity-80"
                />
              ) : (
                <Music className="h-10 w-10 text-muted-foreground/50" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <FolderOpen className="h-10 w-10 text-primary/70 drop-shadow" />
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 p-3">
              <p
                className="truncate font-mono text-xs font-medium"
                title={folder}
              >
                {folder}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{items.length} file</span>
                {imageCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <ImageIcon className="h-3 w-3" />
                    {imageCount}
                  </span>
                )}
                {audioCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Music className="h-3 w-3" />
                    {audioCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
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
