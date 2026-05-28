"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, ArrowRight } from "lucide-react";
import { coursesApi } from "@/lib/api/courses";
import { lessonsApi } from "@/lib/api/lessons";
import type { Lesson, LessonStatus } from "@/lib/types";
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

const STATUS_FLOW: Record<LessonStatus, LessonStatus[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "review"],
  published: ["archived"],
  archived: [],
};

const lessonSchema = z.object({
  courseId: z.string().uuid("Chọn khoá học"),
  code: z
    .string()
    .min(3, "Tối thiểu 3 ký tự")
    .regex(/^[A-Z0-9_]+$/, "Chỉ chữ HOA, số, dấu gạch dưới"),
  week: z.number().int().min(1).max(40),
  orderIndex: z.number().int().min(1).max(100),
  name: z.string().min(1, "Bắt buộc"),
  lessonType: z.string().min(1, "Bắt buộc"),
  skillsCsv: z.string().min(1, "Ít nhất 1 skill"),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

export default function LessonsPage() {
  const { hasRole, hydrated } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    courseId?: string;
    status?: LessonStatus;
    week?: string;
  }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const { data: lessons, isLoading, error } = useQuery({
    queryKey: ["lessons", filters],
    queryFn: () =>
      lessonsApi.list({
        courseId: filters.courseId,
        status: filters.status,
        week: filters.week ? parseInt(filters.week, 10) : undefined,
      }),
  });

  const createMut = useMutation({
    mutationFn: lessonsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      setDialogOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (input: { id: string; values: LessonFormValues }) =>
      lessonsApi.update(input.id, {
        name: input.values.name,
        lessonType: input.values.lessonType,
        skills: input.values.skillsCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        week: input.values.week,
        orderIndex: input.values.orderIndex,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LessonStatus }) =>
      lessonsApi.changeStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["lessons"] }),
  });

  if (!hydrated) return null;
  if (!hasRole("admin", "editor", "qa")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const canWrite = hasRole("admin", "editor");
  const canChangeStatus = hasRole("admin", "qa");

  const onSubmit = (values: LessonFormValues) => {
    const skills = values.skillsCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (editing) {
      updateMut.mutate({ id: editing.id, values });
    } else {
      createMut.mutate({
        courseId: values.courseId,
        code: values.code,
        week: values.week,
        orderIndex: values.orderIndex,
        name: values.name,
        lessonType: values.lessonType,
        skills,
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
                  <TableHead>Lesson Type</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-40 text-right">Thao tác</TableHead>
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
                        <Badge variant="outline">{l.lessonType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {l.skills.map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="text-xs"
                            >
                              {s}
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
                                title={`Chuyển → ${next}`}
                              >
                                <ArrowRight className="mr-1 h-3 w-3" />
                                {next}
                              </Button>
                            ))}
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditing(l);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
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
        courses={courses ?? []}
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

function LessonDialog({
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
  courses: { id: string; name: string }[];
  onSubmit: (values: LessonFormValues) => void;
  submitting: boolean;
  error: string | null;
}) {
  const defaults = useMemo<LessonFormValues>(
    () =>
      editing
        ? {
            courseId: editing.courseId,
            code: editing.code,
            week: editing.week,
            orderIndex: editing.orderIndex,
            name: editing.name,
            lessonType: editing.lessonType,
            skillsCsv: editing.skills.join(", "),
          }
        : {
            courseId: courses[0]?.id ?? "",
            code: "",
            week: 1,
            orderIndex: 1,
            name: "",
            lessonType: "vocabulary",
            skillsCsv: "vocab",
          },
    [editing, courses],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    values: defaults,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Sửa bài học" : "Thêm bài học mới"}
          </DialogTitle>
          <DialogDescription>
            Code và Course không thay đổi sau khi tạo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              placeholder="G1_W01_VOCAB_GREETINGS"
              disabled={!!editing}
              {...register("code")}
            />
            {errors.code && (
              <p className="text-xs text-destructive">
                {errors.code.message}
              </p>
            )}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="lessonType">Lesson Type</Label>
            <Input
              id="lessonType"
              placeholder="vocabulary | phonics | counting | ..."
              {...register("lessonType")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skillsCsv">Skills (cách nhau bằng dấu phẩy)</Label>
            <Input
              id="skillsCsv"
              placeholder="vocab, listening"
              {...register("skillsCsv")}
            />
            {errors.skillsCsv && (
              <p className="text-xs text-destructive">
                {errors.skillsCsv.message}
              </p>
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
  );
}
