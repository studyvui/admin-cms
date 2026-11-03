// ============================================================
// STUDYVUI — Builtin generator Toán Lớp 3 (Phase 2, 2026-08-05).
// Nguồn: mockup Artifact "Mockup Toán Lớp 3 — 35 node" đã được người dùng
// CHỐT (scratchpad lop3_logic.js, stress-test 136.500 lượt gọi sạch). File
// này PORT NGUYÊN VẸN logic các factory từ mockup JS sang builtinGenerator
// TS thật (source="builtin") để dùng trong admin-cms /ai-generate-math.
// Xem PLAN/TOÁN/ghi_chu_dang_bai_sgk/lop3_danh_muc_dang_bai.md (repo STUDYVUI)
// cho bảng ánh xạ tuần↔bài SGK đầy đủ + danh sách archetype.
//
// KHÔNG bao gồm (giữ nguyên khỏi phạm vi tự động, giống Lớp 1/2):
//  - Nhóm 🖼️ "cần ảnh gắn tay" (6 item trong mockup: đo đoạn thẳng T3, điểm
//    giữa/trung điểm + hình tròn T7, góc vuông T8, đếm ô vuông diện tích T21,
//    đọc đồng hồ kim T29) — soạn thủ công qua modal Xem trước (Asset Picker).
//  - Nhóm ⛔ "không khả thi" — không có trong 35 node Lớp 3 (đã lọc từ mockup).
// ============================================================
import type { MathTemplate } from "./types";
// ---- nhap tu cac file gen (muc 93 Dot 4a) ----
import {
  timThanhPhanCongTru, bangNhanChia, timThanhPhanNhanChia, motPhanMay, demCanhHinh, demMatKhoi,
  nhanSo2CS1CS, gapMotSoLenNLan, chiaHetChiaCoDu, chiaSo2CS1CS, giamMotSoDiNLan,
  baiToan2BuocNhanCong, donViDoNho, soSanhNhietDo, nhanChiaSo3CS1CS, toHopCongDatTong,
  bieuThucSo, soSanhGapMayLan, onTapTongHopPhepTinh, onTapChuViDonGian, type Gen,
} from "./builtins-grade3-gen-a";
import {
  docSoLon, vietSoTuCachDoc, soLienTruocSauLon, soSanhSoLon, phanTichThanhTong, docLaMa,
  lamTronSo, chuViTamGiacTuGiac, chuViHCNVuong, dienTichHCNVuong, phanBietChuViDienTich,
  congTruPhamViLon, tinhNhamTronNghin, nhanChiaSoLonCho1CS, tinhKhoangThoiGian,
  soNgayTrongThang, tinhLichThu, tienVietNamTong, tienVietNamDoi, docBangSoLieu, demTally,
  khaNangXayRa, timSoLonBeNhatNChuSo, onTapPhepTinhLon,
} from "./builtins-grade3-gen-b";
// ---- het nhap (muc 93 Dot 4a) ----

// ---------- Đăng ký template ----------
function T(id: string, lessonType: string, skill: string, text: string, gen: Gen): MathTemplate {
  return {
    id,
    source: "builtin",
    lessonType,
    skill,
    grade: 3,
    text,
    formula: "built-in",
    vars: [],
    distractorCount: 3,
    builtinGenerator: () => gen(),
  };
}

export const GRADE3_BUILTIN_TEMPLATES: MathTemplate[] = [
  // W01 — Ôn tập số đến 1000; cộng trừ pv1000; tìm thành phần
  T("TPL_G3_W01_A", "calculation", "calculation", "Tìm thành phần / tổng / hiệu (pv 1000)", timThanhPhanCongTru(50, 900)),
  T("TPL_G3_W01_B", "comparison", "comparison", "So sánh số trong phạm vi 1000", soSanhSoLon(100, 999)),
  T("TPL_G3_W01_C", "number_decompose", "number_decomposition", "Phân tích số thành tổng trăm-chục-đơn vị", phanTichThanhTong(100, 999)),

  // W02 — Tìm thành phần (tiết 2); bảng nhân/chia 2, 5, 3
  T("TPL_G3_W02_A", "multiplication", "multiplication", "Bảng nhân 2", bangNhanChia(2, false)),
  T("TPL_G3_W02_B", "division", "division", "Bảng chia 2", bangNhanChia(2, true)),
  T("TPL_G3_W02_C", "multiplication", "multiplication", "Bảng nhân 5", bangNhanChia(5, false)),
  T("TPL_G3_W02_D", "division", "division", "Bảng chia 5", bangNhanChia(5, true)),
  T("TPL_G3_W02_E", "multiplication", "multiplication", "Bảng nhân 3", bangNhanChia(3, false)),
  T("TPL_G3_W02_F", "division", "division", "Bảng chia 3", bangNhanChia(3, true)),

  // W03 — Bảng nhân/chia 4; ôn hình học đo lường
  T("TPL_G3_W03_A", "multiplication", "multiplication", "Bảng nhân 4", bangNhanChia(4, false)),
  T("TPL_G3_W03_B", "division", "division", "Bảng chia 4", bangNhanChia(4, true)),

  // W04 — Luyện tập chung; bảng nhân/chia 6, 7
  T("TPL_G3_W04_A", "multiplication", "multiplication", "Bảng nhân 6", bangNhanChia(6, false)),
  T("TPL_G3_W04_B", "division", "division", "Bảng chia 6", bangNhanChia(6, true)),
  T("TPL_G3_W04_C", "multiplication", "multiplication", "Bảng nhân 7", bangNhanChia(7, false)),
  T("TPL_G3_W04_D", "division", "division", "Bảng chia 7", bangNhanChia(7, true)),
  T("TPL_G3_W04_E", "calculation", "calculation", "Ôn tập tổng hợp nhân chia bảng nhỏ", onTapTongHopPhepTinh(90)),

  // W05 — Bảng nhân/chia 8, 9
  T("TPL_G3_W05_A", "multiplication", "multiplication", "Bảng nhân 8", bangNhanChia(8, false)),
  T("TPL_G3_W05_B", "division", "division", "Bảng chia 8", bangNhanChia(8, true)),
  T("TPL_G3_W05_C", "multiplication", "multiplication", "Bảng nhân 9", bangNhanChia(9, false)),
  T("TPL_G3_W05_D", "division", "division", "Bảng chia 9", bangNhanChia(9, true)),

  // W06 — Tìm thành phần nhân/chia; một phần mấy
  T("TPL_G3_W06_A", "calculation", "calculation", "Tìm thừa số / số bị chia", timThanhPhanNhanChia(7)),
  T("TPL_G3_W06_B", "number_decompose", "number_decomposition", "Một phần mấy (phân số đơn giản)", motPhanMay()),

  // W07 — Luyện tập chung; điểm giữa/trung điểm + hình tròn (image, không đưa vào đây); ôn nhân chia
  T("TPL_G3_W07_A", "calculation", "calculation", "Ôn tập tổng hợp nhân chia bảng lớn", onTapTongHopPhepTinh(90)),

  // W08 — Góc vuông (image); hình tam giác/tứ giác
  T("TPL_G3_W08_A", "geometry", "geometry", "Đếm số cạnh hình tam giác / tứ giác", demCanhHinh()),

  // W09 — Thực hành vẽ hình; khối lập phương/hộp CN; luyện tập chung
  T("TPL_G3_W09_A", "geometry", "geometry", "Đếm mặt khối lập phương / khối hộp chữ nhật", demMatKhoi()),
  T("TPL_G3_W09_B", "calculation", "calculation", "Ôn tập chung phép nhân/chia bảng", onTapTongHopPhepTinh(90)),

  // W10 — Nhân số 2CS x 1CS; gấp N lần; chia hết/chia dư
  T("TPL_G3_W10_A", "multiplication", "multiplication", "Nhân số 2 chữ số với số 1 chữ số", nhanSo2CS1CS()),
  T("TPL_G3_W10_B", "multiplication", "logic_reasoning", "Gấp một số lên nhiều lần", gapMotSoLenNLan()),
  T("TPL_G3_W10_C", "division", "logic_reasoning", "Phân biệt chia hết / chia có dư", chiaHetChiaCoDu()),

  // W11 — Chia số 2CS cho 1CS; giảm N lần
  T("TPL_G3_W11_A", "division", "division", "Chia số 2 chữ số cho số 1 chữ số", chiaSo2CS1CS()),
  T("TPL_G3_W11_B", "division", "logic_reasoning", "Giảm một số đi nhiều lần", giamMotSoDiNLan()),

  // W12 — Bài toán giải 2 phép tính; luyện tập chung
  T("TPL_G3_W12_A", "word_problem", "logic_reasoning", "Bài toán giải bằng 2 phép tính (nhân rồi cộng)", baiToan2BuocNhanCong()),
  T("TPL_G3_W12_B", "calculation", "calculation", "Ôn tập chung nhân/chia/gấp/giảm", onTapTongHopPhepTinh(90)),

  // W13 — Đơn vị đo mm/gam/ml; nhiệt độ
  T("TPL_G3_W13_A", "measurement", "measurement", "Tính với đơn vị mi-li-mét", donViDoNho("mm", 1, 90)),
  T("TPL_G3_W13_B", "measurement", "measurement", "Tính với đơn vị gam", donViDoNho("g", 10, 500)),
  T("TPL_G3_W13_C", "measurement", "measurement", "Tính với đơn vị mi-li-lít", donViDoNho("ml", 10, 500)),
  T("TPL_G3_W13_D", "comparison", "comparison", "So sánh nhiệt độ (°C)", soSanhNhietDo()),

  // W14 — Thực hành đơn vị đo; luyện tập chung; nhân số 3CS x 1CS
  T("TPL_G3_W14_A", "multiplication", "multiplication", "Nhân số 3 chữ số với số 1 chữ số", nhanChiaSo3CS1CS(true)),
  T("TPL_G3_W14_B", "measurement", "logic_reasoning", "Tổ hợp cộng để đạt tổng cho trước (đơn vị ml)", toHopCongDatTong()),

  // W15 — Chia số 3CS cho 1CS; biểu thức số
  T("TPL_G3_W15_A", "division", "division", "Chia số 3 chữ số cho số 1 chữ số", nhanChiaSo3CS1CS(false)),
  T("TPL_G3_W15_B", "calculation", "calculation", "Tính giá trị biểu thức không có ngoặc", bieuThucSo(false)),

  // W16 — Biểu thức (tiếp); so sánh gấp mấy lần; luyện tập chung
  T("TPL_G3_W16_A", "calculation", "calculation", "Tính giá trị biểu thức có ngoặc", bieuThucSo(true)),
  T("TPL_G3_W16_B", "comparison", "logic_reasoning", "So sánh số lớn gấp mấy lần số bé", soSanhGapMayLan()),
  T("TPL_G3_W16_C", "calculation", "calculation", "Ôn tập chung biểu thức + nhân chia", onTapTongHopPhepTinh(200)),

  // W17 — Ôn tập tổng hợp phép tính, biểu thức
  T("TPL_G3_W17_A", "calculation", "calculation", "Ôn tập nhân/chia phạm vi 100, 1000", onTapTongHopPhepTinh(500)),
  T("TPL_G3_W17_B", "calculation", "calculation", "Ôn tập biểu thức số (có/không ngoặc)", bieuThucSo(true)),

  // W18 — Ôn tập hình học và đo lường chuẩn bị thi HK1
  T("TPL_G3_W18_A", "perimeter", "perimeter", "Ôn tập chu vi đơn giản (cộng các cạnh)", onTapChuViDonGian()),
  T("TPL_G3_W18_B", "measurement", "measurement", "Ôn tập đơn vị đo (mm/g/ml)", donViDoNho("g", 10, 500)),

  // ===== HK2 =====

  // W19 — Số có 4 chữ số; số 10 000; so sánh
  T("TPL_G3_W19_A", "number_decompose", "number_recognition", "Đọc số có 4 chữ số", docSoLon(1000, 9999)),
  T("TPL_G3_W19_B", "number_decompose", "number_recognition", "Viết số từ cách đọc", vietSoTuCachDoc(1000, 9999)),
  T("TPL_G3_W19_C", "sequence", "sequence", "Số liền trước / liền sau (qua mốc 10 000)", soLienTruocSauLon(9990, 10000)),
  T("TPL_G3_W19_D", "comparison", "comparison", "So sánh 2 số trong phạm vi 10 000", soSanhSoLon(1000, 9999)),

  // W20 — Chữ số La Mã; làm tròn chục/trăm
  T("TPL_G3_W20_A", "roman_numeral", "roman_numeral", "Đọc / viết chữ số La Mã (I-XX)", docLaMa()),
  T("TPL_G3_W20_B", "rounding", "rounding", "Làm tròn số đến hàng chục", lamTronSo(10)),
  T("TPL_G3_W20_C", "rounding", "rounding", "Làm tròn số đến hàng trăm", lamTronSo(100)),

  // W21 — Chu vi tam giác/tứ giác/vuông/HCN; diện tích cm²
  T("TPL_G3_W21_A", "perimeter", "perimeter", "Chu vi hình tam giác / tứ giác (tổng các cạnh)", chuViTamGiacTuGiac()),
  T("TPL_G3_W21_B", "perimeter", "perimeter", "Chu vi hình vuông / hình chữ nhật", chuViHCNVuong(false)),

  // W22 — Diện tích HCN, hình vuông
  T("TPL_G3_W22_A", "area", "area", "Diện tích hình chữ nhật / hình vuông", dienTichHCNVuong(false)),
  T("TPL_G3_W22_B", "area", "area", "Tìm cạnh khi biết diện tích (chiều ngược)", dienTichHCNVuong(true)),
  T("TPL_G3_W22_C", "area", "area", "Phân biệt chu vi và diện tích cùng 1 hình vuông", phanBietChuViDienTich()),

  // W23 — Cộng, trừ trong phạm vi 10 000
  T("TPL_G3_W23_A", "calculation", "addition", "Đặt tính rồi tính: cộng/trừ phạm vi 10 000", congTruPhamViLon(9999)),
  T("TPL_G3_W23_B", "calculation", "mental_math", "Tính nhẩm cộng/trừ số tròn nghìn", tinhNhamTronNghin(9999, 1000)),
  T("TPL_G3_W23_C", "perimeter", "perimeter", "Tính chu vi hình chữ nhật (ôn lại)", chuViHCNVuong(false)),

  // W24 — Nhân/chia số có 4 chữ số cho số có 1 chữ số
  T("TPL_G3_W24_A", "multiplication", "multiplication", "Nhân số có 4 chữ số với số có 1 chữ số", nhanChiaSoLonCho1CS(4, "nhan")),
  T("TPL_G3_W24_B", "division", "division", "Chia số có 4 chữ số cho số có 1 chữ số", nhanChiaSoLonCho1CS(4, "chia")),

  // W25 — Luyện tập chung
  T("TPL_G3_W25_A", "calculation", "calculation", "Ôn tập nhân/chia số 4 chữ số", nhanChiaSoLonCho1CS(4)),
  T("TPL_G3_W25_B", "calculation", "calculation", "Ôn tập cộng/trừ phạm vi 10 000", congTruPhamViLon(9999)),

  // W26 — Số có 5 chữ số; số 100 000; so sánh
  T("TPL_G3_W26_A", "number_decompose", "number_recognition", "Đọc số có 5 chữ số", docSoLon(10000, 99999)),
  T("TPL_G3_W26_B", "number_decompose", "number_recognition", "Viết số từ cách đọc (phạm vi 100 000)", vietSoTuCachDoc(10000, 99999)),
  T("TPL_G3_W26_C", "comparison", "comparison", "So sánh 2 số trong phạm vi 100 000", soSanhSoLon(10000, 99999)),
  T("TPL_G3_W26_D", "sequence", "sequence", "Số liền trước / liền sau (qua mốc 100 000)", soLienTruocSauLon(99990, 100000)),

  // W27 — Làm tròn nghìn, chục nghìn
  T("TPL_G3_W27_A", "rounding", "rounding", "Làm tròn số đến hàng nghìn", lamTronSo(1000)),
  T("TPL_G3_W27_B", "rounding", "rounding", "Làm tròn số đến hàng chục nghìn", lamTronSo(10000)),
  T("TPL_G3_W27_C", "number_decompose", "number_decomposition", "Phân tích số 5 chữ số thành tổng", phanTichThanhTong(10000, 99999)),

  // W28 — Cộng, trừ trong phạm vi 100 000
  T("TPL_G3_W28_A", "calculation", "addition", "Đặt tính rồi tính: cộng/trừ phạm vi 100 000", congTruPhamViLon(99999)),
  T("TPL_G3_W28_B", "calculation", "mental_math", "Tính nhẩm cộng/trừ số tròn chục nghìn", tinhNhamTronNghin(99999, 10000)),

  // W29 — Xem đồng hồ; tháng-năm; xem lịch
  T("TPL_G3_W29_A", "telling_time", "time_reasoning", "Tính khoảng thời gian giữa 2 mốc giờ", tinhKhoangThoiGian()),
  T("TPL_G3_W29_B", "calendar_reading", "time_reasoning", "Số ngày trong tháng (30/31/28-29)", soNgayTrongThang()),
  T("TPL_G3_W29_C", "calendar_reading", "time_reasoning", "Tính thứ trong tuần (biết hôm nay, hỏi N ngày sau)", tinhLichThu()),

  // W30 — Tiền Việt Nam; nhân số 5 chữ số với số 1 chữ số
  T("TPL_G3_W30_A", "money", "money", "Tính tổng tiền từ các tờ mệnh giá", tienVietNamTong()),
  T("TPL_G3_W30_B", "money", "money", "Quy đổi mệnh giá tiền", tienVietNamDoi()),
  T("TPL_G3_W30_C", "multiplication", "multiplication", "Nhân số có 5 chữ số với số có 1 chữ số", nhanChiaSoLonCho1CS(5, "nhan")),

  // W31 — Chia số có 5 chữ số cho số có 1 chữ số
  T("TPL_G3_W31_A", "division", "division", "Chia số có 5 chữ số cho số có 1 chữ số", nhanChiaSoLonCho1CS(5, "chia")),
  T("TPL_G3_W31_B", "calculation", "calculation", "Tính giá trị biểu thức phối hợp ×÷+−", bieuThucSo(true)),

  // W32 — Thu thập, phân loại, ghi chép số liệu; bảng số liệu
  T("TPL_G3_W32_A", "data_read", "data_read", "Đọc bảng số liệu (nhiều nhất / ít nhất)", docBangSoLieu()),
  T("TPL_G3_W32_B", "data_read", "data_read", "Đếm số liệu từ ký hiệu kiểm đếm (×/O)", demTally()),

  // W33 — Khả năng xảy ra; ôn tập số đến 100 000
  T("TPL_G3_W33_A", "probability", "probability", "Chắc chắn / có thể / không thể", khaNangXayRa()),
  T("TPL_G3_W33_B", "comparison", "comparison", "Ôn tập đọc/viết/so sánh số đến 100 000", soSanhSoLon(1000, 99999)),
  T("TPL_G3_W33_C", "number_decompose", "logic_reasoning", "Tìm số lớn nhất ghép từ 4 chữ số", timSoLonBeNhatNChuSo(true)),
  T("TPL_G3_W33_D", "number_decompose", "logic_reasoning", "Tìm số bé nhất ghép từ 4 chữ số", timSoLonBeNhatNChuSo(false)),

  // W34 — Ôn tập tổng hợp các phép tính phạm vi 100 000
  T("TPL_G3_W34_A", "calculation", "calculation", "Ôn tập cộng/trừ phạm vi 100 000", congTruPhamViLon(99999)),
  T("TPL_G3_W34_B", "calculation", "calculation", "Ôn tập nhân/chia + biểu thức phối hợp", onTapPhepTinhLon(90000)),

  // W35 — Ôn tập hình học, đo lường và bảng số liệu để kết thúc năm học
  T("TPL_G3_W35_A", "perimeter", "perimeter", "Ôn tập chu vi HCN, hình vuông", chuViHCNVuong(false)),
  T("TPL_G3_W35_B", "area", "area", "Ôn tập diện tích HCN, hình vuông", dienTichHCNVuong(false)),
  T("TPL_G3_W35_C", "data_read", "data_read", "Ôn tập đọc bảng số liệu", docBangSoLieu()),
  T("TPL_G3_W35_D", "probability", "probability", "Ôn tập chắc chắn / có thể / không thể", khaNangXayRa()),
];

export function getGrade3BuiltinsForLessonType(lessonType: string): MathTemplate[] {
  return GRADE3_BUILTIN_TEMPLATES.filter((t) => t.lessonType === lessonType);
}
export function getAllGrade3Builtins(): MathTemplate[] {
  return GRADE3_BUILTIN_TEMPLATES;
}
