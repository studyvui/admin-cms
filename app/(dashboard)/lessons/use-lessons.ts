"use client";

// Data layer cho trang Bài học — tách từ page.tsx. Per-entity (KHÔNG generic).
// Mutation chỉ lo invalidate; side-effect UI (đóng dialog) do component gắn qua per-call
// `.mutate(input, { onSuccess })` để giữ NGUYÊN hành vi cũ.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api/courses";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonStatus } from "@/lib/types";
import { toUpdateInput, type LessonFormValues } from "@/lib/lessons/lesson-form";

export interface LessonFilters {
  courseId?: string;
  status?: LessonStatus;
  week?: string;
}

export function useLessons(filters: LessonFilters, enabled: boolean = true) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["lessons"] });

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  // Chỉ tải danh sách bài học khi người dùng bấm "Hiển thị" (tránh tự động tải
  // toàn bộ bài học mọi lớp/môn mỗi lần vào trang — xem questions/page.tsx tương tự).
  const lessonsQuery = useQuery({
    queryKey: ["lessons", filters],
    queryFn: () =>
      lessonsApi.list({
        courseId: filters.courseId,
        status: filters.status,
        week: filters.week ? parseInt(filters.week, 10) : undefined,
      }),
    enabled,
  });

  const createMut = useMutation({
    mutationFn: lessonsApi.create,
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: (input: { id: string; values: LessonFormValues }) =>
      lessonsApi.update(input.id, toUpdateInput(input.values)),
    onSuccess: invalidate,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LessonStatus }) =>
      lessonsApi.changeStatus(id, status),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => lessonsApi.delete(id),
    onSuccess: invalidate,
  });

  return {
    courses: coursesQuery.data,
    lessons: lessonsQuery.data,
    isLoading: lessonsQuery.isLoading,
    error: lessonsQuery.error,
    createMut,
    updateMut,
    statusMut,
    deleteMut,
  };
}
