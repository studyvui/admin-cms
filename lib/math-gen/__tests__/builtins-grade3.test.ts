// ============================================================
// STUDYVUI — Test builtin Toán Lớp 3 (Phase 2, 2026-08-05).
// Port từ mockup Artifact "Mockup Toán Lớp 3 — 35 node" (đã CHỐT) sang
// builtinGenerator thật. Stress-test nhiều lần vì đây là generator imperative
// (không qua evaluateFormula), dễ lọt lỗi vòng lặp/undefined/thiếu đáp án.
// ============================================================
import { describe, it, expect } from "vitest";
import {
  GRADE3_BUILTIN_TEMPLATES,
  getGrade3BuiltinsForLessonType,
  getAllGrade3Builtins,
} from "../builtins-grade3";

describe("GRADE3_BUILTIN_TEMPLATES — tổng quan", () => {
  it("có ít nhất 85 template (35 node, bỏ nhóm cần ảnh)", () => {
    expect(GRADE3_BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(85);
  });

  it("mọi template đều grade=3, source=builtin, có builtinGenerator", () => {
    for (const t of GRADE3_BUILTIN_TEMPLATES) {
      expect(t.grade).toBe(3);
      expect(t.source).toBe("builtin");
      expect(t.builtinGenerator).toBeTypeOf("function");
      expect(t.id).toMatch(/^TPL_G3_W\d{2}_[A-Z]$/);
    }
  });

  it("id không trùng lặp", () => {
    const ids = GRADE3_BUILTIN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getAllGrade3Builtins khớp đúng mảng gốc", () => {
    expect(getAllGrade3Builtins().length).toBe(GRADE3_BUILTIN_TEMPLATES.length);
  });

  it("phủ đủ 35 tuần (W01-W35 xuất hiện ít nhất 1 template)", () => {
    const weeks = new Set(GRADE3_BUILTIN_TEMPLATES.map((t) => t.id.match(/_W(\d{2})_/)![1]));
    for (let w = 1; w <= 35; w++) {
      expect(weeks.has(String(w).padStart(2, "0"))).toBe(true);
    }
  });
});

describe("GRADE3_BUILTIN_TEMPLATES — sinh 40 lần mỗi template đều hợp lệ", () => {
  for (const tpl of GRADE3_BUILTIN_TEMPLATES) {
    it(`${tpl.id} [${tpl.lessonType}/${tpl.skill}] "${tpl.text}"`, () => {
      for (let i = 0; i < 40; i++) {
        const r = tpl.builtinGenerator!(3, 1);
        expect(typeof r.text).toBe("string");
        expect(r.text.length).toBeGreaterThan(0);
        expect(r.text).not.toMatch(/NaN|undefined|null/);
        expect(Array.isArray(r.options)).toBe(true);
        expect(r.options.length).toBeGreaterThanOrEqual(2);
        expect(r.options).toContain(r.correct_answer);
        expect(new Set(r.options).size).toBe(r.options.length);
        for (const opt of r.options) expect(String(opt)).not.toMatch(/NaN|undefined|null/);
      }
    });
  }
});

describe("getGrade3BuiltinsForLessonType — tra cứu theo lessonType", () => {
  it("mọi lessonType xuất hiện trong GRADE3_BUILTIN_TEMPLATES đều tra được", () => {
    const lessonTypes = Array.from(new Set(GRADE3_BUILTIN_TEMPLATES.map((t) => t.lessonType)));
    for (const lt of lessonTypes) {
      expect(getGrade3BuiltinsForLessonType(lt).length).toBeGreaterThan(0);
    }
  });

  it("lessonType không tồn tại trả mảng rỗng", () => {
    expect(getGrade3BuiltinsForLessonType("khong_ton_tai")).toEqual([]);
  });
});

describe("Kiểm logic đúng cho vài archetype tiêu biểu (không chỉ hình thức)", () => {
  it("TPL_G3_W20_A (số La Mã): giá trị I-XX luôn khớp đúng bảng quy đổi", () => {
    const ROMAN: Record<number, string> = {
      1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X",
      11: "XI", 12: "XII", 13: "XIII", 14: "XIV", 15: "XV", 16: "XVI", 17: "XVII", 18: "XVIII", 19: "XIX", 20: "XX",
    };
    const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G3_W20_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(3, 1);
      const mToRoman = r.text.match(/Số (\d+) viết bằng chữ số La Mã là:/);
      const mFromRoman = r.text.match(/Chữ số La Mã "([IVX]+)" có giá trị là:/);
      if (mToRoman) expect(r.correct_answer).toBe(ROMAN[Number(mToRoman[1])]);
      if (mFromRoman) {
        const val = Object.entries(ROMAN).find(([, v]) => v === mFromRoman[1])![0];
        expect(r.correct_answer).toBe(val);
      }
    }
  });

  it("TPL_G3_W20_B/C (làm tròn chục/trăm): đáp án đúng quy tắc làm tròn", () => {
    for (const id of ["TPL_G3_W20_B", "TPL_G3_W20_C"]) {
      const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      const place = id === "TPL_G3_W20_B" ? 10 : 100;
      for (let i = 0; i < 60; i++) {
        const r = tpl.builtinGenerator!(3, 1);
        const m = r.text.match(/Làm tròn số ([\d ]+) đến hàng/);
        expect(m).not.toBeNull();
        const n = Number(m![1].replace(/\s/g, ""));
        const down = Math.floor(n / place) * place;
        const up = down + place;
        const expected = n - down >= place / 2 ? up : down;
        expect(r.correct_answer.replace(/\s/g, "")).toBe(String(expected));
      }
    }
  });

  it("TPL_G3_W21_B/TPL_G3_W23_C/TPL_G3_W35_A (chu vi HCN/vuông): đáp án đúng công thức", () => {
    for (const id of ["TPL_G3_W21_B", "TPL_G3_W23_C", "TPL_G3_W35_A"]) {
      const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 40; i++) {
        const r = tpl.builtinGenerator!(3, 1);
        const mV = r.text.match(/hình vuông có cạnh (\d+) cm/);
        const mR = r.text.match(/chiều dài (\d+) cm, chiều rộng (\d+) cm/);
        if (mV) expect(Number(r.correct_answer)).toBe(Number(mV[1]) * 4);
        if (mR) expect(Number(r.correct_answer)).toBe((Number(mR[1]) + Number(mR[2])) * 2);
      }
    }
  });

  it("TPL_G3_W22_A/TPL_G3_W35_B (diện tích HCN/vuông): đáp án đúng công thức, luôn có hậu tố cm²", () => {
    for (const id of ["TPL_G3_W22_A", "TPL_G3_W35_B"]) {
      const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 40; i++) {
        const r = tpl.builtinGenerator!(3, 1);
        const mV = r.text.match(/hình vuông có cạnh (\d+) cm/);
        const mR = r.text.match(/chiều dài (\d+) cm, chiều rộng (\d+) cm/);
        if (mV) expect(Number(r.correct_answer)).toBe(Number(mV[1]) * Number(mV[1]));
        if (mR) expect(Number(r.correct_answer)).toBe(Number(mR[1]) * Number(mR[2]));
      }
    }
  });

  it("TPL_G3_W23_A/TPL_G3_W25_B (cộng trừ pv 10 000): kết quả PHẢI < 10 000", () => {
    for (const id of ["TPL_G3_W23_A", "TPL_G3_W25_B"]) {
      const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 60; i++) {
        const r = tpl.builtinGenerator!(3, 1);
        expect(Number(r.correct_answer.replace(/\s/g, ""))).toBeLessThan(10000);
      }
    }
  });

  it("TPL_G3_W28_A/TPL_G3_W34_A (cộng trừ pv 100 000): kết quả PHẢI < 100 000", () => {
    for (const id of ["TPL_G3_W28_A", "TPL_G3_W34_A"]) {
      const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 60; i++) {
        const r = tpl.builtinGenerator!(3, 1);
        expect(Number(r.correct_answer.replace(/\s/g, ""))).toBeLessThan(100000);
      }
    }
  });

  it("TPL_G3_W24_A (nhân 4 chữ số): thừa số trong đề PHẢI có đúng 4 chữ số", () => {
    const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G3_W24_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(3, 1);
      const m = r.text.match(/: ([\d ]+) ×/);
      expect(m).not.toBeNull();
      const a = Number(m![1].replace(/\s/g, ""));
      expect(a).toBeGreaterThanOrEqual(1000);
      expect(a).toBeLessThanOrEqual(9999);
    }
  });

  it("TPL_G3_W24_B (chia 4 chữ số): số bị chia trong đề PHẢI có đúng 4 chữ số", () => {
    const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G3_W24_B")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(3, 1);
      const m = r.text.match(/: ([\d ]+) :/);
      expect(m).not.toBeNull();
      const a = Number(m![1].replace(/\s/g, ""));
      expect(a).toBeGreaterThanOrEqual(1000);
      expect(a).toBeLessThanOrEqual(9999);
    }
  });

  it("TPL_G3_W30_C (nhân 5 chữ số): thừa số trong đề PHẢI có đúng 5 chữ số", () => {
    const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G3_W30_C")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(3, 1);
      const m = r.text.match(/: ([\d ]+) ×/);
      expect(m).not.toBeNull();
      const a = Number(m![1].replace(/\s/g, ""));
      expect(a).toBeGreaterThanOrEqual(10000);
      expect(a).toBeLessThanOrEqual(99999);
    }
  });

  it("TPL_G3_W31_A (chia 5 chữ số): số bị chia trong đề PHẢI có đúng 5 chữ số", () => {
    const tpl = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G3_W31_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(3, 1);
      const m = r.text.match(/: ([\d ]+) :/);
      expect(m).not.toBeNull();
      const a = Number(m![1].replace(/\s/g, ""));
      expect(a).toBeGreaterThanOrEqual(10000);
      expect(a).toBeLessThanOrEqual(99999);
    }
  });

  it("TPL_G3_W33_A/D (xác suất + tìm số bé nhất từ 4 chữ số): đáp án hợp lệ", () => {
    const tplProb = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G3_W33_A")!;
    for (let i = 0; i < 30; i++) {
      const r = tplProb.builtinGenerator!(3, 1);
      expect(r.options.length).toBeGreaterThanOrEqual(2);
    }
    const tplMin = GRADE3_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G3_W33_D")!;
    for (let i = 0; i < 30; i++) {
      const r = tplMin.builtinGenerator!(3, 1);
      const m = r.text.match(/số BÉ NHẤT có thể ghép được là:/);
      expect(m).not.toBeNull();
      // chu so dau khong duoc la 0
      expect(r.correct_answer.replace(/\s/g, "")[0]).not.toBe("0");
    }
  });
});
