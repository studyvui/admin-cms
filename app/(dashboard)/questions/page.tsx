"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, ArrowRight, Trash2, Play, RotateCcw } from "lucide-react";
import { QuestionPreviewModal } from "@/components/question-preview/question-preview-modal";
import { useQuestions } from "./use-questions";
import { QuestionDialog } from "./question-dialog";
import {
  toPayload,
  type QuestionFormValues,
} from "@/lib/questions/question-form";
import {
  STATUS_FLOW,
  SKILL_LABELS,
  QUESTION_TYPE_LABELS,
  QUESTION_STATUS_LABELS,
} from "@/lib/questions/labels";
import type { Question, QuestionStatus } from "@/lib/types";
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
import { StatusBadge } from "@/components/shared/status-badge";

export default function QuestionsPage() {
  const { hasRole, hydrated } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<{
    lessonId?: string;
    status?: QuestionStatus;
    skill?: string;
  }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  // Danh sách > 6000 câu hỏi — chỉ tải khi bấm "Hiển thị"; đổi bộ lọc lại phải
  // bấm lại (tránh vô tình tải "Tất cả" gây lag mỗi lần đổi ý).
  const [showResults, setShowResults] = useState(false);

  const {
    courses,
    lessons,
    questions,
    isLoading,
    error,
    createMut,
    updateMut,
    statusMut,
    deleteMut,
    restoreMut,
  } = useQuestions(filters, showResults);

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    if (!selectedCourseId) return lessons;
    return lessons.filter((l) => l.courseId === selectedCourseId);
  }, [lessons, selectedCourseId]);

  const lessonIdsInCourse = useMemo(
    () => new Set(filteredLessons.map((l) => l.id)),
    [filteredLessons],
  );

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
    const payload = toPayload(values);
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditing(null);
          },
        },
      );
    } else {
      createMut.mutate(
        { lessonId: values.lessonId, code: values.code, ...payload },
        { onSuccess: () => setDialogOpen(false) },
      );
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowResults(true)}>
            Hiển thị
          </Button>
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
                  setShowResults(false);
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
                onValueChange={(v) => {
                  setFilters((f) => ({
                    ...f,
                    lessonId: v === "all" ? undefined : v,
                  }));
                  setShowResults(false);
                }}
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
                onValueChange={(v) => {
                  setFilters((f) => ({
                    ...f,
                    status: v === "all" ? undefined : (v as QuestionStatus),
                  }));
                  setShowResults(false);
                }}
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
                onChange={(e) => {
                  setFilters((f) => ({
                    ...f,
                    skill: e.target.value || undefined,
                  }));
                  setShowResults(false);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Danh sách {showResults ? `(${displayedQuestions.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showResults ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chọn bộ lọc rồi bấm <b>Hiển thị</b> để tải câu hỏi — danh sách có
              hàng nghìn câu nên không tự tải để tránh giật/lag.
            </p>
          ) : isLoading ? (
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
                          {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{SKILL_LABELS[q.skill] ?? q.skill}</TableCell>
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
                                {QUESTION_STATUS_LABELS[next] ?? next}
                              </Button>
                            ))}
                          {/* Khôi phục câu "Ngừng dùng" → "Xuất bản" lại (admin) */}
                          {canDelete && q.status === "deprecated" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              disabled={restoreMut.isPending}
                              title="Khôi phục và xuất bản lại"
                              onClick={() => restoreMut.mutate(q.id)}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              {restoreMut.isPending ? "Đang khôi phục…" : "Khôi phục"}
                            </Button>
                          )}
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
                              title="Sửa câu hỏi"
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
        courses={courses ?? []}
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


