// ============================================================
// STUDYVUI — Test builtin Toán Lớp 2 (Phase 2, 2026-07-29).
// Port từ mockup lop2_logic.js (35 node đã CHỐT) sang builtinGenerator thật.
// Stress-test nhiều lần vì đây là generator imperative (không qua evaluateFormula),
// dễ lọt lỗi vòng lặp/undefined/thiếu đáp án phân biệt.
// ============================================================
import { describe, it, expect } from "vitest";
import {
  GRADE2_BUILTIN_TEMPLATES,
  getGrade2BuiltinsForLessonType,
  getAllGrade2Builtins,
} from "../builtins-grade2";

describe("GRADE2_BUILTIN_TEMPLATES — tổng quan", () => {
  it("có ít nhất 60 template (35 node, bỏ nhóm cần ảnh)", () => {
    expect(GRADE2_BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(60);
  });

  it("mọi template đều grade=2, source=builtin, có builtinGenerator", () => {
    for (const t of GRADE2_BUILTIN_TEMPLATES) {
      expect(t.grade).toBe(2);
      expect(t.source).toBe("builtin");
      expect(t.builtinGenerator).toBeTypeOf("function");
      expect(t.id).toMatch(/^TPL_G2_W\d{2}_[A-Z]$/);
    }
  });

  it("id không trùng lặp", () => {
    const ids = GRADE2_BUILTIN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getAllGrade2Builtins khớp đúng mảng gốc", () => {
    expect(getAllGrade2Builtins().length).toBe(GRADE2_BUILTIN_TEMPLATES.length);
  });
});

describe("GRADE2_BUILTIN_TEMPLATES — sinh 40 lần mỗi template đều hợp lệ", () => {
  for (const tpl of GRADE2_BUILTIN_TEMPLATES) {
    it(`${tpl.id} [${tpl.lessonType}/${tpl.skill}] "${tpl.text}"`, () => {
      for (let i = 0; i < 40; i++) {
        const r = tpl.builtinGenerator!(2, 1);
        expect(typeof r.text).toBe("string");
        expect(r.text.length).toBeGreaterThan(0);
        expect(Array.isArray(r.options)).toBe(true);
        expect(r.options.length).toBeGreaterThanOrEqual(2);
        expect(r.options).toContain(r.correct_answer);
        expect(new Set(r.options).size).toBe(r.options.length);
      }
    });
  }
});

describe("getGrade2BuiltinsForLessonType — tra cứu theo lessonType", () => {
  it("mọi lessonType xuất hiện trong GRADE2_BUILTIN_TEMPLATES đều tra được", () => {
    const lessonTypes = Array.from(new Set(GRADE2_BUILTIN_TEMPLATES.map((t) => t.lessonType)));
    for (const lt of lessonTypes) {
      expect(getGrade2BuiltinsForLessonType(lt).length).toBeGreaterThan(0);
    }
  });

  it("lessonType không tồn tại trả mảng rỗng", () => {
    expect(getGrade2BuiltinsForLessonType("khong_ton_tai")).toEqual([]);
  });
});

describe("Kiểm logic đúng cho vài archetype tiêu biểu (không chỉ hình thức)", () => {
  it("TPL_G2_W19_D (so sánh phép nhân giao hoán): đáp án luôn là =", () => {
    const tpl = GRADE2_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G2_W19_D")!;
    for (let i = 0; i < 30; i++) {
      const r = tpl.builtinGenerator!(2, 1);
      expect(r.correct_answer).toBe("=");
      expect(r.options).toEqual(expect.arrayContaining(["=", ">", "<"]));
    }
  });

  it("TPL_G2_W24_A (decompose1000): đáp án khớp đúng trăm/chục/đơn vị của số trong đề", () => {
    const tpl = GRADE2_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G2_W24_A")!;
    for (let i = 0; i < 30; i++) {
      const r = tpl.builtinGenerator!(2, 1);
      const m = r.text.match(/Số (\d+) gồm/);
      expect(m).not.toBeNull();
      const n = Number(m![1]);
      const tram = Math.floor(n / 100);
      const chuc = Math.floor((n % 100) / 10);
      const dv = n % 10;
      expect(r.correct_answer).toBe(`${tram} trăm ${chuc} chục ${dv} đơn vị`);
    }
  });

  it("TPL_G2_W21_B (tìm SBC/SC/thương): đáp án khớp đúng phép chia trong đề", () => {
    const tpl = GRADE2_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G2_W21_B")!;
    for (let i = 0; i < 30; i++) {
      const r = tpl.builtinGenerator!(2, 1);
      const m = r.text.match(/(\d+) : (\d+) = (\d+), (.+) là bao nhiêu\?/);
      expect(m).not.toBeNull();
      const [, a, b, kq, ask] = m!;
      const expected = ask === "số bị chia" ? a : ask === "số chia" ? b : kq;
      expect(r.correct_answer).toBe(expected);
    }
  });

  it("TPL_G2_W33_B (xác suất): đáp án luôn là 1 trong 3 mức hợp lệ", () => {
    const tpl = GRADE2_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G2_W33_B")!;
    const valid = ["Chắc chắn", "Có thể", "Không thể"];
    for (let i = 0; i < 30; i++) {
      const r = tpl.builtinGenerator!(2, 1);
      expect(valid).toContain(r.correct_answer);
    }
  });

  it("TPL_G2_W16_C (đọc lịch): số ngày khớp đúng tháng trong đề", () => {
    const tpl = GRADE2_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G2_W16_C")!;
    const months31 = [1, 3, 5, 7, 8, 10, 12];
    for (let i = 0; i < 30; i++) {
      const r = tpl.builtinGenerator!(2, 1);
      const m = r.text.match(/Tháng (\d+) có/);
      expect(m).not.toBeNull();
      const month = Number(m![1]);
      const expected = months31.includes(month) ? 31 : month === 2 ? 28 : 30;
      expect(r.correct_answer).toBe(String(expected));
    }
  });
});
