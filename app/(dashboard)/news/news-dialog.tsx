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
