import type { Subject } from "@/lib/types";

export const SUBJECT_LABELS: Record<Subject, string> = {
  english: "Tiếng Anh",
  math: "Toán",
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  english: "#2563eb",
  math: "#16a34a",
};

// Nhãn BẮT BUỘC nguyên văn cho weekly-minutes-chart.tsx (xem Global Constraints của kế hoạch) —
// time_spent_ms là thời gian TRONG câu hỏi do client tự báo cáo, không tính thời gian đọc lý
// thuyết/menu/audio và có thể bị giả mạo. KHÔNG được rút gọn thành "thời gian dùng app".
export const MINUTES_DISCLAIMER =
  "Phút làm bài / học viên / tuần (ước tính từ thời gian trả lời, không phải tổng thời gian dùng app)";

export const TIME_RANGE_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: "7 ngày qua" },
  { value: 30, label: "30 ngày qua" },
  { value: 90, label: "90 ngày qua" },
];
