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
  parseMarkedSentence,
} from "@/lib/questions/question-utils";
import {
  G1_SENTENCE_PAIRS,
  pairKey,
  pairFromKey,
} from "@/lib/questions/sentence-bank";
import { getMathArchetypes } from "@/lib/questions/math-archetypes-grade1";
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

  // Bài học Toán (code chứa "_MATH") → "Loại câu hỏi" chuyển thành đúng "Dạng bài"
  // của node/tuần đó (catalog bám SGK, hiện chỉ có Lớp 1 — Lớp 2-5 chờ đọc SGK nên
  // trả mảng rỗng, dropdown tự rơi về danh sách Loại câu hỏi chung như cũ).
  const watchedLessonCode = useMemo(
    () => lessons.find((l) => l.id === watchedLessonId)?.code ?? "",
    [watchedLessonId, lessons],
  );
  const mathArchetypes = useMemo(
    () => getMathArchetypes(watchedLessonCode),
    [watchedLessonCode],
  );
  // Chỉ bật cho câu MỚI (không phá luồng sửa câu cũ đã có type/skill riêng).
  const useMathArchetypes = !editing && mathArchetypes.length > 0;
  const [archetypeIdx, setArchetypeIdx] = useState<string>("");
  useEffect(() => {
    setArchetypeIdx("");
  }, [watchedLessonId]);
  const selectedArchetype =
    archetypeIdx !== "" ? mathArchetypes[Number(archetypeIdx)] : undefined;
  const archetypeIcon = (feas: string) =>
    feas === "image" ? "🖼️ " : feas === "engine" ? "🛠️ " : "🔢 ";

  // Skill cho bài Toán có Dạng bài: danh sách CỐ ĐỊNH (không đổi Input↔Select giữa
  // chừng khi chọn Dạng bài — tránh Select mất giá trị vì đổi loại component).
  // Options = mọi skill (2 từ, tiếng Việt) xuất hiện trong catalog của bài học đó.
  const mathSkillOptions = useMemo(() => {
    if (!useMathArchetypes) return [];
    return Array.from(new Set(mathArchetypes.map((a) => a.skill)));
  }, [useMathArchetypes, mathArchetypes]);

  // Danh sách mode hiển thị trong dropdown "Chế độ nhập".
  const availableModes = useMemo(() => {
    const base = isEngLesson
      ? ["mc", "letter", "audio_choice", "image_choice", "reorder", "matching", "word_blank"]
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
    else if (mode === "reorder") setValue("type", "reorder");
    else if (mode === "matching") setValue("type", "matching");
    else if (mode === "word_blank") setValue("type", "fill_blank");
    else if (mode === "mc") setValue("type", "multiple_choice");
  }, [mode, editing, setValue]);

  // Mode "matching": cặp nhiễu KHÔNG được trùng vế với cặp đúng / nhiễu khác
  // (2 thẻ giống hệt trên màn làm học sinh bối rối). Dropdown mờ lựa chọn xung đột;
  // schema cũng chặn khi lưu (superRefine).
  const watchedDistractors = watch("distractors" as const) as
    | { left: string; right: string }[]
    | undefined;
  const watchedPairLeft = (watch("pairLeft" as const) as string) ?? "";
  const watchedPairRight = (watch("pairRight" as const) as string) ?? "";
  const normSide = (s: string) =>
    (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  const pairConflicts = (
    p: { left: string; right: string },
    exceptIdx: number,
  ) => {
    if (
      normSide(p.left) === normSide(watchedPairLeft) ||
      normSide(p.right) === normSide(watchedPairRight)
    )
      return true;
    return (watchedDistractors ?? []).some(
      (d, k) =>
        k !== exceptIdx &&
        (normSide(d.left) === normSide(p.left) ||
          normSide(d.right) === normSide(p.right)),
    );
  };
  const firstFreePair = () =>
    G1_SENTENCE_PAIRS.find((p) => !pairConflicts(p, -1)) ?? G1_SENTENCE_PAIRS[0];

  // Khởi tạo 1 cặp nhiễu mặc định (không xung đột) từ ngân hàng khi chưa có.
  useEffect(() => {
    if (mode !== "matching") return;
    if (!Array.isArray(watchedDistractors) || watchedDistractors.length === 0) {
      setValue("distractors" as const, [{ ...firstFreePair() }], {
        shouldValidate: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, watchedDistractors, setValue]);

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
              <Label>
                {useMathArchetypes ? "Loại câu hỏi (Dạng bài theo SGK)" : "Loại câu hỏi"}
              </Label>
              <Select
                value={useMathArchetypes ? archetypeIdx : watch("type")}
                onValueChange={(v) => {
                  if (useMathArchetypes) {
                    setArchetypeIdx(v);
                    const a = mathArchetypes[Number(v)];
                    if (a) {
                      setValue("type", a.label, { shouldValidate: true });
                      setValue("skill", a.skill, { shouldValidate: true });
                    }
                  } else {
                    setValue("type", v, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={useMathArchetypes ? "Chọn dạng bài..." : undefined}
                  />
                </SelectTrigger>
                <SelectContent>
                  {useMathArchetypes
                    ? mathArchetypes.map((a, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {archetypeIcon(a.feas)}
                          {a.label}
                        </SelectItem>
                      ))
                    : QUESTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {QUESTION_TYPE_LABELS[t] ?? t}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
              {useMathArchetypes && selectedArchetype && (
                <p className="text-xs text-muted-foreground">
                  Skill đã tự điền: <b>{selectedArchetype.skill}</b> · gợi ý đề
                  bài/đáp án đã điền vào ô placeholder bên dưới.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill">Skill</Label>
              {useMathArchetypes ? (
                <Select
                  value={watch("skill")}
                  onValueChange={(v) =>
                    setValue("skill", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Loại câu hỏi (Dạng bài) trước" />
                  </SelectTrigger>
                  <SelectContent>
                    {mathSkillOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : !editing && lessonSkills.length > 0 ? (
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
                  placeholder={selectedArchetype?.promptHint || "Which is apple?"}
                  {...register("prompt" as const)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as const).map((k, idx) => (
                  <div key={k} className="space-y-2">
                    <Label htmlFor={`option${k}`}>Lựa chọn {k}</Label>
                    <Input
                      id={`option${k}`}
                      placeholder={selectedArchetype?.optionHints?.[idx]}
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
          ) : mode === "reorder" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">Đề bài (tuỳ chọn)</Label>
                <Input
                  id="prompt"
                  placeholder="Sắp xếp các từ thành câu đúng"
                  {...register("prompt" as const)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sentence">Câu đúng (mỗi từ cách nhau bằng dấu cách)</Label>
                <Input
                  id="sentence"
                  placeholder="It is a pen"
                  {...register("sentence" as const)}
                />
                <p className="text-xs text-muted-foreground">
                  🔤 <b>Câu (sắp xếp)</b>: học sinh kéo/bấm các từ (đã xáo trộn) để xếp lại
                  đúng câu này. Câu cần ít nhất <b>2 từ</b>.
                </p>
                {"sentence" in errors && (
                  <p className="text-xs text-destructive">
                    {(errors as Record<string, { message?: string }>).sentence?.message}
                  </p>
                )}
                <ReorderPreview
                  sentence={(watch("sentence" as const) as string) ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Audio đọc câu (tuỳ chọn)</Label>
                <AssetField
                  kind="audio"
                  value={(watch("promptAudio" as const) as string) ?? ""}
                  onChange={(v) =>
                    setValue("promptAudio" as const, v, { shouldValidate: true })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  🔊 Học sinh nghe câu đọc lên rồi xếp từ theo — chọn file
                  <code className="mx-1">g1_sent_*.mp3</code> từ Kho asset.
                </p>
              </div>
            </>
          ) : mode === "matching" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">Đề bài (tuỳ chọn)</Label>
                <Input
                  id="prompt"
                  placeholder="Nhìn tranh — nối câu hỏi với câu trả lời đúng"
                  {...register("prompt" as const)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Ảnh minh hoạ <span className="text-destructive">*</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    (1 ảnh chung gợi cặp đúng — vd g1_sent_name_nam.webp)
                  </span>
                </Label>
                <AssetField
                  kind="image"
                  value={(watch("promptImage" as const) as string) ?? ""}
                  onChange={(v) =>
                    setValue("promptImage" as const, v, { shouldValidate: true })
                  }
                />
                {"promptImage" in errors && (
                  <p className="text-xs text-destructive">
                    {(errors as Record<string, { message?: string }>).promptImage?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Audio đọc câu (tuỳ chọn)</Label>
                <AssetField
                  kind="audio"
                  value={(watch("promptAudio" as const) as string) ?? ""}
                  onChange={(v) =>
                    setValue("promptAudio" as const, v, { shouldValidate: true })
                  }
                />
              </div>
              <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="flex items-center justify-between">
                  <Label>✅ Cặp ĐÚNG (khớp với ảnh)</Label>
                  <Select
                    value=""
                    onValueChange={(v) => {
                      const p = pairFromKey(v);
                      if (!p) return;
                      setValue("pairLeft" as const, p.left, { shouldValidate: true });
                      setValue("pairRight" as const, p.right, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className="h-7 w-56 text-xs">
                      <SelectValue placeholder="Chọn nhanh từ ngân hàng..." />
                    </SelectTrigger>
                    <SelectContent>
                      {G1_SENTENCE_PAIRS.map((p) => (
                        <SelectItem key={pairKey(p)} value={pairKey(p)}>
                          {p.left} — {p.right}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="pairLeft" className="text-xs">Câu hỏi</Label>
                    <Input
                      id="pairLeft"
                      placeholder="What is your name?"
                      {...register("pairLeft" as const)}
                    />
                    {"pairLeft" in errors && (
                      <p className="text-xs text-destructive">
                        {(errors as Record<string, { message?: string }>).pairLeft?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pairRight" className="text-xs">Câu trả lời</Label>
                    <Input
                      id="pairRight"
                      placeholder="I am Nam"
                      {...register("pairRight" as const)}
                    />
                    {"pairRight" in errors && (
                      <p className="text-xs text-destructive">
                        {(errors as Record<string, { message?: string }>).pairRight?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Cặp NHIỄU (1–3 · chọn từ ngân hàng mẫu câu Lớp 1)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(watchedDistractors?.length ?? 0) >= 3}
                    onClick={() =>
                      setValue(
                        "distractors" as const,
                        [...(watchedDistractors ?? []), { ...firstFreePair() }],
                        { shouldValidate: true },
                      )
                    }
                  >
                    + Thêm nhiễu
                  </Button>
                </div>
                {(watchedDistractors ?? []).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={d.left && d.right ? `${d.left}|${d.right}` : ""}
                      onValueChange={(v) => {
                        const p = pairFromKey(v);
                        if (!p) return;
                        const next = (watchedDistractors ?? []).slice();
                        next[i] = { ...p };
                        setValue("distractors" as const, next, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn cặp nhiễu từ ngân hàng..." />
                      </SelectTrigger>
                      <SelectContent>
                        {G1_SENTENCE_PAIRS.map((p) => {
                          const isCurrent =
                            normSide(p.left) === normSide(d.left) &&
                            normSide(p.right) === normSide(d.right);
                          return (
                            <SelectItem
                              key={pairKey(p)}
                              value={pairKey(p)}
                              disabled={!isCurrent && pairConflicts(p, i)}
                            >
                              {p.left} — {p.right}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={(watchedDistractors?.length ?? 0) <= 1}
                      onClick={() =>
                        setValue(
                          "distractors" as const,
                          (watchedDistractors ?? []).filter((_, k) => k !== i),
                          { shouldValidate: true },
                        )
                      }
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {"distractors" in errors && (
                  <p className="text-xs text-destructive">
                    {(errors as Record<string, { message?: string }>).distractors?.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  🔗 <b>Ghép cặp theo tranh</b>: học sinh nhìn ảnh → chạm 1 câu hỏi
                  → chạm 1 câu trả lời. Chỉ cặp ĐÚNG khớp ảnh được tính; cặp nhiễu
                  trộn vào 2 cột.
                </p>
                <MatchingPreview
                  left={(watch("pairLeft" as const) as string) ?? ""}
                  right={(watch("pairRight" as const) as string) ?? ""}
                  distractors={watchedDistractors ?? []}
                />
              </div>
            </>
          ) : mode === "word_blank" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">Đề bài (tuỳ chọn)</Label>
                <Input
                  id="prompt"
                  placeholder="Chọn từ đúng điền vào chỗ trống"
                  {...register("prompt" as const)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markedSentence">
                  Câu có chỗ trống — bọc <b>từ ẩn</b> trong [ ]
                </Label>
                <Input
                  id="markedSentence"
                  placeholder="It is a [pen]"
                  className="font-mono"
                  {...register("markedSentence" as const)}
                />
                {"markedSentence" in errors && (
                  <p className="text-xs text-destructive">
                    {(errors as Record<string, { message?: string }>).markedSentence?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="wordDistractors">Từ nhiễu (cách nhau dấu phẩy)</Label>
                <Input
                  id="wordDistractors"
                  placeholder="book, bag"
                  className="font-mono"
                  {...register("wordDistractors" as const)}
                />
                {"wordDistractors" in errors && (
                  <p className="text-xs text-destructive">
                    {(errors as Record<string, { message?: string }>).wordDistractors?.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Ảnh gợi ý (tuỳ chọn)</Label>
                  <AssetField
                    kind="image"
                    value={(watch("promptImage" as const) as string) ?? ""}
                    onChange={(v) =>
                      setValue("promptImage" as const, v, { shouldValidate: true })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Audio đọc câu (tuỳ chọn)</Label>
                  <AssetField
                    kind="audio"
                    value={(watch("promptAudio" as const) as string) ?? ""}
                    onChange={(v) =>
                      setValue("promptAudio" as const, v, { shouldValidate: true })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ✏️ <b>Điền từ vào câu</b>: học sinh thấy câu khuyết 1 từ + ngân
                hàng từ (đáp án + từ nhiễu, xáo trộn) → chạm từ đúng để điền.
              </p>
              <WordBlankPreview
                marked={(watch("markedSentence" as const) as string) ?? ""}
                distractorsCsv={(watch("wordDistractors" as const) as string) ?? ""}
              />
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

// Xem trước câu "Sắp xếp" — hiện các thẻ từ (xáo cố định để không nhảy loạn khi gõ).
function ReorderPreview({ sentence }: { sentence: string }) {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  // Xáo hiển thị theo hash ổn định (chỉ để xem trước; lúc lưu mới xáo thật).
  const shuffled = [...words].sort((a, b) => (a + a.length).localeCompare(b + b.length));
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <span className="text-xs text-muted-foreground">Xem trước (thẻ từ xáo trộn): </span>
      <div className="mt-1 flex flex-wrap gap-2">
        {shuffled.map((w, i) => (
          <span key={i} className="rounded-md border-2 border-dashed border-gray-300 bg-background px-3 py-1 text-sm font-medium">
            {w}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Đáp án đúng: <b className="text-foreground">{words.join(" ")}</b>
      </p>
    </div>
  );
}

// Xem trước câu "Ghép cặp theo tranh" — cặp đúng ✓ + cặp nhiễu.
function MatchingPreview({
  left,
  right,
  distractors,
}: {
  left: string;
  right: string;
  distractors: { left: string; right: string }[];
}) {
  if (!left || !right) return null;
  const chip = (t: string, ok?: boolean) => (
    <span
      className={
        "rounded-full border px-2.5 py-0.5 text-xs " +
        (ok ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-muted/40")
      }
    >
      {t}
    </span>
  );
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-sm">
      <span className="text-xs text-muted-foreground">
        Xem trước (2 cột sẽ xáo khi học sinh làm):
      </span>
      <div className="mt-1 space-y-1">
        <div className="flex items-center gap-1.5">
          {chip(left, true)} ↔ {chip(right, true)}
          <span className="text-xs text-emerald-600">✓ đúng</span>
        </div>
        {distractors
          .filter((d) => d.left && d.right)
          .map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {chip(d.left)} ↔ {chip(d.right)}
              <span className="text-xs text-muted-foreground">(nhiễu)</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// Xem trước câu "Điền từ vào câu" — câu khuyết + ngân hàng từ.
function WordBlankPreview({
  marked,
  distractorsCsv,
}: {
  marked: string;
  distractorsCsv: string;
}) {
  const parsed = parseMarkedSentence(marked);
  if (!parsed) return null;
  const ds = distractorsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-sm">
      <span className="text-xs text-muted-foreground">Xem trước: </span>
      <span className="font-mono font-semibold">
        {[parsed.prefix, "___", parsed.suffix].filter(Boolean).join(" ")}
      </span>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Từ cho học sinh chọn:</span>
        {[parsed.answer, ...ds].map((w, i) => (
          <span
            key={i}
            className="rounded-md border-2 border-dashed border-gray-300 bg-background px-2.5 py-0.5 text-xs font-medium"
          >
            {w}
          </span>
        ))}
        <span className="text-xs text-muted-foreground">
          · đáp án: <b className="text-foreground">{parsed.answer}</b>
        </span>
      </div>
    </div>
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
