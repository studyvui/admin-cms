// ============================================================
// STUDYVUI — Builtin generator Toán Lớp 5 (Phase 2, 2026-08-13).
// Nguồn: mockup Artifact "Mockup Toán Lớp 5 — 35 node" đã được người dùng
// CHỐT (scratchpad lop5_logic.js, stress-test 13.200 lượt gọi sạch). File
// này PORT NGUYÊN VẸN logic các factory từ mockup JS sang builtinGenerator
// TS thật (source="builtin") để dùng trong admin-cms /ai-generate-math.
// Xem PLAN/TOÁN/ghi_chu_dang_bai_sgk/lop5_danh_muc_dang_bai.md (repo STUDYVUI)
// cho bảng ánh xạ tuần↔bài SGK đầy đủ + danh sách archetype.
//
// LỚP 5 LÀ LỚP CUỐI LỘ TRÌNH 5 LỚP: không phát sinh kiểu dữ liệu mới nào
// ngoài phân số — TÁI SỬ DỤNG nguyên engine phân số đã viết ở builtins-
// grade4.ts (gcd/rút gọn/quy đồng/so sánh/4 phép tính), chỉ dùng ở 1 nhóm
// (T2-T3 phân số ôn tập + T30 "tỉ số lần lặp lại sự kiện" viết dạng phân
// số). Phần lớn nội dung MỚI của Lớp 5 (tỉ số/%, thể tích khối, vận tốc)
// chỉ cần SỐ THẬP PHÂN + CÔNG THỨC — không cần engine mới.
//
// KHÔNG bao gồm (giữ nguyên khỏi phạm vi tự động, giống Lớp 1-4):
//  - Nhóm 🖼️ "cần ảnh gắn tay" (đọc phân số/hỗn số trên hình tô màu tự do,
//    biểu đồ hình quạt đúng tỉ lệ, hình khai triển khối, đếm khối lập
//    phương 3D, bảng tally phức tạp, mê cung...) — soạn thủ công qua modal
//    Xem trước (Asset Picker).
//  - Bài 66 (Chủ đề 11) và các hoạt động "Thực hành trải nghiệm" — hoàn
//    toàn dựa số liệu thật của lớp học, không có đáp số cố định.
// ============================================================
import type { MathTemplate } from "./types";
// ---- nhap tu cac file gen (muc 93 Dot 4a) ----
import {
  soSanhSoLon, congTruSoLon, rutGonPhanSo, nhanDienPhanSoThapPhan, vietPhanSoThanhPSTP,
  phepTinhPhanSo, congTruPhanSoKhacMau, honSoDoiPhanSo, doiDonViKhoiLuongLon, docVietSTPCoBan,
  soSanhSTP, vietSoDoDuoiDangSTP, vietSoDoDienTichDuoiDangSTP, lamTronSTP, doiDonViDienTichLon,
  congSTP, truSTP, tinhChatSTP, nhanSTP, chiaSTP, nhanChiaSTPVoi101001000, type Gen,
} from "./builtins-grade5-gen-a";
import {
  dienTichTamGiac, dienTichHinhThang, chuViHinhTron, dienTichHinhTron, tiSo, tiLeBanDo,
  tongTiSo, hieuTiSo, timTiSoPhanTramCuaHaiSo, timGiaTriPhanTram, doiDonViTheTichNho,
  doiDonViTheTichLon, theTichHHCN, theTichHLP, dienTichHHCN, dienTichHLP, doiDonViThoiGian,
  congTruThoiGian, nhanChiaThoiGian, vanTocQuangDuongThoiGian, doiDonViVanToc, docBangSoLieu,
  timGiaTriPhanTramBieuDoQuat, tiSoLanLapLai, khaNangXayRa,
} from "./builtins-grade5-gen-b";
// ---- het nhap (muc 93 Dot 4a) ----

// ---------- Đăng ký template ----------
function T(id: string, lessonType: string, skill: string, text: string, gen: Gen): MathTemplate {
  return {
    id,
    source: "builtin",
    lessonType,
    skill,
    grade: 5,
    text,
    formula: "built-in",
    vars: [],
    distractorCount: 3,
    builtinGenerator: () => gen(),
  };
}

export const GRADE5_BUILTIN_TEMPLATES: MathTemplate[] = [
  // W01 — Ôn tập số tự nhiên; ôn tập phép tính; ôn tập phân số
  T("TPL_G5_W01_A", "comparison", "comparison", "Ôn tập đọc/so sánh số tự nhiên lớn", soSanhSoLon(10000, 99999999)),
  T("TPL_G5_W01_B", "calculation", "addition", "Ôn tập cộng/trừ số tự nhiên lớn", congTruSoLon(999999)),
  T("TPL_G5_W01_C", "fraction", "fraction", "Ôn tập rút gọn phân số", rutGonPhanSo()),

  // W02 — Phân số thập phân; ôn tập phép tính phân số
  T("TPL_G5_W02_A", "fraction", "fraction", "Nhận diện phân số thập phân (mẫu 10, 100, 1000)", nhanDienPhanSoThapPhan()),
  T("TPL_G5_W02_B", "fraction", "fraction", "Viết phân số thành phân số thập phân", vietPhanSoThanhPSTP()),
  T("TPL_G5_W02_C", "fraction_operations", "fraction_operations", "4 phép tính với phân số", phepTinhPhanSo()),

  // W03 — Cộng, trừ hai phân số; hỗn số
  T("TPL_G5_W03_A", "fraction_operations", "fraction_operations", "Cộng phân số khác mẫu", congTruPhanSoKhacMau(true)),
  T("TPL_G5_W03_B", "fraction_operations", "fraction_operations", "Trừ phân số khác mẫu", congTruPhanSoKhacMau(false)),
  T("TPL_G5_W03_C", "fraction", "fraction", "Đổi hỗn số ↔ phân số", honSoDoiPhanSo()),

  // W04 — Ôn tập hình học đo lường; khái niệm số thập phân
  T("TPL_G5_W04_A", "measurement", "measurement", "Đổi đơn vị khối lượng lớn (yến, tạ, tấn)", doiDonViKhoiLuongLon()),
  T("TPL_G5_W04_B", "decimal", "decimal", "Đọc/viết số thập phân cơ bản", docVietSTPCoBan()),

  // W05 — So sánh STP; viết số đo dưới dạng STP
  T("TPL_G5_W05_A", "decimal", "comparison", "So sánh 2 số thập phân", soSanhSTP()),
  T("TPL_G5_W05_B", "decimal", "measurement", "Viết số đo độ dài/khối lượng dưới dạng STP", vietSoDoDuoiDangSTP()),

  // W06 — Viết số đo dưới dạng STP (tiếp); làm tròn STP
  T("TPL_G5_W06_A", "decimal", "measurement", "Viết số đo diện tích dưới dạng STP", vietSoDoDienTichDuoiDangSTP()),
  T("TPL_G5_W06_B", "decimal", "rounding", "Làm tròn số thập phân", lamTronSTP()),

  // W07 — km², ha; các đơn vị đo diện tích
  T("TPL_G5_W07_A", "measurement", "measurement", "Đổi đơn vị diện tích lớn (m², ha, km²)", doiDonViDienTichLon()),

  // W08 — Phép cộng số thập phân
  T("TPL_G5_W08_A", "calculation", "addition", "Cộng 2 số thập phân", congSTP()),
  T("TPL_G5_W08_B", "calculation", "calculation", "Tính chất giao hoán của phép cộng STP", tinhChatSTP(true)),

  // W09 — Phép trừ, nhân số thập phân
  T("TPL_G5_W09_A", "calculation", "subtraction", "Trừ 2 số thập phân", truSTP()),
  T("TPL_G5_W09_B", "calculation", "multiplication", "Nhân số thập phân", nhanSTP()),

  // W10 — Phép chia số thập phân
  T("TPL_G5_W10_A", "calculation", "division", "Chia số thập phân", chiaSTP()),

  // W11 — Nhân, chia STP với 10, 100, 1000 hoặc 0,1; 0,01
  T("TPL_G5_W11_A", "calculation", "mental_math", "Nhân/chia nhẩm STP với 10, 100, 1000", nhanChiaSTPVoi101001000()),
  T("TPL_G5_W11_B", "calculation", "calculation", "Tính chất kết hợp của phép cộng STP", tinhChatSTP(false)),

  // W12 — Hình tam giác; diện tích hình tam giác
  T("TPL_G5_W12_A", "area", "area", "Diện tích hình tam giác (S=đáy×cao:2)", dienTichTamGiac()),

  // W13 — Hình thang; diện tích hình thang
  T("TPL_G5_W13_A", "area", "area", "Diện tích hình thang (S=(a+b)×cao:2)", dienTichHinhThang()),

  // W14 — Đường tròn; chu vi và diện tích hình tròn
  T("TPL_G5_W14_A", "perimeter", "perimeter", "Chu vi hình tròn", chuViHinhTron()),
  T("TPL_G5_W14_B", "area", "area", "Diện tích hình tròn", dienTichHinhTron()),

  // W15 — Ôn tập số thập phân
  T("TPL_G5_W15_A", "decimal", "comparison", "Ôn tập so sánh số thập phân", soSanhSTP()),
  T("TPL_G5_W15_B", "decimal", "rounding", "Ôn tập làm tròn số thập phân", lamTronSTP()),

  // W16 — Ôn tập các phép tính với số thập phân
  T("TPL_G5_W16_A", "calculation", "addition", "Ôn tập cộng số thập phân", congSTP()),
  T("TPL_G5_W16_B", "calculation", "subtraction", "Ôn tập trừ số thập phân", truSTP()),
  T("TPL_G5_W16_C", "calculation", "multiplication", "Ôn tập nhân số thập phân", nhanSTP()),
  T("TPL_G5_W16_D", "calculation", "division", "Ôn tập chia số thập phân", chiaSTP()),

  // W17 — Ôn tập một số hình phẳng; chu vi diện tích
  T("TPL_G5_W17_A", "area", "area", "Ôn tập diện tích tam giác", dienTichTamGiac()),
  T("TPL_G5_W17_B", "area", "area", "Ôn tập diện tích hình thang", dienTichHinhThang()),
  T("TPL_G5_W17_C", "perimeter", "perimeter", "Ôn tập chu vi hình tròn", chuViHinhTron()),
  T("TPL_G5_W17_D", "area", "area", "Ôn tập diện tích hình tròn", dienTichHinhTron()),

  // W18 — Ôn tập đo lường
  T("TPL_G5_W18_A", "measurement", "measurement", "Ôn tập đổi đơn vị khối lượng", doiDonViKhoiLuongLon()),
  T("TPL_G5_W18_B", "measurement", "measurement", "Ôn tập đổi đơn vị diện tích", doiDonViDienTichLon()),

  // ===== HK2 =====

  // W19 — Tỉ số, tỉ số phần trăm; tỉ lệ bản đồ
  T("TPL_G5_W19_A", "ratio", "ratio", "Viết tỉ số của 2 số", tiSo()),
  T("TPL_G5_W19_B", "ratio", "ratio", "Tỉ lệ bản đồ (bản đồ ↔ thực tế)", tiLeBanDo()),

  // W20 — Tìm 2 số biết tổng/hiệu và tỉ số; tìm tỉ số % của 2 số
  T("TPL_G5_W20_A", "ratio", "ratio", "Tìm 2 số biết tổng và tỉ số", tongTiSo()),
  T("TPL_G5_W20_B", "ratio", "ratio", "Tìm 2 số biết hiệu và tỉ số", hieuTiSo()),
  T("TPL_G5_W20_C", "percentage", "percentage", "Tìm tỉ số phần trăm của 2 số", timTiSoPhanTramCuaHaiSo()),

  // W21 — Tìm giá trị phần trăm của một số
  T("TPL_G5_W21_A", "percentage", "percentage", "Tìm giá trị % của 1 số (thuận và ngược)", timGiaTriPhanTram()),
  T("TPL_G5_W21_B", "ratio", "ratio", "Ôn tập tổng-tỉ số / hiệu-tỉ số", tongTiSo()),

  // W22 — Thể tích của một hình; cm³, dm³
  T("TPL_G5_W22_A", "volume", "volume", "Đổi đơn vị thể tích nhỏ (cm³, dm³)", doiDonViTheTichNho()),

  // W23 — Mét khối; hình khai triển
  T("TPL_G5_W23_A", "volume", "volume", "Đổi đơn vị thể tích lớn (dm³, m³)", doiDonViTheTichLon()),

  // W24 — Sxq và Stp của HHCN và HLP
  T("TPL_G5_W24_A", "volume", "volume", "Diện tích xung quanh / toàn phần hình hộp chữ nhật", dienTichHHCN()),
  T("TPL_G5_W24_B", "volume", "volume", "Diện tích xung quanh / toàn phần hình lập phương", dienTichHLP()),

  // W25 — Thể tích HHCN và HLP
  T("TPL_G5_W25_A", "volume", "volume", "Thể tích hình hộp chữ nhật (V=dài×rộng×cao)", theTichHHCN()),
  T("TPL_G5_W25_B", "volume", "volume", "Thể tích hình lập phương (V=cạnh³)", theTichHLP()),

  // W26 — Các đơn vị đo thời gian
  T("TPL_G5_W26_A", "measurement", "time_reasoning", "Đổi đơn vị thời gian", doiDonViThoiGian()),

  // W27 — Cộng, trừ, nhân, chia số đo thời gian
  T("TPL_G5_W27_A", "measurement", "time_reasoning", "Cộng/trừ số đo thời gian", congTruThoiGian()),
  T("TPL_G5_W27_B", "measurement", "time_reasoning", "Nhân/chia số đo thời gian với 1 số", nhanChiaThoiGian()),

  // W28 — Vận tốc, quãng đường, thời gian
  T("TPL_G5_W28_A", "speed", "speed", "Tính v / s / t (v=s:t, s=v×t, t=s:v)", vanTocQuangDuongThoiGian()),
  T("TPL_G5_W28_B", "speed", "speed", "Đổi đơn vị vận tốc km/h ↔ m/s", doiDonViVanToc()),

  // W29 — Ôn tập vận tốc, quãng đường, thời gian
  T("TPL_G5_W29_A", "speed", "speed", "Ôn tập vận tốc / quãng đường / thời gian", vanTocQuangDuongThoiGian()),
  T("TPL_G5_W29_B", "speed", "speed", "Ôn tập đổi đơn vị vận tốc", doiDonViVanToc()),

  // W30 — Thu thập số liệu; biểu đồ quạt; tỉ số lần lặp lại sự kiện
  T("TPL_G5_W30_A", "data_read", "data_read", "Đọc bảng số liệu", docBangSoLieu()),
  T("TPL_G5_W30_B", "percentage", "percentage", "Tìm giá trị % từ biểu đồ hình quạt", timGiaTriPhanTramBieuDoQuat()),
  T("TPL_G5_W30_C", "probability", "probability", "Tỉ số lần lặp lại 1 sự kiện (dạng phân số)", tiSoLanLapLai()),

  // W31 — Ôn tập thống kê và biểu diễn số liệu
  T("TPL_G5_W31_A", "data_read", "data_read", "Ôn tập đọc bảng số liệu", docBangSoLieu()),
  T("TPL_G5_W31_B", "percentage", "percentage", "Ôn tập biểu đồ hình quạt", timGiaTriPhanTramBieuDoQuat()),

  // W32 — Ôn tập số tự nhiên, phân số, số thập phân
  T("TPL_G5_W32_A", "comparison", "comparison", "Ôn tập so sánh số tự nhiên", soSanhSoLon(10000, 999999999)),
  T("TPL_G5_W32_B", "fraction", "fraction", "Ôn tập rút gọn phân số", rutGonPhanSo()),
  T("TPL_G5_W32_C", "decimal", "comparison", "Ôn tập so sánh số thập phân", soSanhSTP()),
  T("TPL_G5_W32_D", "calculation", "calculation", "Ôn tập 4 phép tính số thập phân", chiaSTP()),

  // W33 — Ôn tập tỉ số, tỉ số %; ôn tập hình học
  T("TPL_G5_W33_A", "ratio", "ratio", "Ôn tập tổng-tỉ số / hiệu-tỉ số", hieuTiSo()),
  T("TPL_G5_W33_B", "percentage", "percentage", "Ôn tập tìm giá trị % của 1 số", timGiaTriPhanTram()),
  T("TPL_G5_W33_C", "area", "area", "Ôn tập diện tích hình học (tam giác/thang/tròn)", dienTichHinhThang()),

  // W34 — Ôn tập đo lường; ôn tập toán chuyển động đều
  T("TPL_G5_W34_A", "measurement", "measurement", "Ôn tập đổi đơn vị khối lượng/diện tích", doiDonViDienTichLon()),
  T("TPL_G5_W34_B", "volume", "volume", "Ôn tập đổi đơn vị thể tích", doiDonViTheTichLon()),
  T("TPL_G5_W34_C", "speed", "speed", "Ôn tập vận tốc / quãng đường / thời gian", vanTocQuangDuongThoiGian()),

  // W35 — Ôn tập thống kê xác suất; ôn tập chung cuối năm
  T("TPL_G5_W35_A", "probability", "probability", "Ôn tập chắc chắn / có thể / không thể", khaNangXayRa()),
  T("TPL_G5_W35_B", "data_read", "data_read", "Ôn tập đọc bảng số liệu", docBangSoLieu()),
  T("TPL_G5_W35_C", "volume", "volume", "Ôn tập chung: thể tích hình hộp chữ nhật", theTichHHCN()),
  T("TPL_G5_W35_D", "volume", "volume", "Ôn tập chung: thể tích hình lập phương", theTichHLP()),
];

export function getGrade5BuiltinsForLessonType(lessonType: string): MathTemplate[] {
  return GRADE5_BUILTIN_TEMPLATES.filter((t) => t.lessonType === lessonType);
}
export function getAllGrade5Builtins(): MathTemplate[] {
  return GRADE5_BUILTIN_TEMPLATES;
}
