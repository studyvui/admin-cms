// Nhãn hiển thị + luồng trạng thái cho trang Câu hỏi — tách từ page.tsx để dùng chung giữa
// trang danh sách và dialog. Thuần dữ liệu, không React. Giữ NGUYÊN VẸN.

import type { QuestionStatus } from "@/lib/types";

export const STATUS_FLOW: Record<QuestionStatus, QuestionStatus[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "review"],
  published: ["deprecated"],
  deprecated: [],
};

export const SKILL_LABELS: Record<string, string> = {
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
  vocab:               "Từ vựng",
  listening:           "Nghe",
  phonics:             "Phonics",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice:   "Trắc nghiệm",
  image_choice:      "Chọn hình",
  audio_choice:      "Nghe và chọn",
  missing_letter:    "Điền chữ còn thiếu",
  fill_blank:        "Điền số còn thiếu",
  matching:          "Nối từ",
  reorder:           "Sắp xếp câu",
  count_objects:     "Đếm đồ vật",
  number_recognition: "Nhận diện số",
  compare_numbers:   "So sánh số",
};

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  draft:      "Nháp",
  review:     "Chờ duyệt",
  approved:   "Đã duyệt",
  published:  "Xuất bản",
  deprecated: "Ngừng dùng",
};

export const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS);

// Nhãn hiển thị cho dropdown "Chế độ nhập".
export const MODE_LABELS: Record<string, string> = {
  mc: "Trắc nghiệm 4 lựa chọn (đơn giản)",
  letter: "Điền chữ còn thiếu (kéo thẻ chữ)",
  audio_choice: "Nghe rồi chọn ảnh",
  image_choice: "Ảnh rồi chọn từ",
  reorder: "Câu (sắp xếp)",
  json: "JSON raw (nâng cao)",
};
