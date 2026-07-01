// Nhãn + luồng trạng thái cho trang Bài học — tách từ page.tsx để dùng chung page + dialog + skill-picker.
// Thuần dữ liệu, không React. Giữ NGUYÊN VẸN.

import type { LessonStatus } from "@/lib/types";

// Loại bài học của MÔN TOÁN
export const MATH_LESSON_TYPE_LABELS: Record<string, string> = {
  // Số học
  counting:          "Đếm số",
  compare_quantity:  "So sánh số lượng qua hình",
  comparison:        "So sánh dấu > < =",
  number_decompose:  "Tách gộp số",
  sequence:          "Dãy số quy luật",
  sort_numbers:      "Sắp xếp dãy số",
  write_equation:    "Nhìn hình viết phép tính",
  complete_table:    "Hoàn thành bảng cộng/trừ",
  chain_calculation: "Chuỗi phép tính kết hợp",
  find_missing_number: "Tìm số ẩn",
  calculation:       "Tính kết quả",
  fill_blank:        "Điền số còn thiếu",
  word_problem:      "Toán có lời văn",
  // Hình học
  classify_2d:       "Phân loại hình phẳng",
  assemble_shapes:   "Lắp ghép / Xếp hình",
  shape_pattern:     "Quy luật chuỗi hình",
  match_object_shape: "Nối đồ vật với hình/khối",
  classify_3d:       "Phân loại hình khối 3D",
  spatial_orientation: "Vị trí không gian",
  geometry:          "Hình học tổng quát",
};

// Loại bài học của MÔN TIẾNG ANH
export const ENGLISH_LESSON_TYPE_LABELS: Record<string, string> = {
  vocabulary:        "Từ vựng",
  phonics:           "Phonics",
  image_choice:      "Chọn hình",
  missing_letter:    "Điền chữ còn thiếu",
  audio_choice:      "Nghe và chọn",
  reorder:           "Sắp xếp câu",
  match_word:        "Nối từ",
};

// Dùng chung cho cả 2 môn
export const SPECIAL_LESSON_TYPE_LABELS: Record<string, string> = {
  review:            "Ôn tập",
  boss:              "Boss Challenge",
};

// Bảng gộp — CHỈ dùng để tra nhãn (page hiển thị). KHÔNG dùng để render dropdown.
export const LESSON_TYPE_LABELS: Record<string, string> = {
  ...MATH_LESSON_TYPE_LABELS,
  ...ENGLISH_LESSON_TYPE_LABELS,
  ...SPECIAL_LESSON_TYPE_LABELS,
};

export const LESSON_TYPE_OPTIONS = Object.entries(LESSON_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// Kỹ năng MÔN TOÁN
export const MATH_SKILL_LABELS: Record<string, string> = {
  counting:            "Đếm số",
  number_recognition:  "Nhận diện số",
  sequence:            "Dãy số",
  pattern_recognition: "Nhận dạng quy luật",
  comparison:          "So sánh",
  logic_reasoning:     "Tư duy logic",
  number_decomposition: "Tách gộp số",
  addition:            "Phép cộng",
  subtraction:         "Phép trừ",
  mental_math:         "Tính nhẩm",
  "2d_shapes":         "Hình phẳng 2D",
  spatial_reasoning:   "Tư duy không gian",
  "3d_shapes":         "Hình khối 3D",
  fill_blank:          "Điền số",
  word_problem:        "Lời văn",
  geometry:            "Hình học",
  calculation:         "Tính toán",
};

// Kỹ năng MÔN TIẾNG ANH
export const ENGLISH_SKILL_LABELS: Record<string, string> = {
  vocab:               "Từ vựng",
  listening:           "Nghe",
  phonics:             "Phonics",
  reading:             "Đọc hiểu",
  sentence:            "Mẫu câu",
};

// Bảng gộp — CHỈ dùng để tra nhãn (page hiển thị). KHÔNG dùng để render picker.
export const SKILL_LABELS: Record<string, string> = {
  ...MATH_SKILL_LABELS,
  ...ENGLISH_SKILL_LABELS,
};

// Lọc theo môn cho dropdown/picker trong dialog bài học.
export function lessonTypeOptionsForSubject(
  subject?: string,
): { value: string; label: string }[] {
  const base =
    subject === "english"
      ? ENGLISH_LESSON_TYPE_LABELS
      : MATH_LESSON_TYPE_LABELS;
  return Object.entries({ ...base, ...SPECIAL_LESSON_TYPE_LABELS }).map(
    ([value, label]) => ({ value, label }),
  );
}

export function skillLabelsForSubject(subject?: string): Record<string, string> {
  return subject === "english" ? ENGLISH_SKILL_LABELS : MATH_SKILL_LABELS;
}

export const STATUS_LABELS: Record<LessonStatus, string> = {
  draft:    "Nháp",
  review:   "Chờ duyệt",
  approved: "Đã duyệt",
  published: "Xuất bản",
  archived: "Lưu trữ",
};

export const STATUS_FLOW: Record<LessonStatus, LessonStatus[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "review"],
  published: ["archived"],
  archived: [],
};
