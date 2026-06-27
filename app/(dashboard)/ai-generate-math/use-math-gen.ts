"use client";

// Data layer cho trang AI Sinh đề Toán — tách từ page.tsx. Gom: query bài học (suy ra bài Toán
// theo tuần qua buildMathLessonByWeek thuần) + query/CRUD ngân hàng mẫu (question-templates).
// Per-entity, KHÔNG generic. Mutation chỉ invalidate.

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lessonsApi } from "@/lib/api/lessons";
import { questionTemplatesApi } from "@/lib/api/question-templates";
import { buildMathLessonByWeek } from "@/lib/math-gen/page-helpers";
import type { TemplateInput } from "@/lib/math-gen/types";

export function useMathGen({ grade, week }: { grade: number; week: number }) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["question-templates"] });

  // Bài học Toán theo tuần (nguồn dẫn dắt lessonType + skills).
  const { data: allLessons = [] } = useQuery({
    queryKey: ["lessons", "all"],
    queryFn: () => lessonsApi.list({}),
  });
  const mathLessonByWeek = useMemo(
    () => buildMathLessonByWeek(allLessons, grade),
    [allLessons, grade],
  );
  const currentLesson = mathLessonByWeek.get(week) ?? null;
  const lessonType = currentLesson?.lessonType ?? "";
  const allowedSkills = currentLesson?.skills ?? [];

  // Ngân hàng mẫu (user) lọc theo lessonType của tuần.
  const { data: userTemplates = [], isLoading } = useQuery({
    queryKey: ["question-templates", lessonType],
    queryFn: () => questionTemplatesApi.list({ lessonType }),
    enabled: !!lessonType,
  });

  const createMut = useMutation({
    mutationFn: (input: TemplateInput) => questionTemplatesApi.create(input),
    onSuccess: invalidate,
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TemplateInput> }) =>
      questionTemplatesApi.update(id, input),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => questionTemplatesApi.delete(id),
    onSuccess: invalidate,
  });
  const saving = createMut.isPending || updateMut.isPending;

  return {
    currentLesson,
    lessonType,
    allowedSkills,
    userTemplates,
    isLoading,
    createMut,
    updateMut,
    deleteMut,
    saving,
  };
}
