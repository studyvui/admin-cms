// ============================================================
// STUDYVUI — Test builtin Toán Lớp 4 (Phase 2, 2026-08-11).
// Port từ mockup Artifact "Mockup Toán Lớp 4 — 35 node" (đã CHỐT) sang
// builtinGenerator thật. Stress-test nhiều lần vì đây là generator imperative
// (không qua evaluateFormula), dễ lọt lỗi vòng lặp/undefined/thiếu đáp án.
// Đặc biệt chú ý các template phân số (T25-T32, T34) — engine phân số MỚI
// viết riêng cho Lớp 4, cần kiểm logic đúng (rút gọn, quy đồng, so sánh,
// 4 phép tính) chứ không chỉ kiểm hình thức.
// ============================================================
import { describe, it, expect } from "vitest";
import {
  GRADE4_BUILTIN_TEMPLATES,
  getGrade4BuiltinsForLessonType,
  getAllGrade4Builtins,
} from "../builtins-grade4";

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
function parseFrac(s: string): { n: number; d: number } {
  const [n, d] = s.split("/").map(Number);
  return { n, d };
}

describe("GRADE4_BUILTIN_TEMPLATES — tổng quan", () => {
  it("có ít nhất 65 template (35 node, bỏ nhóm cần ảnh)", () => {
    expect(GRADE4_BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(65);
  });

  it("mọi template đều grade=4, source=builtin, có builtinGenerator", () => {
    for (const t of GRADE4_BUILTIN_TEMPLATES) {
      expect(t.grade).toBe(4);
      expect(t.source).toBe("builtin");
      expect(t.builtinGenerator).toBeTypeOf("function");
      expect(t.id).toMatch(/^TPL_G4_W\d{2}_[A-Z]$/);
    }
  });

  it("id không trùng lặp", () => {
    const ids = GRADE4_BUILTIN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getAllGrade4Builtins khớp đúng mảng gốc", () => {
    expect(getAllGrade4Builtins().length).toBe(GRADE4_BUILTIN_TEMPLATES.length);
  });

  it("phủ đủ 35 tuần (W01-W35 xuất hiện ít nhất 1 template)", () => {
    const weeks = new Set(GRADE4_BUILTIN_TEMPLATES.map((t) => t.id.match(/_W(\d{2})_/)![1]));
    for (let w = 1; w <= 35; w++) {
      expect(weeks.has(String(w).padStart(2, "0"))).toBe(true);
    }
  });
});

describe("GRADE4_BUILTIN_TEMPLATES — sinh 40 lần mỗi template đều hợp lệ", () => {
  for (const tpl of GRADE4_BUILTIN_TEMPLATES) {
    it(`${tpl.id} [${tpl.lessonType}/${tpl.skill}] "${tpl.text}"`, () => {
      for (let i = 0; i < 40; i++) {
        const r = tpl.builtinGenerator!(4, 1);
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

describe("GRADE4_BUILTIN_TEMPLATES — không template nào bị 'đơ' (sinh 1 câu y hệt lặp lại)", () => {
  // Bug thật đã gặp (2026-08-11): duongThangVuongGoc/duongThangSongSong ban đầu không có
  // tham số ngẫu nhiên → mỗi tuần sinh ra 12 câu GIỐNG HỆT NHAU. Test này chặn tái diễn.
  it("mỗi template sinh ít nhất 3 câu prompt khác nhau trong 40 lần gọi", () => {
    for (const tpl of GRADE4_BUILTIN_TEMPLATES) {
      const seen = new Set<string>();
      for (let i = 0; i < 40; i++) seen.add(tpl.builtinGenerator!(4, 1).text);
      expect(seen.size, `${tpl.id} chỉ sinh ${seen.size} câu khác nhau / 40 lần — thiếu tham số hoá`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("getGrade4BuiltinsForLessonType — tra cứu theo lessonType", () => {
  it("mọi lessonType xuất hiện trong GRADE4_BUILTIN_TEMPLATES đều tra được", () => {
    const lessonTypes = Array.from(new Set(GRADE4_BUILTIN_TEMPLATES.map((t) => t.lessonType)));
    for (const lt of lessonTypes) {
      expect(getGrade4BuiltinsForLessonType(lt).length).toBeGreaterThan(0);
    }
  });

  it("lessonType không tồn tại trả mảng rỗng", () => {
    expect(getGrade4BuiltinsForLessonType("khong_ton_tai")).toEqual([]);
  });

  it("có ít nhất 1 lessonType 'fraction' và 1 'fraction_operations'", () => {
    expect(getGrade4BuiltinsForLessonType("fraction").length).toBeGreaterThan(0);
    expect(getGrade4BuiltinsForLessonType("fraction_operations").length).toBeGreaterThan(0);
  });
});

describe("Kiểm logic đúng cho vài archetype tiêu biểu (không chỉ hình thức)", () => {
  it("TPL_G4_W06_C/W16_B/W33_B (làm tròn): đáp án đúng quy tắc làm tròn", () => {
    for (const id of ["TPL_G4_W06_C", "TPL_G4_W16_B", "TPL_G4_W33_B"]) {
      const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 40; i++) {
        const r = tpl.builtinGenerator!(4, 1);
        const m = r.text.match(/Làm tròn số ([\d ]+) đến hàng/);
        expect(m).not.toBeNull();
        const n = Number(m![1].replace(/\s/g, ""));
        const place = id === "TPL_G4_W06_C" ? 100000 : 1000000;
        const down = Math.floor(n / place) * place;
        const up = down + place;
        const expected = n - down >= place / 2 ? up : down;
        expect(r.correct_answer.replace(/\s/g, "")).toBe(String(expected));
      }
    }
  });

  it("TPL_G4_W15_A (chu vi hình bình hành): đáp án = 2×(a+b)", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W15_A")!;
    for (let i = 0; i < 40; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const m = r.text.match(/dài (\d+) cm và (\d+) cm/);
      expect(m).not.toBeNull();
      expect(Number(r.correct_answer)).toBe(2 * (Number(m![1]) + Number(m![2])));
    }
  });

  it("TPL_G4_W15_B (chu vi hình thoi): đáp án = 4×cạnh", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W15_B")!;
    for (let i = 0; i < 40; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const m = r.text.match(/cạnh dài (\d+) cm/);
      expect(m).not.toBeNull();
      expect(Number(r.correct_answer)).toBe(Number(m![1]) * 4);
    }
  });

  it("TPL_G4_W19_A (nhân số nhiều chữ số): thừa số PHẢI có 5 chữ số", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W19_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const m = r.text.match(/: ([\d ]+) ×/);
      expect(m).not.toBeNull();
      const a = Number(m![1].replace(/\s/g, ""));
      expect(a).toBeGreaterThanOrEqual(10000);
      expect(a).toBeLessThanOrEqual(99999);
    }
  });

  it("TPL_G4_W19_B (chia số nhiều chữ số): số bị chia PHẢI có 5 chữ số", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W19_B")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const m = r.text.match(/: ([\d ]+) :/);
      expect(m).not.toBeNull();
      const a = Number(m![1].replace(/\s/g, ""));
      expect(a).toBeGreaterThanOrEqual(10000);
      expect(a).toBeLessThanOrEqual(99999);
    }
  });

  // ---------- Phân số: kiểm logic thật, không chỉ hình thức ----------

  it("TPL_G4_W25_B (khái niệm phân số): tử/mẫu luôn khớp đúng số trong đề", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W25_B")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const mFrac = r.text.match(/Phân số (\d+)\/(\d+) có (tử|mẫu) số là:/);
      if (mFrac) {
        const [, n, d, kind] = mFrac;
        expect(r.correct_answer).toBe(kind === "tử" ? n : d);
      }
    }
  });

  it("TPL_G4_W26_A (a:b = a/b): đáp án phải khớp đúng phép chia thành phân số", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W26_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const m = r.text.match(/Phép chia (\d+) : (\d+) viết dưới dạng phân số là:/);
      if (m) expect(r.correct_answer).toBe(`${m[1]}/${m[2]}`);
    }
  });

  it("TPL_G4_W27_A (rút gọn phân số): đáp án PHẢI là phân số tối giản và tương đương đề bài", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W27_A")!;
    for (let i = 0; i < 80; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const m = r.text.match(/Rút gọn phân số (\d+)\/(\d+) về phân số tối giản:/);
      expect(m).not.toBeNull();
      const n0 = Number(m![1]), d0 = Number(m![2]);
      const { n: cn, d: cd } = parseFrac(r.correct_answer);
      // tuong duong: n0*cd === cn*d0
      expect(n0 * cd).toBe(cn * d0);
      // toi gian: gcd(cn,cd) === 1
      expect(gcd(cn, cd)).toBe(1);
    }
  });

  it("TPL_G4_W28_A (so sánh phân số): dấu trả về PHẢI đúng theo giá trị thật (n/d)", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W28_A")!;
    for (let i = 0; i < 100; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const mTwo = r.text.match(/So sánh 2 phân số (\d+)\/(\d+) và (\d+)\/(\d+)\. Dấu thích hợp là:/);
      const mOne = r.text.match(/So sánh phân số (\d+)\/(\d+) với 1\. Dấu thích hợp là:/);
      if (mTwo) {
        const [, n1, d1, n2, d2] = mTwo.map(Number) as unknown as number[];
        const v1 = n1 / d1, v2 = n2 / d2;
        const expected = v1 > v2 ? ">" : v1 < v2 ? "<" : "=";
        expect(r.correct_answer).toBe(expected);
      } else if (mOne) {
        const [, n, d] = mOne.map(Number) as unknown as number[];
        const expected = n / d > 1 ? ">" : n / d < 1 ? "<" : "=";
        expect(r.correct_answer).toBe(expected);
      }
    }
  });

  it("TPL_G4_W29_A (cộng phân số): đáp án PHẢI tương đương tổng thật (quy đồng chéo)", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W29_A")!;
    for (let i = 0; i < 100; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const mFrac = r.text.match(/Tính: (\d+)\/(\d+) \+ (\d+)\/(\d+) = \?/);
      const mWhole = r.text.match(/Tính: (\d+) \+ (\d+)\/(\d+) = \?/);
      const { n: cn, d: cd } = parseFrac(r.correct_answer);
      if (mFrac) {
        const [, n1, d1, n2, d2] = mFrac.map(Number) as unknown as number[];
        const expectedN = n1 * d2 + n2 * d1, expectedD = d1 * d2;
        expect(cn * expectedD).toBe(expectedN * cd);
      } else if (mWhole) {
        const [, whole, n, d] = mWhole.map(Number) as unknown as number[];
        expect(cn * d).toBe((whole * d + n) * cd);
      }
    }
  });

  it("TPL_G4_W30_A (trừ phân số): kết quả PHẢI không âm và tương đương hiệu thật", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W30_A")!;
    for (let i = 0; i < 100; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const { n: cn, d: cd } = parseFrac(r.correct_answer);
      expect(cn).toBeGreaterThanOrEqual(0);
      const mFrac = r.text.match(/Tính: (\d+)\/(\d+) − (\d+)\/(\d+) = \?/);
      if (mFrac) {
        const [, n1, d1, n2, d2] = mFrac.map(Number) as unknown as number[];
        const expectedN = n1 * d2 - n2 * d1, expectedD = d1 * d2;
        expect(cn * expectedD).toBe(expectedN * cd);
      }
    }
  });

  it("TPL_G4_W31_A (nhân phân số): đáp án PHẢI tương đương tích thật", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W31_A")!;
    for (let i = 0; i < 100; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const m = r.text.match(/Tính: (\d+)\/(\d+) × (\d+)\/(\d+) = \?/);
      if (m) {
        const [, n1, d1, n2, d2] = m.map(Number) as unknown as number[];
        const { n: cn, d: cd } = parseFrac(r.correct_answer);
        expect(cn * (d1 * d2)).toBe(n1 * n2 * cd);
      }
    }
  });

  it("TPL_G4_W32_B (tìm phân số của một số): tổng luôn chia hết đúng, kết quả nguyên", () => {
    const tpl = GRADE4_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G4_W32_B")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(4, 1);
      const m = r.text.match(/Một rổ có (\d+) .+ Hỏi (\d+)\/(\d+) số .+ là bao nhiêu/);
      expect(m).not.toBeNull();
      const total = Number(m![1]), n = Number(m![2]), d = Number(m![3]);
      expect(total % d).toBe(0);
      expect(Number(r.correct_answer)).toBe((total / d) * n);
    }
  });
});
