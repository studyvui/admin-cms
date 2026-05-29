import { z } from "zod";
import * as XLSX from "xlsx";
import type { CreateQuestionInput, Lesson } from "@/lib/types";

export const BULK_COLUMNS = [
  "lessonCode",
  "code",
  "type",
  "skill",
  "difficulty",
  "prompt",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correct",
  "assetRefs",
] as const;

export const BULK_HEADER_LABELS: Record<(typeof BULK_COLUMNS)[number], string> = {
  lessonCode: "Mã bài học",
  code: "Mã câu hỏi",
  type: "Loại câu hỏi",
  skill: "Kỹ năng",
  difficulty: "Độ khó (1-5)",
  prompt: "Đề bài",
  optionA: "Lựa chọn A",
  optionB: "Lựa chọn B",
  optionC: "Lựa chọn C",
  optionD: "Lựa chọn D",
  correct: "Đáp án đúng (A/B/C/D)",
  assetRefs: "Asset refs (phân tách bằng dấu phẩy)",
};

const QUESTION_TYPES = [
  "multiple_choice",
  "image_choice",
  "audio_choice",
  "missing_letter",
  "fill_blank",
  "matching",
  "reorder",
  "count_objects",
  "number_recognition",
  "compare_numbers",
];

export const rowSchema = z.object({
  lessonCode: z.string().min(1, "Mã bài học bắt buộc"),
  code: z
    .string()
    .min(3, "Mã câu hỏi tối thiểu 3 ký tự")
    .regex(/^[A-Z0-9_]+$/, "Mã câu hỏi chỉ chữ HOA / số / _"),
  type: z.string().refine((v) => QUESTION_TYPES.includes(v), {
    message: `Loại phải là 1 trong: ${QUESTION_TYPES.join(", ")}`,
  }),
  skill: z.string().min(1, "Kỹ năng bắt buộc"),
  difficulty: z.coerce.number().int().min(1, "1-5").max(5, "1-5"),
  prompt: z.string().min(1, "Đề bài bắt buộc"),
  optionA: z.string().min(1, "Lựa chọn A bắt buộc"),
  optionB: z.string().min(1, "Lựa chọn B bắt buộc"),
  optionC: z.string().min(1, "Lựa chọn C bắt buộc"),
  optionD: z.string().min(1, "Lựa chọn D bắt buộc"),
  correct: z.enum(["A", "B", "C", "D"], {
    message: "Đáp án phải là A, B, C hoặc D",
  }),
  assetRefs: z.string().optional(),
});

export type ParsedRow = z.infer<typeof rowSchema>;

export interface ImportRowResult {
  rowNumber: number;
  raw: Record<string, unknown>;
  status: "valid" | "invalid";
  errors: string[];
  parsed?: ParsedRow;
  resolvedLessonId?: string;
}

function normalizeKey(k: string): string {
  // Match by both English key and Vietnamese label
  const trimmed = k.trim();
  for (const col of BULK_COLUMNS) {
    if (trimmed === col || trimmed === BULK_HEADER_LABELS[col]) return col;
  }
  return trimmed;
}

export function parseWorkbook(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: false,
  });
  return raw.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[normalizeKey(k)] = v;
    }
    return normalized;
  });
}

export function validateRows(
  rawRows: Record<string, unknown>[],
  lessonByCode: Map<string, Lesson>,
): ImportRowResult[] {
  return rawRows.map((raw, idx) => {
    const rowNumber = idx + 2; // header is row 1
    const errors: string[] = [];

    const result = rowSchema.safeParse(raw);
    if (!result.success) {
      result.error.issues.forEach((e) => {
        const path = e.path.join(".");
        errors.push(`${path}: ${e.message}`);
      });
      return { rowNumber, raw, status: "invalid", errors };
    }

    const lesson = lessonByCode.get(result.data.lessonCode);
    if (!lesson) {
      errors.push(`lessonCode: không tìm thấy bài học "${result.data.lessonCode}"`);
      return { rowNumber, raw, status: "invalid", errors, parsed: result.data };
    }

    return {
      rowNumber,
      raw,
      status: "valid",
      errors: [],
      parsed: result.data,
      resolvedLessonId: lesson.id,
    };
  });
}

export function toCreateInput(r: ImportRowResult): CreateQuestionInput | null {
  if (r.status !== "valid" || !r.parsed || !r.resolvedLessonId) return null;
  const p = r.parsed;
  const options = [p.optionA, p.optionB, p.optionC, p.optionD];
  const correctIdx = ["A", "B", "C", "D"].indexOf(p.correct);
  const assetRefs = (p.assetRefs ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    lessonId: r.resolvedLessonId,
    code: p.code,
    type: p.type,
    skill: p.skill,
    difficulty: p.difficulty,
    content: { prompt: p.prompt, options },
    correctAnswer: options[correctIdx],
    assetRefs,
  };
}

export function buildTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const headerRow = BULK_COLUMNS.map((c) => BULK_HEADER_LABELS[c]);
  const sampleRow = [
    "G1_W01_VOCAB_GREETINGS",
    "G1_W01_VOCAB_010",
    "multiple_choice",
    "vocab",
    1,
    "Hello có nghĩa là gì?",
    "Xin chào",
    "Tạm biệt",
    "Cảm ơn",
    "Xin lỗi",
    "A",
    "grade1/english/hello_1.png",
  ];
  const helpRow = BULK_COLUMNS.map((c) => `<${c}>`);
  const ws = XLSX.utils.aoa_to_sheet([headerRow, sampleRow, helpRow]);
  ws["!cols"] = BULK_COLUMNS.map((c) => ({
    wch: Math.max(BULK_HEADER_LABELS[c].length + 2, 14),
  }));
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  return wb;
}

export function downloadTemplateXlsx(filename = "questions_template.xlsx") {
  const wb = buildTemplateWorkbook();
  XLSX.writeFile(wb, filename);
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
