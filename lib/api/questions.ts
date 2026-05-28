import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  CreateQuestionInput,
  Question,
  QuestionStatus,
  UpdateQuestionInput,
} from "@/lib/types";

interface ListQuestionsParams {
  lessonId?: string;
  status?: QuestionStatus;
  skill?: string;
}

interface BulkUploadResult {
  inserted: number;
  skipped: number;
  errors: { index: number; message: string }[];
}

export const questionsApi = {
  list: (params: ListQuestionsParams = {}) =>
    apiGet<Question[]>("/admin/questions", { params }),
  get: (id: string) => apiGet<Question>(`/admin/questions/${id}`),
  create: (input: CreateQuestionInput) =>
    apiPost<Question>("/admin/questions", input),
  update: (id: string, input: UpdateQuestionInput) =>
    apiPatch<Question>(`/admin/questions/${id}`, input),
  changeStatus: (id: string, status: QuestionStatus) =>
    apiPatch<Question>(`/admin/questions/${id}/status`, { status }),
  delete: (id: string) =>
    apiDelete<{ success: boolean }>(`/admin/questions/${id}`),
  bulkUpload: (questions: CreateQuestionInput[]) =>
    apiPost<BulkUploadResult>("/admin/questions/bulk-upload", { questions }),
};
