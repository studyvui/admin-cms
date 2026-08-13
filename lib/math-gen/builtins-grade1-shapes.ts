// ============================================================
// STUDYVUI — Mẫu built-in Lớp 1 cho 6 lessonType hình học/không gian
// (compare_quantity, spatial_orientation, assemble_shapes, match_object_shape,
// classify_2d, classify_3d). Trước đây các lessonType này dùng CHUNG mẫu
// generic "Có bao nhiêu {item} trong hình?" (BUILTIN_LT_MAP.counting trong
// builtins.ts) — sai bản chất sư phạm. File này viết mẫu RIÊNG theo đúng nội
// dung SGK thật (PLAN/TOÁN/ghi_chu_dang_bai_sgk/lop1_tap1_ghichu.md Bài
// 3/6/7/8/9/14/15/16), theo khuôn T()+generator imperative đã dùng ở
// builtins-grade2.ts (vd demDoanThang/nhanDienKhoi cho classify_2d/classify_3d).
//
// Tất cả các dạng này đều "KHẢ THI CẦN ẢNH" theo ghi chú SGK: câu hỏi + đáp án
// sinh tự động bằng text/số, ảnh minh hoạ do admin gắn tay ở modal Xem trước
// (Asset Picker) SAU KHI xem đáp án đúng — không auto-map. Tách file riêng
// (không gộp vào builtins.ts) để không vượt ngân sách ~500 dòng/file (AGENTS.md).
//
// Mỗi generator đảm bảo LUÔN trả ≥4 lựa chọn phân biệt — khác các mẫu cũ
// compare_routes/compare_three_named (builtins.ts) chỉ có 3 lựa chọn nên bị
// toBulkRows() âm thầm loại khỏi Excel 12 cột.
// ============================================================
import type { MathTemplate, RawGenerated } from "./types";

// ---------- Helpers thuần (copy quy ước từ builtins-grade2.ts) ----------
function shuffleArr<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function numericDistractors(correct: number, count: number, spread?: number): number[] {
  const sp = spread || Math.max(3, Math.abs(correct) * 0.3 + 2);
  const set = new Set<number>([correct]);
  let tries = 0;
  while (set.size < count + 1 && tries < 300) {
    tries++;
    const d = correct + Math.round((Math.random() * 2 - 1) * sp);
    if (d >= 0 && !set.has(d)) set.add(d);
  }
  let pad = 1;
  while (set.size < count + 1 && pad < 2000) {
    if (!set.has(correct + pad)) set.add(correct + pad);
    else if (correct - pad >= 0 && !set.has(correct - pad)) set.add(correct - pad);
    pad++;
  }
  return shuffleArr(Array.from(set));
}
function mcNumeric(text: string, correct: number, spread?: number): RawGenerated {
  const options = numericDistractors(correct, 3, spread).map(String);
  return { text, correct_answer: String(correct), options };
}

type Gen = () => RawGenerated;

// ================================================================
// compare_quantity (T3, T6 — "So sánh bằng nhau/nhiều hơn/ít hơn")
// ================================================================
const CMP_QTY_ITEMS = ["quả táo", "con mèo", "chiếc xe", "bông hoa", "quyển vở", "viên bi"];
function genCompareQuantity(): Gen {
  return () => {
    const item = CMP_QTY_ITEMS[rnd(0, CMP_QTY_ITEMS.length - 1)];
    const b = rnd(1, 8);
    const diff = rnd(1, 5);
    const a = b + diff;
    return mcNumeric(`Nhóm A có ${a} ${item}, nhóm B có ${b} ${item}. Nhóm A nhiều hơn nhóm B mấy ${item}?`, diff);
  };
}

// ================================================================
// spatial_orientation (T15, T16 — "Vị trí, định hướng trong không gian")
// ================================================================
function genSpatialLeftRight(): Gen {
  return () => {
    const n = rnd(4, 8);
    const k = rnd(1, n);
    const correct = n - k + 1;
    const pool = Array.from({ length: n }, (_, i) => i + 1).filter((v) => v !== correct);
    const options = shuffleArr([correct, ...shuffleArr(pool).slice(0, 3)]).map(String);
    return {
      text: `Có ${n} bạn xếp hàng từ trái sang phải, đánh số 1 đến ${n}. Bạn đứng vị trí thứ ${k} tính từ trái thì đứng vị trí thứ mấy tính từ phải?`,
      correct_answer: String(correct),
      options,
    };
  };
}
function genSpatialTrainCar(): Gen {
  return () => {
    const positions = [1, 2, 3, 4];
    const mode = rnd(0, 2);
    let text: string;
    let correct: number;
    if (mode === 0) {
      const x = rnd(2, 4);
      correct = x - 1;
      text = `Đoàn tàu có 4 toa đánh số 1 đến 4. Toa số mấy ở TRƯỚC toa số ${x}?`;
    } else if (mode === 1) {
      const x = rnd(1, 3);
      correct = x + 1;
      text = `Đoàn tàu có 4 toa đánh số 1 đến 4. Toa số mấy ở SAU toa số ${x}?`;
    } else {
      const a = rnd(1, 2);
      const b = a + 2;
      correct = a + 1;
      text = `Đoàn tàu có 4 toa đánh số 1 đến 4. Toa số mấy ở GIỮA toa ${a} và toa ${b}?`;
    }
    const options = shuffleArr(positions).map(String);
    return { text, correct_answer: String(correct), options };
  };
}

// ================================================================
// assemble_shapes (T8, T9, T18 — "TH lắp ghép, xếp hình")
// ================================================================
const ASSEMBLE_PIECES = ["miếng bìa hình tam giác", "miếng bìa hình vuông", "miếng bìa hình tròn", "miếng bìa hình chữ nhật"];
function genAssembleShapes(): Gen {
  return () => {
    const picked = shuffleArr(ASSEMBLE_PIECES).slice(0, 2);
    const a = rnd(2, 6);
    const b = rnd(2, 6);
    return mcNumeric(`Ghép ${a} ${picked[0]} với ${b} ${picked[1]} thì được tất cả bao nhiêu miếng bìa?`, a + b);
  };
}

// ================================================================
// match_object_shape (T7, T14 — "Nối đồ vật với hình/khối")
// ================================================================
const OBJECT_SHAPE_POOL: [string, string][] = [
  ["Quả bóng", "hình tròn"],
  ["Viên gạch", "hình vuông"],
  ["Biển báo giao thông", "hình tam giác"],
  ["Quyển sách", "hình chữ nhật"],
  ["Hộp quà", "khối lập phương"],
  ["Hộp bánh", "khối hộp chữ nhật"],
];
function genMatchObjectShape(): Gen {
  return () => {
    const idx = rnd(0, OBJECT_SHAPE_POOL.length - 1);
    const [object, correct] = OBJECT_SHAPE_POOL[idx];
    const distractorPool = Array.from(new Set(OBJECT_SHAPE_POOL.map((p) => p[1]))).filter((s) => s !== correct);
    const options = shuffleArr([correct, ...shuffleArr(distractorPool).slice(0, 3)]);
    return { text: `${object} thường có dạng hình gì?`, correct_answer: correct, options };
  };
}

// ================================================================
// classify_2d / classify_3d (T7/T18 và T14/T16 — nhận diện hình phẳng/khối)
// Pool cố định nhỏ (4 giá trị) → luôn xuất đủ 4 đáp án. Tên học sinh biến thiên
// trong text để giảm trùng chữ ký (signature) khi sinh batch nhiều câu, cùng
// tinh thần cảnh báo ở demDoanThang (builtins-grade2.ts): "tránh 1 template chỉ
// ra đúng 1 câu khiến batch sinh hàng loạt bị trùng lặp và bị loại".
// ================================================================
const KID_NAMES = ["Lan", "Mai", "Tuấn", "Nam", "Hà", "Minh", "An", "Bình"];
const SHAPE_2D_POOL = ["hình vuông", "hình tròn", "hình tam giác", "hình chữ nhật"];
const SHAPE_3D_POOL = ["khối lập phương", "khối hộp chữ nhật", "khối trụ", "khối cầu"];

function genClassify2D(): Gen {
  return () => {
    const name = KID_NAMES[rnd(0, KID_NAMES.length - 1)];
    const correct = SHAPE_2D_POOL[rnd(0, SHAPE_2D_POOL.length - 1)];
    return {
      text: `Hình trong bức tranh của bạn ${name} là hình gì?`,
      correct_answer: correct,
      options: shuffleArr(SHAPE_2D_POOL),
    };
  };
}
function genClassify3D(): Gen {
  return () => {
    const name = KID_NAMES[rnd(0, KID_NAMES.length - 1)];
    const correct = SHAPE_3D_POOL[rnd(0, SHAPE_3D_POOL.length - 1)];
    return {
      text: `Khối đồ chơi của bạn ${name} là khối gì?`,
      correct_answer: correct,
      options: shuffleArr(SHAPE_3D_POOL),
    };
  };
}

// ================================================================
// GRADE1_SHAPE_BUILTIN_TEMPLATES
// ================================================================
function T(id: string, lessonType: string, skill: string, text: string, gen: Gen): MathTemplate {
  return {
    id,
    source: "builtin",
    lessonType,
    skill,
    grade: 1,
    text,
    formula: "built-in",
    vars: [],
    distractorCount: 3,
    builtinGenerator: () => gen(),
  };
}

export const GRADE1_SHAPE_BUILTIN_TEMPLATES: MathTemplate[] = [
  T("TPL_G1_SHAPE_CMPQTY_01", "compare_quantity", "comparison", "So sánh số lượng 2 nhóm (nhiều hơn mấy đơn vị)", genCompareQuantity()),
  T("TPL_G1_SHAPE_SPATIAL_01", "spatial_orientation", "spatial_reasoning", "Vị trí trái-phải trong hàng", genSpatialLeftRight()),
  T("TPL_G1_SHAPE_SPATIAL_02", "spatial_orientation", "spatial_reasoning", "Vị trí trước-sau-giữa (đoàn tàu 4 toa)", genSpatialTrainCar()),
  T("TPL_G1_SHAPE_ASSEMBLE_01", "assemble_shapes", "spatial_reasoning", "Đếm tổng số miếng bìa khi ghép 2 loại hình", genAssembleShapes()),
  T("TPL_G1_SHAPE_MATCH_01", "match_object_shape", "2d_shapes", "Nối đồ vật thật với tên hình/khối", genMatchObjectShape()),
  T("TPL_G1_SHAPE_2D_01", "classify_2d", "2d_shapes", "Nhận diện hình phẳng qua ảnh", genClassify2D()),
  T("TPL_G1_SHAPE_3D_01", "classify_3d", "3d_shapes", "Nhận diện hình khối qua ảnh", genClassify3D()),
];

/** Built-in Lớp 1 (nhóm hình học/không gian) khả dụng cho 1 lessonType. */
export function getGrade1ShapeBuiltinsForLessonType(lessonType: string): MathTemplate[] {
  return GRADE1_SHAPE_BUILTIN_TEMPLATES.filter((t) => t.lessonType === lessonType);
}

export function getAllGrade1ShapeBuiltins(): MathTemplate[] {
  return GRADE1_SHAPE_BUILTIN_TEMPLATES;
}
