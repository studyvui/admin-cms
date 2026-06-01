"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, ArrowRight, ImageIcon, Music, X, Trash2, Play } from "lucide-react";
import { QuestionPreviewModal } from "@/components/question-preview/question-preview-modal";
import { lessonsApi } from "@/lib/api/lessons";
import { coursesApi } from "@/lib/api/courses";
import { ImagePicker } from "@/components/asset-picker/image-picker";
import { AudioPicker } from "@/components/asset-picker/audio-picker";
import { questionsApi } from "@/lib/api/questions";
import type {
  CreateQuestionInput,
  Question,
  QuestionStatus,
} from "@/lib/types";
import { extractError } from "@/lib/errors";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";

const STATUS_FLOW: Record<QuestionStatus, QuestionStatus[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "review"],
  published: ["deprecated"],
  deprecated: [],
};

function nextQuestionCode(lessonCode: string, existingCodes: string[]): string {
  const prefix = `${lessonCode}_`;
  const usedNums = new Set(
    existingCodes
      .filter((c) => c.startsWith(prefix))
      .map((c) => parseInt(c.slice(prefix.length), 10))
      .filter((n) => !isNaN(n) && n > 0),
  );
  let seq = 1;
  while (usedNums.has(seq)) seq++;
  return `${lessonCode}_${String(seq).padStart(3, "0")}`;
}

const QUESTION_TYPES = [
  "multiple_choice",
  "image_choice",
  "audio_choice",
  "missing_letter",
  "fill_blank",
  "matching",
  "reorder",
  "count_objects",
  "number_recognition",
  "compare_numbers",
];

const baseSchema = z.object({
  lessonId: z.string().uuid("Chọn bài học"),
  code: z
    .string()
    .min(3)
    .regex(/^[A-Z0-9_]+$/, "Chỉ chữ HOA, số, dấu gạch dưới"),
  type: z.string().min(1),
  skill: z.string().min(1),
  difficulty: z.number().int().min(1).max(5),
  assetRefsCsv: z.string().optional(),
});

const mcSchema = baseSchema.extend({
  mode: z.literal("mc"),
  prompt: z.string().min(1, "Cần đề bài"),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

const jsonSchema = baseSchema.extend({
  mode: z.literal("json"),
  contentJson: z.string().refine((v) => {
    try {
      JSON.parse(v);
      return true;
    } catch {
      return false;
    }
  }, "JSON không hợp lệ"),
  correctAnswer: z.string().min(1),
});

const questionFormSchema = z.discriminatedUnion("mode", [mcSchema, jsonSchema]);

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function QuestionsPage() {
  const { hasRole, hydrated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<{
    lessonId?: string;
    status?: QuestionStatus;
    skill?: string;
  }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => coursesApi.list(),
  });

  const { data: lessons } = useQuery({
    queryKey: ["lessons", "for-questions"],
    queryFn: () => lessonsApi.list(),
  });

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    if (!selectedCourseId) return lessons;
    return lessons.filter((l) => l.courseId === selectedCourseId);
  }, [lessons, selectedCourseId]);

  const lessonIdsInCourse = useMemo(
    () => new Set(filteredLessons.map((l) => l.id)),
    [filteredLessons],
  );

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ["questions", filters],
    queryFn: () => questionsApi.list(filters),
  });

  const createMut = useMutation({
    mutationFn: questionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      setDialogOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateQuestionInput>;
    }) => questionsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuestionStatus }) =>
      questionsApi.changeStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => questionsApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  const lessonNameById = useMemo(() => {
    const m = new Map<string, string>();
    lessons?.forEach((l) => m.set(l.id, `${l.code} — ${l.name}`));
    return m;
  }, [lessons]);

  const displayedQuestions = useMemo(() => {
    if (!questions) return [];
    if (!selectedCourseId || filters.lessonId) return questions;
    return questions.filter((q) => lessonIdsInCourse.has(q.lessonId));
  }, [questions, selectedCourseId, filters.lessonId, lessonIdsInCourse]);

  if (!hydrated) return null;
  if (!hasRole("admin", "editor", "qa")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const canWrite = hasRole("admin", "editor");
  const canChangeStatus = hasRole("admin", "qa", "editor");
  const canDelete = hasRole("admin");
  const isEditor = hasRole("editor") && !hasRole("admin");

  // Editor chi sua duoc cau hoi o status draft hoac review.
  const canEditQuestion = (q: Question) =>
    canWrite &&
    (!isEditor || q.status === "draft" || q.status === "review");

  const onSubmit = (values: QuestionFormValues) => {
    const assetRefs = (values.assetRefsCsv ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let content: Record<string, unknown>;
    let correctAnswer: string;

    if (values.mode === "mc") {
      const options = [
        { key: "A", text: values.optionA },
        { key: "B", text: values.optionB },
        { key: "C", text: values.optionC },
        { key: "D", text: values.optionD },
      ];
      content = {
        prompt: values.prompt,
        options: options.map((o) => o.text),
      };
      correctAnswer =
        options.find((o) => o.key === values.correctOption)?.text ?? "";
    } else {
      content = JSON.parse(values.contentJson);
      correctAnswer = values.correctAnswer;
    }

    if (editing) {
      updateMut.mutate({
        id: editing.id,
        input: {
          type: values.type,
          skill: values.skill,
          difficulty: values.difficulty,
          content,
          correctAnswer,
          assetRefs,
        },
      });
    } else {
      createMut.mutate({
        lessonId: values.lessonId,
        code: values.code,
        type: values.type,
        skill: values.skill,
        difficulty: values.difficulty,
        content,
        correctAnswer,
        assetRefs,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Câu hỏi</h1>
          <p className="text-muted-foreground">
            Nhập, sửa, duyệt và xuất bản câu hỏi
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm câu hỏi
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <Label className="mb-1.5 block text-xs">Khóa học</Label>
              <Select
                value={selectedCourseId ?? "all"}
                onValueChange={(v) => {
                  const newCourseId = v === "all" ? undefined : v;
                  setSelectedCourseId(newCourseId);
                  // Reset lesson filter nếu lesson không thuộc course mới
                  if (filters.lessonId && newCourseId) {
                    const lesson = lessons?.find((l) => l.id === filters.lessonId);
                    if (lesson && lesson.courseId !== newCourseId) {
                      setFilters((f) => ({ ...f, lessonId: undefined }));
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Bài học</Label>
              <Select
                value={filters.lessonId ?? "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    lessonId: v === "all" ? undefined : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {filteredLessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} — {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Trạng thái</Label>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    status: v === "all" ? undefined : (v as QuestionStatus),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="review">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="published">Xuất bản</SelectItem>
                  <SelectItem value="deprecated">Ngừng dùng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Skill</Label>
              <Input
                placeholder="vocab, phonics, ..."
                value={filters.skill ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    skill: e.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Danh sách ({displayedQuestions.length})
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
          ) : displayedQuestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Không có câu hỏi khớp bộ lọc.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Bài học</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead className="w-12">Lv</TableHead>
                  <TableHead>Đáp án</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-44 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedQuestions.map((q) => {
                  const allNextStatuses = STATUS_FLOW[q.status] ?? [];
                  // Editor: chi cho phep draft→review va review→draft
                  const nextStatuses = isEditor
                    ? allNextStatuses.filter(
                        (s) =>
                          (q.status === "draft" && s === "review") ||
                          (q.status === "review" && s === "draft"),
                      )
                    : allNextStatuses;
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">
                        {q.code}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lessonNameById.get(q.lessonId) ?? q.lessonId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {q.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{q.skill}</TableCell>
                      <TableCell>{q.difficulty}</TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={q.correctAnswer}
                      >
                        {q.correctAnswer}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={q.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canChangeStatus &&
                            nextStatuses.map((next) => (
                              <Button
                                key={next}
                                variant="ghost"
                                size="sm"
                                disabled={statusMut.isPending}
                                onClick={() =>
                                  statusMut.mutate({ id: q.id, status: next })
                                }
                              >
                                <ArrowRight className="mr-1 h-3 w-3" />
                                {next}
                              </Button>
                            ))}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewQuestion(q)}
                            title="Xem thử câu hỏi"
                          >
                            <Play className="h-4 w-4 text-blue-500" />
                          </Button>
                          {canEditQuestion(q) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditing(q);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deleteMut.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Xoá câu hỏi "${q.code}"? Thao tác này không thể hoàn tác.`,
                                  )
                                ) {
                                  deleteMut.mutate(q.id);
                                }
                              }}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Xoá câu hỏi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <QuestionDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        lessons={lessons ?? []}
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

      <QuestionPreviewModal
        open={previewQuestion !== null}
        onOpenChange={(o) => { if (!o) setPreviewQuestion(null); }}
        question={previewQuestion}
      />
    </div>
  );
}

function QuestionDialog({
  open,
  onOpenChange,
  editing,
  lessons,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Question | null;
  lessons: { id: string; code: string; name: string; skills: string[] }[];
  onSubmit: (values: QuestionFormValues) => void;
  submitting: boolean;
  error: string | null;
}) {
  const defaults = useMemo<QuestionFormValues>(() => {
    if (editing) {
      const c = editing.content as {
        prompt?: string;
        options?: string[];
      };
      const opts = Array.isArray(c?.options) ? c.options : [];
      const isFourOption = opts.length === 4;
      if (isFourOption) {
        const correctIdx = opts.findIndex((o) => o === editing.correctAnswer);
        return {
          mode: "mc",
          lessonId: editing.lessonId,
          code: editing.code,
          type: editing.type,
          skill: editing.skill,
          difficulty: editing.difficulty,
          assetRefsCsv: editing.assetRefs.join(", "),
          prompt: c.prompt ?? "",
          optionA: opts[0] ?? "",
          optionB: opts[1] ?? "",
          optionC: opts[2] ?? "",
          optionD: opts[3] ?? "",
          correctOption: (["A", "B", "C", "D"][correctIdx] ?? "A") as
            | "A"
            | "B"
            | "C"
            | "D",
        };
      }
      return {
        mode: "json",
        lessonId: editing.lessonId,
        code: editing.code,
        type: editing.type,
        skill: editing.skill,
        difficulty: editing.difficulty,
        assetRefsCsv: editing.assetRefs.join(", "),
        contentJson: JSON.stringify(editing.content, null, 2),
        correctAnswer: editing.correctAnswer,
      };
    }
    return {
      mode: "mc",
      lessonId: lessons[0]?.id ?? "",
      code: "",
      type: "multiple_choice",
      skill: "vocab",
      difficulty: 1,
      assetRefsCsv: "",
      prompt: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
    };
  }, [editing, lessons]);

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
          <div className="grid grid-cols-2 gap-4">
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
                  {lessons.map((l) => (
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
                      {t}
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
                        {s}
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
                setValue("mode", v as "mc" | "json", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mc">
                  Trắc nghiệm 4 lựa chọn (đơn giản)
                </SelectItem>
                <SelectItem value="json">JSON raw (nâng cao)</SelectItem>
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
                  </div>
                ))}
              </div>
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

function AssetRefsField({
  value,
  onChange,
}: {
  value: string;
  onChange: (csv: string) => void;
}) {
  const [imageOpen, setImageOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);

  const refs = useMemo(
    () =>
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [value],
  );

  const setRefs = (next: string[]) => {
    const unique = Array.from(new Set(next));
    onChange(unique.join(", "));
  };

  const remove = (key: string) => {
    setRefs(refs.filter((r) => r !== key));
  };

  return (
    <div className="space-y-2">
      <Label>Asset đính kèm (ảnh / audio)</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setImageOpen(true)}
        >
          <ImageIcon className="mr-1.5 h-4 w-4" />
          Chọn ảnh
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAudioOpen(true)}
        >
          <Music className="mr-1.5 h-4 w-4" />
          Chọn audio
        </Button>
      </div>

      {refs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/30 p-2">
          {refs.map((k) => (
            <Badge key={k} variant="secondary" className="gap-1 font-mono">
              <span className="truncate max-w-[240px]">{k}</span>
              <button
                type="button"
                onClick={() => remove(k)}
                className="hover:text-destructive"
                aria-label={`Bỏ ${k}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Chưa chọn asset nào — bấm nút phía trên để chọn từ kho R2.
        </p>
      )}

      <ImagePicker
        open={imageOpen}
        onOpenChange={setImageOpen}
        initialSelected={refs.filter((r) => /\.(png|webp|jpe?g|gif|svg)$/i.test(r))}
        multiple
        onConfirm={(picked) => {
          const audioOnly = refs.filter(
            (r) => !/\.(png|webp|jpe?g|gif|svg)$/i.test(r),
          );
          setRefs([...audioOnly, ...picked]);
        }}
      />

      <AudioPicker
        open={audioOpen}
        onOpenChange={setAudioOpen}
        initialSelected={refs.filter((r) => /\.(mp3|ogg|wav|m4a)$/i.test(r))}
        multiple
        onConfirm={(picked) => {
          const imageOnly = refs.filter(
            (r) => !/\.(mp3|ogg|wav|m4a)$/i.test(r),
          );
          setRefs([...imageOnly, ...picked]);
        }}
      />
    </div>
  );
}
