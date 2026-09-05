"use client";

// Data layer cho trang Bảng tin — tách từ page.tsx, per-entity (KHÔNG generic),
// theo đúng khuôn use-questions.ts.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { newsApi } from "@/lib/api/news";
import type { NewsStatus, NewsType, UpdateNewsInput } from "@/lib/types";

export interface NewsFilters {
  status?: NewsStatus;
  type?: NewsType;
  q?: string;
}

export function useNews(filters: NewsFilters) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["news"] });

  const newsQuery = useQuery({
    queryKey: ["news", filters],
    queryFn: () => newsApi.list(filters),
  });

  const createMut = useMutation({
    mutationFn: newsApi.create,
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNewsInput }) =>
      newsApi.update(id, input),
    onSuccess: invalidate,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: NewsStatus }) =>
      newsApi.changeStatus(id, status),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: invalidate,
  });

  return {
    news: newsQuery.data,
    isLoading: newsQuery.isLoading,
    error: newsQuery.error,
    createMut,
    updateMut,
    statusMut,
    deleteMut,
  };
}
