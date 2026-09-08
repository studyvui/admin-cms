import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  CreateNewsInput,
  NewsPost,
  NewsStatus,
  NewsType,
  UpdateNewsInput,
} from "@/lib/types";

interface ListNewsParams {
  status?: NewsStatus;
  type?: NewsType;
  q?: string;
}

export const newsApi = {
  list: (params: ListNewsParams = {}) =>
    apiGet<NewsPost[]>("/admin/news", { params }),
  get: (id: string) => apiGet<NewsPost>(`/admin/news/${id}`),
  create: (input: CreateNewsInput) =>
    apiPost<NewsPost>("/admin/news", input),
  update: (id: string, input: UpdateNewsInput) =>
    apiPatch<NewsPost>(`/admin/news/${id}`, input),
  changeStatus: (id: string, status: NewsStatus) =>
    apiPatch<NewsPost>(`/admin/news/${id}/status`, { status }),
  delete: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`/admin/news/${id}`),
};
