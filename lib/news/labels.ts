import type { NewsStatus, NewsType } from "@/lib/types";

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  tip: "Mẹo học",
  update: "Cập nhật",
  event: "Sự kiện",
};

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  draft: "Nháp",
  published: "Đã đăng",
};
