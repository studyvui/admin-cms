import { describe, it, expect } from "vitest";
import {
  resolveVarValue,
  renderText,
  evaluateFormula,
  generateDistractors,
  evaluateCondition,
  resolveVarsWithCondition,
} from "../evaluate";
import { generateBatch, generateOne } from "../generate";
import { getBuiltinsForLessonType, getAllBuiltins } from "../builtins";
import { toBulkRows } from "../export-xlsx";
import type { MathTemplate, TemplateVar } from "../types";

describe("resolveVarValue", () => {
  it("number → trong [min,max]", () => {
    const v: TemplateVar = { name: "a", type: "number", min: 3, max: 7 };
    for (let i = 0; i < 200; i++) {
      const val = resolveVarValue(v) as number;
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
  it("text → luôn nằm trong choices", () => {
    const v: TemplateVar = { name: "a", type: "text", choices: ["Lan", "Mai", "Tuấn"] };
    for (let i = 0; i < 100; i++) {
      expect(["Lan", "Mai", "Tuấn"]).toContain(resolveVarValue(v));
    }
  });
});

describe("renderText", () => {
  it("thế nhiều biến", () => {
    expect(renderText("Bạn {a} có {b} bi", { a: "Lan", b: 5 })).toBe("Bạn Lan có 5 bi");
  });
});

describe("evaluateFormula", () => {
  it("numeric: a + b", () => {
    expect(evaluateFormula("a + b", { a: 3, b: 4 })).toEqual({ answer: 7, optionsType: "numeric" });
  });
  it("numeric: a - b", () => {
    expect(evaluateFormula("a - b", { a: 9, b: 4 })).toEqual({ answer: 5, optionsType: "numeric" });
  });
  it("comparison", () => {
    expect(evaluateFormula("comparison", { a: 5, b: 3 }).answer).toBe(">");
    expect(evaluateFormula("comparison", { a: 2, b: 8 }).answer).toBe("<");
    expect(evaluateFormula("comparison", { a: 4, b: 4 }).answer).toBe("=");
  });
  it("bỏ qua biến text trong công thức số (không crash)", () => {
    const r = evaluateFormula("b - c", { a: "Lan", b: 8, c: 3 });
    expect(r).toEqual({ answer: 5, optionsType: "numeric" });
  });
  it("biểu thức không an toàn → '?'", () => {
    expect(evaluateFormula("a + window", { a: 1 }).answer).toBe("?");
  });
});

describe("evaluateCondition", () => {
  it("rỗng → true", () => {
    expect(evaluateCondition("", { a: 1 })).toBe(true);
    expect(evaluateCondition(undefined, { a: 1 })).toBe(true);
  });
  it("c > b", () => {
    expect(evaluateCondition("c > b", { b: 2, c: 5 })).toBe(true);
    expect(evaluateCondition("c > b", { b: 5, c: 2 })).toBe(false);
  });
  it("a >= b && a <= 10", () => {
    expect(evaluateCondition("a >= b && a <= 10", { a: 8, b: 3 })).toBe(true);
    expect(evaluateCondition("a >= b && a <= 10", { a: 12, b: 3 })).toBe(false);
  });
  it("biểu thức không an toàn → true (bỏ qua)", () => {
    expect(evaluateCondition("a > window", { a: 1 })).toBe(true);
  });
});

describe("resolveVarsWithCondition", () => {
  it("luôn thỏa điều kiện a >= b (không số âm khi trừ)", () => {
    const vars = [
      { name: "a", type: "number" as const, min: 1, max: 10 },
      { name: "b", type: "number" as const, min: 1, max: 10 },
    ];
    for (let i = 0; i < 300; i++) {
      const r = resolveVarsWithCondition(vars, "a >= b");
      expect(Number(r.a)).toBeGreaterThanOrEqual(Number(r.b));
    }
  });
});

describe("generateDistractors", () => {
  it("numeric: đủ count+1 đáp án, duy nhất, chứa đáp án đúng", () => {
    const opts = generateDistractors(7, 3, "numeric");
    expect(opts.length).toBe(4);
    expect(new Set(opts).size).toBe(4);
    expect(opts).toContain("7");
    opts.forEach((o) => expect(Number(o)).toBeGreaterThanOrEqual(0));
  });
  it("comparison: 3 dấu", () => {
    expect(generateDistractors(">", 3, "comparison")).toEqual([">", "<", "="]);
  });
});

describe("generateBatch (user template)", () => {
  const tpl: MathTemplate = {
    id: "CTPL_TEST",
    source: "user",
    lessonType: "calculation",
    skill: "addition",
    grade: 1,
    text: "Tính: {a} + {b} = ?",
    formula: "a + b",
    vars: [
      { name: "a", type: "number", min: 1, max: 9 },
      { name: "b", type: "number", min: 1, max: 9 },
    ],
    distractorCount: 3,
  };

  it("sinh đủ số câu, mỗi câu 4 đáp án có đáp án đúng", () => {
    const { questions, report } = generateBatch(tpl, { grade: 1, week: 1, count: 10 });
    expect(questions.length).toBe(10);
    expect(report.generated).toBe(10);
    for (const q of questions) {
      expect(q.options.length).toBe(4);
      expect(q.options).toContain(q.correct_answer);
      expect(q.optionsType).toBe("numeric");
    }
  });

  it("phép trừ + điều kiện a>=b → không có đáp án âm", () => {
    const sub: MathTemplate = {
      ...tpl,
      id: "CTPL_SUB",
      text: "Tính: {a} - {b} = ?",
      formula: "a - b",
      condition: "a >= b",
      vars: [
        { name: "a", type: "number", min: 1, max: 10 },
        { name: "b", type: "number", min: 1, max: 10 },
      ],
    };
    const { questions } = generateBatch(sub, { grade: 1, week: 1, count: 30 });
    for (const q of questions) {
      expect(Number(q.correct_answer)).toBeGreaterThanOrEqual(0);
    }
  });

  it("biến text random trong choices", () => {
    const wp: MathTemplate = {
      ...tpl,
      id: "CTPL_WP",
      text: "Bạn {a} có {b} viên bi, cho {c} viên. Còn mấy?",
      formula: "b - c",
      vars: [
        { name: "a", type: "text", choices: ["Lan", "Mai", "Tuấn"] },
        { name: "b", type: "number", min: 5, max: 10 },
        { name: "c", type: "number", min: 1, max: 3 },
      ],
    };
    const { questions } = generateBatch(wp, { grade: 1, week: 2, count: 20 });
    for (const q of questions) {
      expect(["Lan", "Mai", "Tuấn"]).toContain(q.vars.a);
      expect(q.text).toMatch(/^Bạn (Lan|Mai|Tuấn) có/);
    }
  });
});

describe("built-in templates", () => {
  it("calculation có built-in cộng", () => {
    const list = getBuiltinsForLessonType("calculation");
    expect(list.some((t) => t.id === "TPL_ADD_01")).toBe(true);
  });
  it("mỗi built-in sinh được câu hợp lệ", () => {
    for (const t of getAllBuiltins()) {
      const q = generateOne(t, 1, 1, 2);
      expect(q.text.length).toBeGreaterThan(0);
      expect(q.options).toContain(q.correct_answer);
    }
  });
});

describe("toBulkRows export", () => {
  const tpl: MathTemplate = {
    id: "CTPL_E",
    source: "user",
    lessonType: "calculation",
    skill: "addition",
    grade: 1,
    text: "Tính: {a} + {b} = ?",
    formula: "a + b",
    vars: [
      { name: "a", type: "number", min: 1, max: 9 },
      { name: "b", type: "number", min: 1, max: 9 },
    ],
    distractorCount: 3,
  };

  it("xuất multiple_choice, lessonCode G1_W01_MATH, correct map đúng", () => {
    const { questions } = generateBatch(tpl, { grade: 1, week: 1, count: 8 });
    const { rows } = toBulkRows(questions, { grade: 1, week: 1 });
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.type).toBe("multiple_choice");
      expect(r.lessonCode).toBe("G1_W01_MATH");
      const opts = [r.optionA, r.optionB, r.optionC, r.optionD];
      const idx = ["A", "B", "C", "D"].indexOf(r.correct);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(new Set(opts).size).toBe(4);
    }
  });

  it("bỏ comparison (chỉ 3 lựa chọn)", () => {
    const cmp: MathTemplate = {
      ...tpl,
      id: "CTPL_CMP",
      text: "So sánh {a} ... {b}",
      formula: "comparison",
      vars: [
        { name: "a", type: "number", min: 1, max: 20 },
        { name: "b", type: "number", min: 1, max: 20 },
      ],
    };
    const { questions } = generateBatch(cmp, { grade: 1, week: 3, count: 5 });
    const { rows, skipped } = toBulkRows(questions, { grade: 1, week: 3 });
    expect(rows.length).toBe(0);
    expect(skipped.length).toBe(5);
  });
});
