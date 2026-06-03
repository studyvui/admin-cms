// ============================================================
// STUDYVUI — Xuất câu hỏi Toán đã sinh ra Excel 12 cột (khớp Bulk Import).
// type='multiple_choice', lessonCode=G{grade}_W{ww}_MATH, assetRefs = ảnh/audio
// admin đã gắn ở modal Xem trước & Chỉnh sửa. Bỏ câu < 4 đáp án (comparison).
// ============================================================
import * as XLSX from "xlsx";
import { BULK_COLUMNS, BULK_HEADER_LABELS } from "@/lib/bulk-import";
import type { GeneratedMathQuestion } from "./types";

const LETTERS = ["A", "B", "C", "D"];

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
  skipped: { id: string; reason: string }[];
}

export interface ExportOpts {
  grade: number;
  week: number;
  startSeq?: number; // mặc định 101
}

function stripAssetPrefix(path: string): string {
  // CDN key thật giữ tiền tố images/ · audio/ — chỉ bỏ "assets/".
  return (path || "").replace(/^\/?assets\//, "").trim();
}

function seedFromString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function toBulkRows(questions: GeneratedMathQuestion[], opts: ExportOpts): ExportResult {
  const ww = String(opts.week).padStart(2, "0");
  const lessonCode = `G${opts.grade}_W${ww}_MATH`;
  let seq = opts.startSeq ?? 101;
  const rows: BulkRow[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const q of questions) {
    if (q.optionsType === "comparison") {
      skipped.push({ id: q.id, reason: "comparison (dấu < > =) chỉ 3 lựa chọn — chưa khớp 12 cột." });
      continue;
    }
    const correct = String(q.correct_answer).trim();
    const uniq = Array.from(new Set([correct, ...q.options.map((o) => String(o).trim())].filter(Boolean)));
    if (uniq.length < 4) {
      skipped.push({ id: q.id, reason: `Thiếu đáp án phân biệt (có ${uniq.length}/4).` });
      continue;
    }
    const four = uniq.slice(0, 4);
    const code = `${lessonCode}_${String(seq).padStart(3, "0")}`;
    const rng = mulberry32(seedFromString(code));
    const shuffled = four.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const correctIdx = shuffled.indexOf(correct);
    if (correctIdx < 0) {
      skipped.push({ id: q.id, reason: "Không xác định được vị trí đáp án đúng." });
      continue;
    }
    seq += 1;

    rows.push({
      lessonCode,
      code,
      type: "multiple_choice",
      skill: q.skill,
      difficulty: Math.min(5, Math.max(1, q.difficulty || 1)),
      prompt: q.text,
      optionA: shuffled[0],
      optionB: shuffled[1],
      optionC: shuffled[2],
      optionD: shuffled[3],
      correct: LETTERS[correctIdx],
      assetRefs: (q.assetRefs || []).map(stripAssetPrefix).filter(Boolean).join(", "),
    });
  }

  return { rows, skipped };
}

export function buildWorkbook(rows: BulkRow[]): XLSX.WorkBook {
  const header = BULK_COLUMNS.map((c) => BULK_HEADER_LABELS[c]);
  const data = rows.map((r) => BULK_COLUMNS.map((c) => (r as unknown as Record<string, unknown>)[c]));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws["!cols"] = BULK_COLUMNS.map((c) => ({ wch: Math.max(BULK_HEADER_LABELS[c].length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  return wb;
}

export function downloadBulkXlsx(rows: BulkRow[], filename: string): void {
  const wb = buildWorkbook(rows);
  XLSX.writeFile(wb, filename);
}
