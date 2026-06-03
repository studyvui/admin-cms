import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { ServerTemplate, TemplateInput } from "@/lib/math-gen/types";

interface ListParams {
  lessonType?: string;
  grade?: number;
}

export const questionTemplatesApi = {
  list: (params: ListParams = {}) =>
    apiGet<ServerTemplate[]>("/admin/question-templates", { params }),
  get: (id: string) => apiGet<ServerTemplate>(`/admin/question-templates/${id}`),
  create: (input: TemplateInput) =>
    apiPost<ServerTemplate>("/admin/question-templates", input),
  update: (id: string, input: Partial<TemplateInput>) =>
    apiPatch<ServerTemplate>(`/admin/question-templates/${id}`, input),
  delete: (id: string) =>
    apiDelete<{ success: boolean }>(`/admin/question-templates/${id}`),
};
