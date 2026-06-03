// ============================================================
// Nhãn tiếng Việt cho lessonType + skill (đồng bộ với trang Bài học).
// Giá trị lưu là KEY tiếng Anh (vd "counting"), hiển thị nhãn tiếng Việt.
// ============================================================

export const LESSON_TYPE_LABELS: Record<string, string> = {
  counting: "Đếm số",
  compare_quantity: "So sánh số lượng qua hình",
  comparison: "So sánh dấu > < =",
  number_decompose: "Tách gộp số",
  sequence: "Dãy số quy luật",
  sort_numbers: "Sắp xếp dãy số",
  write_equation: "Nhìn hình viết phép tính",
  complete_table: "Hoàn thành bảng cộng/trừ",
  chain_calculation: "Chuỗi phép tính kết hợp",
  find_missing_number: "Tìm số ẩn",
  calculation: "Tính kết quả",
  fill_blank: "Điền số còn thiếu",
  word_problem: "Toán có lời văn",
  classify_2d: "Phân loại hình phẳng",
  assemble_shapes: "Lắp ghép / Xếp hình",
  shape_pattern: "Quy luật chuỗi hình",
  match_object_shape: "Nối đồ vật với hình/khối",
  classify_3d: "Phân loại hình khối 3D",
  spatial_orientation: "Vị trí không gian",
  geometry: "Hình học tổng quát",
  vocabulary: "Từ vựng",
  phonics: "Phonics",
  review: "Ôn tập",
  boss: "Boss Challenge",
};

export const SKILL_LABELS: Record<string, string> = {
  counting: "Đếm số",
  number_recognition: "Nhận diện số",
  sequence: "Dãy số",
  pattern_recognition: "Nhận dạng quy luật",
  comparison: "So sánh",
  logic_reasoning: "Tư duy logic",
  number_decomposition: "Tách gộp số",
  addition: "Phép cộng",
  subtraction: "Phép trừ",
  mental_math: "Tính nhẩm",
  "2d_shapes": "Hình phẳng 2D",
  spatial_reasoning: "Tư duy không gian",
  "3d_shapes": "Hình khối 3D",
  fill_blank: "Điền số",
  word_problem: "Lời văn",
  geometry: "Hình học",
  calculation: "Tính toán",
  vocab: "Từ vựng",
  listening: "Nghe",
  phonics: "Phonics",
};

export function lessonTypeLabel(key: string): string {
  return LESSON_TYPE_LABELS[key] ?? key;
}
export function skillLabel(key: string): string {
  return SKILL_LABELS[key] ?? key;
}
