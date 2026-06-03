// ============================================================
// STUDYVUI — Engine sinh đề Toán (port evaluateFormula + generateDistractors
// + substitute của admin_math.html, dòng 2240–2300). Thuần, test được.
// ============================================================
import type { TemplateVar, OptionsType } from "./types";

/** Random giá trị cho 1 biến: number → int trong [min,max]; text → 1 phần tử choices. */
export function resolveVarValue(v: TemplateVar): string | number {
  if (v.type === "text") {
    const choices = (v.choices || []).filter((c) => c.trim() !== "");
    if (choices.length === 0) return `{${v.name}}`;
    return choices[Math.floor(Math.random() * choices.length)];
  }
  const min = Number.isFinite(v.min) ? (v.min as number) : 1;
  const max = Number.isFinite(v.max) ? (v.max as number) : 10;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/** Tạo map {name: value} cho toàn bộ biến. */
export function resolveVars(vars: TemplateVar[]): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const v of vars) out[v.name] = resolveVarValue(v);
  return out;
}

// Cho phép toán tử so sánh/logic trong điều kiện (sau khi thế biến số).
const SAFE_COND = /^[0-9+\-*/%().<>=!&|\s]+$/;

/**
 * Kiểm tra điều kiện ràng buộc (vd "c > b", "a >= b && a <= 10").
 * Rỗng → luôn true. Chỉ tính trên BIẾN SỐ; biểu thức không an toàn → true (bỏ qua).
 */
export function evaluateCondition(
  condition: string | undefined | null,
  vars: Record<string, string | number>,
): boolean {
  const c = (condition || "").trim();
  if (!c) return true;
  let expr = c;
  for (const [k, val] of Object.entries(vars)) {
    if (typeof val === "number") {
      expr = expr.replace(new RegExp(`\\b${k}\\b`, "g"), String(val));
    }
  }
  if (!SAFE_COND.test(expr)) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return Boolean(Function('"use strict"; return (' + expr + ")")());
  } catch {
    return true;
  }
}

/**
 * Random biến đến khi thỏa điều kiện (reject-sampling). Tối đa maxAttempts,
 * nếu không đạt thì trả lần cuối (tránh kẹt vô hạn khi điều kiện bất khả thi).
 */
export function resolveVarsWithCondition(
  vars: TemplateVar[],
  condition?: string | null,
  maxAttempts = 100,
): Record<string, string | number> {
  let last = resolveVars(vars);
  if (!condition || !condition.trim()) return last;
  for (let i = 0; i < maxAttempts; i++) {
    if (evaluateCondition(condition, last)) return last;
    last = resolveVars(vars);
  }
  return last;
}

/** Thế {name} trong text bằng giá trị. */
export function renderText(text: string, vars: Record<string, string | number>): string {
  let out = text;
  for (const [k, val] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(val));
  }
  return out;
}

export interface FormulaResult {
  answer: number | string;
  optionsType: OptionsType;
}

// Chỉ cho phép biểu thức số học an toàn (sau khi đã thế biến số).
const SAFE_EXPR = /^[0-9+\-*/().\s]+$/;

/**
 * Tính đáp án từ formula.
 * - "comparison" → so sánh a,b → '>' | '<' | '='.
 * - còn lại → thế các BIẾN SỐ vào biểu thức rồi eval (làm tròn 2 chữ số).
 */
export function evaluateFormula(
  formula: string,
  vars: Record<string, string | number>,
): FormulaResult {
  const f = (formula || "").trim().toLowerCase();
  if (f === "comparison") {
    const a = Number(vars.a);
    const b = Number(vars.b);
    const answer = a > b ? ">" : a < b ? "<" : "=";
    return { answer, optionsType: "comparison" };
  }
  let expr = formula;
  for (const [k, val] of Object.entries(vars)) {
    if (typeof val === "number") {
      expr = expr.replace(new RegExp(`\\b${k}\\b`, "g"), String(val));
    }
  }
  if (!SAFE_EXPR.test(expr)) return { answer: "?", optionsType: "numeric" };
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const result = Function('"use strict"; return (' + expr + ")")() as number;
    return { answer: Math.round(result * 100) / 100, optionsType: "numeric" };
  } catch {
    return { answer: "?", optionsType: "numeric" };
  }
}

/**
 * Sinh danh sách đáp án (đã gồm đáp án đúng, đã xáo trộn).
 * - comparison → ['>','<','='] (3 lựa chọn).
 * - numeric → spread quanh đáp án đúng, ≥0, duy nhất.
 */
export function generateDistractors(
  correct: number | string,
  count: number,
  optionsType: OptionsType,
): string[] {
  if (optionsType === "comparison") return [">", "<", "="];
  const correctVal = Number(correct);
  if (!Number.isFinite(correctVal)) return [String(correct)];
  const options: number[] = [correctVal];
  let attempts = 0;
  while (options.length < count + 1 && attempts < 200) {
    attempts++;
    const spread = Math.max(3, Math.abs(correctVal) * 0.3 + 2);
    const d = Math.round(correctVal + (Math.random() * spread * 2 - spread));
    if (d !== correctVal && d >= 0 && !options.includes(d)) options.push(d);
  }
  // xáo trộn
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options.map(String);
}
