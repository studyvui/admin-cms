# Giai đoạn 4 — Trang Bảng tin (admin-cms) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm trang `/news` (CRUD bản tin) vào admin-cms, gọi module backend `admin/news` vừa xây (xem `backend/docs/superpowers/plans/2026-09-05-cms-stage4-news-backend.md`).

**Architecture:** Theo đúng khuôn `app/(dashboard)/questions/` (page.tsx orchestration + use-news.ts data hook + news-dialog.tsx form) đã ghi trong `AGENTS.md` mục "Cấu trúc chuẩn MỌI trang phức tạp". Ảnh đại diện dùng lại `ImagePicker` có sẵn (prefix `news_images`), lưu FULL URL tuyệt đối (giống `vocabulary.imageUrl` ở `lesson-dialog.tsx`, KHÔNG lưu raw key như `assetRefs`).

**Tech Stack:** Next.js 14, react-hook-form + zod, TanStack Query v5, axios (`lib/api-client.ts`).

**Spec:** `C:\Users\FPT\.claude\plans\h-y-l-n-k-ho-ch-lively-lollipop.md` — mục "GIAI ĐOẠN 4 — Bản tin". Backend đã xong (xem plan backend nêu trên) — 7 endpoint dùng ở đây: `GET/POST /admin/news`, `GET/PATCH/DELETE /admin/news/:id`, `PATCH /admin/news/:id/status`.

## Global Constraints

- Route `/news` gate quyền `hasRole("admin", "editor")` — khớp `@Roles(admin, editor)` backend.
- Xoá bài (`DELETE`) chỉ hiện nút cho `hasRole("admin")` — khớp `@Roles(admin)` method-level backend.
- Bài mới LUÔN tạo ở trạng thái `draft` — KHÔNG có field chọn trạng thái trong dialog Thêm/Sửa; xuất bản/gỡ bài là 1 action riêng trên bảng danh sách (nút toggle).
- Ảnh lưu FULL URL tuyệt đối (`https://cdn.studyvui.vn/...`), không lưu key trần — để cả admin-cms lẫn frontend học sinh dùng thẳng `<img src>` không cần biết CDN base.
- Mỗi `lib/news/*-form.ts` có vitest assert đúng bộ key của `toCreatePayload`/`toUpdatePayload` (tránh 400 do `forbidNonWhitelisted` khi payload thừa key — bài học từ risk table trong spec).
- Select filter dùng sentinel `__all__` (Radix từ chối `value=""`) — đúng pattern `AGENTS.md`.
- Cổng test đầy đủ trước khi coi task xong: `npm test`, `npx tsc --noEmit`.

---

### Task 1: Types + API layer

**Files:**
- Modify: `admin-cms/lib/types.ts` (thêm cuối file)
- Create: `admin-cms/lib/api/news.ts`

**Interfaces:**
- Produces: `NewsType`, `NewsStatus`, `NewsSource`, `NewsPost`, `CreateNewsInput`, `UpdateNewsInput`, `newsApi.{list,get,create,update,changeStatus,delete}` — dùng bởi mọi task sau.

- [ ] **Bước 1: Thêm type vào `lib/types.ts`**

Thêm vào cuối file, sau `ActiveLearnerDetailItem`:

```typescript
// Bảng tin (GĐ4) — admin xem/sửa qua /admin/news/*. Ảnh lưu FULL URL tuyệt đối
// (giống VocabItem.imageUrl), không lưu key trần (khác Question.assetRefs).
export type NewsType = "tip" | "update" | "event";
export type NewsStatus = "draft" | "published";
export type NewsSource = "manual" | "ai";

export interface NewsPost {
  id: string;
  slug: string;
  type: NewsType;
  title: string;
  hook?: string | null;
  content: string;
  image?: string | null;
  status: NewsStatus;
  source: NewsSource;
  authorId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsInput {
  type: NewsType;
  title: string;
  hook?: string;
  content: string;
  image?: string;
}

export interface UpdateNewsInput {
  type?: NewsType;
  title?: string;
  hook?: string;
  content?: string;
  image?: string;
}
```

- [ ] **Bước 2: Viết `lib/api/news.ts`**

```typescript
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  CreateNewsInput,
  NewsPost,
  NewsStatus,
  NewsType,
  UpdateNewsInput,
} from "@/lib/types";

interface ListNewsParams {
  status?: NewsStatus;
  type?: NewsType;
  q?: string;
}

export const newsApi = {
  list: (params: ListNewsParams = {}) =>
    apiGet<NewsPost[]>("/admin/news", { params }),
  get: (id: string) => apiGet<NewsPost>(`/admin/news/${id}`),
  create: (input: CreateNewsInput) =>
    apiPost<NewsPost>("/admin/news", input),
  update: (id: string, input: UpdateNewsInput) =>
    apiPatch<NewsPost>(`/admin/news/${id}`, input),
  changeStatus: (id: string, status: NewsStatus) =>
    apiPatch<NewsPost>(`/admin/news/${id}/status`, { status }),
  delete: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`/admin/news/${id}`),
};
```

- [ ] **Bước 3: Build kiểm tra type**

```bash
cd "E:\AGRIBANK LAPTOP\admin-cms"
npx tsc --noEmit
```

Expected: sạch.

- [ ] **Bước 4: Commit**

```bash
git add lib/types.ts lib/api/news.ts
git commit -m "feat(news): types + api layer cho module News"
```

---

### Task 2: Form schema + labels (thuần, có test)

**Files:**
- Create: `admin-cms/lib/news/news-form.ts`
- Create: `admin-cms/lib/news/labels.ts`
- Create: `admin-cms/lib/news/__tests__/news-form.test.ts`

**Interfaces:**
- Consumes: `CreateNewsInput`, `UpdateNewsInput`, `NewsType`, `NewsStatus` (Task 1).
- Produces: `newsFormSchema`, `NewsFormValues`, `toCreatePayload`, `toUpdatePayload`, `NEWS_TYPE_LABELS`, `NEWS_STATUS_LABELS` — dùng bởi Task 3, Task 4, Task 5.

- [ ] **Bước 1: Viết test `__tests__/news-form.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { toCreatePayload, toUpdatePayload } from "../news-form";

describe("news-form toCreatePayload", () => {
  it("chỉ gồm field bắt buộc khi hook/image trống", () => {
    const payload = toCreatePayload({
      type: "update",
      title: "Tiêu đề",
      hook: "",
      content: "Nội dung dài hơn 10 ký tự",
      image: "",
    });
    expect(Object.keys(payload).sort()).toEqual(["content", "title", "type"]);
  });

  it("gồm đủ hook + image khi có giá trị", () => {
    const payload = toCreatePayload({
      type: "tip",
      title: "Tiêu đề",
      hook: "Hook ngắn",
      content: "Nội dung dài hơn 10 ký tự",
      image: "https://cdn.studyvui.vn/news_images/a.jpg",
    });
    expect(Object.keys(payload).sort()).toEqual([
      "content",
      "hook",
      "image",
      "title",
      "type",
    ]);
  });
});

describe("news-form toUpdatePayload", () => {
  it("luôn gồm đủ 5 field (cho phép xoá hook/image bằng chuỗi rỗng)", () => {
    const payload = toUpdatePayload({
      type: "event",
      title: "Tiêu đề",
      hook: "",
      content: "Nội dung dài hơn 10 ký tự",
      image: "",
    });
    expect(Object.keys(payload).sort()).toEqual([
      "content",
      "hook",
      "image",
      "title",
      "type",
    ]);
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận FAIL**

```bash
npx vitest run lib/news/__tests__/news-form.test.ts
```

Expected: FAIL — không tìm thấy module `../news-form`.

- [ ] **Bước 3: Viết `lib/news/news-form.ts`**

```typescript
import { z } from "zod";
import type { CreateNewsInput, UpdateNewsInput } from "@/lib/types";

export const newsFormSchema = z.object({
  type: z.enum(["tip", "update", "event"]),
  title: z.string().min(3, "Tối thiểu 3 ký tự"),
  hook: z.string().optional(),
  content: z.string().min(10, "Tối thiểu 10 ký tự"),
  image: z.string().optional(),
});

export type NewsFormValues = z.infer<typeof newsFormSchema>;

// Tao bai moi: bo qua field rong de payload gon (backend cung coi undefined
// = "khong co", khac chuoi rong).
export function toCreatePayload(values: NewsFormValues): CreateNewsInput {
  return {
    type: values.type,
    title: values.title,
    ...(values.hook ? { hook: values.hook } : {}),
    content: values.content,
    ...(values.image ? { image: values.image } : {}),
  };
}

// Cap nhat: LUON gui du hook/image (ke ca chuoi rong) de admin xoa duoc
// hook/anh da co truoc do — omit field se bi service hieu la "khong doi".
export function toUpdatePayload(values: NewsFormValues): UpdateNewsInput {
  return {
    type: values.type,
    title: values.title,
    hook: values.hook ?? "",
    content: values.content,
    image: values.image ?? "",
  };
}
```

- [ ] **Bước 4: Chạy test, xác nhận PASS**

```bash
npx vitest run lib/news/__tests__/news-form.test.ts
```

Expected: PASS, 3/3.

- [ ] **Bước 5: Viết `lib/news/labels.ts`**

```typescript
import type { NewsStatus, NewsType } from "@/lib/types";

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  tip: "Mẹo học",
  update: "Cập nhật",
  event: "Sự kiện",
};

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  draft: "Nháp",
  published: "Đã đăng",
};
```

- [ ] **Bước 6: Build kiểm tra type**

```bash
npx tsc --noEmit
```

Expected: sạch.

- [ ] **Bước 7: Commit**

```bash
git add lib/news/news-form.ts lib/news/labels.ts lib/news/__tests__/news-form.test.ts
git commit -m "feat(news): form schema + labels (thuan, co test)"
```

---

### Task 3: Data hook `use-news.ts`

**Files:**
- Create: `admin-cms/app/(dashboard)/news/use-news.ts`

**Interfaces:**
- Consumes: `newsApi` (Task 1), `NewsStatus`, `NewsType`, `UpdateNewsInput` (Task 1).
- Produces: `useNews(filters): { news, isLoading, error, createMut, updateMut, statusMut, deleteMut }` — dùng bởi Task 5 (`page.tsx`).

- [ ] **Bước 1: Viết `use-news.ts`**

```typescript
"use client";

// Data layer cho trang Bảng tin — tách từ page.tsx, per-entity (KHÔNG generic),
// theo đúng khuôn use-questions.ts.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { newsApi } from "@/lib/api/news";
import type { NewsStatus, NewsType, UpdateNewsInput } from "@/lib/types";

export interface NewsFilters {
  status?: NewsStatus;
  type?: NewsType;
  q?: string;
}

export function useNews(filters: NewsFilters) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["news"] });

  const newsQuery = useQuery({
    queryKey: ["news", filters],
    queryFn: () => newsApi.list(filters),
  });

  const createMut = useMutation({
    mutationFn: newsApi.create,
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNewsInput }) =>
      newsApi.update(id, input),
    onSuccess: invalidate,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: NewsStatus }) =>
      newsApi.changeStatus(id, status),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: invalidate,
  });

  return {
    news: newsQuery.data,
    isLoading: newsQuery.isLoading,
    error: newsQuery.error,
    createMut,
    updateMut,
    statusMut,
    deleteMut,
  };
}
```

- [ ] **Bước 2: Build kiểm tra type**

```bash
npx tsc --noEmit
```

Expected: sạch (chưa có consumer nên chỉ tự kiểm tra file).

- [ ] **Bước 3: Commit**

```bash
git add "app/(dashboard)/news/use-news.ts"
git commit -m "feat(news): data hook use-news.ts"
```

---

### Task 4: Form dialog `news-dialog.tsx`

**Files:**
- Create: `admin-cms/app/(dashboard)/news/news-dialog.tsx`

**Interfaces:**
- Consumes: `newsFormSchema`, `NewsFormValues` (Task 2), `NEWS_TYPE_LABELS` (Task 2), `NewsPost`, `NewsType` (Task 1), `ImagePicker` (`components/asset-picker/image-picker.tsx`, đã có), `assetsApi` (`lib/api/assets.ts`, đã có).
- Produces: component `NewsDialog({ open, onOpenChange, editing, onSubmit, submitting, error })` — dùng bởi Task 5.

- [ ] **Bước 1: Viết `news-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, X } from "lucide-react";
import { assetsApi } from "@/lib/api/assets";
import { ImagePicker } from "@/components/asset-picker/image-picker";
import { newsFormSchema, type NewsFormValues } from "@/lib/news/news-form";
import { NEWS_TYPE_LABELS } from "@/lib/news/labels";
import type { NewsPost, NewsType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: NewsPost | null;
  onSubmit: (values: NewsFormValues) => void;
  submitting: boolean;
  error: string | null;
}

export function NewsDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  submitting,
  error,
}: NewsDialogProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    values: editing
      ? {
          type: editing.type,
          title: editing.title,
          hook: editing.hook ?? "",
          content: editing.content,
          image: editing.image ?? "",
        }
      : {
          type: "update" as NewsType,
          title: "",
          hook: "",
          content: "",
          image: "",
        },
  });

  const watchedImage = watch("image");
  const watchedContent = watch("content");

  const { data: imageAssets } = useQuery({
    queryKey: ["assets", "image", "news_images"],
    queryFn: () => assetsApi.list({ type: "image", prefix: "news_images" }),
    staleTime: 60_000,
    enabled: pickerOpen,
  });

  const handlePickerConfirm = (keys: string[]) => {
    if (keys.length === 0) return;
    const key = keys[0];
    const url =
      imageAssets?.find((a) => a.key === key)?.url ??
      `https://cdn.studyvui.vn/${key}`;
    setValue("image", url, { shouldValidate: true });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          onOpenChange(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sửa bài viết" : "Thêm bài viết mới"}
            </DialogTitle>
            <DialogDescription>
              Bài mới luôn ở trạng thái Nháp. Dùng nút &quot;Xuất bản&quot; ở
              danh sách để đăng.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Loại bài</Label>
              <Select
                value={watch("type")}
                onValueChange={(v) =>
                  setValue("type", v as NewsType, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(NEWS_TYPE_LABELS) as NewsType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {NEWS_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input id="title" {...register("title")} />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hook">Mở bài (hook, tuỳ chọn)</Label>
              <Textarea id="hook" rows={2} {...register("hook")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Nội dung (HTML: p, b, i, ul/li, a — sẽ được kiểm duyệt phía
                máy chủ)
              </Label>
              <Textarea
                id="content"
                rows={8}
                className="font-mono text-xs"
                {...register("content")}
              />
              {errors.content && (
                <p className="text-xs text-destructive">
                  {errors.content.message}
                </p>
              )}
              {watchedContent && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm [&_a]:text-primary [&_a]:underline [&_li]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Xem trước:
                  </p>
                  <div dangerouslySetInnerHTML={{ __html: watchedContent }} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Ảnh đại diện</Label>
              {watchedImage ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={watchedImage}
                    alt=""
                    className="h-16 w-28 rounded-md border object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    Đổi ảnh
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Xoá ảnh"
                    onClick={() =>
                      setValue("image", "", { shouldValidate: true })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Chọn ảnh
                </Button>
              )}
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        prefix="news_images"
        onConfirm={handlePickerConfirm}
      />
    </>
  );
}
```

- [ ] **Bước 2: Build kiểm tra type**

```bash
npx tsc --noEmit
```

Expected: sạch.

- [ ] **Bước 3: Commit**

```bash
git add "app/(dashboard)/news/news-dialog.tsx"
git commit -m "feat(news): form dialog Them/Sua bai viet"
```

---

### Task 5: Trang `page.tsx` + đăng ký sidebar

**Files:**
- Create: `admin-cms/app/(dashboard)/news/page.tsx`
- Modify: `admin-cms/components/shared/sidebar-nav.tsx`
- Modify: `admin-cms/AGENTS.md`

**Interfaces:**
- Consumes: `useNews` (Task 3), `NewsDialog` (Task 4), `toCreatePayload`/`toUpdatePayload`/`NewsFormValues` (Task 2), `NEWS_TYPE_LABELS`/`NEWS_STATUS_LABELS` (Task 2), `NewsPost`/`NewsStatus`/`NewsType` (Task 1).
- Produces: route `/news` — không task nào khác phụ thuộc.

- [ ] **Bước 1: Viết `page.tsx`**

```tsx
"use client";

import { useState } from "react";
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
  const [filters, setFilters] = useState<{
    status?: NewsStatus;
    type?: NewsType;
    q?: string;
  }>({});
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
                value={filters.q ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, q: e.target.value || undefined }))
                }
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
```

- [ ] **Bước 2: Thêm mục "Bảng tin" vào `sidebar-nav.tsx`**

Thêm import `Newspaper` vào khối import lucide-react (dòng 5-20):

```typescript
  Newspaper,
```

Thêm section mới vào `NAV_SECTIONS` (sau section `"Kiểm duyệt"`, trước `"Phân tích"`):

```typescript
  {
    title: "Bảng tin",
    items: [
      { href: "/news", label: "Bảng tin", icon: Newspaper, roles: ["admin", "editor"] },
    ],
  },
```

- [ ] **Bước 3: Sửa `AGENTS.md` — 2 chỗ lỗi thời**

Sửa dòng 17 (`| Charts | recharts (dashboard / my-stats) |`) thành:

```markdown
| Charts | recharts (dashboard / my-stats / analytics — GĐ3) |
```

Xoá đoạn ghi chú lỗi thời về `/settings` 404 (dòng 70-72, đã có `page.tsx` thật từ GĐ1):

```markdown
> **Lưu ý route:** sidebar (`components/shared/sidebar-nav.tsx`) có mục `/settings` (admin)
> nhưng CHƯA có `app/(dashboard)/settings/page.tsx` → click sẽ rơi vào `app/not-found.tsx` (404).
> Cần thêm page hoặc bỏ khỏi NAV. (`app/not-found.tsx` và `app/providers.tsx` đều đã tồn tại.)
```

Thay bằng dòng trống (xoá hẳn 3 dòng đó, không thay thế bằng nội dung khác).

Thêm `news/page.tsx` vào danh sách cấu trúc (dòng 46, sau `ai-generate-math/page.tsx`):

```markdown
│   └── news/page.tsx           # CRUD bảng tin — GĐ4
```

- [ ] **Bước 4: Build + test toàn cục**

```bash
npx tsc --noEmit
npm test
```

Expected: cả 2 sạch, toàn bộ vitest suite hiện có vẫn PASS.

- [ ] **Bước 5: Commit**

```bash
git add "app/(dashboard)/news/page.tsx" components/shared/sidebar-nav.tsx AGENTS.md
git commit -m "feat(news): trang /news + dang ky sidebar + cap nhat AGENTS.md"
```

---

### Task 6: E2E

**Files:**
- Create: `admin-cms/e2e/news.spec.ts`
- Modify: `admin-cms/e2e/fixtures/data.ts` (thêm cuối file)

**Interfaces:**
- Consumes: `ApiMock`, `loginAs` (`e2e/helpers/*`, đã có).

- [ ] **Bước 1: Thêm fixture vào `e2e/fixtures/data.ts`**

Thêm vào cuối file:

```typescript
export const NEWS_DRAFT = {
  id: "33333333-3333-4333-8333-333333333333",
  slug: "bai-nhap-e2e",
  type: "tip",
  title: "Bài nháp E2E",
  hook: null,
  content: "<p>Nội dung nháp</p>",
  image: null,
  status: "draft",
  source: "manual",
  publishedAt: null,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

export const NEWS_PUBLISHED = {
  id: "44444444-4444-4444-8444-444444444444",
  slug: "bai-da-dang-e2e",
  type: "update",
  title: "Bài đã đăng E2E",
  hook: "<i>Hook</i>",
  content: "<p>Nội dung đã đăng</p>",
  image: "https://cdn.studyvui.vn/news_images/e2e.jpg",
  status: "published",
  source: "manual",
  publishedAt: "2026-09-02T00:00:00Z",
  createdAt: "2026-09-02T00:00:00Z",
  updatedAt: "2026-09-02T00:00:00Z",
};

export const NEWS_LIST = [NEWS_PUBLISHED, NEWS_DRAFT];
```

- [ ] **Bước 2: Viết `e2e/news.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import { NEWS_LIST, NEWS_DRAFT } from "./fixtures/data";

async function setup(page: import("@playwright/test").Page) {
  const api = new ApiMock().onGet(/^\/admin\/news$/, NEWS_LIST);
  await api.install(page);
  return api;
}

test.describe("Bảng tin (admin)", () => {
  test.beforeEach(async ({ context }) => {
    await loginAs(context, "admin");
  });

  test("danh sách bảng tin render từ dữ liệu (mock)", async ({ page }) => {
    await setup(page);
    await page.goto("/news");
    await expect(page.getByRole("heading", { name: "Bảng tin" })).toBeVisible();
    await expect(page.getByText("Bài đã đăng E2E")).toBeVisible();
    await expect(page.getByText("Bài nháp E2E")).toBeVisible();
  });

  test("mở Thêm bài viết → điền form → gửi đúng payload", async ({ page }) => {
    const api = await setup(page);
    await page.goto("/news");
    await page.getByRole("button", { name: "Thêm bài viết" }).click();
    await expect(
      page.getByRole("heading", { name: "Thêm bài viết mới" }),
    ).toBeVisible();

    const dialog = page.getByRole("dialog");
    await dialog.locator("#title").fill("Bài mới từ E2E");
    await dialog
      .locator("#content")
      .fill("<p>Nội dung bài mới đủ dài để qua validate</p>");
    await dialog.getByRole("button", { name: "Tạo mới" }).click();

    const req = api.find("POST", /^\/admin\/news$/);
    expect(req?.body).toMatchObject({
      type: "update",
      title: "Bài mới từ E2E",
      content: "<p>Nội dung bài mới đủ dài để qua validate</p>",
    });
  });

  test("bấm Xuất bản trên bài nháp → gọi đúng PATCH status", async ({ page }) => {
    const api = await setup(page);
    await page.goto("/news");
    const row = page.getByRole("row", { name: new RegExp(NEWS_DRAFT.title) });
    await row.getByTitle("Xuất bản").click();

    const req = api.find(
      "PATCH",
      new RegExp(`^/admin/news/${NEWS_DRAFT.id}/status$`),
    );
    expect(req?.body).toEqual({ status: "published" });
  });
});

test.describe("Bảng tin (editor)", () => {
  test.beforeEach(async ({ context }) => {
    await loginAs(context, "editor");
  });

  test("editor không thấy nút Xoá bài viết", async ({ page }) => {
    await setup(page);
    await page.goto("/news");
    await expect(page.getByText("Bài đã đăng E2E")).toBeVisible();
    await expect(page.getByTitle("Xoá bài viết")).toHaveCount(0);
  });
});
```

- [ ] **Bước 3: Chạy e2e (dừng `npm run dev` cục bộ trước nếu đang chạy)**

```bash
npx playwright test e2e/news.spec.ts
```

Expected: PASS, 4/4.

- [ ] **Bước 4: Commit**

```bash
git add e2e/news.spec.ts e2e/fixtures/data.ts
git commit -m "test(news): e2e cho trang /news"
```

---

## Kiểm chứng cuối (trước khi báo hoàn tất nhánh)

```bash
npm test
npx tsc --noEmit
npm run build
npx next lint
npm run test:e2e
```

Dán output thật của cả 5 lệnh — theo `superpowers:verification-before-completion`, không suy đoán.
