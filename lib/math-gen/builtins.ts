// ============================================================
// STUDYVUI — Mẫu built-in (gốc từ engine/math/math_templates.js).
// 4 mẫu numeric chuyển sang DẠNG KHAI BÁO (text/formula/vars) để sửa được
// (clone → custom). Riêng "dãy số" giữ generator imperative (cần biến dẫn xuất).
// ============================================================
import type { MathTemplate, RawGenerated, TemplateVar } from "./types";

function num(name: string, min: number, max: number): TemplateVar {
  return { name, type: "number", min, max };
}
function text(name: string, choices: string[]): TemplateVar {
  return { name, type: "text", choices };
}

function declarative(
  id: string,
  lessonType: string,
  skill: string,
  tplText: string,
  formula: string,
  vars: TemplateVar[],
  condition?: string,
): MathTemplate {
  return {
    id,
    source: "builtin",
    lessonType,
    skill,
    grade: 1,
    text: tplText,
    formula,
    condition,
    vars,
    distractorCount: 3,
  };
}

// ── sequence: generator imperative (port nguyên) ─────────────
function genSequence(): RawGenerated {
  const step = Math.floor(Math.random() * 5) + 1;
  const start = Math.floor(Math.random() * 20);
  const seq = [start, start + step, start + step * 2, start + step * 3];
  const nextNum = start + step * 4;
  const options: number[] = [nextNum];
  while (options.length < 4) {
    const d = nextNum + Math.floor(Math.random() * 10) - 5;
    if (d >= 0 && !options.includes(d)) options.push(d);
  }
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return {
    text: `Điền số tiếp theo vào chỗ chấm: ${seq.join(", ")}, ...`,
    correct_answer: String(nextNum),
    options: options.map(String),
  };
}

// Nhóm built-in → templates (kỹ năng đã chuyển tiếng Việt).
export const BUILTIN_GROUPS: Record<string, MathTemplate[]> = {
  counting: [
    declarative(
      "TPL_COUNT_01",
      "counting",
      "counting",
      "Có bao nhiêu {item} trong hình?",
      "count",
      [num("count", 1, 5), text("item", ["quả táo", "con mèo", "chiếc xe", "ngôi sao"])],
    ),
  ],
  addition: [
    declarative(
      "TPL_ADD_01",
      "calculation",
      "addition",
      "Tính: {a} + {b} = ?",
      "a + b",
      [num("a", 1, 10), num("b", 1, 10)],
    ),
    declarative(
      "TPL_ADD_WORD_01",
      "word_problem",
      "word_problem",
      "Lan có {a} {item}. Mẹ cho Lan thêm {b} {item} nữa. Hỏi Lan có tất cả bao nhiêu {item}?",
      "a + b",
      [num("a", 1, 10), num("b", 1, 10), text("item", ["quyển vở", "cái kẹo", "quả cam", "viên bi"])],
    ),
  ],
  comparison: [
    declarative(
      "TPL_COMP_01",
      "comparison",
      "comparison",
      "Điền dấu thích hợp: {a} ... {b}",
      "comparison",
      [num("a", 0, 20), num("b", 0, 20)],
    ),
  ],
  sequence: [
    {
      id: "TPL_SEQ_01",
      source: "builtin",
      lessonType: "sequence",
      skill: "sequence",
      grade: 1,
      text: "Điền số tiếp theo vào chỗ chấm: {seq} ...",
      formula: "built-in",
      vars: [],
      distractorCount: 3,
      builtinGenerator: genSequence,
    },
  ],
};

// Map nhóm built-in → các lesson type được phép dùng (port BUILTIN_LT_MAP).
export const BUILTIN_LT_MAP: Record<string, string[]> = {
  counting: [
    "counting", "compare_quantity", "classify_2d", "classify_3d",
    "assemble_shapes", "match_object_shape", "shape_pattern",
    "spatial_orientation", "number_decompose",
  ],
  addition: [
    "calculation", "write_equation", "chain_calculation",
    "complete_table", "fill_blank", "find_missing_number", "word_problem",
  ],
  comparison: ["comparison", "compare_quantity", "find_missing_number"],
  sequence: ["sequence", "sort_numbers"],
};

/** Built-in khả dụng cho 1 lesson type (gộp các nhóm map tới lesson type đó). */
export function getBuiltinsForLessonType(lessonType: string): MathTemplate[] {
  const out: MathTemplate[] = [];
  for (const gk of Object.keys(BUILTIN_LT_MAP)) {
    if (BUILTIN_LT_MAP[gk].includes(lessonType)) {
      out.push(...(BUILTIN_GROUPS[gk] || []));
    }
  }
  return out;
}

export function getAllBuiltins(): MathTemplate[] {
  return Object.values(BUILTIN_GROUPS).flat();
}
