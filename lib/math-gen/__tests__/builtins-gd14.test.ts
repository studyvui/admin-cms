// ============================================================
// STUDYVUI — Test 6 generator built-in MỚI (GD14 Phase 2, Lớp 1, 2026-07-24):
// decompose_tens_ones, seven_segment, shape_pattern_cycle, compare_routes,
// compare_three_named, weekday_reasoning. Stress-test nhiều lần vì đây là
// generator imperative (không qua evaluateFormula), dễ lọt lỗi vòng lặp/undefined.
// ============================================================
import { describe, it, expect } from "vitest";
import { BUILTIN_GROUPS, BUILTIN_LT_MAP, getBuiltinsForLessonType } from "../builtins";

const NEW_GROUPS = [
  "decompose_tens_ones",
  "seven_segment",
  "shape_pattern_cycle",
  "compare_routes",
  "compare_three_named",
  "weekday_reasoning",
] as const;

function runMany(fn: () => { text: string; correct_answer: string; options: string[] }, n = 100) {
  const results = [];
  for (let i = 0; i < n; i++) results.push(fn());
  return results;
}

describe("6 generator built-in mới (GD14 Phase 2)", () => {
  for (const groupKey of NEW_GROUPS) {
    it(`nhóm "${groupKey}" tồn tại + có builtinGenerator`, () => {
      const group = BUILTIN_GROUPS[groupKey];
      expect(group).toBeDefined();
      expect(group.length).toBeGreaterThan(0);
      expect(group[0].builtinGenerator).toBeTypeOf("function");
    });

    it(`nhóm "${groupKey}" sinh 100 lần đều hợp lệ (text/options/correct_answer)`, () => {
      const gen = BUILTIN_GROUPS[groupKey][0].builtinGenerator!;
      const results = runMany(() => gen(1, 1));
      for (const r of results) {
        expect(typeof r.text).toBe("string");
        expect(r.text.length).toBeGreaterThan(0);
        expect(Array.isArray(r.options)).toBe(true);
        expect(r.options.length).toBeGreaterThanOrEqual(2);
        // đáp án đúng PHẢI nằm trong options
        expect(r.options).toContain(r.correct_answer);
        // options không trùng lặp
        expect(new Set(r.options).size).toBe(r.options.length);
      }
    });
  }

  it("decompose_tens_ones: đáp án khớp đúng số trong đề (kiểm tra logic, không chỉ hình thức)", () => {
    const gen = BUILTIN_GROUPS.decompose_tens_ones[0].builtinGenerator!;
    for (let i = 0; i < 50; i++) {
      const r = gen(1, 1);
      const m = r.text.match(/Số (\d+) gồm/);
      expect(m).not.toBeNull();
      const value = Number(m![1]);
      const tens = Math.floor(value / 10);
      const ones = value % 10;
      expect(r.correct_answer).toBe(`${tens} chục ${ones} đơn vị`);
    }
  });

  it("seven_segment: đáp án khớp bảng tra 7 đoạn thật", () => {
    const TABLE: Record<number, number> = { 0: 6, 1: 2, 2: 5, 3: 5, 4: 4, 5: 5, 6: 6, 7: 3, 8: 7, 9: 6 };
    const gen = BUILTIN_GROUPS.seven_segment[0].builtinGenerator!;
    for (let i = 0; i < 50; i++) {
      const r = gen(1, 1);
      const m = r.text.match(/chữ số (\d) bằng/);
      expect(m).not.toBeNull();
      const digit = Number(m![1]);
      expect(r.correct_answer).toBe(String(TABLE[digit]));
    }
  });

  it("compare_routes: đáp án khớp logic so sánh tổng 2 đoạn với đoạn còn lại", () => {
    const gen = BUILTIN_GROUPS.compare_routes[0].builtinGenerator!;
    for (let i = 0; i < 50; i++) {
      const r = gen(1, 1);
      const m = r.text.match(/(\d+)m và (\d+)m \(tổng (\d+)m\)\. Đường B dài (\d+)m/);
      expect(m).not.toBeNull();
      const [, a, b, sum, c] = m!.map(Number);
      expect(a + b).toBe(sum);
      const expected = sum < c ? "Đường A" : sum > c ? "Đường B" : "Bằng nhau";
      expect(r.correct_answer).toBe(expected);
    }
  });

  it("weekday_reasoning: đáp án luôn là 1 trong 7 thứ hợp lệ, khác các nhiễu, LUÔN đủ 4 đáp án", () => {
    const WEEKDAYS = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"];
    const gen = BUILTIN_GROUPS.weekday_reasoning[0].builtinGenerator!;
    for (let i = 0; i < 50; i++) {
      const r = gen(1, 1);
      expect(WEEKDAYS).toContain(r.correct_answer);
      for (const o of r.options) expect(WEEKDAYS).toContain(o);
      // Bug đã fix 2026-07-27: trước đây chỉ lấy 2 nhiễu (3 đáp án), bị pipeline
      // export/bulk-import loại vì thiếu 1 đáp án (khớp 12 cột cần đủ A/B/C/D).
      expect(r.options.length).toBe(4);
    }
  });

  it("shape_pattern_cycle: LUÔN đủ 4 đáp án kể cả khi chu kỳ chỉ có 3 hình", () => {
    const gen = BUILTIN_GROUPS.shape_pattern_cycle[0].builtinGenerator!;
    for (let i = 0; i < 50; i++) {
      const r = gen(1, 1);
      // Bug đã fix 2026-07-27: chu kỳ 3 hình trước đây chỉ ra 3 đáp án (thiếu 1).
      expect(r.options.length).toBe(4);
      expect(new Set(r.options).size).toBe(4);
      expect(r.options).toContain(r.correct_answer);
    }
  });

  it('nhóm "compare_two_numbers" tồn tại + sinh 100 lần đều hợp lệ, LUÔN đủ 4 đáp án số', () => {
    const gen = BUILTIN_GROUPS.compare_two_numbers[0].builtinGenerator!;
    expect(gen).toBeTypeOf("function");
    for (let i = 0; i < 100; i++) {
      const r = gen(1, 1);
      expect(r.options.length).toBe(4);
      expect(new Set(r.options).size).toBe(4);
      expect(r.options).toContain(r.correct_answer);
      for (const o of r.options) expect(Number(o)).toBeGreaterThanOrEqual(0);
    }
  });

  it("compare_two_numbers: đáp án khớp đúng logic lớn hơn/bé hơn giữa 2 số trong đề", () => {
    const gen = BUILTIN_GROUPS.compare_two_numbers[0].builtinGenerator!;
    for (let i = 0; i < 50; i++) {
      const r = gen(1, 1);
      const m = r.text.match(/Số nào (lớn hơn|bé hơn): (\d+) hay (\d+)\?/);
      expect(m).not.toBeNull();
      const [, mode, a, b] = m!;
      const expected = mode === "lớn hơn" ? Math.max(Number(a), Number(b)) : Math.min(Number(a), Number(b));
      expect(r.correct_answer).toBe(String(expected));
    }
  });

  it('nhóm "find_number_by_property" tồn tại + sinh 100 lần đều hợp lệ, LUÔN đủ 4 đáp án', () => {
    const gen = BUILTIN_GROUPS.find_number_by_property[0].builtinGenerator!;
    expect(gen).toBeTypeOf("function");
    for (let i = 0; i < 100; i++) {
      const r = gen(1, 1);
      expect(r.options.length).toBe(4);
      expect(new Set(r.options).size).toBe(4);
      expect(r.options).toContain(r.correct_answer);
    }
  });

  it("find_number_by_property: đáp án khớp đúng tính chất (1 chữ số / tròn chục)", () => {
    const gen = BUILTIN_GROUPS.find_number_by_property[0].builtinGenerator!;
    for (let i = 0; i < 60; i++) {
      const r = gen(1, 1);
      const correct = Number(r.correct_answer);
      if (r.text.includes("MỘT CHỮ SỐ")) {
        expect(correct).toBeGreaterThanOrEqual(1);
        expect(correct).toBeLessThanOrEqual(9);
        // cac dap an con lai (nhieu) phai la so 2 chu so (khong phai 1 chu so)
        for (const o of r.options) if (o !== r.correct_answer) expect(Number(o)).toBeGreaterThanOrEqual(10);
      } else {
        expect(r.text).toContain("TRÒN CHỤC");
        expect(correct % 10).toBe(0);
        for (const o of r.options) if (o !== r.correct_answer) expect(Number(o) % 10).not.toBe(0);
      }
    }
  });

  it("BUILTIN_LT_MAP: mọi lessonType mới đều tra được builtin qua getBuiltinsForLessonType", () => {
    expect(getBuiltinsForLessonType("number_decompose").length).toBeGreaterThan(0);
    expect(getBuiltinsForLessonType("shape_pattern").length).toBeGreaterThan(0);
    expect(getBuiltinsForLessonType("calendar_reading").length).toBeGreaterThan(0);
    expect(getBuiltinsForLessonType("comparison").length).toBeGreaterThan(0);
    expect(BUILTIN_LT_MAP.compare_routes).toContain("word_problem");
    expect(BUILTIN_LT_MAP.compare_two_numbers).toContain("comparison");
    // seven_segment KHONG con duoc dung cho "counting" (nguoi dung yeu cau bo 2026-07-28).
    expect(BUILTIN_LT_MAP.seven_segment).not.toContain("counting");
    expect(getBuiltinsForLessonType("counting").some((t) => t.id === "TPL_FIND_NUMBER_PROPERTY_01")).toBe(true);
    expect(getBuiltinsForLessonType("counting").some((t) => t.id === "TPL_SEVEN_SEGMENT_01")).toBe(false);
  });
});
