// ============================================================
// STUDYVUI — Mẫu built-in (gốc từ engine/math/math_templates.js).
// 4 mẫu numeric chuyển sang DẠNG KHAI BÁO (text/formula/vars) để sửa được
// (clone → custom). Riêng "dãy số" giữ generator imperative (cần biến dẫn xuất).
// ============================================================
import type { MathTemplate, RawGenerated, TemplateVar } from "./types";

function num(name: string, min: number, max: number): TemplateVar {
  return { name, type: "number", min, max };
}
function text(name: string, choices: string[]): TemplateVar {
  return { name, type: "text", choices };
}

function declarative(
  id: string,
  lessonType: string,
  skill: string,
  tplText: string,
  formula: string,
  vars: TemplateVar[],
  condition?: string,
  grade: number = 1,
): MathTemplate {
  return {
    id,
    source: "builtin",
    lessonType,
    skill,
    grade,
    text: tplText,
    formula,
    condition,
    vars,
    distractorCount: 3,
  };
}

// ── sequence: generator imperative (port nguyên) ─────────────
// params tuỳ chọn (admin chỉnh qua modal "Sửa" — xem sequence-range-modal.tsx): override
// range start/step. Không truyền → giữ nguyên range gốc (start 0-19, step 1-5).
function genSequence(_grade?: number, _difficulty?: number, params?: Record<string, number>): RawGenerated {
  const stepMin = params?.stepMin ?? 1;
  const stepMax = params?.stepMax ?? 5;
  const startMin = params?.startMin ?? 0;
  const startMax = params?.startMax ?? 19;
  const step = Math.floor(Math.random() * (stepMax - stepMin + 1)) + stepMin;
  const start = Math.floor(Math.random() * (startMax - startMin + 1)) + startMin;
  const seq = [start, start + step, start + step * 2, start + step * 3];
  const nextNum = start + step * 4;
  const options: number[] = [nextNum];
  while (options.length < 4) {
    const d = nextNum + Math.floor(Math.random() * 10) - 5;
    if (d >= 0 && !options.includes(d)) options.push(d);
  }
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return {
    text: `Điền số tiếp theo vào chỗ chấm: ${seq.join(", ")}, ...`,
    correct_answer: String(nextNum),
    options: options.map(String),
  };
}

// ============================================================
// GD14 Phase 2 (Lớp 1, 2026-07-24) — 6 generator imperative MỚI cho nhóm
// 🛠️ "cần mở rộng engine" (vượt khả năng formula +−×÷ thuần của evaluateFormula):
// tách chục/đơn vị, đếm que tính 7 đoạn, quy luật lặp hình, so sánh 2 tuyến
// đường, so sánh 3 giá trị gắn tên, suy luận thứ trong tuần.
// Nguồn: PLAN/TOÁN/ghi_chu_dang_bai_sgk/lop1_danh_muc_dang_bai.md (mục MỚI PHÁT HIỆN).
// ============================================================
function shuffleArr<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Bài 21/24: "X gồm mấy chục mấy đơn vị?" — cần chia lấy nguyên/dư (floor/mod),
// evaluateFormula không hỗ trợ toán tử này (SAFE_EXPR chỉ có + - * / ( )). ──
function genDecomposeTensOnes(): RawGenerated {
  const tens = Math.floor(Math.random() * 9) + 1; // 1-9
  const ones = Math.floor(Math.random() * 10); // 0-9
  const value = tens * 10 + ones;
  const correct = `${tens} chục ${ones} đơn vị`;
  const candidates = shuffleArr([
    `${ones} chục ${tens} đơn vị`,
    `${tens} chục ${(ones + 1) % 10} đơn vị`,
    `${(tens % 9) + 1} chục ${ones} đơn vị`,
    `${tens} chục ${(ones + 9) % 10} đơn vị`,
  ]).filter((c) => c !== correct);
  const options = shuffleArr([correct, ...candidates.slice(0, 3)]);
  return { text: `Số ${value} gồm mấy chục và mấy đơn vị?`, correct_answer: correct, options };
}

// ── Bài 38: đếm số que tính kiểu 7 đoạn (bảng tra, không phải công thức số học) ──
const SEVEN_SEGMENT_COUNT: Record<number, number> = { 0: 6, 1: 2, 2: 5, 3: 5, 4: 4, 5: 5, 6: 6, 7: 3, 8: 7, 9: 6 };
function genSevenSegment(): RawGenerated {
  const digit = Math.floor(Math.random() * 10);
  const correct = SEVEN_SEGMENT_COUNT[digit];
  const set = new Set<number>([correct]);
  let tries = 0;
  while (set.size < 4 && tries < 30) {
    tries++;
    const d = correct + Math.floor(Math.random() * 5) - 2;
    if (d > 0 && !set.has(d)) set.add(d);
  }
  return {
    text: `Xếp chữ số ${digit} bằng que tính (kiểu bảy đoạn). Cần mấy que tính?`,
    correct_answer: String(correct),
    options: shuffleArr(Array.from(set)).map(String),
  };
}

// ── Tuan 19-20: "Tim so theo dieu kien" — thay the genSevenSegment (nguoi dung yeu cau
// bo dang "xep que tinh kieu bay doan", 2026-07-28). Dang nay bam dung catalog SGK that
// (lop1_danh_muc_dang_bai.md) va la dang TEXT THUAN (khong can anh) cho lessonType
// "counting" — dang gan nhat truoc do (seven_segment) cung khong can anh nhung bi
// nguoi dung tu choi vi khong phu hop; dang nay thay bang tinh chat so hoc that (chu so
// don/tron chuc) thay vi lien tuong que tinh 7 doan.
function genFindNumberByProperty(): RawGenerated {
  const askSingleDigit = Math.random() < 0.5;
  if (askSingleDigit) {
    const correct = Math.floor(Math.random() * 9) + 1; // 1-9 (1 chu so)
    const wrongs = new Set<number>();
    while (wrongs.size < 3) {
      const d = Math.floor(Math.random() * 89) + 10; // 10-98 (2 chu so, chac chan sai)
      wrongs.add(d);
    }
    const options = shuffleArr([correct, ...Array.from(wrongs)]).map(String);
    return {
      text: `Trong các số sau, số nào là số CÓ MỘT CHỮ SỐ: ${options.join(", ")}?`,
      correct_answer: String(correct),
      options,
    };
  }
  const correct = (Math.floor(Math.random() * 9) + 1) * 10; // 10,20,...,90 (tron chuc)
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = Math.floor(Math.random() * 89) + 10; // 10-98
    if (d % 10 !== 0) wrongs.add(d); // loai so tron chuc khac de chi co 1 dap an dung
  }
  const options = shuffleArr([correct, ...Array.from(wrongs)]).map(String);
  return {
    text: `Trong các số sau, số nào là số TRÒN CHỤC: ${options.join(", ")}?`,
    correct_answer: String(correct),
    options,
  };
}

// ── Bài 9/19: quy luật lặp hình theo chu kỳ (đáp án là TÊN hình, không phải số) ──
const SHAPE_NAMES = ["hình tròn", "hình vuông", "hình tam giác", "hình chữ nhật"];
function genShapePatternCycle(): RawGenerated {
  const cycleLen = Math.random() < 0.5 ? 3 : 4;
  const pool = shuffleArr(SHAPE_NAMES).slice(0, cycleLen);
  const seqLen = cycleLen * 2 + 1;
  const seq: string[] = [];
  for (let i = 0; i < seqLen; i++) seq.push(pool[i % cycleLen]);
  const correct = seq[seqLen - 1];
  seq[seqLen - 1] = "?";
  // Luon can DU 4 dap an (khop yeu cau 12 cot Excel/bulk-import). Khi cycleLen=3, pool chi
  // co 2 nhieu — bu them tu SHAPE_NAMES day du (4 hinh) de luon co 3 nhieu + 1 dung = 4.
  let distractors = pool.filter((p) => p !== correct);
  if (distractors.length < 3) {
    const extra = SHAPE_NAMES.filter((s) => s !== correct && !distractors.includes(s));
    distractors = [...distractors, ...shuffleArr(extra)];
  }
  const options = shuffleArr([correct, ...distractors.slice(0, 3)]);
  return {
    text: `Dãy hình lặp lại: ${seq.join(", ")}. Hình còn thiếu là hình gì?`,
    correct_answer: correct,
    options,
  };
}

// ── Bài 28: so sánh tổng 2 đoạn đường chia khúc với 1 số cho trước (đáp án là TÊN đường) ──
function genCompareRoutes(): RawGenerated {
  const a = Math.floor(Math.random() * 7) + 2; // 2-8
  const b = Math.floor(Math.random() * 7) + 2; // 2-8
  const c = Math.floor(Math.random() * 11) + 5; // 5-15
  const sum = a + b;
  const correct = sum < c ? "Đường A" : sum > c ? "Đường B" : "Bằng nhau";
  return {
    text: `Đường A chia 2 đoạn ${a}m và ${b}m (tổng ${sum}m). Đường B dài ${c}m. Đường nào ngắn hơn?`,
    correct_answer: correct,
    options: ["Đường A", "Đường B", "Bằng nhau"],
  };
}

// ── Bài 22/38: so sánh 3 giá trị gắn với 3 cái tên, tìm tên có giá trị lớn/bé nhất ──
const NAMED_GROUP_POOLS: string[][] = [
  ["Lớp 1A", "Lớp 1B", "Lớp 1C"],
  ["Tổ Một", "Tổ Hai", "Tổ Ba"],
  ["Bạn Mai", "Bạn Việt", "Bạn Nam"],
];
function genCompareThreeNamed(): RawGenerated {
  const pool = NAMED_GROUP_POOLS[Math.floor(Math.random() * NAMED_GROUP_POOLS.length)];
  const base = Math.floor(Math.random() * 15) + 20; // 20-34
  const deltaB = Math.floor(Math.random() * 5) + 1;
  const deltaC = Math.floor(Math.random() * 5) + 1;
  const vals = [base, base - deltaB, base + deltaC];
  const askMax = Math.random() < 0.5;
  const target = askMax ? Math.max(...vals) : Math.min(...vals);
  const correctName = pool[vals.indexOf(target)];
  const text = `${pool[0]} có ${vals[0]} học sinh, ${pool[1]} có ${vals[1]} học sinh, ${pool[2]} có ${vals[2]} học sinh. ${askMax ? "Nơi nào có NHIỀU học sinh nhất?" : "Nơi nào có ÍT học sinh nhất?"}`;
  return { text, correct_answer: correctName, options: pool };
}

// ── Tuan 21-23/33: "So sanh SO nao lon hon/be hon" — dap an la MOT TRONG 2 SO da cho,
// khong phai dau ><= (evaluateFormula khong chon-nhanh duoc gia tri lon nhat giua 2 bien
// bang bieu thuc thuan). Dung builtin de dap an la SO (numeric), luon sinh du 4 lua chon
// phan biet (khac voi compare_routes/compare_three_named — nhung cau do dap an la TEN nen
// bi gioi han dung 3 lua chon, khong khop 12 cot; cau nay dap an la SO nen mo rong duoc). ──
function genCompareTwoNumbers(): RawGenerated {
  const a = Math.floor(Math.random() * 90) + 10; // 10-99
  let b = Math.floor(Math.random() * 90) + 10;
  while (b === a) b = Math.floor(Math.random() * 90) + 10;
  const askMax = Math.random() < 0.5;
  const correct = askMax ? Math.max(a, b) : Math.min(a, b);
  const text = `Số nào ${askMax ? "lớn hơn" : "bé hơn"}: ${a} hay ${b}?`;
  const set = new Set<number>([a, b]);
  let tries = 0;
  while (set.size < 4 && tries < 40) {
    tries++;
    const d = correct + Math.floor(Math.random() * 11) - 5;
    if (d >= 0 && !set.has(d)) set.add(d);
  }
  return { text, correct_answer: String(correct), options: shuffleArr(Array.from(set)).map(String) };
}

// ── Bài 35/37/40/41: suy luận thứ trong tuần (hôm qua/hôm nay/ngày mai, cộng dồn số ngày) ──
const WEEKDAY_NAMES = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"];
function genWeekdayReasoning(): RawGenerated {
  const idx = Math.floor(Math.random() * 7);
  const mode = Math.floor(Math.random() * 3);
  let text: string;
  let correctIdx: number;
  if (mode === 0) {
    text = `Hôm nay là ${WEEKDAY_NAMES[idx]}. Vậy ngày mai là thứ mấy?`;
    correctIdx = (idx + 1) % 7;
  } else if (mode === 1) {
    text = `Hôm nay là ${WEEKDAY_NAMES[idx]}. Vậy hôm qua là thứ mấy?`;
    correctIdx = (idx + 6) % 7;
  } else {
    const days = Math.floor(Math.random() * 3) + 2; // 2-4 ngày sau
    text = `Hôm nay là ${WEEKDAY_NAMES[idx]}. Sau ${days} ngày nữa là thứ mấy?`;
    correctIdx = (idx + days) % 7;
  }
  const correct = WEEKDAY_NAMES[correctIdx];
  // Can DU 4 dap an (7 thu trong tuan thua de lay 3 nhieu — truoc day chi lay 2 nhieu = 3
  // dap an, bi pipeline export/bulk-import loai vi thieu 1 dap an phan biet).
  const distractorPool = WEEKDAY_NAMES.filter((w) => w !== correct);
  const options = shuffleArr([correct, ...shuffleArr(distractorPool).slice(0, 3)]);
  return { text, correct_answer: correct, options };
}

// Nhóm built-in → templates (kỹ năng đã chuyển tiếng Việt).
export const BUILTIN_GROUPS: Record<string, MathTemplate[]> = {
  counting: [
    declarative(
      "TPL_COUNT_01",
      "counting",
      "counting",
      "Có bao nhiêu {item} trong hình?",
      "count",
      [num("count", 1, 5), text("item", ["quả táo", "con mèo", "chiếc xe", "ngôi sao"])],
    ),
  ],
  addition: [
    declarative(
      "TPL_ADD_01",
      "calculation",
      "addition",
      "Tính: {a} + {b} = ?",
      "a + b",
      [num("a", 1, 10), num("b", 1, 10)],
    ),
    declarative(
      "TPL_ADD_WORD_01",
      "word_problem",
      "word_problem",
      "Lan có {a} {item}. Mẹ cho Lan thêm {b} {item} nữa. Hỏi Lan có tất cả bao nhiêu {item}?",
      "a + b",
      [num("a", 1, 10), num("b", 1, 10), text("item", ["quyển vở", "cái kẹo", "quả cam", "viên bi"])],
    ),
  ],
  comparison: [
    declarative(
      "TPL_COMP_01",
      "comparison",
      "comparison",
      "Điền dấu thích hợp: {a} ... {b}",
      "comparison",
      [num("a", 0, 20), num("b", 0, 20)],
    ),
  ],
  sequence: [
    {
      id: "TPL_SEQ_01",
      source: "builtin",
      lessonType: "sequence",
      skill: "sequence",
      grade: 1,
      text: "Điền số tiếp theo vào chỗ chấm: {seq} ...",
      formula: "built-in",
      vars: [],
      distractorCount: 3,
      builtinGenerator: genSequence,
    },
  ],
  decompose_tens_ones: [
    {
      id: "TPL_DECOMPOSE_TENS_ONES_01",
      source: "builtin",
      lessonType: "number_decompose",
      skill: "number_decomposition",
      grade: 1,
      text: "Số {value} gồm mấy chục và mấy đơn vị?",
      formula: "built-in",
      vars: [],
      distractorCount: 3,
      builtinGenerator: genDecomposeTensOnes,
    },
  ],
  seven_segment: [
    {
      id: "TPL_SEVEN_SEGMENT_01",
      source: "builtin",
      lessonType: "counting",
      skill: "counting",
      grade: 1,
      text: "Xếp chữ số {digit} bằng que tính (kiểu bảy đoạn). Cần mấy que tính?",
      formula: "built-in",
      vars: [],
      distractorCount: 3,
      builtinGenerator: genSevenSegment,
    },
  ],
  find_number_by_property: [
    {
      id: "TPL_FIND_NUMBER_PROPERTY_01",
      source: "builtin",
      lessonType: "counting",
      skill: "number_recognition",
      grade: 1,
      text: "Trong các số cho trước, tìm số có 1 chữ số / số tròn chục.",
      formula: "built-in",
      vars: [],
      distractorCount: 3,
      builtinGenerator: genFindNumberByProperty,
    },
  ],
  shape_pattern_cycle: [
    {
      id: "TPL_SHAPE_PATTERN_01",
      source: "builtin",
      lessonType: "shape_pattern",
      skill: "pattern_recognition",
      grade: 1,
      text: "Dãy hình lặp lại: {seq}. Hình còn thiếu là hình gì?",
      formula: "built-in",
      vars: [],
      distractorCount: 3,
      builtinGenerator: genShapePatternCycle,
    },
  ],
  compare_routes: [
    {
      id: "TPL_COMPARE_ROUTES_01",
      source: "builtin",
      lessonType: "word_problem",
      skill: "comparison",
      grade: 1,
      text: "So sánh tổng 2 đoạn đường với 1 đoạn cho trước.",
      formula: "built-in",
      vars: [],
      distractorCount: 2,
      builtinGenerator: genCompareRoutes,
    },
  ],
  compare_three_named: [
    {
      id: "TPL_COMPARE_THREE_NAMED_01",
      source: "builtin",
      lessonType: "word_problem",
      skill: "comparison",
      grade: 1,
      text: "So sánh 3 giá trị gắn với 3 tên, tìm tên có giá trị lớn/bé nhất.",
      formula: "built-in",
      vars: [],
      distractorCount: 2,
      builtinGenerator: genCompareThreeNamed,
    },
  ],
  weekday_reasoning: [
    {
      id: "TPL_WEEKDAY_REASONING_01",
      source: "builtin",
      lessonType: "calendar_reading",
      skill: "time_reasoning",
      grade: 1,
      text: "Suy luận thứ trong tuần (hôm qua/hôm nay/ngày mai, cộng dồn số ngày).",
      formula: "built-in",
      vars: [],
      distractorCount: 2,
      builtinGenerator: genWeekdayReasoning,
    },
  ],
  compare_two_numbers: [
    {
      id: "TPL_COMPARE_TWO_NUM_01",
      source: "builtin",
      lessonType: "comparison",
      skill: "comparison",
      grade: 1,
      text: "Số nào lớn hơn/bé hơn trong 2 số cho trước.",
      formula: "built-in",
      vars: [],
      distractorCount: 3,
      builtinGenerator: genCompareTwoNumbers,
    },
  ],
};

// Map nhóm built-in → các lesson type được phép dùng (port BUILTIN_LT_MAP).
export const BUILTIN_LT_MAP: Record<string, string[]> = {
  counting: [
    "counting", "compare_quantity", "classify_2d", "classify_3d",
    "assemble_shapes", "match_object_shape", "shape_pattern",
    "spatial_orientation", "number_decompose",
  ],
  addition: [
    "calculation", "write_equation", "chain_calculation",
    "complete_table", "fill_blank", "find_missing_number", "word_problem",
  ],
  comparison: ["comparison", "compare_quantity", "find_missing_number"],
  sequence: ["sequence", "sort_numbers"],
  decompose_tens_ones: ["number_decompose"],
  // "counting" da bo khoi seven_segment (2026-07-28, nguoi dung yeu cau bo dang "xep que
  // tinh kieu bay doan" khoi noi dung sinh tu dong) — thay bang find_number_by_property.
  // Giu group "review" rieng (khong dung trong batch HK2 nay) phong khi can lai sau.
  seven_segment: ["review"],
  find_number_by_property: ["counting"],
  shape_pattern_cycle: ["shape_pattern"],
  compare_routes: ["word_problem", "length_measurement"],
  compare_three_named: ["word_problem", "comparison"],
  weekday_reasoning: ["calendar_reading"],
  compare_two_numbers: ["comparison", "find_missing_number"],
};

/**
 * Built-in khả dụng cho 1 lesson type (gộp các nhóm map tới lesson type đó).
 * grade tuỳ chọn: khi truyền vào, CHỈ trả built-in đúng lớp đó — bắt buộc dùng
 * khi 1 lessonType dùng chung tên ở nhiều lớp (vd "calculation") vì phạm vi số
 * mỗi lớp khác hẳn nhau (Lớp 1 số nhỏ, Lớp 2 tới 1000).
 */
export function getBuiltinsForLessonType(lessonType: string, grade?: number): MathTemplate[] {
  const out: MathTemplate[] = [];
  for (const gk of Object.keys(BUILTIN_LT_MAP)) {
    if (BUILTIN_LT_MAP[gk].includes(lessonType)) {
      out.push(...(BUILTIN_GROUPS[gk] || []));
    }
  }
  return grade == null ? out : out.filter((t) => t.grade === grade);
}

export function getAllBuiltins(): MathTemplate[] {
  return Object.values(BUILTIN_GROUPS).flat();
}
