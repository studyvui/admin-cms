"use client";

// Dialog Thêm/Sửa câu hỏi — tách từ page.tsx (Q4a). Chuyển NGUYÊN VẸN, không đổi hành vi.
// Logic transform form↔payload nằm ở lib/questions/question-form.ts (toPayload do page gọi
// trong onSubmit; toFormValues/defaultFormValues dùng ở đây để dựng defaults).

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionsApi } from "@/lib/api/questions";
import {
  nextQuestionCode,
  parseMarkedWord,
} from "@/lib/questions/question-utils";
import {
  questionFormSchema,
  toFormValues,
  defaultFormValues,
  type QuestionFormValues,
} from "@/lib/questions/question-form";
import {
  MODE_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  SKILL_LABELS,
} from "@/lib/questions/labels";
import type { Question } from "@/lib/types";
import { AssetField } from "@/components/form-fields/asset-field";
import { AssetRefsField } from "@/components/form-fields/asset-refs-field";
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

export function QuestionDialog({
  open,
  onOpenChange,
  editing,
  courses,
  lessons,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Question | null;
  courses: { id: string; code: string; name: string }[];
  lessons: { id: string; courseId: string; code: string; name: string; skills: string[] }[];
  onSubmit: (values: QuestionFormValues) => void;
  submitting: boolean;
  error: string | null;
}) {
  const initialCourseId = useMemo(() => {
    if (editing) {
      return lessons.find((l) => l.id === editing.lessonId)?.courseId ?? "";
    }
    return courses[0]?.id ?? "";
  }, [editing, lessons, courses]);

  const [dialogCourseId, setDialogCourseId] = useState(initialCourseId);

  // Sync khi dialog mo lai (editing thay doi)
  useEffect(() => {
    setDialogCourseId(initialCourseId);
  }, [initialCourseId, open]);

  const lessonsInCourse = useMemo(
    () => lessons.filter((l) => !dialogCourseId || l.courseId === dialogCourseId),
    [lessons, dialogCourseId],
  );

  const defaults = useMemo<QuestionFormValues>(
    () =>
      editing
        ? toFormValues(editing)
        : defaultFormValues(lessonsInCourse[0]?.id ?? ""),
    [editing, lessonsInCourse],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    values: defaults,
  });

  const mode = watch("mode");
  const watchedLessonId = watch("lessonId");

  const { data: lessonQuestions } = useQuery({
    queryKey: ["questions", "by-lesson", watchedLessonId],
    queryFn: () => questionsApi.list({ lessonId: watchedLessonId }),
    enabled: !!watchedLessonId && !editing,
  });

  const lessonSkills = useMemo(
    () => lessons.find((l) => l.id === watchedLessonId)?.skills ?? [],
    [watchedLessonId, lessons],
  );

  // Bài học Tiếng Anh (code chứa "_ENG") → bộ "Chế độ nhập" riêng.
  const isEngLesson = useMemo(
    () =>
      /_ENG/i.test(lessons.find((l) => l.id === watchedLessonId)?.code ?? ""),
    [watchedLessonId, lessons],
  );

  // Danh sách mode hiển thị trong dropdown "Chế độ nhập".
  const availableModes = useMemo(() => {
    const base = isEngLesson
      ? ["mc", "letter", "audio_choice", "image_choice"]
      : ["mc", "letter", "json"];
    // Khi sửa câu cũ có mode ngoài danh sách (vd json của bài ENG) → giữ để select hiển thị đúng.
    return editing && !base.includes(mode) ? [...base, mode] : base;
  }, [isEngLesson, editing, mode]);

  // Khi đổi bài học làm mode hiện tại không còn hợp lệ (vd json → bài ENG) → về "mc".
  useEffect(() => {
    if (editing) return;
    if (!availableModes.includes(mode)) {
      setValue("mode", "mc", { shouldValidate: true });
    }
  }, [editing, availableModes, mode, setValue]);

  // Mode chuyên biệt ép sẵn "Loại câu hỏi" cho khớp (người dùng vẫn thấy đúng loại).
  useEffect(() => {
    if (editing) return;
    if (mode === "audio_choice") setValue("type", "audio_choice");
    else if (mode === "image_choice") setValue("type", "image_choice");
    else if (mode === "letter") setValue("type", "missing_letter");
    else if (mode === "mc") setValue("type", "multiple_choice");
  }, [mode, editing, setValue]);

  useEffect(() => {
    if (editing || !watchedLessonId) return;
    const lesson = lessons.find((l) => l.id === watchedLessonId);
    if (!lesson) return;
    const code = nextQuestionCode(
      lesson.code,
      (lessonQuestions ?? []).map((q) => q.code),
    );
    setValue("code", code, { shouldValidate: true });
    if (lesson.skills.length > 0) {
      setValue("skill", lesson.skills[0], { shouldValidate: true });
    }
  }, [editing, watchedLessonId, lessonQuestions, lessons, setValue]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
          </DialogTitle>
          <DialogDescription>
            Lesson ID và Code không thay đổi sau khi tạo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Khóa học</Label>
              <Select
                value={dialogCourseId}
                onValueChange={(v) => {
                  setDialogCourseId(v);
                  // Tự chọn bài học đầu tiên của khóa mới
                  const firstLesson = lessons.find((l) => l.courseId === v);
                  setValue("lessonId", firstLesson?.id ?? "", { shouldValidate: true });
                }}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khóa học" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bài học</Label>
              <Select
                value={watch("lessonId")}
                onValueChange={(v) =>
                  setValue("lessonId", v, { shouldValidate: true })
                }
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bài học" />
                </SelectTrigger>
                <SelectContent>
                  {lessonsInCourse.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} — {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lessonId && (
                <p className="text-xs text-destructive">
                  {errors.lessonId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code câu hỏi</Label>
              <Input
                id="code"
                readOnly
                disabled={!!editing}
                className="cursor-not-allowed bg-muted font-mono text-sm text-muted-foreground"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
              {!editing && (
                <p className="text-xs text-muted-foreground">
                  Tự động sinh từ bài học đã chọn.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Loại câu hỏi</Label>
              <Select
                value={watch("type")}
                onValueChange={(v) =>
                  setValue("type", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t] ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill">Skill</Label>
              {!editing && lessonSkills.length > 0 ? (
                <Select
                  value={watch("skill")}
                  onValueChange={(v) =>
                    setValue("skill", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonSkills.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SKILL_LABELS[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input id="skill" {...register("skill")} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Độ khó (1-5)</Label>
              <Input
                id="difficulty"
                type="number"
                min={1}
                max={5}
                {...register("difficulty", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chế độ nhập</Label>
            <Select
              value={mode}
              onValueChange={(v) =>
                setValue("mode", v as QuestionFormValues["mode"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger aria-label="Chế độ nhập">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODE_LABELS[m] ?? m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "mc" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">Đề bài</Label>
                <Textarea
                  id="prompt"
                  rows={2}
                  placeholder="Which is apple?"
                  {...register("prompt" as const)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as const).map((k) => (
                  <div key={k} className="space-y-2">
                    <Label htmlFor={`option${k}`}>Lựa chọn {k}</Label>
                    <Input
                      id={`option${k}`}
                      {...register(`option${k}` as const)}
                    />
                    <AssetField
                      kind="image"
                      value={(watch(`option${k}Img` as const) as string) ?? ""}
                      onChange={(v) =>
                        setValue(`option${k}Img` as const, v, {
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Để tạo câu <b>&quot;chọn hình đúng từ âm thanh&quot;</b>: chọn
                đủ <b>4 ảnh</b> cho A→D (ảnh sẽ là đáp án), điền chữ vào ô lựa
                chọn làm nhãn, chọn audio đề bài ở mục{" "}
                <b>&quot;Asset đính kèm&quot;</b> phía dưới, và đặt Loại câu hỏi
                là <b>Chọn hình</b>.
              </p>
              <div className="space-y-2">
                <Label>Đáp án đúng</Label>
                <Select
                  value={watch("correctOption" as const)}
                  onValueChange={(v) =>
                    setValue(
                      "correctOption" as const,
                      v as "A" | "B" | "C" | "D",
                      { shouldValidate: true },
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : mode === "image_choice" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">
                  Đề bài <span className="text-muted-foreground">(tuỳ chọn)</span>
                </Label>
                <Textarea
                  id="prompt"
                  rows={2}
                  placeholder="VD: Đây là gì? (có thể bỏ trống)"
                  {...register("prompt" as const)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Hình ảnh đề bài <span className="text-destructive">*</span>
                </Label>
                <AssetField
                  kind="image"
                  value={(watch("promptImage" as const) as string) ?? ""}
                  onChange={(v) =>
                    setValue("promptImage" as const, v, {
                      shouldValidate: true,
                    })
                  }
                />
                {"promptImage" in errors && (
                  <p className="text-xs text-destructive">
                    {
                      (errors as Record<string, { message?: string }>)
                        .promptImage?.message
                    }
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                🖼️ <b>Ảnh rồi chọn từ</b>: học sinh nhìn ảnh đề bài rồi chọn{" "}
                <b>1 trong 4 từ</b>. Ảnh đề bài bắt buộc; mỗi lựa chọn nhập{" "}
                <b>1 từ</b> (không cần ảnh).
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as const).map((k) => (
                  <div key={k} className="space-y-2">
                    <Label htmlFor={`option${k}`}>
                      Lựa chọn {k} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`option${k}`}
                      {...register(`option${k}` as const)}
                    />
                    {`option${k}` in errors && (
                      <p className="text-xs text-destructive">
                        {
                          (errors as Record<string, { message?: string }>)[
                            `option${k}`
                          ]?.message
                        }
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Đáp án đúng (từ)</Label>
                <Select
                  value={watch("correctOption" as const)}
                  onValueChange={(v) =>
                    setValue(
                      "correctOption" as const,
                      v as "A" | "B" | "C" | "D",
                      { shouldValidate: true },
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : mode === "audio_choice" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">
                  Đề bài <span className="text-muted-foreground">(tuỳ chọn)</span>
                </Label>
                <Textarea
                  id="prompt"
                  rows={2}
                  placeholder="VD: Nghe và chọn hình đúng (có thể bỏ trống)"
                  {...register("prompt" as const)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Âm thanh đề bài <span className="text-destructive">*</span>
                </Label>
                <AssetField
                  kind="audio"
                  value={(watch("promptAudio" as const) as string) ?? ""}
                  onChange={(v) =>
                    setValue("promptAudio" as const, v, {
                      shouldValidate: true,
                    })
                  }
                />
                {"promptAudio" in errors && (
                  <p className="text-xs text-destructive">
                    {
                      (errors as Record<string, { message?: string }>)
                        .promptAudio?.message
                    }
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                🔊 <b>Nghe rồi chọn ảnh</b>: học sinh nghe âm thanh đề bài rồi
                chọn <b>1 trong 4 ảnh</b>. Mỗi lựa chọn chỉ cần <b>ảnh</b> (bắt
                buộc), không cần nhập chữ.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as const).map((k) => (
                  <div key={k} className="space-y-2">
                    <Label>
                      Lựa chọn {k}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <AssetField
                      kind="image"
                      value={(watch(`option${k}Img` as const) as string) ?? ""}
                      onChange={(v) =>
                        setValue(`option${k}Img` as const, v, {
                          shouldValidate: true,
                        })
                      }
                    />
                    {`option${k}Img` in errors && (
                      <p className="text-xs text-destructive">
                        {
                          (errors as Record<string, { message?: string }>)[
                            `option${k}Img`
                          ]?.message
                        }
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Đáp án đúng (ảnh)</Label>
                <Select
                  value={watch("correctOption" as const)}
                  onValueChange={(v) =>
                    setValue(
                      "correctOption" as const,
                      v as "A" | "B" | "C" | "D",
                      { shouldValidate: true },
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Ảnh A</SelectItem>
                    <SelectItem value="B">Ảnh B</SelectItem>
                    <SelectItem value="C">Ảnh C</SelectItem>
                    <SelectItem value="D">Ảnh D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : mode === "letter" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">Đề bài (tuỳ chọn)</Label>
                <Input
                  id="prompt"
                  placeholder="Điền chữ còn thiếu"
                  {...register("prompt" as const)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markedWord">Từ có đánh dấu chỗ ẩn</Label>
                <Input
                  id="markedWord"
                  placeholder="h[el]lo"
                  className="font-mono"
                  {...register("markedWord" as const)}
                />
                <p className="text-xs text-muted-foreground">
                  Gõ từ, bao các chữ bị ẩn trong <b>[ ]</b>. Vd{" "}
                  <code>h[el]lo</code> → hiện <b>h _ _ l o</b>, đáp án <b>el</b>.
                  Chữ gây nhiễu hệ thống tự sinh. Audio (nếu có) chọn ở{" "}
                  <b>&quot;Asset đính kèm&quot;</b>.
                </p>
                {"markedWord" in errors && (
                  <p className="text-xs text-destructive">
                    {
                      (errors as Record<string, { message?: string }>)
                        .markedWord?.message
                    }
                  </p>
                )}
                <LetterFillPreview
                  marked={(watch("markedWord" as const) as string) ?? ""}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="contentJson">Content JSON</Label>
                <Textarea
                  id="contentJson"
                  rows={8}
                  className="font-mono text-xs"
                  placeholder='{ "prompt": "...", "options": [...] }'
                  {...register("contentJson" as const)}
                />
                {"contentJson" in errors && (
                  <p className="text-xs text-destructive">
                    {(errors as Record<string, { message?: string }>)
                      .contentJson?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Đáp án đúng (string)</Label>
                <Input
                  id="correctAnswer"
                  {...register("correctAnswer" as const)}
                />
              </div>
            </>
          )}

          <AssetRefsField
            value={watch("assetRefsCsv") ?? ""}
            onChange={(v) =>
              setValue("assetRefsCsv", v, { shouldValidate: true })
            }
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

// Xem trước câu "Điền chữ còn thiếu" ngay trong form.
function LetterFillPreview({ marked }: { marked: string }) {
  const parsed = parseMarkedWord(marked);
  if (!parsed) return null;
  const sp = (s: string) => s.split("").join(" ");
  const slots = parsed.hidden
    .split("")
    .map(() => "_")
    .join(" ");
  const display = [sp(parsed.prefix), slots, sp(parsed.suffix)]
    .filter(Boolean)
    .join("   ");
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-sm">
      <span className="text-muted-foreground">Xem trước: </span>
      <span className="font-mono font-semibold tracking-wide">{display}</span>
      <span className="text-muted-foreground"> · đáp án: </span>
      <span className="font-mono font-semibold">
        {parsed.hidden.toLowerCase()}
      </span>
    </div>
  );
}
