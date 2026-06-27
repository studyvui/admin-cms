// Logic THUẦN (không React/DOM) cho trang Câu hỏi — tách từ app/(dashboard)/questions/page.tsx
// để test được bằng vitest (env node). Hành vi giữ NGUYÊN VẸN so với bản inline cũ; chỉ thêm
// tham số `rng` tuỳ chọn (mặc định Math.random) để test xác định được phần có ngẫu nhiên.

/** Sinh mã câu hỏi kế tiếp dạng `{lessonCode}_{seq:3}` (bỏ qua các seq đã dùng). */
export function nextQuestionCode(
  lessonCode: string,
  existingCodes: string[],
): string {
  const prefix = `${lessonCode}_`;
  const usedNums = new Set(
    existingCodes
      .filter((c) => c.startsWith(prefix))
      .map((c) => parseInt(c.slice(prefix.length), 10))
      .filter((n) => !isNaN(n) && n > 0),
  );
  let seq = 1;
  while (usedNums.has(seq)) seq++;
  return `${lessonCode}_${String(seq).padStart(3, "0")}`;
}

// ── Helpers cho loại "Điền chữ còn thiếu" (mode "letter") ──
// Cú pháp: gõ từ với [..] bao các chữ bị ẩn. Vd "h[el]lo" → prefix "h", hidden "el", suffix "lo".
export function parseMarkedWord(
  s: string,
): { prefix: string; hidden: string; suffix: string } | null {
  const m = (s ?? "").trim().match(/^([a-zA-Z]*)\[([a-zA-Z]+)\]([a-zA-Z]*)$/);
  if (!m) return null;
  return { prefix: m[1], hidden: m[2], suffix: m[3] };
}

/** Trộn mảng (Fisher–Yates). `rng` mặc định Math.random; tiêm để test xác định. */
export function shuffleArr<T>(a: T[], rng: () => number = Math.random): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// Sinh n chữ cái nhiễu ngẫu nhiên, KHÁC các chữ trong exclude (chữ đáp án).
export function genDistractorLetters(
  exclude: Set<string>,
  n: number,
  rng: () => number = Math.random,
): string[] {
  const pool = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .filter((c) => !exclude.has(c));
  return shuffleArr(pool, rng).slice(0, Math.max(0, n));
}
