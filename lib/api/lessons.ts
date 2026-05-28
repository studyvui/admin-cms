import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  CreateLessonInput,
  Lesson,
  LessonStatus,
  UpdateLessonInput,
} from "@/lib/types";

interface ListLessonsParams {
  courseId?: string;
  status?: LessonStatus;
  week?: number;
}

export const lessonsApi = {
  list: (params: ListLessonsParams = {}) =>
    apiGet<Lesson[]>("/admin/lessons", { params }),
  get: (id: string) => apiGet<Lesson>(`/admin/lessons/${id}`),
  create: (input: CreateLessonInput) =>
    apiPost<Lesson>("/admin/lessons", input),
  update: (id: string, input: UpdateLessonInput) =>
    apiPatch<Lesson>(`/admin/lessons/${id}`, input),
  changeStatus: (id: string, status: LessonStatus) =>
    apiPatch<Lesson>(`/admin/lessons/${id}/status`, { status }),
  delete: (id: string) =>
    apiDelete<{ success: boolean }>(`/admin/lessons/${id}`),
  reorder: (lessonIds: string[]) =>
    apiPost<{ success: boolean }>("/admin/lessons/reorder", { lessonIds }),
};
