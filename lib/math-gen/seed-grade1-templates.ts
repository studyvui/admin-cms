// ============================================================
// STUDYVUI — Seed template Toán Lớp 1 (GD14 Phase 2, 2026-07-24)
// Nguồn: mockup "Xưởng duyệt dạng bài Toán — theo node trạm (Lớp 1)" đã được
// người dùng CHỐT (35 node/tuần, 269 dạng bài). Đây là 68 dạng bài thuộc nhóm
// ✅ "Formula/lựa chọn sẵn có" — đáp án THUẦN SỐ HỌC (+ - * /) hoặc so sánh
// (>,<,=), khớp đúng khả năng của evaluateFormula hiện tại (KHÔNG cần sửa engine).
//
// KHÔNG bao gồm:
//  - Nhóm 🖼️ "cần ảnh gắn tay" — soạn thủ công qua modal Xem trước (Asset Picker),
//    không đi qua template.
//  - Nhóm 🛠️ "cần mở rộng engine" — đã có generator riêng trong builtins.ts
//    (decompose_tens_ones, seven_segment, shape_pattern_cycle, compare_routes,
//    compare_three_named, weekday_reasoning).
//  - Nhóm ⛔ "không khả thi" — loại khỏi phạm vi sinh đề tự động.
//
// Đây MỚI CHỈ LÀ FILE DỮ LIỆU (chưa seed lên backend). Muốn đưa vào production
// (bảng question_templates qua admin/question-templates) cần chạy script riêng
// POST từng template — PHẢI hỏi xác nhận trước khi chạy thật (xem README/CLAUDE.md
// mục "⛔ QUY TẮC DEPLOY").
// ============================================================
import type { TemplateInput, TemplateVar } from "./types";

function num(name: string, min: number, max: number): TemplateVar {
  return { name, type: "number", min, max };
}

const GRADE1_TEMPLATES: TemplateInput[] = [
  // ── Chủ đề 1: Các số trong phạm vi 10 & so sánh (Tuần 1-6 / Bài 1-6) ──
  {
    lessonType: "fill_blank", skill: "sequence", grade: 1,
    text: "Điền số còn thiếu: {a}, {b}, ?, {d}, {e}",
    formula: "c", vars: [num("a", 0, 3), num("b", 1, 4), num("c", 2, 5), num("d", 3, 6), num("e", 4, 7)],
    condition: "b===a+1 && c===b+1 && d===c+1 && e===d+1", distractorCount: 3,
  },
  {
    lessonType: "comparison", skill: "comparison", grade: 1,
    text: "Điền dấu thích hợp: {a} ... {b}",
    formula: "comparison", vars: [num("a", 0, 10), num("b", 0, 10)], distractorCount: 2,
  },
  {
    lessonType: "number_decompose", skill: "number_decomposition", grade: 1,
    text: "{x} gồm {a} và mấy?",
    formula: "x - a", vars: [num("x", 4, 10), num("a", 1, 9)], condition: "a < x", distractorCount: 3,
  },
  {
    lessonType: "fill_blank", skill: "sequence", grade: 1,
    text: "Điền số còn thiếu: {a}, {b}, ?, {d}",
    formula: "c", vars: [num("a", 0, 6), num("b", 1, 7), num("c", 2, 8), num("d", 3, 9)],
    condition: "b-a===d-c && c-b===d-c && b>a && d>c", distractorCount: 3,
  },

  // ── Chủ đề 3: Phép cộng, phép trừ phạm vi 10 (Tuần 9-14 / Bài 10-13) ──
  {
    lessonType: "calculation", skill: "addition", grade: 1,
    text: "Tính: {a} + {b} = ?",
    formula: "a + b", vars: [num("a", 0, 9), num("b", 0, 9)], condition: "a + b <= 10", distractorCount: 3,
  },
  {
    lessonType: "find_missing_number", skill: "addition", grade: 1,
    text: "Số? {a} + ? = {c}",
    formula: "c - a", vars: [num("a", 1, 9), num("c", 2, 10)], condition: "a < c", distractorCount: 3,
  },
  {
    lessonType: "complete_table", skill: "addition", grade: 1,
    text: "Tính: {a} + ? = {total}",
    formula: "total - a", vars: [num("a", 1, 9), num("total", 7, 10)], condition: "a < total", distractorCount: 3,
  },
  {
    lessonType: "chain_calculation", skill: "addition", grade: 1,
    text: "Tính: {a} + {b} + {c} = ?",
    formula: "a + b + c", vars: [num("a", 1, 5), num("b", 1, 4), num("c", 0, 3)], distractorCount: 3,
  },
  {
    lessonType: "calculation", skill: "subtraction", grade: 1,
    text: "Tính: {a} − {b} = ?",
    formula: "a - b", vars: [num("a", 1, 10), num("b", 0, 10)], condition: "b <= a", distractorCount: 3,
  },
  {
    lessonType: "complete_table", skill: "subtraction", grade: 1,
    text: "Tính: {minuend} − {b} = ?",
    formula: "minuend - b", vars: [num("minuend", 6, 10), num("b", 0, 10)], condition: "b <= minuend", distractorCount: 3,
  },
  {
    lessonType: "chain_calculation", skill: "subtraction", grade: 1,
    text: "Tính: {a} + {b} − {c} = ?",
    formula: "a + b - c", vars: [num("a", 1, 5), num("b", 1, 5), num("c", 1, 4)], condition: "a + b >= c", distractorCount: 3,
  },
  {
    lessonType: "chain_calculation", skill: "subtraction", grade: 1,
    text: "Tính: {a} − {b} − {c} = ?",
    formula: "a - b - c", vars: [num("a", 6, 10), num("b", 1, 3), num("c", 1, 2)], condition: "a - b >= c", distractorCount: 3,
  },
  {
    lessonType: "write_equation", skill: "number_decomposition", grade: 1,
    text: "Biết {a} + {b} = {c}. Vậy {c} − {a} = ?",
    formula: "b", vars: [num("a", 1, 8), num("b", 1, 8), num("c", 2, 16)], condition: "c===a+b", distractorCount: 3,
  },
  {
    lessonType: "complete_table", skill: "addition", grade: 1,
    text: "Ngôi nhà có tổng đỉnh là {total}. Một hàng ghi {a} và ?. Số còn lại là mấy?",
    formula: "total - a", vars: [num("total", 7, 9), num("a", 1, 8)], condition: "a < total", distractorCount: 3,
  },

  // ── Chủ đề 5: Ôn tập học kỳ 1 (Tuần 17-18 / Bài 17-20) ──
  {
    lessonType: "find_missing_number", skill: "logic_reasoning", grade: 1,
    text: "Số nào vừa lớn hơn {lo} vừa bé hơn {hi}?",
    formula: "lo + 1", vars: [num("lo", 2, 5), num("hi", 4, 7)], condition: "hi===lo+2", distractorCount: 3,
  },
  // (Bài 18 "Tính nhẩm tổng hợp cộng+trừ" trộn ngẫu nhiên phép + và − bằng 1 var text —
  // evaluateFormula không rẽ nhánh theo biến text được, nên tách thành 2 template riêng: mẫu
  // "Tính: {a} + {b}" và "Tính: {a} − {b}" đã có sẵn ở trên/dưới, dùng 2 mẫu đó thay vì 1 mẫu trộn.)

  // ── Chủ đề 6: Các số đến 100 (Tuần 19-21 / Bài 21-24) ──
  {
    lessonType: "fill_blank", skill: "sequence", grade: 1,
    text: "Điền số còn thiếu: {a}, ?, {c}, {d}",
    formula: "b", vars: [num("a", 10, 96), num("b", 11, 97), num("c", 12, 98), num("d", 13, 99)],
    condition: "b===a+1 && c===b+1 && d===c+1", distractorCount: 3,
  },
  {
    lessonType: "fill_blank", skill: "pattern_recognition", grade: 1,
    text: "Điền số còn thiếu: {a}, {b}, ?, {d}",
    formula: "c", vars: [num("a", 10, 60), num("b", 11, 65), num("c", 12, 70), num("d", 13, 75)],
    condition: "b-a===d-c && c-b===d-c && b>a", distractorCount: 3,
  },
  {
    lessonType: "comparison", skill: "comparison", grade: 1,
    text: "Điền dấu thích hợp: {a} ... {b}",
    formula: "comparison", vars: [num("a", 10, 99), num("b", 10, 99)], distractorCount: 2,
  },
  {
    lessonType: "find_missing_number", skill: "comparison", grade: 1,
    text: "Số nào lớn hơn trong cặp: {a} và {b}?",
    formula: "a", vars: [num("a", 50, 99), num("b", 10, 49)], distractorCount: 3,
  },
  {
    lessonType: "find_missing_number", skill: "comparison", grade: 1,
    text: "Số nào bé hơn trong cặp: {a} và {b}?",
    formula: "b", vars: [num("a", 50, 99), num("b", 10, 49)], distractorCount: 3,
  },

  // ── Chủ đề 7: Độ dài và đo độ dài (Tuần 22-24 / Bài 25-28) ──
  // (Bài 28 "so sánh tổng 2 tuyến đường" — đáp án là TÊN đường (text) suy ra từ so sánh
  // (a+b) với c, KHÔNG khớp formula:"comparison" (chỉ so 2 biến có sẵn). Dùng builtin
  // "compare_routes" trong builtins.ts thay cho template — không đưa vào seed declarative.)

  // ── Chủ đề 8: Cộng trừ (không nhớ) phạm vi 100 (Tuần 25-29 / Bài 29-33) ──
  {
    lessonType: "calculation", skill: "addition", grade: 1,
    text: "Tính: {a} + {b} = ?",
    formula: "a + b", vars: [num("a", 10, 89), num("b", 0, 9)], distractorCount: 3,
  },
  {
    lessonType: "word_problem", skill: "addition", grade: 1,
    text: "Mai gấp được {a} chiếc thuyền giấy, Mi gấp được {b} chiếc. Hỏi cả hai gấp được bao nhiêu chiếc?",
    formula: "a + b", vars: [num("a", 10, 30), num("b", 1, 9)], distractorCount: 3,
  },
  {
    lessonType: "calculation", skill: "addition", grade: 1,
    text: "Tính: {a} + {b} = ?",
    formula: "a + b", vars: [num("a", 10, 79), num("b", 10, 20)], distractorCount: 3,
  },
  {
    lessonType: "word_problem", skill: "addition", grade: 1,
    text: "Cây cà chua thứ nhất có {a} quả, cây thứ hai có {b} quả. Hỏi cả hai cây có bao nhiêu quả?",
    formula: "a + b", vars: [num("a", 5, 20), num("b", 5, 30)], distractorCount: 3,
  },
  {
    lessonType: "calculation", skill: "mental_math", grade: 1,
    text: "Tính nhẩm: {a} + {b} = ?",
    formula: "a + b", vars: [num("a", 10, 90), num("b", 10, 30)], condition: "a % 10 === 0 && b % 10 === 0", distractorCount: 3,
  },
  {
    lessonType: "calculation", skill: "subtraction", grade: 1,
    text: "Tính: {a} − {b} = ?",
    formula: "a - b", vars: [num("a", 11, 99), num("b", 0, 9)], condition: "b <= a", distractorCount: 3,
  },
  {
    lessonType: "word_problem", skill: "subtraction", grade: 1,
    text: "Xe buýt chở {a} hành khách. Có {b} người xuống xe. Hỏi còn lại bao nhiêu người?",
    formula: "a - b", vars: [num("a", 15, 29), num("b", 1, 9)], distractorCount: 3,
  },
  {
    lessonType: "fill_blank", skill: "subtraction", grade: 1,
    text: "Đếm lùi từ {a} đi 2 bước, mỗi bước 1 đơn vị. Còn lại mấy?",
    formula: "a - 2", vars: [num("a", 5, 20)], distractorCount: 3,
  },
  {
    lessonType: "write_equation", skill: "subtraction", grade: 1,
    text: "Biết {a} + {b} = {c}. Vậy {c} − {b} = ?",
    formula: "a", vars: [num("a", 10, 80), num("b", 1, 9), num("c", 11, 89)], condition: "c===a+b", distractorCount: 3,
  },
  {
    lessonType: "chain_calculation", skill: "subtraction", grade: 1,
    text: "Số? {x} →(−{a})→ ? →(+{b})→ ?",
    formula: "x - a + b", vars: [num("x", 20, 60), num("a", 1, 9), num("b", 1, 9)], distractorCount: 3,
  },
  {
    lessonType: "calculation", skill: "subtraction", grade: 1,
    text: "Tính: {a} − {b} = ?",
    formula: "a - b", vars: [num("a", 20, 99), num("b", 10, 90)], condition: "b <= a", distractorCount: 3,
  },
  {
    lessonType: "word_problem", skill: "subtraction", grade: 1,
    text: "Vườn cây có {total} cây nhãn và vải, trong đó có {a} cây nhãn. Hỏi có bao nhiêu cây vải?",
    formula: "total - a", vars: [num("total", 50, 99), num("a", 10, 89)], condition: "a < total", distractorCount: 3,
  },
  {
    lessonType: "calculation", skill: "mental_math", grade: 1,
    text: "Tính nhẩm: {a} − {b} = ?",
    formula: "a - b", vars: [num("a", 40, 90), num("b", 10, 30)], condition: "a % 10 === 0 && b % 10 === 0 && b <= a", distractorCount: 3,
  },
  {
    lessonType: "chain_calculation", skill: "subtraction", grade: 1,
    text: "Số? {x} →(−{a})→ ? →(−20)→ ?",
    formula: "x - a - 20", vars: [num("x", 60, 99), num("a", 10, 30)], condition: "x - a >= 20", distractorCount: 3,
  },
  // (Bài 33 "Tính/tính nhẩm tổng hợp" cũng trộn +/− ngẫu nhiên — dùng 2 mẫu cộng/trừ riêng đã có
  // ở trên thay vì 1 mẫu trộn theo lý do đã ghi ở Bài 18.)
  {
    lessonType: "word_problem", skill: "measurement", grade: 1,
    text: "Cầu bay qua 3 điểm cách nhau {a}, {b}, {c} bước chân. Tổng quãng đường bay là bao nhiêu bước chân?",
    formula: "a + b + c", vars: [num("a", 3, 12), num("b", 3, 8), num("c", 2, 6)], distractorCount: 3,
  },
  {
    lessonType: "chain_calculation", skill: "addition", grade: 1,
    text: "Số? {x} →(+{a})→ ? →(−{b})→ ?",
    formula: "x + a - b", vars: [num("x", 20, 60), num("a", 5, 20), num("b", 5, 25)], condition: "x + a >= b", distractorCount: 3,
  },
  {
    lessonType: "word_problem", skill: "logic_reasoning", grade: 1,
    text: "Có {total} quả. Hái đi {a} quả, rồi rụng thêm {b} quả. Hỏi còn lại bao nhiêu quả?",
    formula: "total - a - b", vars: [num("total", 40, 90), num("a", 15, 35), num("b", 1, 9)], condition: "total - a >= b", distractorCount: 3,
  },
  {
    lessonType: "word_problem", skill: "addition", grade: 1,
    text: "Cân thăng bằng: 1 bên có túi đỏ (?), bên kia có 2 túi {a} và {b}. Túi đỏ nặng bao nhiêu?",
    formula: "a + b", vars: [num("a", 10, 40), num("b", 10, 40)], distractorCount: 3,
  },
  {
    lessonType: "chain_calculation", skill: "addition", grade: 1,
    text: "Tính: {a} + {b} + {c} = ?",
    formula: "a + b + c", vars: [num("a", 10, 40), num("b", 1, 9), num("c", 1, 9)], distractorCount: 3,
  },

  // ── Chủ đề 9: Thời gian, giờ và lịch (Tuần 30-32 / Bài 34-37) ──
  {
    lessonType: "telling_time", skill: "time_reasoning", grade: 1,
    text: "Kim giờ chỉ số {h}, kim phút chỉ số 12. Là mấy giờ?",
    formula: "h", vars: [num("h", 1, 12)], distractorCount: 3,
  },
  {
    lessonType: "telling_time", skill: "time_reasoning", grade: 1,
    text: "Gia đình xuất phát lúc {a} giờ, về đến nhà lúc {b} giờ. Hỏi đi hết mấy giờ?",
    formula: "b - a", vars: [num("a", 6, 9), num("b", 8, 13)], condition: "b > a && b - a <= 4", distractorCount: 3,
  },
  {
    lessonType: "calendar_reading", skill: "time_reasoning", grade: 1,
    text: "Tờ lịch cũ ghi ngày {a}, tờ lịch mới ghi ngày {b}. Đã xé mấy tờ lịch?",
    formula: "b - a", vars: [num("a", 10, 20), num("b", 11, 25)], condition: "b > a", distractorCount: 3,
  },

  // ── Chủ đề 10: Ôn tập cuối năm (Tuần 33-35 / Bài 38-41) ──
  {
    lessonType: "fill_blank", skill: "sequence", grade: 1,
    text: "Điền số còn thiếu: {a}, {b}, {c}, ?",
    formula: "d", vars: [num("a", 0, 6), num("b", 1, 7), num("c", 2, 8), num("d", 3, 9)],
    condition: "b===a+1 && c===b+1 && d===c+1", distractorCount: 3,
  },
  {
    lessonType: "fill_blank", skill: "sequence", grade: 1,
    text: "Các giai đoạn phát triển: {a}, {b}, ?, {d}, {e}. Giai đoạn còn thiếu là số mấy?",
    formula: "c", vars: [num("a", 1, 1), num("b", 2, 2), num("c", 3, 3), num("d", 4, 4), num("e", 5, 5)],
    distractorCount: 3,
  },
  // (Câu "So sánh biểu thức {a}+{b} với {c}" và "So sánh 3 số đo bước chân, tìm dài nhất" cùng
  // lý do như Bài 28 ở trên — đáp án cần suy luận/text, không so trực tiếp 2 biến có sẵn. Dùng
  // builtin "compare_three_named" cho dạng "tìm ai/lớp nào nhiều/dài nhất trong 3"; dạng so sánh
  // biểu thức a+b với c có thể thêm sau bằng cách mở evaluateFormula hỗ trợ biểu thức 2 vế.)
  {
    lessonType: "calculation", skill: "mental_math", grade: 1,
    text: "Tính nhẩm: {a} + {b} = ?",
    formula: "a + b", vars: [num("a", 30, 90), num("b", 10, 40)], condition: "a % 10 === 0 && b % 10 === 0", distractorCount: 3,
  },
  {
    lessonType: "word_problem", skill: "subtraction", grade: 1,
    text: "Lớp em chăm sóc {a} cây hoa hồng. Sáng nay đã có {b} cây nở hoa. Hỏi còn bao nhiêu cây chưa nở?",
    formula: "a - b", vars: [num("a", 50, 90), num("b", 20, 49)], condition: "b < a", distractorCount: 3,
  },
  {
    lessonType: "word_problem", skill: "addition", grade: 1,
    text: "Mai hái được {a} bông hoa, Mi hái được {b} bông hoa. Hỏi cả hai chị em hái được bao nhiêu bông hoa?",
    formula: "a + b", vars: [num("a", 10, 40), num("b", 5, 20)], distractorCount: 3,
  },
];

export default GRADE1_TEMPLATES;
