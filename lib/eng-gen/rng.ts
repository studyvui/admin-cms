// ============================================================
// STUDYVUI — Seeded RNG (mulberry32) — port y nguyên từ vanilla.
// Đây là CHÌA KHOÁ parity: cùng seed → cùng chuỗi số → cùng output.
// ============================================================
import type { Rng } from "./types";

/**
 * Biến thể dùng trong master_generator_english.js + template_expander.js.
 * `let s = (seed || ...) >>> 0;` rồi closure mutate s.
 */
export function makeRng(seed?: number): Rng {
  let s = ((seed || Math.random() * 0xffffffff) >>> 0) as number;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Biến thể dùng trong distractor_engine_v2.js (mutate tham số seed trực tiếp).
 * Với seed dương < 2^31 cho cùng kết quả như makeRng, nhưng port riêng cho chuẩn.
 */
export function mulberry32(seed: number): Rng {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRng<T>(arr: T[], rng: Rng): T | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}
