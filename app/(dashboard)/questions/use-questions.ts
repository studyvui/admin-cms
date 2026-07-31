"use client";

// Data layer cho trang Câu hỏi — tách từ page.tsx. Per-entity (KHÔNG generic).
// Mỗi mutation chỉ lo invalidate (data concern); side-effect UI (đóng dialog) do component
// tự gắn qua per-call `.mutate(input, { onSuccess })` để giữ NGUYÊN hành vi cũ.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api/courses";
import { lessonsApi } from "@/lib/api/lessons";
import { questionsApi } from "@/lib/api/questions";
import type { CreateQuestionInput, QuestionStatus } from "@/lib/types";

export interface QuestionFilters {
  lessonId?: string;
  status?: QuestionStatus;
  skill?: string;
}

export function useQuestions(filters: QuestionFilters, enabled: boolean = true) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["questions"] });

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => coursesApi.list(),
  });

  const lessonsQuery = useQuery({
    queryKey: ["lessons", "for-questions"],
    queryFn: () => lessonsApi.list(),
  });

  // Danh sách câu hỏi hiện > 6000 bản ghi — chỉ tải khi người dùng bấm "Hiển thị"
  // (tránh lag do tự động tải toàn bộ mỗi lần vào trang, xem question-dialog page.tsx).
  const questionsQuery = useQuery({
    queryKey: ["questions", filters],
    queryFn: () => questionsApi.list(filters),
    enabled,
  });

  const createMut = useMutation({
    mutationFn: questionsApi.create,
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateQuestionInput>;
    }) => questionsApi.update(id, input),
    onSuccess: invalidate,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuestionStatus }) =>
      questionsApi.changeStatus(id, status),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => questionsApi.delete(id),
    onSuccess: invalidate,
  });

  // Khôi phục câu "Ngừng dùng" → "Xuất bản" lại (tự chạy chuỗi chuyển trạng thái:
  // deprecated → draft → review → approved → published). Admin mới được (cần quyền publish).
  const restoreMut = useMutation({
    mutationFn: async (id: string) => {
      const chain: QuestionStatus[] = ["draft", "review", "approved", "published"];
      for (const status of chain) {
        await questionsApi.changeStatus(id, status);
      }
    },
    onSuccess: invalidate,
  });

  return {
    courses: coursesQuery.data,
    lessons: lessonsQuery.data,
    questions: questionsQuery.data,
    isLoading: questionsQuery.isLoading,
    error: questionsQuery.error,
    createMut,
    updateMut,
    statusMut,
    deleteMut,
    restoreMut,
  };
}
