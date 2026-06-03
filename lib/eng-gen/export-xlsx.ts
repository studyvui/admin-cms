// ============================================================
// STUDYVUI — Xuất câu hỏi đã sinh ra Excel 12 cột (khớp Bulk Import).
// Dùng lại BULK_COLUMNS/BULK_HEADER_LABELS của lib/bulk-import.ts.
// ============================================================
import * as XLSX from "xlsx";
import { BULK_COLUMNS, BULK_HEADER_LABELS } from "@/lib/bulk-import";
import type { GeneratedQuestion } from "./types";
import { makeRng } from "./rng";
import { displayPrompt } from "./to-question";

// Chỉ các loại khớp 12 cột (4 đáp án, 1 đúng) + type hợp lệ rowSchema bulk.
const EXPORTABLE = new Set(["image_choice", "audio_choice", "missing_letter", "multiple_choice"]);

const LETTERS = ["A", "B", "C", "D"];

function stripAssetPrefix(path: string): string {
  // CDN key thật giữ tiền tố images/ · audio/ — chỉ bỏ "assets/".
  return (path || "").replace(/^\/?assets\//, "").trim();
}

function seedFromString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return h >>> 0;
}

export interface BulkRow {
  lessonCode: string;
  code: string;
  type: string;
  skill: string;
  difficulty: number;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string;
  assetRefs: string;
}

export interface ExportResult {
  rows: BulkRow[];
  skipped: { id: string; type: string; reason: string }[];
}

export interface ExportOpts {
  grade: number;
  week: number;
  startSeq?: number; // mặc định 101
}

/** Map danh sách câu đã sinh → các hàng 12 cột (loại bỏ loại không khớp). */
export function toBulkRows(questions: GeneratedQuestion[], opts: ExportOpts): ExportResult {
  const ww = String(opts.week).padStart(2, "0");
  const lessonCode = `G${opts.grade}_W${ww}_ENG`;
  let seq = opts.startSeq ?? 101;
  const rows: BulkRow[] = [];
  const skipped: { id: string; type: string; reason: string }[] = [];

  for (const q of questions) {
    const type = q.blueprintType;
    if (!EXPORTABLE.has(type)) {
      skipped.push({ id: q.id, type, reason: "Loại không khớp định dạng 12 cột (reorder/match_word/true_false)." });
      continue;
    }
    const correctAnswer = String(q.correct_answer || q.components.vocab || "").trim();
    const distractors = (q.components.distractors || []).map((d) => String(d).trim()).filter(Boolean);
    const optionsRaw = [correctAnswer, ...distractors].filter(Boolean);
    // Cần đúng 4 đáp án phân biệt
    const uniq = Array.from(new Set(optionsRaw));
    if (uniq.length < 4) {
      skipped.push({ id: q.id, type, reason: `Thiếu đáp án phân biệt (có ${uniq.length}/4).` });
      continue;
    }
    const four = uniq.slice(0, 4);
    // Xáo trộn ổn định theo code để đáp án đúng không luôn ở vị trí A
    const rng = makeRng(seedFromString(`${lessonCode}_${seq}`));
    const shuffled = four.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const correctIdx = shuffled.indexOf(correctAnswer);
    if (correctIdx < 0) {
      skipped.push({ id: q.id, type, reason: "Không xác định được vị trí đáp án đúng." });
      continue;
    }

    let assetRefs = "";
    if (type === "image_choice") assetRefs = stripAssetPrefix(q.components.assets.image);
    else if (type === "audio_choice") assetRefs = stripAssetPrefix(q.components.assets.audio);

    const code = `${lessonCode}_${String(seq).padStart(3, "0")}`;
    seq += 1;

    rows.push({
      lessonCode,
      code,
      type,
      skill: q.skill,
      difficulty: Math.min(5, Math.max(1, q.difficulty || 1)),
      prompt: displayPrompt(q),
      optionA: shuffled[0],
      optionB: shuffled[1],
      optionC: shuffled[2],
      optionD: shuffled[3],
      correct: LETTERS[correctIdx],
      assetRefs,
    });
  }

  return { rows, skipped };
}

/** Tạo workbook XLSX với header nhãn tiếng Việt (sheet đầu = dữ liệu để Bulk Import đọc). */
export function buildWorkbook(rows: BulkRow[]): XLSX.WorkBook {
  const header = BULK_COLUMNS.map((c) => BULK_HEADER_LABELS[c]);
  const data = rows.map((r) => BULK_COLUMNS.map((c) => (r as unknown as Record<string, unknown>)[c]));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws["!cols"] = BULK_COLUMNS.map((c) => ({ wch: Math.max(BULK_HEADER_LABELS[c].length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  return wb;
}

/** Tải file .xlsx về máy (gọi trong browser). */
export function downloadBulkXlsx(rows: BulkRow[], filename: string): void {
  const wb = buildWorkbook(rows);
  XLSX.writeFile(wb, filename);
}
