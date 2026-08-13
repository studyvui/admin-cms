// ============================================================
// STUDYVUI — Test mẫu built-in Lớp 1 (nhóm hình học/không gian): compare_quantity,
// spatial_orientation, assemble_shapes, match_object_shape, classify_2d, classify_3d.
// Stress-test nhiều lần (generator imperative) + khoá ràng buộc "luôn xuất được 12
// cột" (≥4 lựa chọn phân biệt) — khác các mẫu cũ compare_routes/compare_three_named
// chỉ có 3 lựa chọn nên bị toBulkRows() âm thầm loại.
// ============================================================
import { describe, it, expect } from "vitest";
import {
  GRADE1_SHAPE_BUILTIN_TEMPLATES,
  getGrade1ShapeBuiltinsForLessonType,
  getAllGrade1ShapeBuiltins,
} from "../builtins-grade1-shapes";
import { generateBatch } from "../generate";
import { toBulkRows } from "../export-xlsx";

const EXPECTED_LESSON_TYPES = [
  "compare_quantity",
  "spatial_orientation",
  "assemble_shapes",
  "match_object_shape",
  "classify_2d",
  "classify_3d",
];

describe("GRADE1_SHAPE_BUILTIN_TEMPLATES — tổng quan", () => {
  it("có đủ mẫu cho cả 6 lessonType còn thiếu", () => {
    for (const lt of EXPECTED_LESSON_TYPES) {
      expect(getGrade1ShapeBuiltinsForLessonType(lt).length).toBeGreaterThan(0);
    }
  });

  it("mọi mẫu đều grade=1, source=builtin, có builtinGenerator", () => {
    for (const t of GRADE1_SHAPE_BUILTIN_TEMPLATES) {
      expect(t.grade).toBe(1);
      expect(t.source).toBe("builtin");
      expect(t.builtinGenerator).toBeTypeOf("function");
      expect(t.id).toMatch(/^TPL_G1_SHAPE_/);
    }
  });

  it("id không trùng lặp", () => {
    const ids = GRADE1_SHAPE_BUILTIN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getAllGrade1ShapeBuiltins khớp đúng mảng gốc", () => {
    expect(getAllGrade1ShapeBuiltins().length).toBe(GRADE1_SHAPE_BUILTIN_TEMPLATES.length);
  });
});

describe("GRADE1_SHAPE_BUILTIN_TEMPLATES — sinh 40 lần mỗi mẫu đều hợp lệ và ≥4 lựa chọn", () => {
  for (const tpl of GRADE1_SHAPE_BUILTIN_TEMPLATES) {
    it(`${tpl.id} [${tpl.lessonType}/${tpl.skill}] "${tpl.text}"`, () => {
      for (let i = 0; i < 40; i++) {
        const r = tpl.builtinGenerator!(1, 1);
        expect(typeof r.text).toBe("string");
        expect(r.text.length).toBeGreaterThan(0);
        expect(Array.isArray(r.options)).toBe(true);
        expect(r.options).toContain(r.correct_answer);
        expect(new Set(r.options).size).toBe(r.options.length);
        // ràng buộc cốt lõi: phải đủ 4 lựa chọn phân biệt để xuất được 12 cột Excel
        expect(r.options.length).toBeGreaterThanOrEqual(4);
      }
    });
  }
});

describe("GRADE1_SHAPE_BUILTIN_TEMPLATES — luôn xuất được Excel 12 cột (không bị toBulkRows loại)", () => {
  for (const tpl of GRADE1_SHAPE_BUILTIN_TEMPLATES) {
    it(`${tpl.id} export multiple_choice, không bị skip`, () => {
      const { questions } = generateBatch(tpl, { grade: 1, week: 1, count: 10 });
      const { rows, skipped } = toBulkRows(questions, { grade: 1, week: 1 });
      expect(skipped.length).toBe(0);
      expect(rows.length).toBe(questions.length);
      for (const r of rows) {
        expect(r.type).toBe("multiple_choice");
        const opts = [r.optionA, r.optionB, r.optionC, r.optionD];
        expect(new Set(opts).size).toBe(4);
        expect(["A", "B", "C", "D"]).toContain(r.correct);
      }
    });
  }
});
