// Nhãn hiển thị cho trang Cài đặt — thuần dữ liệu, không React.

import type { SettingType } from "@/lib/types";

export const SETTING_CATEGORY_LABELS: Record<string, string> = {
  system: "Hệ thống",
  news: "Bảng tin",
  analytics: "Phân tích",
  general: "Chung",
};

export const SETTING_TYPE_LABELS: Record<SettingType, string> = {
  boolean: "Bật/tắt",
  number: "Số",
  string: "Văn bản",
  json: "JSON",
};
