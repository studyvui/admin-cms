// ============================================================
// STUDYVUI — Builtin generator Toán Lớp 2 (Phase 2, 2026-07-29).
// Nguồn: mockup "Xưởng duyệt dạng bài Toán — Lớp 2 (35 node)" đã được người
// dùng CHỐT (scratchpad lop2_logic.js, 994 dòng, 35 node HK1+HK2). File này
// PORT NGUYÊN VẸN logic các factory từ mockup JS sang builtinGenerator TS thật
// (source="builtin") để dùng trong admin-cms /ai-generate-math.
//
// KHÔNG bao gồm (giữ nguyên khỏi phạm vi tự động, giống Lớp 1):
//  - Nhóm 🖼️ "cần ảnh gắn tay" (feas="image" trong mockup) — soạn thủ công
//    qua modal Xem trước (Asset Picker), không đi qua template.
//  - Nhóm ⛔ "không khả thi" — không có trong 35 node Lớp 2 (đã lọc từ mockup).
//
// Quy ước: mỗi "factory" nhận tham số phạm vi (min/max/...) và trả về ĐÚNG 1
// hàm builtinGenerator (grade, difficulty) => RawGenerated — khớp chữ ký
// MathTemplate.builtinGenerator. distractorCount cố định 3 (4 lựa chọn).
// ============================================================
import type { MathTemplate } from "./types";
// ---- nhap tu cac file gen (muc 93 Dot 4a) ----
import {
  rnd, mcNumeric, mcFixed, decompose100, tachThe3So, tongHieuThanhPhan, tinhCongTru,
  soLienTruocSau, daySoLienTiep, giaiToanThemBot, giaiToanHonKem, soSanhBieuThuc,
  timChuoiChung3Buoc, noiKetQua, chonPhepTinhKQLonNhat, chonToHopTong, tinhDonVi,
  soSanhCanNang3Con, giaiToanDonVi, demDoanThang, doDaiGapKhuc, soSanh2DuongDi, suyLuanThu,
  doiGio12h24h, soGioMuonSom, docLich, xacSuatBong, type Gen,
} from "./builtins-grade2-gen-a";
import {
  bangNhanChia, timThuaSoTich, timSoBiChia, vietTongThanhTich, chiaDeu, soSanhNhanGiaoHoan,
  decompose1000, demNhomChucTram, vietSoThanhTong, docSoBangChu, soTronTramChuc, soSanh1000,
  dungSaiSoSanh, soSanhTenGiaTri, ghepTheMinMax, demTheoNguong, timChuSoChoBatDangThuc,
  timSoTheoDieuKien, soLonBeNhat3CsKhacNhau, doiDonVi, chonDonViDo, toanDoDiaDanhVN,
  demTongTien, chonToHopTien, doNLanThuoc, chuViHangRao, tauQuaCau, tinh3CsCong, tinh3CsTru,
  timPhepTinhSai, timChuSoDatCot, nhanDienKhoi, quyLuatHinhKhoi, pictograph,
} from "./builtins-grade2-gen-b";
// ---- het nhap (muc 93 Dot 4a) ----

// ================================================================
// GRADE2_BUILTIN_TEMPLATES — mirror đúng 35 node NODES trong lop2_logic.js.
// Mỗi phần tử = 1 item feas="formula"|"engine" (bỏ feas="image", soạn tay sau).
// ================================================================
function T(id: string, lessonType: string, skill: string, text: string, gen: Gen): MathTemplate {
  return {
    id,
    source: "builtin",
    lessonType,
    skill,
    grade: 2,
    text,
    formula: "built-in",
    vars: [],
    distractorCount: 3,
    builtinGenerator: () => gen(),
  };
}

export const GRADE2_BUILTIN_TEMPLATES: MathTemplate[] = [
  // W01 — Ôn tập số đến 100; tia số; số liền trước/sau
  T("TPL_G2_W01_A", "number_decompose", "number_decomposition", "Số gồm mấy chục mấy đơn vị", decompose100(10, 99)),
  T("TPL_G2_W01_B", "number_decompose", "logic_reasoning", "Ghép 2 thẻ số thành số có 2 chữ số khác nhau", tachThe3So()),
  T("TPL_G2_W01_C", "sequence", "sequence", "Số liền trước / liền sau", soLienTruocSau()),
  T("TPL_G2_W01_D", "sequence", "sequence", "Điền số còn thiếu trên tia số", daySoLienTiep(0, 96, 1)),

  // W02 — Số hạng/tổng, SBT/ST/hiệu, hơn kém
  T("TPL_G2_W02_A", "calculation", "calculation", "Tính tổng / hiệu từ số hạng cho sẵn", tongHieuThanhPhan(5, 60)),
  T("TPL_G2_W02_B", "calculation", "calculation", "Nhận diện số bị trừ/số trừ/hiệu", () => {
    const a = rnd(20, 80);
    const b = rnd(5, a - 1);
    return mcNumeric(`Trong phép tính ${a} - ${b} = ${a - b}, số bị trừ là bao nhiêu?`, a, 5);
  }),
  T("TPL_G2_W02_C", "word_problem", "logic_reasoning", "Giải toán hơn/kém (tuổi, số lượng)", giaiToanHonKem(5, 50)),
  T("TPL_G2_W02_D", "comparison", "comparison", "So sánh cân nặng 3 con vật (số liệu cho sẵn)", soSanhCanNang3Con()),

  // W03 — Ôn cộng trừ không nhớ phạm vi 100
  T("TPL_G2_W03_A", "calculation", "mental_math", "Tính nhẩm số tròn chục", tinhCongTru(10, 90, false)),
  T("TPL_G2_W03_B", "calculation", "calculation", "Tính (không nhớ, hàng ngang)", tinhCongTru(10, 99, false)),
  T("TPL_G2_W03_C", "comparison", "logic_reasoning", "Phân loại kết quả theo ngưỡng", demTheoNguong()),
  T("TPL_G2_W03_D", "chain_calculation", "mental_math", "Chuỗi 2 phép tính liên tiếp", timChuoiChung3Buoc(10, 90)),
  T("TPL_G2_W03_E", "calculation", "calculation", "Tổng của.../Hiệu của...", tongHieuThanhPhan(10, 90)),
  T("TPL_G2_W03_F", "comparison", "comparison", "Điền dấu >,<,= so sánh biểu thức", soSanhBieuThuc(1, 60)),

  // W04 — Cộng qua 10 phạm vi 20
  T("TPL_G2_W04_A", "calculation", "addition", "Tính cộng qua 10", tinhCongTru(2, 9, true)),
  T("TPL_G2_W04_B", "calculation", "addition", "Nối phép tính với kết quả", noiKetQua(2, 9)),
  T("TPL_G2_W04_C", "word_problem", "addition", "Giải toán lời văn cộng qua 10", giaiToanThemBot(4, 9)),

  // W05 — Bảng cộng qua 10; thêm/bớt
  T("TPL_G2_W05_A", "calculation", "addition", "Tính nhẩm bảng cộng qua 10", tinhCongTru(3, 9, true)),
  T("TPL_G2_W05_B", "calculation", "logic_reasoning", "Chọn phép tính kết quả lớn nhất", chonPhepTinhKQLonNhat(3, 9)),
  T("TPL_G2_W05_C", "chain_calculation", "mental_math", "Dây chuyền 2 bước (+/-)", timChuoiChung3Buoc(5, 15)),
  T("TPL_G2_W05_D", "word_problem", "addition", "Giải toán thêm một số đơn vị", giaiToanThemBot(5, 15)),
  T("TPL_G2_W05_E", "word_problem", "subtraction", "Giải toán bớt một số đơn vị", giaiToanThemBot(8, 20)),

  // W06 — Trừ qua 10 phạm vi 20
  T("TPL_G2_W06_A", "calculation", "subtraction", "Tính trừ qua 10", tinhCongTru(11, 18, false)),
  T("TPL_G2_W06_B", "calculation", "subtraction", "Nối phép trừ với kết quả", noiKetQua(11, 18)),
  T("TPL_G2_W06_C", "comparison", "comparison", "So sánh biểu thức trừ", soSanhBieuThuc(11, 18)),

  // W07 — Bảng trừ qua 10; nhiều hơn/ít hơn
  T("TPL_G2_W07_A", "calculation", "subtraction", "Tính nhẩm bảng trừ qua 10", tinhCongTru(11, 18, false)),
  T("TPL_G2_W07_B", "calculation", "logic_reasoning", "Chọn phép tính kết quả bé nhất", chonPhepTinhKQLonNhat(11, 18)),
  T("TPL_G2_W07_C", "word_problem", "logic_reasoning", "Giải toán về nhiều hơn một số đơn vị", giaiToanHonKem(5, 20)),
  T("TPL_G2_W07_D", "word_problem", "logic_reasoning", "Giải toán về ít hơn một số đơn vị", giaiToanHonKem(5, 20)),

  // W08 — Nặng hơn/nhẹ hơn; kg
  T("TPL_G2_W08_A", "calculation", "mental_math", "Tính nhẩm/hàng ngang (ôn tập)", tinhCongTru(1, 20, true)),
  T("TPL_G2_W08_B", "comparison", "comparison", "So sánh cân nặng 3 con vật", soSanhCanNang3Con()),
  T("TPL_G2_W08_C", "word_problem", "measurement", "Giải toán cộng/trừ ki-lô-gam", giaiToanDonVi("kg")),

  // W09 — Lít
  T("TPL_G2_W09_A", "number_decompose", "number_recognition", "Đọc số lít viết bằng chữ", () => {
    const n = rnd(2, 20);
    // Đọc số tiếng Việt 2-20: "mười" đứng trước hàng đơn vị của 11-19 (không phải
    // "một mươi" — cách đó chỉ dùng cho 20, 30...); "lăm" thay "năm" sau "mười".
    const donVi = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    let w: string;
    if (n <= 10) w = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"][n];
    else if (n < 20) w = `mười ${n % 10 === 5 ? "lăm" : donVi[n % 10]}`;
    else w = "hai mươi";
    return mcNumeric(`"${w.charAt(0).toUpperCase() + w.slice(1)} lít" là bao nhiêu lít?`, n, 3);
  }),
  T("TPL_G2_W09_B", "measurement", "measurement", "Tính cộng/trừ đơn vị lít", tinhDonVi("l", 1, 30)),
  T("TPL_G2_W09_C", "word_problem", "measurement", "Giải toán lời văn với lít", giaiToanDonVi("l")),
  T("TPL_G2_W09_D", "measurement", "measurement", "Tổng số lít từ nhiều ca cộng dồn", () => {
    const a = rnd(1, 5);
    const b = rnd(1, 5);
    const c = rnd(1, 5);
    return mcNumeric(`Đồ vật đựng số lít bằng tổng ${a}l+${b}l+${c}l. Đồ vật đó chứa bao nhiêu lít?`, a + b + c, 2);
  }),

  // W10 — Cộng có nhớ 2cs + 1cs
  T("TPL_G2_W10_A", "calculation", "addition", "Tính cộng có nhớ (2cs + 1cs)", () => {
    const a = rnd(10, 89);
    const b = rnd(Math.max(2, 11 - (a % 10)), 9);
    return mcNumeric(`Tính: ${a} + ${b} = ?`, a + b);
  }),
  T("TPL_G2_W10_B", "calculation", "logic_reasoning", "Chọn phép tính kết quả lớn nhất", chonPhepTinhKQLonNhat(10, 89)),
  T("TPL_G2_W10_C", "word_problem", "addition", "Giải toán lời văn cộng có nhớ", giaiToanThemBot(10, 89)),
  T("TPL_G2_W10_D", "calculation", "addition", "Tháp số: ô trên = tổng 2 ô dưới", () => {
    const a = rnd(1, 9);
    const b = rnd(1, 9);
    return mcNumeric(`Tháp số: 2 ô đáy là ${a} và ${b}. Ô trên (tổng 2 ô đáy) là bao nhiêu?`, a + b, 2);
  }),

  // W11 — Cộng có nhớ 2cs + 2cs
  T("TPL_G2_W11_A", "calculation", "addition", "Tính cộng có nhớ (2cs + 2cs)", () => {
    const a = rnd(15, 89);
    const b = rnd(15, 89);
    return mcNumeric(`Tính: ${a} + ${b} = ?`, a + b);
  }),
  T("TPL_G2_W11_B", "calculation", "logic_reasoning", "Tìm phép tính đúng trong các phép tính cho sẵn", () => {
    const a = rnd(10, 89);
    const b = rnd(10, 89);
    return mcFixed(`Phép tính nào dưới đây đúng?`, `${a} + ${b} = ${a + b}`, [
      `${a} + ${b} = ${a + b + 1}`,
      `${a} + ${b} = ${a + b - 1}`,
      `${a} + ${b} = ${a + b + 10}`,
    ]);
  }),
  T("TPL_G2_W11_C", "length_measurement", "comparison", "So sánh quãng đường qua 2 đoạn cộng dồn", soSanh2DuongDi()),
  T("TPL_G2_W11_D", "word_problem", "addition", "Giải toán lời văn cộng 2 số có 2 chữ số", giaiToanThemBot(15, 89)),

  // W12 — Trừ có nhớ 2cs - 1cs
  T("TPL_G2_W12_A", "calculation", "subtraction", "Tính trừ có nhớ (2cs - 1cs)", () => {
    const a = rnd(11, 95);
    const b = rnd((a % 10) + 1, 9);
    return mcNumeric(`Tính: ${a} - ${b} = ?`, a - b);
  }),
  T("TPL_G2_W12_B", "calculation", "logic_reasoning", "Chọn phép tính kết quả lớn nhất", chonPhepTinhKQLonNhat(20, 90)),
  T("TPL_G2_W12_C", "word_problem", "logic_reasoning", "Giải toán lời văn trừ có nhớ (ít hơn)", giaiToanHonKem(10, 90)),

  // W13 — Trừ có nhớ 2cs - 2cs
  T("TPL_G2_W13_A", "calculation", "subtraction", "Tính trừ có nhớ (2cs - 2cs)", () => {
    const a = rnd(30, 99);
    const b = rnd(15, a - 1);
    return mcNumeric(`Tính: ${a} - ${b} = ?`, a - b);
  }),
  T("TPL_G2_W13_B", "calculation", "logic_reasoning", "Chọn bảng ghi phép tính đúng", () => {
    const a = rnd(30, 99);
    const b = rnd(10, a - 1);
    return mcFixed(`Phép tính nào dưới đây đúng?`, `${a} - ${b} = ${a - b}`, [
      `${a} - ${b} = ${a - b + 1}`,
      `${a} - ${b} = ${a - b - 2}`,
      `${a} - ${b} = ${a - b + 10}`,
    ]);
  }),
  T("TPL_G2_W13_C", "comparison", "comparison", "Điền dấu so sánh biểu thức trừ", soSanhBieuThuc(20, 90)),
  T("TPL_G2_W13_D", "calculation", "mental_math", "Tính nhẩm 100 trừ số tròn chục", () => {
    const b = rnd(1, 9) * 10;
    return mcNumeric(`Tính nhẩm: 100 - ${b} = ?`, 100 - b, 10);
  }),

  // W14 — Điểm, đoạn thẳng
  T("TPL_G2_W14_A", "classify_2d", "geometry", "Đếm số đoạn thẳng trong hình", demDoanThang([
    ["Hình tam giác", 3],
    ["Hình tứ giác", 4],
    ["Hình chữ nhật", 4],
    ["Hình ngũ giác", 5],
    ["Hình lục giác", 6],
  ])),
  T("TPL_G2_W14_B", "classify_2d", "geometry", "Đếm số đoạn thẳng trong đường gấp khúc", demDoanThang([
    ["Đường gấp khúc 3 đoạn", 3],
    ["Đường gấp khúc 4 đoạn", 4],
    ["Đường gấp khúc 5 đoạn", 5],
    ["Đường gấp khúc 2 đoạn", 2],
    ["Đường gấp khúc 6 đoạn", 6],
  ])),

  // W15 — Đường gấp khúc, tứ giác
  T("TPL_G2_W15_A", "length_measurement", "measurement", "Tính độ dài đường gấp khúc", doDaiGapKhuc(3)),

  // W16 — Giờ - phút, ngày - tháng
  T("TPL_G2_W16_A", "telling_time", "time_reasoning", "Đổi giờ 12h ↔ 24h theo buổi", doiGio12h24h()),
  T("TPL_G2_W16_B", "telling_time", "time_reasoning", "So giờ đến với giờ quy định", soGioMuonSom()),
  T("TPL_G2_W16_C", "calendar_reading", "time_reasoning", "Đọc lịch: tháng có bao nhiêu ngày", docLich()),
  T("TPL_G2_W16_D", "calendar_reading", "time_reasoning", "Suy luận thứ trong tuần", suyLuanThu()),

  // W17 — Ôn cộng trừ phạm vi 20, 100
  T("TPL_G2_W17_A", "calculation", "mental_math", "Tính nhẩm cộng/trừ phạm vi 20 và 100", tinhCongTru(1, 99, true)),
  T("TPL_G2_W17_B", "comparison", "logic_reasoning", "Phân loại kết quả theo 2 ngưỡng", demTheoNguong()),
  T("TPL_G2_W17_C", "find_missing_number", "logic_reasoning", "Chọn 2 túi/số để đủ tổng cho trước", chonToHopTong("kg")),
  T("TPL_G2_W17_D", "calculation", "calculation", "Đặt tính rồi tính (hàng ngang)", tinhCongTru(20, 99, true)),

  // W18 — Ôn hình phẳng, đo lường, ôn tập HK1
  T("TPL_G2_W18_A", "classify_2d", "geometry", "Đếm đoạn thẳng trong hình cơ bản", demDoanThang([
    ["Hình vuông", 4],
    ["Hình tam giác", 3],
    ["Hình chữ nhật", 4],
    ["Hình lục giác", 6],
  ])),
  T("TPL_G2_W18_B", "measurement", "measurement", "Tính cộng/trừ kg và lít (ôn tập)", tinhDonVi("kg", 10, 90)),
  T("TPL_G2_W18_C", "find_missing_number", "logic_reasoning", "Chọn tổ hợp 3 can/vật đủ tổng cho trước", chonToHopTong("l")),
  T("TPL_G2_W18_D", "length_measurement", "comparison", "So sánh 2 đường đi (số liệu cho sẵn)", soSanh2DuongDi()),
  T("TPL_G2_W18_E", "calendar_reading", "time_reasoning", "Suy luận lịch: ngày X là thứ mấy", suyLuanThu()),
  T("TPL_G2_W18_F", "sequence", "sequence", "Chọn câu trả lời đúng (dãy số)", daySoLienTiep(10, 90, 2)),

  // W19 — Phép nhân; thừa số, tích
  T("TPL_G2_W19_A", "multiplication", "multiplication", "Chuyển phép cộng các số hạng bằng nhau thành phép nhân", vietTongThanhTich()),
  T("TPL_G2_W19_B", "multiplication", "multiplication", "Tính tích (bảng nhân cơ bản)", bangNhanChia(2, true)),
  T("TPL_G2_W19_C", "multiplication", "multiplication", "Tìm thừa số/tích trong phép nhân cho sẵn", timThuaSoTich()),
  T("TPL_G2_W19_D", "comparison", "multiplication", "So sánh phép nhân (tính giao hoán)", soSanhNhanGiaoHoan()),

  // W20 — Bảng nhân 2, 5
  T("TPL_G2_W20_A", "multiplication", "multiplication", "Tính nhẩm bảng nhân 2", bangNhanChia(2, true)),
  T("TPL_G2_W20_B", "multiplication", "multiplication", "Tính nhẩm bảng nhân 5", bangNhanChia(5, true)),
  T("TPL_G2_W20_C", "sequence", "sequence", "Đếm thêm 2/thêm 5 rồi nêu số còn thiếu", daySoLienTiep(2, 40, 2)),
  T("TPL_G2_W20_D", "calculation", "logic_reasoning", "Chọn phép tính có kết quả lớn/bé nhất", chonPhepTinhKQLonNhat(2, 10)),

  // W21 — Phép chia; SBC, SC, thương
  T("TPL_G2_W21_A", "division", "division", "Tính chia (bảng chia 2, 5 cơ bản)", bangNhanChia(2, false)),
  T("TPL_G2_W21_B", "division", "division", "Tìm số bị chia/số chia/thương", timSoBiChia()),
  T("TPL_G2_W21_C", "division", "division", "Chọn phép tính thích hợp cho bài toán chia đều", chiaDeu()),

  // W22 — Bảng chia 2, 5; luyện tập chung
  T("TPL_G2_W22_A", "division", "division", "Tính nhẩm bảng chia 2", bangNhanChia(2, false)),
  T("TPL_G2_W22_B", "division", "division", "Tính nhẩm bảng chia 5", bangNhanChia(5, false)),
  T("TPL_G2_W22_C", "counting", "number_recognition", "Tìm số theo điều kiện (1 chữ số / tròn chục)", timSoTheoDieuKien()),
  T("TPL_G2_W22_D", "multiplication", "multiplication", "Tính nhẩm hỗn hợp nhân/chia bảng 2&5", bangNhanChia(5, true)),

  // W23 — Khối trụ, khối cầu
  T("TPL_G2_W23_A", "classify_3d", "3d_shapes", "Nhận diện vật có dạng khối trụ/khối cầu", nhanDienKhoi()),
  T("TPL_G2_W23_B", "shape_pattern", "pattern_recognition", "Quy luật lặp chu kỳ khối (3D)", quyLuatHinhKhoi(false)),

  // W24 — Đơn vị, chục, trăm, nghìn; số tròn trăm/chục
  T("TPL_G2_W24_A", "number_decompose", "number_decomposition", "Số gồm mấy trăm mấy chục mấy đơn vị", decompose1000()),
  T("TPL_G2_W24_B", "multiplication", "mental_math", "Đếm nhóm 10/100 (khay bánh, hộp)", demNhomChucTram()),
  T("TPL_G2_W24_C", "sequence", "sequence", "Điền dãy số tròn trăm/tròn chục còn thiếu", daySoLienTiep(100, 900, 100)),
  T("TPL_G2_W24_D", "number_decompose", "number_recognition", "Nhận diện số tròn trăm/tròn chục", soTronTramChuc()),

  // W25 — So sánh tròn trăm/chục; số có 3cs
  T("TPL_G2_W25_A", "comparison", "comparison", "So sánh 2 số (>,<,=)", soSanh1000(10, 990)),
  T("TPL_G2_W25_B", "comparison", "logic_reasoning", "Đúng/Sai cho 1 phát biểu so sánh", dungSaiSoSanh()),
  T("TPL_G2_W25_C", "number_decompose", "number_recognition", "Đọc số bằng lời → chọn số đúng", docSoBangChu()),
  T("TPL_G2_W25_D", "comparison", "comparison", "So sánh giá trị 3-4 đối tượng có tên", soSanhTenGiaTri()),

  // W26 — Viết số thành tổng; so sánh số 3cs
  T("TPL_G2_W26_A", "number_decompose", "number_decomposition", "Viết số thành tổng trăm+chục+đơn vị", vietSoThanhTong()),
  T("TPL_G2_W26_B", "number_decompose", "logic_reasoning", "Ghép 3 thẻ số thành số lớn/bé nhất", ghepTheMinMax()),
  T("TPL_G2_W26_C", "comparison", "logic_reasoning", "Đếm số lượng thoả điều kiện >/< ngưỡng", demTheoNguong()),
  T("TPL_G2_W26_D", "comparison", "logic_reasoning", "Tìm chữ số thích hợp cho bất đẳng thức", timChuSoChoBatDangThuc()),

  // W27 — Luyện tập chung
  T("TPL_G2_W27_A", "number_decompose", "logic_reasoning", "Số lớn nhất/bé nhất có 3 chữ số", soLonBeNhat3CsKhacNhau()),
  T("TPL_G2_W27_B", "comparison", "comparison", "So sánh + sắp xếp số có 3 chữ số", soSanhTenGiaTri()),
  T("TPL_G2_W27_C", "number_decompose", "number_decomposition", "Viết số thành tổng (ôn tập)", vietSoThanhTong()),

  // W28 — dm, m, km
  T("TPL_G2_W28_A", "length_measurement", "measurement", "Đổi đơn vị đo độ dài (dm, m, cm)", doiDonVi()),
  T("TPL_G2_W28_B", "length_measurement", "measurement", "Chọn đơn vị đo thích hợp cho vật thật", chonDonViDo()),
  T("TPL_G2_W28_C", "length_measurement", "measurement", "Cộng/trừ số đo cùng đơn vị", tinhDonVi("m", 1, 50)),
  T("TPL_G2_W28_D", "length_measurement", "comparison", "So sánh 3 khoảng cách có tên", soSanhTenGiaTri()),

  // W29 — Tiền Việt Nam; thực hành đo độ dài
  T("TPL_G2_W29_A", "money", "money", "Đếm tổng số tiền từ nhiều tờ cho sẵn", demTongTien()),
  T("TPL_G2_W29_B", "money", "logic_reasoning", "Chọn tổ hợp tờ tiền đủ số tiền cho trước", chonToHopTien()),
  T("TPL_G2_W29_C", "length_measurement", "measurement", "Đo được N lần thước (N x đơn vị)", doNLanThuoc()),

  // W30 — Luyện tập chung (đo lường)
  T("TPL_G2_W30_A", "length_measurement", "measurement", "Tính chu vi/tổng nhiều đoạn cho sẵn", chuViHangRao()),
  T("TPL_G2_W30_B", "word_problem", "measurement", "Bài toán quãng đường còn lại (trừ)", giaiToanDonVi("km")),
  T("TPL_G2_W30_C", "word_problem", "subtraction", "Bài toán tàu qua cầu (trừ đơn giản)", tauQuaCau()),

  // W31 — Cộng phạm vi 1000
  T("TPL_G2_W31_A", "calculation", "addition", "Tính cộng 3 chữ số (không nhớ)", tinh3CsCong(100, 500, 100, 499)),
  T("TPL_G2_W31_B", "calculation", "addition", "Tính cộng 3 chữ số (có nhớ)", tinh3CsCong(150, 600, 150, 400)),
  T("TPL_G2_W31_C", "calculation", "logic_reasoning", "Tìm phép tính sai trong 4 phép tính", timPhepTinhSai()),
  T("TPL_G2_W31_D", "calculation", "calculation", "Tổng của.../Hiệu của... (3 chữ số)", tongHieuThanhPhan(100, 500)),

  // W32 — Trừ phạm vi 1000; luyện tập chung
  T("TPL_G2_W32_A", "calculation", "subtraction", "Tính trừ 3 chữ số (không nhớ)", tinh3CsTru(300, 900, 100)),
  T("TPL_G2_W32_B", "calculation", "subtraction", "Tính trừ 3 chữ số (có nhớ)", tinh3CsTru(300, 900, 50)),
  T("TPL_G2_W32_C", "find_missing_number", "logic_reasoning", "Tìm chữ số thích hợp trong phép +/- đặt cột", timChuSoDatCot()),
  T("TPL_G2_W32_D", "comparison", "logic_reasoning", "Phân loại kết quả theo ngưỡng", demTheoNguong()),

  // W33 — Thu thập số liệu; biểu đồ tranh; xác suất
  T("TPL_G2_W33_A", "data_read", "data_read", "Đọc biểu đồ tranh (mỗi biểu tượng = 1 hoặc 10)", pictograph()),
  T("TPL_G2_W33_B", "probability", "probability", "Xác suất: Chắc chắn / Có thể / Không thể", xacSuatBong()),

  // W34 — Ôn tập số, cộng trừ, nhân chia
  T("TPL_G2_W34_A", "number_decompose", "number_recognition", "Đọc số bằng lời (ôn tập)", docSoBangChu()),
  T("TPL_G2_W34_B", "calculation", "mental_math", "Tính nhẩm cộng trừ phạm vi 100 và 1000", tinhCongTru(10, 900, true)),
  T("TPL_G2_W34_C", "calculation", "calculation", "Tổng của.../Hiệu của... (ôn tập)", tongHieuThanhPhan(10, 900)),
  T("TPL_G2_W34_D", "multiplication", "multiplication", "Tính nhẩm nhân chia bảng 2&5 (ôn tập)", bangNhanChia(5, true)),
  T("TPL_G2_W34_E", "word_problem", "addition", "Toán đố khoảng cách địa danh Việt Nam", toanDoDiaDanhVN()),

  // W35 — Ôn tập hình học, đo lường, thống kê
  T("TPL_G2_W35_A", "measurement", "measurement", "Ôn tập đo lường: cộng/trừ kg, lít", tinhDonVi("kg", 10, 90)),
  T("TPL_G2_W35_B", "data_read", "data_read", "Đọc biểu đồ tranh (ôn tập)", pictograph()),
  T("TPL_G2_W35_C", "shape_pattern", "pattern_recognition", "Quy luật lặp theo màu", quyLuatHinhKhoi(true)),
  T("TPL_G2_W35_D", "length_measurement", "measurement", "Đường gấp khúc nhiều đoạn (ôn tập chung)", doDaiGapKhuc(3)),
  T("TPL_G2_W35_E", "probability", "probability", "Xác suất (ôn tập)", xacSuatBong()),
];

/** Built-in Lớp 2 khả dụng cho 1 lessonType (dùng cùng cơ chế getBuiltinsForLessonType). */
export function getGrade2BuiltinsForLessonType(lessonType: string): MathTemplate[] {
  return GRADE2_BUILTIN_TEMPLATES.filter((t) => t.lessonType === lessonType);
}

export function getAllGrade2Builtins(): MathTemplate[] {
  return GRADE2_BUILTIN_TEMPLATES;
}
