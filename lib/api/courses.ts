import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  Course,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/lib/types";

export const coursesApi = {
  list: () => apiGet<Course[]>("/admin/courses"),
  create: (input: CreateCourseInput) =>
    apiPost<Course>("/admin/courses", input),
  update: (id: string, input: UpdateCourseInput) =>
    apiPatch<Course>(`/admin/courses/${id}`, input),
  archive: (id: string) => apiDelete<{ success: boolean }>(`/admin/courses/${id}`),
};
