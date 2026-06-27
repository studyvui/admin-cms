"use client";

// Dialog Thêm/Sửa bài học — tách từ lessons/page.tsx (Phase 1 / L3). Giữ NGUYÊN VẸN hành vi.
// Pattern asset của lessons (useFieldArray vocabulary + pickerState + VocabAssetField) KHÁC
// questions — giữ riêng, KHÔNG gộp vào components/form-fields.

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, ImageIcon, Music } from "lucide-react";
import { assetsApi } from "@/lib/api/assets";
import {
  lessonSchema,
  buildCode,
  toFormValues,
  defaultFormValues,
  type LessonFormValues,
} from "@/lib/lessons/lesson-form";
import { LESSON_TYPE_OPTIONS } from "@/lib/lessons/labels";
import { SkillPicker } from "./skill-picker";
import type { Course, Lesson } from "@/lib/types";
import { ImagePicker } from "@/components/asset-picker/image-picker";
import { AudioPicker } from "@/components/asset-picker/audio-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Stable empty array — passed to asset pickers so their internal
// useEffect([open, initialSelected]) doesn't loop on the default `[]` (React #185)
const EMPTY_KEYS: string[] = [];

export function LessonDialog({
  open,
  onOpenChange,
  editing,
  courses,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Lesson | null;
  courses: Course[];
  onSubmit: (values: LessonFormValues) => void;
  submitting: boolean;
  error: string | null;
}) {
  const defaults = useMemo<LessonFormValues>(
    () =>
      editing ? toFormValues(editing) : defaultFormValues(courses[0]?.id ?? ""),
    [editing, courses],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    values: defaults,
  });

  const watchedCourseId = watch("courseId");
  const watchedWeek = watch("week");
  const watchedOrderIndex = watch("orderIndex");

  const selectedCourse = courses.find((c) => c.id === watchedCourseId);
  const isEnglishCourse = selectedCourse?.subject === "english";

  const { fields: vocabFields, append: appendVocab, remove: removeVocab } = useFieldArray({
    control,
    name: "vocabulary",
  });

  const vocabValues = watch("vocabulary");

  // Picker state: which row and which field type is being picked
  const [pickerState, setPickerState] = useState<{
    type: "image" | "audio";
    index: number;
  } | null>(null);

  const { data: imageAssets } = useQuery({
    queryKey: ["assets", "image", undefined] as [string, string, undefined],
    queryFn: () => assetsApi.list({ type: "image" }),
    staleTime: 60_000,
    enabled: pickerState?.type === "image",
  });
  const { data: audioAssets } = useQuery({
    queryKey: ["assets", "audio", undefined] as [string, string, undefined],
    queryFn: () => assetsApi.list({ type: "audio" }),
    staleTime: 60_000,
    enabled: pickerState?.type === "audio",
  });

  const handlePickerConfirm = (keys: string[]) => {
    if (!pickerState || keys.length === 0) {
      setPickerState(null);
      return;
    }
    const { type, index } = pickerState;
    const assets = type === "image" ? imageAssets : audioAssets;
    const key = keys[0];
    const url =
      assets?.find((a) => a.key === key)?.url ??
      `https://cdn.studyvui.vn/${key}`;
    if (type === "image") {
      setValue(`vocabulary.${index}.imageUrl`, url);
    } else {
      setValue(`vocabulary.${index}.audioUrl`, url);
    }
    setPickerState(null);
  };

  // Auto-generate code khi tạo mới (không cho phép sửa khi editing)
  useEffect(() => {
    if (!editing) {
      const code = buildCode(courses, watchedCourseId, watchedWeek, watchedOrderIndex);
      setValue("code", code, { shouldValidate: true });
    }
  }, [editing, watchedCourseId, watchedWeek, watchedOrderIndex, courses, setValue]);

  // Khi chuyển sang khoá học Tiếng Anh → tự động chọn loại & kỹ năng phù hợp
  useEffect(() => {
    if (!editing && isEnglishCourse) {
      setValue("lessonType", "vocabulary", { shouldValidate: false });
      setValue("skillsCsv", "vocab, listening", { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnglishCourse]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Sửa bài học" : "Thêm bài học mới"}
          </DialogTitle>
          <DialogDescription>
            Code tự động sinh từ Khoá học + Tuần. Không thay đổi sau khi tạo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 1. Khoá học */}
          <div className="space-y-2">
            <Label>Khoá học</Label>
            <Select
              value={watch("courseId")}
              onValueChange={(v) =>
                setValue("courseId", v, { shouldValidate: true })
              }
              disabled={!!editing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn khoá học" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-xs text-destructive">
                {errors.courseId.message}
              </p>
            )}
          </div>

          {/* 2. Tuần + Thứ tự trong tuần */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="week">Tuần</Label>
              <Input
                id="week"
                type="number"
                min={1}
                max={40}
                {...register("week", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderIndex">Thứ tự trong tuần</Label>
              <Input
                id="orderIndex"
                type="number"
                min={1}
                {...register("orderIndex", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 3. Code — tự sinh, chỉ đọc */}
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              readOnly
              disabled={!!editing}
              className="cursor-not-allowed bg-muted font-mono text-sm text-muted-foreground"
              {...register("code")}
            />
            {!editing && (
              <p className="text-xs text-muted-foreground">
                Tự động sinh từ Khoá học và Tuần. Không thể chỉnh sửa.
              </p>
            )}
            {errors.code && (
              <p className="text-xs text-destructive">
                {errors.code.message}
              </p>
            )}
          </div>

          {/* 4. Tên bài học */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên bài học</Label>
            <Input
              id="name"
              placeholder="Greetings & Introductions"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* 5. Lesson Type */}
          <div className="space-y-2">
            <Label htmlFor="lessonType">Loại bài học</Label>
            <Controller
              name="lessonType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="lessonType">
                    <SelectValue placeholder="Chọn loại bài học..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LESSON_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.lessonType && (
              <p className="text-xs text-destructive">
                {errors.lessonType.message}
              </p>
            )}
          </div>

          {/* 6. Skills */}
          <div className="space-y-2">
            <Label>Kỹ năng</Label>
            <Controller
              name="skillsCsv"
              control={control}
              render={({ field }) => (
                <SkillPicker value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.skillsCsv && (
              <p className="text-xs text-destructive">
                {errors.skillsCsv.message}
              </p>
            )}
          </div>

          {/* 7. Từ vựng — chỉ hiển thị cho khoá học Tiếng Anh */}
          {isEnglishCourse && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Từ vựng bài học</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendVocab({ word: "", meaning: "", imageUrl: "", audioUrl: "" })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Thêm từ
                </Button>
              </div>

              {vocabFields.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Chưa có từ vựng. Nhấn &ldquo;Thêm từ&rdquo; để bắt đầu.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_1fr_2fr_2fr_2rem] gap-1.5 px-0.5">
                    <span className="text-xs text-muted-foreground">Từ vựng</span>
                    <span className="text-xs text-muted-foreground">Nghĩa (Tiếng Việt)</span>
                    <span className="text-xs text-muted-foreground">Hình ảnh</span>
                    <span className="text-xs text-muted-foreground">Âm thanh</span>
                    <span />
                  </div>
                  <div className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
                    {vocabFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-[1fr_1fr_2fr_2fr_2rem] gap-1.5 items-center"
                      >
                        <Input
                          placeholder="apple"
                          {...register(`vocabulary.${index}.word`)}
                          className="h-8 text-sm"
                        />
                        <Input
                          placeholder="quả táo"
                          {...register(`vocabulary.${index}.meaning`)}
                          className="h-8 text-sm"
                        />
                        <VocabAssetField
                          value={vocabValues[index]?.imageUrl ?? ""}
                          type="image"
                          onClear={() =>
                            setValue(`vocabulary.${index}.imageUrl`, "")
                          }
                          onBrowse={() =>
                            setPickerState({ type: "image", index })
                          }
                        />
                        <VocabAssetField
                          value={vocabValues[index]?.audioUrl ?? ""}
                          type="audio"
                          onClear={() =>
                            setValue(`vocabulary.${index}.audioUrl`, "")
                          }
                          onBrowse={() =>
                            setPickerState({ type: "audio", index })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeVocab(index)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Asset pickers — inside form so Radix UI handles focus correctly */}
          <ImagePicker
            open={pickerState?.type === "image"}
            onOpenChange={(o) => { if (!o) setPickerState(null); }}
            initialSelected={EMPTY_KEYS}
            multiple={false}
            onConfirm={handlePickerConfirm}
          />
          <AudioPicker
            open={pickerState?.type === "audio"}
            onOpenChange={(o) => { if (!o) setPickerState(null); }}
            initialSelected={EMPTY_KEYS}
            multiple={false}
            onConfirm={handlePickerConfirm}
          />

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
  );
}

function VocabAssetField({
  value,
  type,
  onClear,
  onBrowse,
}: {
  value: string;
  type: "image" | "audio";
  onClear: () => void;
  onBrowse: () => void;
}) {
  const filename = value ? (value.split("/").pop() ?? value) : "";
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-md border bg-background text-sm">
      {value ? (
        <>
          {type === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="h-8 w-8 shrink-0 border-r object-cover"
            />
          )}
          <span className="min-w-0 flex-1 truncate px-1.5 text-xs">
            {filename}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 px-1 text-muted-foreground hover:text-destructive"
            title="Xoá"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <span className="flex-1 px-2 text-xs text-muted-foreground">
          {type === "image" ? "Chưa có ảnh" : "Chưa có audio"}
        </span>
      )}
      <button
        type="button"
        onClick={onBrowse}
        className="shrink-0 border-l px-1.5 text-muted-foreground hover:text-foreground"
        title={type === "image" ? "Chọn ảnh từ kho" : "Chọn audio từ kho"}
      >
        {type === "image" ? (
          <ImageIcon className="h-3.5 w-3.5" />
        ) : (
          <Music className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
