"use client";

import { useState } from "react";
import { Plus, Pencil, ArrowRight, Trash2 } from "lucide-react";
import { useLessons } from "./use-lessons";
import { LessonDialog } from "./lesson-dialog";
import { toCreateInput, type LessonFormValues } from "@/lib/lessons/lesson-form";
import {
  STATUS_LABELS,
  STATUS_FLOW,
  LESSON_TYPE_LABELS,
  SKILL_LABELS,
} from "@/lib/lessons/labels";
import type { Course, Lesson, LessonStatus } from "@/lib/types";
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

export default function LessonsPage() {
  const { hasRole, hydrated } = useAuth();
  const [filters, setFilters] = useState<{
    courseId?: string;
    status?: LessonStatus;
    week?: string;
  }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);

  const {
    courses,
    lessons,
    isLoading,
    error,
    createMut,
    updateMut,
    statusMut,
    deleteMut,
  } = useLessons(filters);

  if (!hydrated) return null;
  if (!hasRole("admin", "editor", "qa")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const canWrite = hasRole("admin");
  const canChangeStatus = hasRole("admin", "qa");
  const canDelete = hasRole("admin");

  const onSubmit = (values: LessonFormValues) => {
    if (editing) {
      updateMut.mutate(
        { id: editing.id, values },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditing(null);
          },
        },
      );
    } else {
      createMut.mutate(toCreateInput(values), {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bài học</h1>
          <p className="text-muted-foreground">
            Cấu trúc tuần học, lesson type và status workflow
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
            Thêm bài học
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs">Khoá học</Label>
              <Select
                value={filters.courseId ?? "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    courseId: v === "all" ? undefined : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
                    status: v === "all" ? undefined : (v as LessonStatus),
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
                  <SelectItem value="archived">Lưu trữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Tuần</Label>
              <Input
                type="number"
                placeholder="Để trống = tất cả"
                value={filters.week ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    week: e.target.value || undefined,
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
            Danh sách ({lessons?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {extractError(error)}
            </div>
          ) : !lessons || lessons.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Không có bài học khớp bộ lọc.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Tuần</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Loại bài học</TableHead>
                  <TableHead>Kỹ năng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-52 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((l) => {
                  const nextStatuses = STATUS_FLOW[l.status] ?? [];
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">
                        {l.code}
                      </TableCell>
                      <TableCell>W{l.week}</TableCell>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {LESSON_TYPE_LABELS[l.lessonType] ?? l.lessonType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {l.skills.map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="text-xs"
                            >
                              {SKILL_LABELS[s] ?? s}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={l.status} />
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
                                  statusMut.mutate({ id: l.id, status: next })
                                }
                                title={`Chuyển → ${STATUS_LABELS[next]}`}
                              >
                                <ArrowRight className="mr-1 h-3 w-3" />
                                {STATUS_LABELS[next]}
                              </Button>
                            ))}
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Sửa bài học"
                              onClick={() => {
                                setEditing(l);
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
                                    `Xoá bài học "${l.code}"? Toàn bộ câu hỏi thuộc bài này sẽ không còn truy cập được. Thao tác này không thể hoàn tác.`,
                                  )
                                ) {
                                  deleteMut.mutate(l.id);
                                }
                              }}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Xoá bài học"
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

      <LessonDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        courses={(courses ?? []) as Course[]}
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



