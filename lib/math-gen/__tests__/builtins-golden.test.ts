// ============================================================
// STUDYVUI — Test đặc trưng (golden) cho builtin Toán Lớp 2-5.
// Khoá: thứ tự + metadata của GRADE{2..5}_BUILTIN_TEMPLATES và kết quả sinh đề của MỖI
// template khi Math.random cố định hạt giống. Dựng trước khi tách file builtins-grade*.ts
// (Đợt 4a) để chứng minh việc tách không đổi hành vi.
// Sửa generator CÓ CHỦ ĐÍCH → cập nhật file json: UPDATE_GOLDEN=1 npx vitest run lib/math-gen/__tests__/builtins-golden.test.ts
// ============================================================
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { MathTemplate } from "../types";
import { GRADE2_BUILTIN_TEMPLATES } from "../builtins-grade2";
import { GRADE3_BUILTIN_TEMPLATES } from "../builtins-grade3";
import { GRADE4_BUILTIN_TEMPLATES } from "../builtins-grade4";
import { GRADE5_BUILTIN_TEMPLATES } from "../builtins-grade5";

const GOLDEN_FILE = join(__dirname, "builtins-golden.json");
const RUNS = 25;

const GRADES: Record<string, MathTemplate[]> = {
  "2": GRADE2_BUILTIN_TEMPLATES,
  "3": GRADE3_BUILTIN_TEMPLATES,
  "4": GRADE4_BUILTIN_TEMPLATES,
  "5": GRADE5_BUILTIN_TEMPLATES,
};

interface GoldenGrade {
  ids: string[];
  meta: Record<string, string>;
  hash: Record<string, string>;
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function snapshotGrade(grade: number, templates: MathTemplate[]): GoldenGrade {
  const out: GoldenGrade = { ids: [], meta: {}, hash: {} };
  for (const t of templates) {
    out.ids.push(t.id);
    out.meta[t.id] = `${t.lessonType}|${t.skill}|${t.grade}|${t.text}`;
    const rng = mulberry32(fnv1a(t.id));
    const spy = vi.spyOn(Math, "random").mockImplementation(rng);
    try {
      const results = [];
      for (let i = 0; i < RUNS; i++) results.push(t.builtinGenerator!(grade, 1));
      out.hash[t.id] = createHash("sha256").update(JSON.stringify(results)).digest("hex").slice(0, 16);
    } catch (e) {
      out.hash[t.id] = `LOI: ${e instanceof Error ? e.message : String(e)}`; // lỗi lúc sinh → test đỏ nêu đúng id
    } finally {
      spy.mockRestore();
    }
  }
  return out;
}

afterEach(() => vi.restoreAllMocks());

const snapshot: Record<string, GoldenGrade> = {};
for (const [g, templates] of Object.entries(GRADES)) snapshot[g] = snapshotGrade(Number(g), templates);

if (process.env.UPDATE_GOLDEN) {
  writeFileSync(GOLDEN_FILE, JSON.stringify(snapshot, null, 2) + "\n");
}
const golden: Record<string, GoldenGrade> = JSON.parse(readFileSync(GOLDEN_FILE, "utf8"));

describe("builtin Toán Lớp 2-5 — golden (Math.random cố định)", () => {
  for (const g of Object.keys(GRADES)) {
    describe(`Lớp ${g}`, () => {
      it("danh sách id đúng thứ tự, đủ phần tử", () => {
        expect(snapshot[g].ids).toEqual(golden[g].ids);
      });
      it("metadata (lessonType | skill | grade | text) mỗi template y nguyên", () => {
        expect(snapshot[g].meta).toEqual(golden[g].meta);
      });
      it(`kết quả ${RUNS} lượt sinh của mỗi template y nguyên`, () => {
        expect(snapshot[g].hash).toEqual(golden[g].hash);
      });
    });
  }
});
