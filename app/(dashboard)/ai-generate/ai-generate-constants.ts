import type { Skill } from "@/lib/eng-gen/types";

// Mục 93 Đợt 4c: hằng của trang AI Sinh đề Tiếng Anh, tách nguyên văn từ page.tsx;
// dùng chung bởi page.tsx và ai-generate-preview-card.tsx (một nguồn duy nhất).
const SKILLS: { value: Skill; label: string }[] = [
  { value: "vocabulary", label: "Từ vựng" },
  { value: "phonics", label: "Phonics" },
  { value: "sentence", label: "Câu (sắp xếp)" },
  { value: "listening", label: "Nghe" },
  { value: "review", label: "Ôn tập" },
];


type InputMode = "letter" | "audio_choice" | "image_choice";

const INPUT_MODES: { value: InputMode; label: string }[] = [
  { value: "letter", label: "Điền chữ còn thiếu (kéo thẻ chữ)" },
  { value: "audio_choice", label: "Nghe rồi chọn ảnh" },
  { value: "image_choice", label: "Ảnh rồi chọn từ" },
];

const EXPORTABLE = new Set(["image_choice", "audio_choice", "missing_letter", "multiple_choice", "reorder"]);
const DIFF_COLOR: Record<number, string> = { 1: "#10b981", 2: "#f59e0b", 3: "#ef4444" };

// Mapping DB skill keys → generator Skill type (case-insensitive lookup)
const DB_SKILL_TO_GENERATOR: Record<string, Skill> = {
  vocabulary: "vocabulary",
  vocab: "vocabulary",
  "từ vựng": "vocabulary",
  phonics: "phonics",
  sentence: "sentence",
  listening: "listening",
  nghe: "listening",
  review: "review",
  "ôn tập": "review",
};

export { SKILLS, INPUT_MODES, EXPORTABLE, DIFF_COLOR, DB_SKILL_TO_GENERATOR, type InputMode };
