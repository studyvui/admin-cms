"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Archive } from "lucide-react";
import { extractError } from "@/lib/errors";
import { coursesApi } from "@/lib/api/courses";
import type { Course, Subject } from "@/lib/types";
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

const courseSchema = z.object({
  code: z
    .string()
    .min(3, "Tối thiểu 3 ký tự")
    .regex(/^[a-z0-9_]+$/, "Chỉ chữ thường, số, dấu gạch dưới"),
  subject: z.enum(["english", "math"]),
  grade: z.number().int().min(1).max(5),
  name: z.string().min(1, "Bắt buộc"),
  description: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const SUBJECT_LABEL: Record<string, string> = {
  english: "Tiếng Anh",
  math: "Toán",
};

function buildCourseName(subject: string, grade: number): string {
  if (!subject || !grade || grade < 1) return "";
  return `${SUBJECT_LABEL[subject] ?? subject} Lớp ${grade}`;
}

function buildCourseCode(subject: string, grade: number): string {
  if (!subject || !grade || grade < 1) return "";
  return `${subject}_grade${grade}`;
}

export default function CoursesPage() {
  const { hasRole, hydrated } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const createMut = useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setDialogOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (input: { id: string } & Partial<CourseFormValues>) =>
      coursesApi.update(input.id, {
        name: input.name,
        description: input.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const archiveMut = useMutation({
    mutationFn: coursesApi.archive,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });

  if (!hydrated) return null;
  if (!hasRole("admin")) {
    return (
      <div className="text-center text-muted-foreground">
        Chỉ Admin được truy cập trang này.
      </div>
    );
  }

  const onSubmit = (values: CourseFormValues) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, ...values });
    } else {
      createMut.mutate(values);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Khoá học</h1>
          <p className="text-muted-foreground">
            Quản lý chương trình theo môn và lớp
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm khoá học
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Danh sách ({courses?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorBlock error={error} />
          ) : !courses || courses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có khoá học nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Môn</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">
                      {c.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {c.subject === "english" ? "Tiếng Anh" : "Toán"}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.grade}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.isActive ? "default" : "secondary"}
                      >
                        {c.isActive ? "Đang hoạt động" : "Lưu trữ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {c.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(`Lưu trữ khoá học "${c.name}"?`)
                              ) {
                                archiveMut.mutate(c.id);
                              }
                            }}
                          >
                            <Archive className="h-4 w-4" />
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

      <CourseDialog
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

function CourseDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Course | null;
  onSubmit: (values: CourseFormValues) => void;
  submitting: boolean;
  error: string | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    values: editing
      ? {
          code: editing.code,
          subject: editing.subject,
          grade: editing.grade,
          name: editing.name,
          description: editing.description ?? "",
        }
      : {
          code: "",
          subject: "english" as Subject,
          grade: 1,
          name: "",
          description: "",
        },
  });

  const watchedSubject = watch("subject");
  const watchedGrade = watch("grade");

  useEffect(() => {
    if (!editing) {
      setValue("name", buildCourseName(watchedSubject, watchedGrade), {
        shouldValidate: true,
      });
      setValue("code", buildCourseCode(watchedSubject, watchedGrade), {
        shouldValidate: true,
      });
    }
  }, [editing, watchedSubject, watchedGrade, setValue]);

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
            {editing ? "Sửa khoá học" : "Thêm khoá học mới"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Code/môn/lớp không thay đổi sau khi tạo."
              : "Tên và Code tự động sinh từ Môn + Lớp. Không thay đổi sau khi tạo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Môn</Label>
              <Select
                value={watch("subject")}
                onValueChange={(v) =>
                  setValue("subject", v as Subject, { shouldValidate: true })
                }
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">Tiếng Anh</SelectItem>
                  <SelectItem value="math">Toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Lớp</Label>
              <Input
                id="grade"
                type="number"
                min={1}
                max={5}
                disabled={!!editing}
                {...register("grade", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Tên hiển thị</Label>
            <Input
              id="name"
              readOnly
              disabled={!!editing}
              className="cursor-not-allowed bg-muted text-muted-foreground"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
            {!editing && (
              <p className="text-xs text-muted-foreground">
                Tự động sinh từ Môn và Lớp. Không thể chỉnh sửa.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
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
                Tự động sinh từ Môn và Lớp. Không thể chỉnh sửa.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              rows={3}
              {...register("description")}
            />
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

function ErrorBlock({ error }: { error: unknown }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {extractError(error)}
    </div>
  );
}
