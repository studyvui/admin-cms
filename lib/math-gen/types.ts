// ============================================================
// STUDYVUI — Math Generator (admin-cms) — Types
// Mô hình "Ngân hàng mẫu" (port từ admin_math.html):
//   template { text {a}{b}.., formula, vars[number|text], distractorCount }
//   sinh đề = random biến trong [min,max] / chọn trong choices → thế text →
//   tính đáp án bằng formula → sinh nhiễu. KHÔNG auto-map ảnh/audio.
// ============================================================

export type VarType = "number" | "text";

export interface TemplateVar {
  name: string; // a, b, c, d
  type: VarType;
  min?: number; // number
  max?: number; // number
  choices?: string[]; // text — danh sách lựa chọn
}

export type TemplateSource = "builtin" | "user";
export type OptionsType = "numeric" | "comparison";

/** Mẫu trên backend (Supabase) — khớp model QuestionTemplate. */
export interface ServerTemplate {
  id: string;
  lessonType: string;
  skill: string;
  grade: number;
  text: string;
  formula: string;
  condition?: string | null;
  vars: TemplateVar[];
  distractorCount: number;
  source: string;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Mẫu dùng trong UI: built-in (có generator) hoặc user (formula + vars). */
export interface MathTemplate {
  id: string;
  source: TemplateSource;
  lessonType: string;
  skill: string;
  grade: number;
  text: string;
  formula: string;
  condition?: string;
  vars: TemplateVar[];
  distractorCount: number;
  /** chỉ built-in dạng imperative (vd sequence): hàm sinh trực tiếp. */
  builtinGenerator?: (grade: number, difficulty: number) => RawGenerated;
}

/** Kết quả thô từ generator built-in. */
export interface RawGenerated {
  text: string;
  correct_answer: string;
  options: string[];
  meta?: { itemKeyword?: string };
}

export interface GeneratedMathQuestion {
  id: string;
  templateId: string;
  lessonType: string;
  skill: string;
  grade: number;
  week: number;
  difficulty: number;
  text: string;
  options: string[];
  correct_answer: string;
  optionsType: OptionsType;
  vars: Record<string, string | number>;
  /** ảnh/audio admin gắn ở modal Xem trước & Chỉnh sửa (CDN key). */
  assetRefs: string[];
}

export interface MathGenReport {
  generated: number;
  skipped_dup: number;
}

/** Input form lưu/sửa template (gửi backend). */
export interface TemplateInput {
  lessonType: string;
  skill: string;
  grade: number;
  text: string;
  formula: string;
  condition?: string;
  vars: TemplateVar[];
  distractorCount: number;
}
