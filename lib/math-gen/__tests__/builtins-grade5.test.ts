// ============================================================
// STUDYVUI — Test builtin Toán Lớp 5 (Phase 2, 2026-08-13).
// Port từ mockup Artifact "Mockup Toán Lớp 5 — 35 node" (đã CHỐT) sang
// builtinGenerator thật. Lớp 5 là lớp CUỐI lộ trình 5 lớp — kiểm kỹ các
// archetype MỚI (tỉ số/%, thể tích, vận tốc) + engine phân số tái sử dụng.
// ============================================================
import { describe, it, expect } from "vitest";
import {
  GRADE5_BUILTIN_TEMPLATES,
  getGrade5BuiltinsForLessonType,
  getAllGrade5Builtins,
} from "../builtins-grade5";

function parseFrac(s: string): { n: number; d: number } {
  const [n, d] = s.split("/").map(Number);
  return { n, d };
}
function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
function parseVN(s: string): number {
  return Number(s.replace(/\s/g, "").replace(",", "."));
}

describe("GRADE5_BUILTIN_TEMPLATES — tổng quan", () => {
  it("có ít nhất 60 template (35 node, bỏ nhóm cần ảnh)", () => {
    expect(GRADE5_BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(60);
  });

  it("mọi template đều grade=5, source=builtin, có builtinGenerator", () => {
    for (const t of GRADE5_BUILTIN_TEMPLATES) {
      expect(t.grade).toBe(5);
      expect(t.source).toBe("builtin");
      expect(t.builtinGenerator).toBeTypeOf("function");
      expect(t.id).toMatch(/^TPL_G5_W\d{2}_[A-Z]$/);
    }
  });

  it("id không trùng lặp", () => {
    const ids = GRADE5_BUILTIN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getAllGrade5Builtins khớp đúng mảng gốc", () => {
    expect(getAllGrade5Builtins().length).toBe(GRADE5_BUILTIN_TEMPLATES.length);
  });

  it("phủ đủ 35 tuần (W01-W35 xuất hiện ít nhất 1 template)", () => {
    const weeks = new Set(GRADE5_BUILTIN_TEMPLATES.map((t) => t.id.match(/_W(\d{2})_/)![1]));
    for (let w = 1; w <= 35; w++) {
      expect(weeks.has(String(w).padStart(2, "0"))).toBe(true);
    }
  });
});

describe("GRADE5_BUILTIN_TEMPLATES — sinh 40 lần mỗi template đều hợp lệ", () => {
  for (const tpl of GRADE5_BUILTIN_TEMPLATES) {
    it(`${tpl.id} [${tpl.lessonType}/${tpl.skill}] "${tpl.text}"`, () => {
      for (let i = 0; i < 40; i++) {
        const r = tpl.builtinGenerator!(5, 1);
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

describe("GRADE5_BUILTIN_TEMPLATES — không template nào bị 'đơ' (lặp 1 câu y hệt)", () => {
  it("mỗi template sinh ít nhất 3 câu prompt khác nhau trong 40 lần gọi", () => {
    for (const tpl of GRADE5_BUILTIN_TEMPLATES) {
      const seen = new Set<string>();
      for (let i = 0; i < 40; i++) seen.add(tpl.builtinGenerator!(5, 1).text);
      expect(seen.size, `${tpl.id} chỉ sinh ${seen.size} câu khác nhau / 40 lần`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("getGrade5BuiltinsForLessonType — tra cứu theo lessonType", () => {
  it("mọi lessonType xuất hiện trong GRADE5_BUILTIN_TEMPLATES đều tra được", () => {
    const lessonTypes = Array.from(new Set(GRADE5_BUILTIN_TEMPLATES.map((t) => t.lessonType)));
    for (const lt of lessonTypes) {
      expect(getGrade5BuiltinsForLessonType(lt).length).toBeGreaterThan(0);
    }
  });
  it("lessonType không tồn tại trả mảng rỗng", () => {
    expect(getGrade5BuiltinsForLessonType("khong_ton_tai")).toEqual([]);
  });
  it("có template cho các lessonType MỚI: ratio, percentage, volume, speed, decimal", () => {
    for (const lt of ["ratio", "percentage", "volume", "speed", "decimal"]) {
      expect(getGrade5BuiltinsForLessonType(lt).length, lt).toBeGreaterThan(0);
    }
  });
});

describe("Kiểm logic đúng cho các archetype tiêu biểu (không chỉ hình thức)", () => {
  it("TPL_G5_W03_A/B (cộng/trừ phân số khác mẫu): đáp án tương đương đúng quy đồng chéo", () => {
    for (const id of ["TPL_G5_W03_A", "TPL_G5_W03_B"]) {
      const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 80; i++) {
        const r = tpl.builtinGenerator!(5, 1);
        const m = r.text.match(/Tính: (\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?/);
        expect(m).not.toBeNull();
        const [, n1, d1, op, n2, d2] = m!;
        const N1 = Number(n1), D1 = Number(d1), N2 = Number(n2), D2 = Number(d2);
        const expectedN = op === "+" ? N1 * D2 + N2 * D1 : N1 * D2 - N2 * D1;
        const expectedD = D1 * D2;
        const { n: cn, d: cd } = parseFrac(r.correct_answer);
        expect(cn * expectedD).toBe(expectedN * cd);
      }
    }
  });

  it("TPL_G5_W01_C/W32_B (rút gọn phân số): đáp án PHẢI tối giản và tương đương", () => {
    for (const id of ["TPL_G5_W01_C", "TPL_G5_W32_B"]) {
      const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 80; i++) {
        const r = tpl.builtinGenerator!(5, 1);
        const m = r.text.match(/Rút gọn phân số (\d+)\/(\d+) về phân số tối giản:/);
        expect(m).not.toBeNull();
        const n0 = Number(m![1]), d0 = Number(m![2]);
        const { n: cn, d: cd } = parseFrac(r.correct_answer);
        expect(n0 * cd).toBe(cn * d0);
        expect(gcd(cn, cd)).toBe(1);
      }
    }
  });

  it("TPL_G5_W05_A/W15_A/W32_C (so sánh STP): dấu trả về đúng theo giá trị thật", () => {
    for (const id of ["TPL_G5_W05_A", "TPL_G5_W15_A", "TPL_G5_W32_C"]) {
      const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 60; i++) {
        const r = tpl.builtinGenerator!(5, 1);
        const m = r.text.match(/So sánh: ([\d,]+) và ([\d,]+)\. Dấu thích hợp là:/);
        expect(m).not.toBeNull();
        const a = parseVN(m![1]), b = parseVN(m![2]);
        expect(r.correct_answer).toBe(a > b ? ">" : "<");
      }
    }
  });

  it("TPL_G5_W08_A/W16_A (cộng STP): đáp án đúng phép cộng thập phân", () => {
    for (const id of ["TPL_G5_W08_A", "TPL_G5_W16_A"]) {
      const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === id)!;
      for (let i = 0; i < 60; i++) {
        const r = tpl.builtinGenerator!(5, 1);
        const m = r.text.match(/Tính: ([\d,]+) \+ ([\d,]+) = \?/);
        expect(m).not.toBeNull();
        const a = parseVN(m![1]), b = parseVN(m![2]);
        const expected = Math.round((a + b) * 100) / 100;
        expect(Math.abs(parseVN(r.correct_answer) - expected)).toBeLessThan(0.005);
      }
    }
  });

  it("TPL_G5_W12_A (diện tích tam giác): S=đáy×cao:2", () => {
    const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W12_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(5, 1);
      const m = r.text.match(/đáy (\d+)cm, chiều cao (\d+)cm/);
      expect(m).not.toBeNull();
      const day = Number(m![1]), cao = Number(m![2]);
      expect(Number(r.correct_answer)).toBe((day * cao) / 2);
    }
  });

  it("TPL_G5_W13_A (diện tích hình thang): S=(a+b)×cao:2", () => {
    const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W13_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(5, 1);
      const m = r.text.match(/2 đáy (\d+)cm, (\d+)cm và chiều cao (\d+)cm/);
      expect(m).not.toBeNull();
      const a = Number(m![1]), b = Number(m![2]), h = Number(m![3]);
      expect(Number(r.correct_answer)).toBe(((a + b) * h) / 2);
    }
  });

  it("TPL_G5_W14_A/B (chu vi/diện tích hình tròn): đúng công thức π=3,14", () => {
    const tplC = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W14_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tplC.builtinGenerator!(5, 1);
      const mR = r.text.match(/bán kính (\d+)cm/);
      const mD = r.text.match(/đường kính (\d+)cm/);
      if (mR) expect(Math.abs(parseVN(r.correct_answer) - 2 * 3.14 * Number(mR[1]))).toBeLessThan(0.02);
      if (mD) expect(Math.abs(parseVN(r.correct_answer) - 3.14 * Number(mD[1]))).toBeLessThan(0.02);
    }
    const tplS = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W14_B")!;
    for (let i = 0; i < 60; i++) {
      const r = tplS.builtinGenerator!(5, 1);
      const m = r.text.match(/bán kính (\d+)cm/);
      expect(m).not.toBeNull();
      const rad = Number(m![1]);
      expect(Math.abs(parseVN(r.correct_answer) - 3.14 * rad * rad)).toBeLessThan(0.02);
    }
  });

  it("TPL_G5_W20_A/B (tổng-tỉ số / hiệu-tỉ số): số lớn+số bé đúng tỉ lệ", () => {
    const tplTong = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W20_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tplTong.builtinGenerator!(5, 1);
      const m = r.text.match(/Tổng của 2 số là (\d+), tỉ số của 2 số là (\d+)\/(\d+)\./);
      expect(m).not.toBeNull();
      const tong = Number(m![1]), p1 = Number(m![2]), p2 = Number(m![3]);
      const k = tong / (p1 + p2);
      const so1 = p1 * k, so2 = p2 * k;
      expect([so1, so2]).toContain(Number(r.correct_answer));
    }
  });

  it("TPL_G5_W20_C (tỉ số % của 2 số): đúng công thức a:b×100", () => {
    const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W20_C")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(5, 1);
      const m = r.text.match(/Tìm tỉ số phần trăm của (\d+) và (\d+):/);
      expect(m).not.toBeNull();
      const a = Number(m![1]), b = Number(m![2]);
      const expectedPct = Math.round((a / b) * 1000) / 10;
      const actualPct = parseVN(r.correct_answer.replace("%", ""));
      expect(Math.abs(actualPct - expectedPct)).toBeLessThan(0.15);
    }
  });

  it("TPL_G5_W21_A (giá trị % của 1 số): chiều thuận đúng %×tổng, chiều ngược đúng suy tổng", () => {
    const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W21_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(5, 1);
      const mThuan = r.text.match(/Tìm (\d+)% của (\d+):/);
      const mNguoc = r.text.match(/Biết (\d+)% của một số là (\d+)\. Số đó là:/);
      if (mThuan) {
        const pct = Number(mThuan[1]), total = Number(mThuan[2]);
        expect(Number(r.correct_answer)).toBe(Math.round((total * pct) / 100));
      } else if (mNguoc) {
        const pct = Number(mNguoc[1]), value = Number(mNguoc[2]);
        expect(Number(r.correct_answer)).toBe((value * 100) / pct);
      }
    }
  });

  it("TPL_G5_W25_A/B (thể tích HHCN/HLP): đúng công thức nhân", () => {
    const tplHCN = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W25_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tplHCN.builtinGenerator!(5, 1);
      const m = r.text.match(/chiều dài (\d+)cm, chiều rộng (\d+)cm, chiều cao (\d+)cm/);
      expect(m).not.toBeNull();
      const [, a, b, c] = m!.map(Number) as unknown as number[];
      expect(Number(r.correct_answer)).toBe(a * b * c);
    }
    const tplLP = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W25_B")!;
    for (let i = 0; i < 60; i++) {
      const r = tplLP.builtinGenerator!(5, 1);
      const m = r.text.match(/có cạnh (\d+)cm\./);
      expect(m).not.toBeNull();
      const a = Number(m![1]);
      expect(Number(r.correct_answer)).toBe(a * a * a);
    }
  });

  it("TPL_G5_W28_A (v/s/t): đúng công thức v=s:t, s=v×t, t=s:v", () => {
    const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W28_A")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(5, 1);
      const mV = r.text.match(/Một xe đi (\d+)km trong (\d+) giờ\. Tính vận tốc/);
      const mS = r.text.match(/vận tốc (\d+)km\/h trong (\d+) giờ\. Tính quãng đường/);
      const mT = r.text.match(/quãng đường (\d+)km với vận tốc (\d+)km\/h\. Tính thời gian/);
      if (mV) expect(Number(r.correct_answer)).toBe(Number(mV[1]) / Number(mV[2]));
      if (mS) expect(Number(r.correct_answer)).toBe(Number(mS[1]) * Number(mS[2]));
      if (mT) expect(Number(r.correct_answer)).toBe(Number(mT[1]) / Number(mT[2]));
    }
  });

  it("TPL_G5_W28_B (đổi vận tốc km/h↔m/s): hệ số 3,6 đúng cả 2 chiều", () => {
    const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W28_B")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(5, 1);
      const mUp = r.text.match(/Đổi: (\d+)km\/h = \? m\/s/);
      const mDown = r.text.match(/Đổi: ([\d,]+)m\/s = \? km\/h/);
      if (mUp) {
        const kmh = Number(mUp[1]);
        expect(Math.abs(parseVN(r.correct_answer) - kmh / 3.6)).toBeLessThan(0.15);
      } else if (mDown) {
        const ms = parseVN(mDown[1]);
        expect(Math.abs(Number(r.correct_answer) - ms * 3.6)).toBeLessThan(0.5);
      }
    }
  });

  it("TPL_G5_W30_C (tỉ số lần lặp lại dạng phân số): đúng count/total", () => {
    const tpl = GRADE5_BUILTIN_TEMPLATES.find((t) => t.id === "TPL_G5_W30_C")!;
    for (let i = 0; i < 60; i++) {
      const r = tpl.builtinGenerator!(5, 1);
      const m = r.text.match(/(\d+) lần, mặt 6 chấm xuất hiện (\d+) lần/);
      expect(m).not.toBeNull();
      const total = Number(m![1]), count = Number(m![2]);
      expect(r.correct_answer).toBe(`${count}/${total}`);
    }
  });
});
