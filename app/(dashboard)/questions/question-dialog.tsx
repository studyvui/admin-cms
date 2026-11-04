"use client";

// Dialog Thêm/Sửa câu hỏi — tách từ page.tsx (Q4a). Chuyển NGUYÊN VẸN, không đổi hành vi.
// Logic transform form↔payload nằm ở lib/questions/question-form.ts (toPayload do page gọi
// trong onSubmit; toFormValues/defaultFormValues dùng ở đây để dựng defaults).
// Mục 93 Đợt 4b: các khối ô nhập tách ra question-dialog-top-fields.tsx và question-fields-{choice,text,matching}.tsx.

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionsApi } from "@/lib/api/questions";
import { nextQuestionCode } from "@/lib/questions/question-utils";
import { G1_SENTENCE_PAIRS } from "@/lib/questions/sentence-bank";
import { getMathArchetypes } from "@/lib/questions/math-archetypes-grade1";
import {
  questionFormSchema,
  toFormValues,
  defaultFormValues,
  type QuestionFormValues,
} from "@/lib/questions/question-form";
import { MODE_LABELS } from "@/lib/questions/labels";
import type { Question } from "@/lib/types";
import { AssetRefsField } from "@/components/form-fields/asset-refs-field";
import { Button } from "@/components/ui/button";
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
import { QuestionTopFields } from "./question-dialog-top-fields";
import { McFields, ImageChoiceFields, AudioChoiceFields } from "./question-fields-choice";
import { LetterFields, ReorderFields, WordBlankFields, JsonFields } from "./question-fields-text";
import { MatchingFields } from "./question-fields-matching";

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

  // ---- keo: hook useForm giu `form` de truyen cho cac khoi (muc 93 Dot 4b) ----
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    values: defaults,
  });
  const { handleSubmit, setValue, watch, reset } = form;

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
          <QuestionTopFields form={form} dialogCourseId={dialogCourseId} setDialogCourseId={setDialogCourseId} lessonsInCourse={lessonsInCourse} lessonSkills={lessonSkills} mathArchetypes={mathArchetypes} useMathArchetypes={useMathArchetypes} archetypeIdx={archetypeIdx} setArchetypeIdx={setArchetypeIdx} selectedArchetype={selectedArchetype} archetypeIcon={archetypeIcon} mathSkillOptions={mathSkillOptions} lessons={lessons} editing={editing} courses={courses} />

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
            <McFields form={form} selectedArchetype={selectedArchetype} />
          ) : mode === "image_choice" ? (
            <ImageChoiceFields form={form} />
          ) : mode === "audio_choice" ? (
            <AudioChoiceFields form={form} />
          ) : mode === "letter" ? (
            <LetterFields form={form} />
          ) : mode === "reorder" ? (
            <ReorderFields form={form} />
          ) : mode === "matching" ? (
            <MatchingFields form={form} watchedDistractors={watchedDistractors} normSide={normSide} pairConflicts={pairConflicts} firstFreePair={firstFreePair} />
          ) : mode === "word_blank" ? (
            <WordBlankFields form={form} />
          ) : (
            <JsonFields form={form} />
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
