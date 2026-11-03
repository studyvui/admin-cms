// ============================================================
// STUDYVUI — Builtin generator Toán Lớp 4 (Phase 2, 2026-08-11).
// Nguồn: mockup Artifact "Mockup Toán Lớp 4 — 35 node" đã được người dùng
// CHỐT (scratchpad lop4_logic.js, stress-test 13.800 lượt gọi sạch). File
// này PORT NGUYÊN VẸN logic các factory từ mockup JS sang builtinGenerator
// TS thật (source="builtin") để dùng trong admin-cms /ai-generate-math.
// Xem PLAN/TOÁN/ghi_chu_dang_bai_sgk/lop4_danh_muc_dang_bai.md (repo STUDYVUI)
// cho bảng ánh xạ tuần↔bài SGK đầy đủ + danh sách archetype.
//
// ĐIỂM MỚI so với Lớp 1-3: Lớp 4 có chương PHÂN SỐ hoàn toàn mới (T25-T32,
// T34) — hệ thống "Ngân hàng mẫu" hiện tại (evaluateFormula số học thuần +
// TemplateVar number/text) KHÔNG có kiểu dữ liệu phân số. Giải pháp: viết
// hẳn 1 engine phân số thuần TS (gcd/rút gọn/quy đồng/so sánh/4 phép tính)
// NGAY TRONG FILE NÀY và dùng builtinGenerator (RawGenerated là string thuần
// — text/correct_answer/options đều là string) — KHÔNG cần sửa types.ts hay
// evaluateFormula, vì builtinGenerator vốn đã bỏ qua formula/vars hoàn toàn
// (giống cách "sequence" của Lớp 1 hay "onTapPhepTinhLon" của Lớp 3 làm).
//
// KHÔNG bao gồm (giữ nguyên khỏi phạm vi tự động, giống Lớp 1/2/3):
//  - Nhóm 🖼️ "cần ảnh gắn tay" (5 item trong mockup: đọc số đo góc T3, nhận
//    diện loại góc T4, nhận diện vuông góc T13, nhận diện song song T14,
//    đọc biểu đồ cột T24) — soạn thủ công qua modal Xem trước (Asset Picker).
//  - Nhóm ⛔ "không khả thi" — không có trong 35 node Lớp 4 (đã lọc từ mockup).
//
// So với mockup gốc: vài "item mix" (dùng pick() chọn ngẫu nhiên giữa nhiều
// factory trong 1 thẻ demo, ở T10/T16/T17/T18/T33/T34/T35) được TÁCH thành
// các template RIÊNG BIỆT ở đây — dễ gắn skill tag chính xác + dễ test độc
// lập từng archetype hơn là gộp chung 1 template ngẫu nhiên đa dạng.
// ============================================================
import type { MathTemplate } from "./types";
// ---- nhap tu cac file gen (muc 93 Dot 4a) ----
import {
  docSoLon, vietSoTuCachDoc, soSanhSoLon, hangCuaChuSo, lamTronSo, daySoTuNhien, soChanLe,
  bieuThucChuaChu, baiToanBaBuoc, soSanhGocSoDo, phanLoaiGoc, donViKhoiLuongLon, donViDienTich,
  donViThoiGian, congTruSoLon, tinhChatPhepTinh, timHaiSoBietTongHieu, duongThangVuongGoc,
  duongThangSongSong, chuViHinhBinhHanh, chuViHinhThoi, type Gen,
} from "./builtins-grade4-gen-a";
import {
  nhanSoLonCho1CS, chiaSoLonCho1CS, nhanChiaNham101001000, nhanVoiSoCoHaiCS, chiaChoSoCoHaiCS,
  genEstimateCheck, timTrungBinhCong, genUnitRateForward, genUnitRateReverse, genDataSequence,
  genEventFrequency, genFractionConcept, genFractionEqualsDiv, genFractionBasicProperty,
  genFractionSimplify, genFractionCommonDenom, genFractionCompare, genFractionAddSub,
  genFractionMulDiv, genFractionOfNumber,
} from "./builtins-grade4-gen-b";
// ---- het nhap (muc 93 Dot 4a) ----

// ---------- Đăng ký template ----------
function T(id: string, lessonType: string, skill: string, text: string, gen: Gen): MathTemplate {
  return {
    id,
    source: "builtin",
    lessonType,
    skill,
    grade: 4,
    text,
    formula: "built-in",
    vars: [],
    distractorCount: 3,
    builtinGenerator: () => gen(),
  };
}

export const GRADE4_BUILTIN_TEMPLATES: MathTemplate[] = [
  // W01 — Ôn tập số đến 100.000; ôn tập các phép tính
  T("TPL_G4_W01_A", "calculation", "addition", "Ôn tập cộng/trừ số đến 100.000", congTruSoLon(99999)),
  T("TPL_G4_W01_B", "multiplication", "multiplication", "Ôn tập nhân số có nhiều chữ số với số có 1 chữ số", nhanSoLonCho1CS(5)),
  T("TPL_G4_W01_C", "comparison", "comparison", "So sánh số trong phạm vi 100.000", soSanhSoLon(1000, 99999)),

  // W02 — Số chẵn, số lẻ; biểu thức chứa chữ
  T("TPL_G4_W02_A", "number_decompose", "number_recognition", "Nhận biết số chẵn, số lẻ", soChanLe()),
  T("TPL_G4_W02_B", "calculation", "calculation", "Tính giá trị biểu thức chứa chữ (biết giá trị của chữ)", bieuThucChuaChu()),

  // W03 — Giải toán 3 bước tính; đo góc [image bỏ qua]
  T("TPL_G4_W03_A", "word_problem", "logic_reasoning", "Bài toán giải bằng 3 bước tính", baiToanBaBuoc()),
  T("TPL_G4_W03_B", "geometry", "geometry", "So sánh 2 góc theo số đo", soSanhGocSoDo()),

  // W04 — Góc nhọn, góc tù, góc bẹt
  T("TPL_G4_W04_A", "geometry", "geometry", "Phân loại góc nhọn / vuông / tù / bẹt theo số đo", phanLoaiGoc()),

  // W05 — Số có 6 chữ số, số 1.000.000; hàng và lớp (tiết 1)
  T("TPL_G4_W05_A", "number_decompose", "number_recognition", "Đọc số có 6 chữ số", docSoLon(100000, 999999)),
  T("TPL_G4_W05_B", "number_decompose", "number_recognition", "Viết số từ cách đọc (phạm vi 6 chữ số)", vietSoTuCachDoc(100000, 999999)),
  T("TPL_G4_W05_C", "number_decompose", "number_decomposition", "Xác định hàng của 1 chữ số (đến hàng trăm nghìn)", hangCuaChuSo(6)),

  // W06 — Hàng và lớp (tiết 2); số phạm vi lớp triệu; làm tròn hàng trăm nghìn
  T("TPL_G4_W06_A", "number_decompose", "number_recognition", "Đọc số đến hàng triệu", docSoLon(1000000, 900000000)),
  T("TPL_G4_W06_B", "number_decompose", "number_decomposition", "Xác định hàng/lớp của 1 chữ số (đến hàng trăm triệu)", hangCuaChuSo(9)),
  T("TPL_G4_W06_C", "rounding", "rounding", "Làm tròn số đến hàng trăm nghìn", lamTronSo(100000)),

  // W07 — So sánh số nhiều chữ số; dãy số tự nhiên
  T("TPL_G4_W07_A", "comparison", "comparison", "So sánh 2 số có nhiều chữ số (đến hàng triệu)", soSanhSoLon(100000, 999999999)),
  T("TPL_G4_W07_B", "sequence", "sequence", "Tìm số tiếp theo trong dãy số cách đều", daySoTuNhien()),

  // W08 — Yến, tạ, tấn
  T("TPL_G4_W08_A", "measurement", "measurement", "Đổi đơn vị khối lượng lớn (yến, tạ, tấn)", donViKhoiLuongLon()),

  // W09 — dm², m², mm²; giây, thế kỉ (tiết 1)
  T("TPL_G4_W09_A", "measurement", "measurement", "Đổi đơn vị diện tích (mm², cm², dm², m²)", donViDienTich()),
  T("TPL_G4_W09_B", "measurement", "time_reasoning", "Đổi đơn vị thời gian (phút-giây, thế kỉ)", donViThoiGian()),

  // W10 — Giây, thế kỉ (tiết 2); ôn tập đổi đơn vị
  T("TPL_G4_W10_A", "measurement", "time_reasoning", "Tính với đơn vị giây, thế kỉ (tiếp)", donViThoiGian()),
  T("TPL_G4_W10_B", "measurement", "measurement", "Ôn tập đổi đơn vị khối lượng", donViKhoiLuongLon()),
  T("TPL_G4_W10_C", "measurement", "measurement", "Ôn tập đổi đơn vị diện tích", donViDienTich()),

  // W11 — Cộng/trừ số có nhiều chữ số
  T("TPL_G4_W11_A", "calculation", "addition", "Đặt tính rồi tính: cộng/trừ số có nhiều chữ số", congTruSoLon(999999)),

  // W12 — T/c giao hoán+kết hợp phép cộng; tìm 2 số biết tổng và hiệu
  T("TPL_G4_W12_A", "calculation", "calculation", "Tính chất giao hoán / kết hợp của phép cộng", tinhChatPhepTinh(["giao_hoan_cong", "ket_hop_cong"])),
  T("TPL_G4_W12_B", "word_problem", "logic_reasoning", "Tìm hai số khi biết tổng và hiệu", timHaiSoBietTongHieu()),

  // W13 — Hai đường thẳng vuông góc [image bỏ qua]
  T("TPL_G4_W13_A", "geometry", "geometry", "Số đo góc tạo bởi 2 đường thẳng vuông góc", duongThangVuongGoc()),

  // W14 — Hai đường thẳng song song [image bỏ qua]
  T("TPL_G4_W14_A", "geometry", "geometry", "Đặc điểm 2 đường thẳng song song", duongThangSongSong()),

  // W15 — Hình bình hành, hình thoi
  T("TPL_G4_W15_A", "perimeter", "perimeter", "Chu vi hình bình hành", chuViHinhBinhHanh()),
  T("TPL_G4_W15_B", "perimeter", "perimeter", "Chu vi hình thoi", chuViHinhThoi()),

  // W16 — Ôn tập các số đến lớp triệu
  T("TPL_G4_W16_A", "comparison", "comparison", "Ôn tập so sánh số đến lớp triệu", soSanhSoLon(100000, 999999999)),
  T("TPL_G4_W16_B", "rounding", "rounding", "Ôn tập làm tròn số đến hàng triệu", lamTronSo(1000000)),
  T("TPL_G4_W16_C", "number_decompose", "number_recognition", "Ôn tập đọc số đến lớp triệu", docSoLon(100000, 900000000)),

  // W17 — Ôn tập phép cộng, phép trừ; ôn tập hình học
  T("TPL_G4_W17_A", "calculation", "addition", "Ôn tập cộng/trừ số có nhiều chữ số", congTruSoLon(999999)),
  T("TPL_G4_W17_B", "perimeter", "perimeter", "Ôn tập chu vi hình bình hành", chuViHinhBinhHanh()),
  T("TPL_G4_W17_C", "perimeter", "perimeter", "Ôn tập chu vi hình thoi", chuViHinhThoi()),

  // W18 — Ôn tập đo lường; ôn tập chung
  T("TPL_G4_W18_A", "measurement", "measurement", "Ôn tập đổi đơn vị khối lượng", donViKhoiLuongLon()),
  T("TPL_G4_W18_B", "measurement", "measurement", "Ôn tập đổi đơn vị diện tích", donViDienTich()),
  T("TPL_G4_W18_C", "measurement", "time_reasoning", "Ôn tập đổi đơn vị thời gian", donViThoiGian()),
  T("TPL_G4_W18_D", "word_problem", "logic_reasoning", "Ôn tập chung: bài toán nhiều bước", baiToanBaBuoc()),

  // ===== HK2 =====

  // W19 — Nhân/Chia với số có 1 chữ số
  T("TPL_G4_W19_A", "multiplication", "multiplication", "Nhân số có nhiều chữ số với số có 1 chữ số", nhanSoLonCho1CS(5)),
  T("TPL_G4_W19_B", "division", "division", "Chia số có nhiều chữ số cho số có 1 chữ số", chiaSoLonCho1CS(5)),

  // W20 — T/c giao hoán+kết hợp phép nhân; nhân/chia với 10,100,1000
  T("TPL_G4_W20_A", "calculation", "calculation", "Tính chất giao hoán / kết hợp của phép nhân", tinhChatPhepTinh(["giao_hoan_nhan", "ket_hop_nhan"])),
  T("TPL_G4_W20_B", "calculation", "mental_math", "Nhân, chia nhẩm với 10, 100, 1000", nhanChiaNham101001000()),

  // W21 — T/c phân phối phép nhân với phép cộng; nhân với số có 2CS (tiết 1)
  T("TPL_G4_W21_A", "calculation", "calculation", "Tính chất phân phối của phép nhân với phép cộng/trừ", tinhChatPhepTinh(["phan_phoi", "phan_phoi_tru"])),
  T("TPL_G4_W21_B", "multiplication", "multiplication", "Nhân với số có hai chữ số", nhanVoiSoCoHaiCS()),

  // W22 — Nhân/Chia cho số có 2CS; ước lượng
  T("TPL_G4_W22_A", "division", "division", "Chia cho số có hai chữ số", chiaChoSoCoHaiCS()),
  T("TPL_G4_W22_B", "estimation", "estimation", "Ước lượng (làm tròn) để kiểm tra nhanh Đúng/Sai", genEstimateCheck()),

  // W23 — Tìm TBC; bài toán rút về đơn vị
  T("TPL_G4_W23_A", "calculation", "average", "Tìm số trung bình cộng", timTrungBinhCong()),
  T("TPL_G4_W23_B", "word_problem", "word_problem", "Rút về đơn vị — chiều tìm tổng (chia rồi nhân)", genUnitRateForward()),
  T("TPL_G4_W23_C", "word_problem", "word_problem", "Rút về đơn vị — chiều tìm số lượng (chia rồi chia)", genUnitRateReverse()),

  // W24 — Dãy số liệu thống kê; biểu đồ cột [image bỏ qua]
  T("TPL_G4_W24_A", "data_read", "data_read", "Đọc dãy số liệu thống kê", genDataSequence()),

  // W25 — Số lần xuất hiện 1 sự kiện; khái niệm phân số
  T("TPL_G4_W25_A", "probability", "probability", "Đếm số lần xuất hiện của 1 sự kiện", genEventFrequency()),
  T("TPL_G4_W25_B", "fraction", "fraction", "Khái niệm phân số: đọc/viết, tử số, mẫu số", genFractionConcept()),

  // W26 — Phân số và phép chia số tự nhiên; t/c cơ bản phân số
  T("TPL_G4_W26_A", "fraction", "fraction", "Phân số và phép chia số tự nhiên (a:b = a/b)", genFractionEqualsDiv()),
  T("TPL_G4_W26_B", "fraction", "fraction", "Tính chất cơ bản của phân số", genFractionBasicProperty()),

  // W27 — Rút gọn phân số; quy đồng mẫu số
  T("TPL_G4_W27_A", "fraction", "fraction", "Rút gọn phân số về tối giản", genFractionSimplify()),
  T("TPL_G4_W27_B", "fraction", "fraction", "Quy đồng mẫu số 2 phân số", genFractionCommonDenom()),

  // W28 — So sánh phân số
  T("TPL_G4_W28_A", "fraction", "fraction", "So sánh 2 phân số (cùng mẫu / cùng tử / so với 1)", genFractionCompare()),

  // W29 — Phép cộng phân số
  T("TPL_G4_W29_A", "fraction_operations", "fraction_operations", "Cộng phân số (cùng mẫu / khác mẫu / với số tự nhiên)", genFractionAddSub(true)),

  // W30 — Phép trừ phân số
  T("TPL_G4_W30_A", "fraction_operations", "fraction_operations", "Trừ phân số (cùng mẫu / khác mẫu / với số tự nhiên)", genFractionAddSub(false)),

  // W31 — Phép nhân phân số
  T("TPL_G4_W31_A", "fraction_operations", "fraction_operations", "Nhân phân số (2 phân số / với số tự nhiên)", genFractionMulDiv(true)),

  // W32 — Phép chia phân số; tìm phân số của 1 số
  T("TPL_G4_W32_A", "fraction_operations", "fraction_operations", "Chia phân số (2 phân số / với số tự nhiên)", genFractionMulDiv(false)),
  T("TPL_G4_W32_B", "fraction_operations", "fraction_operations", "Tìm phân số của một số (bài toán lời văn)", genFractionOfNumber()),

  // W33 — Ôn tập số tự nhiên
  T("TPL_G4_W33_A", "comparison", "comparison", "Ôn tập so sánh số tự nhiên", soSanhSoLon(100000, 999999999)),
  T("TPL_G4_W33_B", "rounding", "rounding", "Ôn tập làm tròn số tự nhiên", lamTronSo(1000000)),
  T("TPL_G4_W33_C", "number_decompose", "number_recognition", "Ôn tập đọc số tự nhiên", docSoLon(100000, 900000000)),

  // W34 — Ôn tập phép tính với STN; ôn tập phân số và phép tính phân số
  T("TPL_G4_W34_A", "calculation", "calculation", "Ôn tập tính chất phép tính viết bằng chữ (a, b, c)", tinhChatPhepTinh(["giao_hoan_cong", "ket_hop_cong", "giao_hoan_nhan", "ket_hop_nhan", "phan_phoi", "phan_phoi_tru"])),
  T("TPL_G4_W34_B", "fraction_operations", "fraction_operations", "Ôn tập cộng phân số", genFractionAddSub(true)),
  T("TPL_G4_W34_C", "fraction_operations", "fraction_operations", "Ôn tập trừ phân số", genFractionAddSub(false)),
  T("TPL_G4_W34_D", "fraction_operations", "fraction_operations", "Ôn tập nhân phân số", genFractionMulDiv(true)),
  T("TPL_G4_W34_E", "fraction_operations", "fraction_operations", "Ôn tập chia phân số", genFractionMulDiv(false)),

  // W35 — Ôn tập hình học, đo lường và bảng số liệu để kết thúc năm học
  T("TPL_G4_W35_A", "perimeter", "perimeter", "Ôn tập chu vi hình bình hành", chuViHinhBinhHanh()),
  T("TPL_G4_W35_B", "perimeter", "perimeter", "Ôn tập chu vi hình thoi", chuViHinhThoi()),
  T("TPL_G4_W35_C", "data_read", "data_read", "Ôn tập đọc bảng số liệu thống kê", genDataSequence()),
  T("TPL_G4_W35_D", "probability", "probability", "Ôn tập đếm số lần xuất hiện sự kiện", genEventFrequency()),
];

export function getGrade4BuiltinsForLessonType(lessonType: string): MathTemplate[] {
  return GRADE4_BUILTIN_TEMPLATES.filter((t) => t.lessonType === lessonType);
}
export function getAllGrade4Builtins(): MathTemplate[] {
  return GRADE4_BUILTIN_TEMPLATES;
}
