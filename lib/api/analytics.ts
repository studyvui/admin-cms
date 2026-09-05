import { apiGet } from "@/lib/api-client";
import type {
  AnalyticsOverview,
  ActiveLearnerPoint,
  WeeklyMinutesPoint,
  HourHistogramPoint,
  SubjectSplitItem,
  ProblemLessonItem,
  ActiveLearnerDetailItem,
} from "@/lib/types";

// API báo cáo phân tích khách hàng (GĐ3) — 6 endpoint đọc từ /admin/analytics/*, tất cả admin-only
// (backend @Roles(admin) ở class level admin-analytics.controller.ts).
export const analyticsApi = {
  overview: () => apiGet<AnalyticsOverview>("/admin/analytics/overview"),
  activeLearners: (days: number) =>
    apiGet<ActiveLearnerPoint[]>("/admin/analytics/active-learners", {
      params: { days },
    }),
  weeklyMinutes: (weeks: number) =>
    apiGet<WeeklyMinutesPoint[]>("/admin/analytics/weekly-minutes", {
      params: { weeks },
    }),
  hourHistogram: (days: number) =>
    apiGet<HourHistogramPoint[]>("/admin/analytics/hour-histogram", {
      params: { days },
    }),
  subjectSplit: (days: number) =>
    apiGet<SubjectSplitItem[]>("/admin/analytics/subject-split", {
      params: { days },
    }),
  problemLessons: (days: number) =>
    apiGet<ProblemLessonItem[]>("/admin/analytics/problem-lessons", {
      params: { days },
    }),
  activeLearnersDetail: (day: string) =>
    apiGet<ActiveLearnerDetailItem[]>("/admin/analytics/active-learners-detail", {
      params: { day },
    }),
};
