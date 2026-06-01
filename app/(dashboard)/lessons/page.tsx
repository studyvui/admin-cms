"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, ArrowRight, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { coursesApi } from "@/lib/api/courses";
import { lessonsApi } from "@/lib/api/lessons";
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

const LESSON_TYPE_LABELS: Record<string, string> = {
  // Số học
  counting:          "Đếm số",
  compare_quantity:  "So sánh số lượng qua hình",
  comparison:        "So sánh dấu > < =",
  number_decompose:  "Tách gộp số",
  sequence:          "Dãy số quy luật",
  sort_numbers:      "Sắp xếp dãy số",
  write_equation:    "Nhìn hình viết phép tính",
  complete_table:    "Hoàn thành bảng cộng/trừ",
  chain_calculation: "Chuỗi phép tính kết hợp",
  find_missing_number: "Tìm số ẩn",
  calculation:       "Tính kết quả",
  fill_blank:        "Điền số còn thiếu",
  word_problem:      "Toán có lời văn",
  // Hình học
  classify_2d:       "Phân loại hình phẳng",
  assemble_shapes:   "Lắp ghép / Xếp hình",
  shape_pattern:     "Quy luật chuỗi hình",
  match_object_shape: "Nối đồ vật với hình/khối",
  classify_3d:       "Phân loại hình khối 3D",
  spatial_orientation: "Vị trí không gian",
  geometry:          "Hình học tổng quát",
  // Tiếng Anh
  vocabulary:        "Từ vựng",
  phonics:           "Phonics",
  image_choice:      "Chọn hình",
  missing_letter:    "Điền chữ còn thiếu",
  audio_choice:      "Nghe và chọn",
  reorder:           "Sắp xếp câu",
  match_word:        "Nối từ",
  // Đặc biệt
  review:            "Ôn tập",
  boss:              "Boss Challenge",
};

const LESSON_TYPE_OPTIONS = Object.entries(LESSON_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const SKILL_LABELS: Record<string, string> = {
  counting:            "Đếm số",
  number_recognition:  "Nhận diện số",
  sequence:            "Dãy số",
  pattern_recognition: "Nhận dạng quy luật",
  comparison:          "So sánh",
  logic_reasoning:     "Tư duy logic",
  number_decomposition: "Tách gộp số",
  addition:            "Phép cộng",
  subtraction:         "Phép trừ",
  mental_math:         "Tính nhẩm",
  "2d_shapes":         "Hình phẳng 2D",
  spatial_reasoning:   "Tư duy không gian",
  "3d_shapes":         "Hình khối 3D",
  fill_blank:          "Điền số",
  word_problem:        "Lời văn",
  geometry:            "Hình học",
  calculation:         "Tính toán",
  vocab:               "Từ vựng",
  listening:           "Nghe",
  phonics:             "Phonics",
};

const STATUS_LABELS: Record<LessonStatus, string> = {
  draft:    "Nháp",
  review:   "Chờ duyệt",
  approved: "Đã duyệt",
  published: "Xuất bản",
  archived: "Lưu trữ",
};

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

  const deleteMut = useMutation({
    mutationFn: (id: string) => lessonsApi.delete(id),
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

  const canWrite = hasRole("admin");
  const canChangeStatus = hasRole("admin", "qa");
  const canDelete = hasRole("admin");

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

const SUBJECT_CODE: Record<string, string> = { english: "ENG", math: "MATH" };

function buildCode(
  courses: Course[],
  courseId: string,
  week: number,
  orderIndex: number,
): string {
  const course = courses.find((c) => c.id === courseId);
  if (!course || !week || week < 1) return "";
  const w = String(week).padStart(2, "0");
  const sub = SUBJECT_CODE[course.subject] ?? course.subject.toUpperCase();
  const suffix = orderIndex > 1 ? `_${orderIndex}` : "";
  return `G${course.grade}_W${w}_${sub}${suffix}`;
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
  courses: Course[];
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
    control,
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    values: defaults,
  });

  const watchedCourseId = watch("courseId");
  const watchedWeek = watch("week");
  const watchedOrderIndex = watch("orderIndex");

  // Auto-generate code khi tạo mới (không cho phép sửa khi editing)
  useEffect(() => {
    if (!editing) {
      const code = buildCode(courses, watchedCourseId, watchedWeek, watchedOrderIndex);
      setValue("code", code, { shouldValidate: true });
    }
  }, [editing, watchedCourseId, watchedWeek, watchedOrderIndex, courses, setValue]);

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

function SkillPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (csv: string) => void;
}) {
  const [customInput, setCustomInput] = useState("");

  const selected = useMemo(
    () => new Set(value.split(",").map((s) => s.trim()).filter(Boolean)),
    [value],
  );

  const knownKeys = useMemo(() => new Set(Object.keys(SKILL_LABELS)), []);

  const customSkills = useMemo(
    () => Array.from(selected).filter((s) => !knownKeys.has(s)),
    [selected, knownKeys],
  );

  const update = (next: Set<string>) => onChange(Array.from(next).join(", "));

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    update(next);
  };

  const removeCustom = (key: string) => {
    const next = new Set(selected);
    next.delete(key);
    update(next);
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const next = new Set(selected);
    next.add(trimmed);
    update(next);
    setCustomInput("");
  };

  return (
    <div className="space-y-2">
      {/* Known skills — toggle badges */}
      <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/20 p-2.5">
        {Object.entries(SKILL_LABELS).map(([key, label]) => (
          <button
            type="button"
            key={key}
            onClick={() => toggle(key)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              selected.has(key)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom skills not in SKILL_LABELS */}
      {customSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {customSkills.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
            >
              {s}
              <button type="button" onClick={() => removeCustom(s)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add custom skill */}
      <div className="flex gap-2">
        <Input
          placeholder="Thêm kỹ năng tùy chỉnh..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addCustom(); }
          }}
          className="h-8 text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={addCustom}>
          Thêm
        </Button>
      </div>
    </div>
  );
}
