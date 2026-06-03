// ============================================================
// Nạp engine VANILLA gốc (STUDYVUI/engine/english/*) vào 1 window shim
// để so khớp parity với bản TS port. Chỉ dùng trong test (Node).
// ============================================================
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));

// admin-cms/lib/eng-gen/__tests__ → lên 4 cấp = "AGRIBANK LAPTOP" → STUDYVUI
const ENGINE_DIR =
  process.env.STUDYVUI_ENGINE_DIR ||
  resolve(__dirname, "../../../../STUDYVUI/engine/english");

// Thứ tự nạp giống admin_english.html (chỉ các module cần cho building-block parity)
const LOAD_ORDER = [
  "data/vocab_provider.js",
  "templates/_index.js",
  "templates/vocab_image_choice.js",
  "templates/vocab_audio_choice.js",
  "templates/vocab_match_word.js",
  "templates/phonics_missing_letter.js",
  "templates/sentence_reorder.js",
  "templates/listening_audio_choice.js",
  "templates/review_mixed.js",
  "utils/template_expander.js",
  "difficulty/difficulty_engine.js",
  "generator/distractor_engine_v2.js",
  "observability/duplicate_detector_english_v2.js",
  "qa/visual_qa_english.js",
];

export interface VanillaWindow {
  EnglishTemplateRegistry: {
    getById: (id: string) => unknown;
    getAll: () => unknown[];
  };
  expandEnglishTemplate: (template: unknown, seed: number | null, ctx: unknown) => unknown;
  applyEnglishDifficultyConstraints: (template: unknown, level: number) => unknown;
  pickEnglishDistractors: (word: string, count: number, strategy: string, ctx: unknown) => string[];
  pickLetterDistractors: (letter: string, count: number, opts?: unknown) => string[];
  generateEnglishQuestionHash: (q: unknown) => string;
  computeEnglishQuestionDNA: (q: unknown) => unknown;
  runEnglishVisualQA: (q: unknown) => { passed: boolean; score: number };
  EnglishVocabProvider: { getWordListForWeek: (g: number, w: number) => string[] };
  // mulberry32 giống vanilla để cấp rng cho distractor parity
  _makeRng: (seed: number) => () => number;
  [k: string]: unknown;
}

let _cached: VanillaWindow | null = null;

export function loadVanilla(): VanillaWindow {
  if (_cached) return _cached;
  if (!existsSync(ENGINE_DIR)) {
    throw new Error(
      `Không tìm thấy engine vanilla tại: ${ENGINE_DIR}. Đặt env STUDYVUI_ENGINE_DIR để trỏ đúng.`,
    );
  }
  const win: Record<string, unknown> = {};
  const sandbox: Record<string, unknown> = {
    window: win,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    Math,
    Date,
    JSON,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
  };
  // self-reference cho code dùng `this`/global
  sandbox.globalThis = sandbox;

  for (const rel of LOAD_ORDER) {
    const file = resolve(ENGINE_DIR, rel);
    const code = readFileSync(file, "utf8");
    runInNewContext(code, sandbox, { filename: rel });
  }

  // mulberry32 chuẩn giống distractor_engine để cấp rng deterministic
  (win as VanillaWindow)._makeRng = (seed: number) => {
    let s = seed >>> 0;
    return function () {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  _cached = win as unknown as VanillaWindow;
  return _cached;
}
