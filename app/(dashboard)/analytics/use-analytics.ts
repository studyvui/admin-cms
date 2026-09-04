"use client";

// Data layer cho trang Báo cáo phân tích (GĐ3) — 6 hook, mỗi hook 1 useQuery ứng với 1 endpoint
// /admin/analytics/*. Không có mutation (trang chỉ đọc). staleTime khớp TTL cache phía backend
// (cache.service.ts) — tránh gọi lại API khi dữ liệu backend chắc chắn chưa đổi.

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["admin-analytics", "overview"],
    queryFn: analyticsApi.overview,
    staleTime: 5 * 60 * 1000, // 300s, khớp TTL cache overview ở backend
  });
}

export function useActiveLearners(days: number) {
  return useQuery({
    queryKey: ["admin-analytics", "active-learners", days],
    queryFn: () => analyticsApi.activeLearners(days),
    staleTime: 15 * 60 * 1000, // 900s
  });
}

export function useWeeklyMinutes(weeks: number) {
  return useQuery({
    queryKey: ["admin-analytics", "weekly-minutes", weeks],
    queryFn: () => analyticsApi.weeklyMinutes(weeks),
    staleTime: 60 * 60 * 1000, // 3600s
  });
}

export function useHourHistogram(days: number) {
  return useQuery({
    queryKey: ["admin-analytics", "hour-histogram", days],
    queryFn: () => analyticsApi.hourHistogram(days),
    staleTime: 60 * 60 * 1000, // 3600s
  });
}

export function useSubjectSplit(days: number) {
  return useQuery({
    queryKey: ["admin-analytics", "subject-split", days],
    queryFn: () => analyticsApi.subjectSplit(days),
    staleTime: 15 * 60 * 1000, // 900s
  });
}

export function useProblemLessons() {
  return useQuery({
    queryKey: ["admin-analytics", "problem-lessons"],
    queryFn: analyticsApi.problemLessons,
    staleTime: 30 * 60 * 1000, // 1800s
  });
}
