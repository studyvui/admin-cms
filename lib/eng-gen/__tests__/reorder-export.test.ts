// ============================================================
// Reorder: xuất 12 cột (quy ước optionA = cả câu) + roundtrip Bulk Import.
// ============================================================
import { describe, it, expect } from "vitest";
import { toBulkRows } from "../export-xlsx";
import type { GeneratedQuestion } from "../types";
import { rowSchema, toCreateInput, shuffleStable, type ImportRowResult } from "@/lib/bulk-import";

function reorderQ(id: string, sentence: string): GeneratedQuestion {
  const correctOrder = sentence.split(/\s+/);
  return {
    id,
    grade: 1,
    week: 1,
    skill: "sentence",
    blueprintType: "reorder",
    blueprint_type: "reorder",
    difficulty: 1,
    lifecycleStatus: "draft",
    components: { stem: "Sắp xếp các từ thành câu đúng", vocab: null, meaning: null, distractors: [], assets: { image: "", audio: "" } },
    correct_answer: sentence,
    render_spec: {
      blueprint_type: "reorder",
      vocab_word: null, image_path: null, audio_path: null, missing_word: null,
      gap_position: null, correct_letter: null,
      sentence_words: [...correctOrder].reverse(),
      correct_order: correctOrder,
    },
    variable_values: { word: null, grade: 1, week: 1 },
    distractor_strategy: "mixed",
    template_id: "sentence_reorder_l2",
    syncStatus: "pending",
    tags: [],
  } as unknown as GeneratedQuestion;
}

describe("toBulkRows — reorder (không còn bị skip)", () => {
  it("map câu reorder vào 12 cột theo quy ước optionA = cả câu", () => {
    const { rows, skipped } = toBulkRows([reorderQ("Q1", "It is a pen")], { grade: 1, week: 1 });
    expect(skipped).toHaveLength(0);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.type).toBe("reorder");
    expect(r.optionA).toBe("It is a pen");
    expect(r.optionB).toBe("");
    expect(r.optionC).toBe("");
    expect(r.optionD).toBe("");
    expect(r.correct).toBe("A");
  });

  it("bỏ qua câu reorder chỉ có 1 từ", () => {
    const { rows, skipped } = toBulkRows([reorderQ("Q2", "Jump")], { grade: 1, week: 1 });
    expect(rows).toHaveLength(0);
    expect(skipped).toHaveLength(1);
  });
});

describe("Roundtrip: export → rowSchema → toCreateInput", () => {
  function importRow(row: Record<string, unknown>): ReturnType<typeof toCreateInput> {
    const parsed = rowSchema.parse(row);
    const result: ImportRowResult = {
      rowNumber: 2, raw: row, status: "valid", errors: [], parsed, resolvedLessonId: "lesson-1",
    };
    return toCreateInput(result);
  }

  it("giữ nguyên câu đúng + items là hoán vị của thứ tự đúng", () => {
    const { rows } = toBulkRows([reorderQ("Q3", "How old are you")], { grade: 1, week: 3, lessonCode: "G1_W03_ENG" });
    const input = importRow({ ...rows[0] });
    expect(input).not.toBeNull();
    expect(input!.type).toBe("reorder");
    expect(input!.correctAnswer).toBe("How old are you");
    const content = input!.content as { correct_order: string[]; items: string[] };
    expect(content.correct_order).toEqual(["How", "old", "are", "you"]);
    expect([...content.items].sort()).toEqual([...content.correct_order].sort());
  });
});

describe("rowSchema — nới cho reorder, giữ chặt cho 4-đáp-án", () => {
  const base = { lessonCode: "G1_W03_ENG", code: "G1_W03_ENG_101", skill: "sentence", difficulty: 1, prompt: "Sắp xếp" };

  it("reorder: chỉ cần optionA (câu ≥ 2 từ), B/C/D rỗng OK", () => {
    const ok = rowSchema.safeParse({ ...base, type: "reorder", optionA: "It is a pen", optionB: "", optionC: "", optionD: "", correct: "A" });
    expect(ok.success).toBe(true);
  });

  it("reorder: 1 từ -> lỗi", () => {
    const bad = rowSchema.safeParse({ ...base, type: "reorder", optionA: "pen", optionB: "", optionC: "", optionD: "", correct: "A" });
    expect(bad.success).toBe(false);
  });

  it("multiple_choice: vẫn bắt buộc B/C/D + correct A-D", () => {
    const bad = rowSchema.safeParse({ ...base, type: "multiple_choice", optionA: "a", optionB: "", optionC: "", optionD: "", correct: "A" });
    expect(bad.success).toBe(false);
  });
});

describe("shuffleStable", () => {
  it("cùng seed -> cùng kết quả (xác định)", () => {
    const a = shuffleStable(["a", "b", "c", "d"], "CODE1");
    const b = shuffleStable(["a", "b", "c", "d"], "CODE1");
    expect(a).toEqual(b);
  });
  it("giữ nguyên đa tập phần tử", () => {
    const out = shuffleStable(["It", "is", "a", "pen"], "X");
    expect([...out].sort()).toEqual(["It", "a", "is", "pen"].sort());
  });
});
