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
import type { MathTemplate, RawGenerated } from "./types";

// ---------- Helpers thuần (port từ lop3_logic.js) ----------
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
function pick<T>(arr: T[]): T {
  return arr[rnd(0, arr.length - 1)];
}
function numericDistractors(correct: number, count: number, spread?: number): number[] {
  const sp = spread || Math.max(3, Math.abs(correct) * 0.25 + 2);
  const set = new Set<number>([correct]);
  let tries = 0;
  while (set.size < count + 1 && tries < 400) {
    tries++;
    const d = correct + Math.round((Math.random() * 2 - 1) * sp);
    if (d >= 0 && !set.has(d)) set.add(d);
  }
  let pad = 1;
  while (set.size < count + 1 && pad < 5000) {
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
function fmtSo(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function mcNumericFmt(text: string, correct: number, spread?: number): RawGenerated {
  const raw = numericDistractors(correct, 3, spread);
  const options = raw.map(fmtSo);
  return { text, correct_answer: fmtSo(correct), options };
}
function mcFixed(text: string, correct: string, distractors: string[]): RawGenerated {
  // KHONG don them lua chon gia khi mien gia tri that qua hep (vd dau so sanh
  // >,<,= chi co toi da 3 ky hieu that) - de it hon 4 lua chon con hon la hien
  // 1 dap an vo nghia.
  const seen = new Set([correct]);
  const uniq: string[] = [];
  for (const d of distractors) {
    if (uniq.length >= 3) break;
    if (!seen.has(d)) {
      seen.add(d);
      uniq.push(d);
    }
  }
  const options = shuffleArr([correct, ...uniq]);
  return { text, correct_answer: correct, options };
}

type Gen = () => RawGenerated;

// ---------- Đọc số tiếng Việt (hỗ trợ dạng "đọc/viết số") ----------
const DV = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
function doc2CS(n: number): string {
  if (n === 0) return "";
  if (n < 10) return DV[n];
  const chuc = Math.floor(n / 10);
  const dv = n % 10;
  const s = chuc === 1 ? "mười" : DV[chuc] + " mươi";
  if (dv === 0) return s;
  if (dv === 1 && chuc >= 2) return s + " mốt";
  if (dv === 5) return s + " lăm";
  return s + " " + DV[dv];
}
function doc3CS(n: number): string {
  if (n === 0) return "";
  const tram = Math.floor(n / 100);
  const rest = n % 100;
  let s = "";
  if (tram > 0) s += DV[tram] + " trăm";
  if (rest === 0) return s;
  if (tram > 0 && rest < 10) s += " linh " + DV[rest];
  else s += (s ? " " : "") + doc2CS(rest);
  return s.trim();
}
function docSoVN(nIn: number): string {
  const n = Math.max(0, Math.min(999999, Math.round(nIn))); // ep ve mien an toan, tranh NaN khi distractor troi ra ngoai pham vi
  if (n === 0) return "không";
  if (n === 100000) return "một trăm nghìn";
  const nghin = Math.floor(n / 1000);
  const rest = n % 1000;
  let s = "";
  if (nghin > 0) s += (nghin < 10 ? DV[nghin] : nghin < 100 ? doc2CS(nghin) : docSoVN(nghin)) + " nghìn";
  if (rest > 0) {
    if (nghin > 0 && rest < 100) s += " không trăm" + (rest > 0 ? " " + (rest < 10 ? "linh " + DV[rest] : doc2CS(rest)) : "");
    else s += (s ? " " : "") + doc3CS(rest);
  }
  return s.trim().replace(/\s+/g, " ");
}

// ================================================================
// Factory nhóm HK1 (Tuần 1-18, Bài 1-44) — số pv1000, bảng nhân/chia,
// hình học cơ bản, đơn vị đo mm/g/ml, biểu thức số.
// ================================================================
function timThanhPhanCongTru(min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max);
    const b = rnd(min, max);
    const kind = pick(["tong", "hieu", "sohang", "sobitru"]);
    if (kind === "tong") return mcNumeric(`Tổng của ${a} và ${b} là:`, a + b);
    if (kind === "hieu") {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return mcNumeric(`Hiệu của ${big} và ${small} là:`, big - small);
    }
    if (kind === "sohang") {
      const tong = a + b;
      return mcNumeric(`Tìm số hạng: ? + ${b} = ${tong}`, a, 5);
    }
    const hieu = Math.abs(a - b);
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    return mcNumeric(`Biết hiệu là ${hieu}, số trừ là ${small}. Số bị trừ là:`, big, 5);
  };
}
function bangNhanChia(bang: number, isChia: boolean): Gen {
  return () => {
    const k = rnd(1, 10);
    if (isChia) return mcNumeric(`Tính: ${bang * k} : ${bang} = ?`, k, 2);
    return mcNumeric(`Tính: ${bang} × ${k} = ?`, bang * k, Math.max(3, bang));
  };
}
function timThanhPhanNhanChia(bang: number): Gen {
  return () => {
    const k = rnd(2, 9);
    const tich = bang * k;
    const kind = pick(["thuaso", "sobichia"]);
    if (kind === "thuaso") return mcNumeric(`Tìm thừa số: ? × ${bang} = ${tich}`, k, 2);
    return mcNumeric(`Tìm số bị chia: ? : ${bang} = ${k}`, tich, Math.max(4, bang));
  };
}
function motPhanMay(): Gen {
  return () => {
    const n = pick([2, 3, 4, 5]);
    const total = rnd(2, 6) * n;
    const part = total / n;
    return mcNumeric(`Một hình có ${total} ô vuông, tô màu 1/${n} số ô. Số ô được tô màu là:`, part, 3);
  };
}
function demCanhHinh(): Gen {
  return () => {
    const isTG = Math.random() < 0.5;
    return mcNumeric(`Hình ${isTG ? "tam giác" : "tứ giác"} có mấy cạnh?`, isTG ? 3 : 4, 1);
  };
}
function demMatKhoi(): Gen {
  return () => {
    const isLP = Math.random() < 0.5;
    return mcNumeric(`Khối ${isLP ? "lập phương" : "hộp chữ nhật"} có mấy mặt?`, 6, 1);
  };
}
function nhanSo2CS1CS(): Gen {
  return () => {
    const a = rnd(11, 49);
    const b = rnd(2, 9);
    return mcNumeric(`Tính: ${a} × ${b} = ?`, a * b, Math.round(a * b * 0.2) + 3);
  };
}
function gapMotSoLenNLan(): Gen {
  return () => {
    const a = rnd(5, 40);
    const n = rnd(2, 6);
    return mcNumeric(`${a} gấp ${n} lần là bao nhiêu?`, a * n, Math.round(a * n * 0.2) + 3);
  };
}
function chiaHetChiaCoDu(): Gen {
  return () => {
    const b = rnd(3, 9);
    const q = rnd(4, 20);
    const hasR = Math.random() < 0.5;
    const r = hasR ? rnd(1, b - 1) : 0;
    const a = b * q + r;
    return mcFixed(
      `Phép chia ${a} : ${b} là phép chia:`,
      hasR ? "có dư" : "hết",
      ["có dư", "hết", "không xác định", "vừa hết vừa dư"].filter((x) => x !== (hasR ? "có dư" : "hết")),
    );
  };
}
function chiaSo2CS1CS(): Gen {
  return () => {
    const b = rnd(2, 9);
    const qMax = 49 / b < 4 ? 4 : Math.floor(49 / b);
    const q = rnd(11, qMax);
    const a = b * q;
    return mcNumeric(`Tính: ${a} : ${b} = ?`, q, 3);
  };
}
function giamMotSoDiNLan(): Gen {
  return () => {
    const n = rnd(2, 6);
    const ket = rnd(4, 20);
    const a = ket * n;
    return mcNumeric(`Giảm ${a} đi ${n} lần thì được bao nhiêu?`, ket, Math.round(ket * 0.3) + 2);
  };
}
function baiToan2BuocNhanCong(): Gen {
  return () => {
    const soHop = rnd(3, 8);
    const soMoiHop = rnd(4, 12);
    const them = rnd(5, 30);
    const total = soHop * soMoiHop + them;
    return mcNumeric(
      `Có ${soHop} hộp bút, mỗi hộp ${soMoiHop} cái, và ${them} cái để rời. Hỏi có tất cả bao nhiêu cái bút?`,
      total,
      Math.round(total * 0.15) + 4,
    );
  };
}
function donViDoNho(unit: string, min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max);
    const b = rnd(min, max);
    const op = pick(["+", "-", "×"]);
    let expr: string;
    let correct: number;
    if (op === "+") {
      expr = `${a}${unit} + ${b}${unit}`;
      correct = a + b;
    } else if (op === "-") {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      expr = `${big}${unit} - ${small}${unit}`;
      correct = big - small;
    } else {
      const k = rnd(2, 5);
      expr = `${a}${unit} × ${k}`;
      correct = a * k;
    }
    return mcNumeric(`Tính: ${expr} = ?`, correct, Math.max(3, Math.round(correct * 0.2)));
  };
}
function soSanhNhietDo(): Gen {
  return () => {
    const a = rnd(-5, 40);
    let b = rnd(-5, 40);
    while (a === b) b = rnd(-5, 40);
    const bigger = Math.max(a, b);
    return mcFixed(`Nhiệt độ nào cao hơn: ${a}°C hay ${b}°C?`, `${bigger}°C`, [
      `${Math.min(a, b)}°C`,
      `${a}°C và ${b}°C bằng nhau`,
      `Không xác định được`,
    ]);
  };
}
function nhanChiaSo3CS1CS(isNhan: boolean): Gen {
  return () => {
    if (isNhan) {
      const a = rnd(101, 333);
      const b = rnd(2, 3);
      return mcNumeric(`Tính: ${a} × ${b} = ?`, a * b, Math.round(a * b * 0.15) + 5);
    }
    // so bi chia "a" phai la so co 3 chu so (100-999).
    const b = rnd(2, 4);
    const q = rnd(Math.ceil(100 / b), Math.floor(999 / b));
    const a = b * q;
    return mcNumeric(`Tính: ${a} : ${b} = ?`, q, Math.round(q * 0.15) + 5);
  };
}
function toHopCongDatTong(): Gen {
  return () => {
    const arr = shuffleArr([150, 200, 250, 300]);
    const target = arr[0] + arr[1];
    return mcNumeric(
      `Có các ca đựng ${arr.join("ml, ")}ml. Cần chọn 2 ca để được đúng ${target}ml. Tổng số ml của 2 ca đó là:`,
      target,
      30,
    );
  };
}
function bieuThucSo(withParen: boolean): Gen {
  return () => {
    const a = rnd(2, 20);
    const b = rnd(2, 10);
    const c = rnd(2, 10);
    if (withParen) {
      const correct = (a + b) * c;
      return mcNumeric(`Tính giá trị biểu thức: (${a} + ${b}) × ${c} = ?`, correct, Math.round(correct * 0.15) + 5);
    }
    const correct = a + b * c;
    return mcNumeric(`Tính giá trị biểu thức: ${a} + ${b} × ${c} = ?`, correct, Math.round(correct * 0.15) + 5);
  };
}
function soSanhGapMayLan(): Gen {
  return () => {
    const n = rnd(2, 8);
    const small = rnd(3, 15);
    const big = small * n;
    return mcNumeric(`${big} gấp mấy lần ${small}?`, n, 2);
  };
}
function onTapTongHopPhepTinh(max: number): Gen {
  return () => {
    const a = rnd(10, max);
    const b = rnd(2, 9);
    const op = pick(["×", ":"]);
    if (op === "×") return mcNumeric(`Tính: ${a} × ${b} = ?`, a * b, Math.round(a * b * 0.15) + 4);
    const q = rnd(2, Math.floor(max / b) || 2);
    const dividend = q * b;
    return mcNumeric(`Tính: ${dividend} : ${b} = ?`, q, 3);
  };
}
function onTapChuViDonGian(): Gen {
  return () => {
    const nCanh = pick([3, 4]);
    const canh = Array.from({ length: nCanh }, () => rnd(2, 15));
    const tong = canh.reduce((x, y) => x + y, 0);
    return mcNumeric(
      `Tính chu vi hình ${nCanh === 3 ? "tam giác" : "tứ giác"} có độ dài các cạnh là ${canh.join(" cm, ")} cm.`,
      tong,
      4,
    );
  };
}

// ================================================================
// Factory nhóm HK2 (Tuần 19-35, Bài 45-81) — số đến 10 000/100 000,
// La Mã, làm tròn, chu vi/diện tích, đồng hồ/lịch, tiền, thống kê, xác suất.
// ================================================================
function docSoLon(min: number, max: number): Gen {
  return () => {
    const n = rnd(min, max);
    const near = shuffleArr([1, 10, 100, 1000]).slice(0, 3);
    return mcFixed(
      `Số ${fmtSo(n)} đọc là:`,
      docSoVN(n),
      near.map((d) => docSoVN(Math.min(max, Math.max(min, n + (Math.random() < 0.5 ? d : -d))))),
    );
  };
}
function vietSoTuCachDoc(min: number, max: number): Gen {
  return () => {
    const n = rnd(min, max);
    return mcFixed(`"${docSoVN(n)}" viết là số nào?`, fmtSo(n), [
      fmtSo(n + pick([1, 10, 100])),
      fmtSo(Math.max(0, n - pick([1, 10, 100]))),
      fmtSo(n + 1000),
    ]);
  };
}
function soLienTruocSauLon(min: number, max: number): Gen {
  return () => {
    const n = rnd(min, max);
    const askSau = Math.random() < 0.5;
    return mcNumericFmt(`Số liền ${askSau ? "sau" : "trước"} của ${fmtSo(n)} là số nào?`, askSau ? n + 1 : n - 1, 5);
  };
}
function soSanhSoLon(min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max);
    let b = rnd(min, max);
    while (a === b) b = rnd(min, max);
    return mcFixed(`So sánh: ${fmtSo(a)} và ${fmtSo(b)}. Dấu thích hợp là:`, a > b ? ">" : "<", ["=", a > b ? "<" : ">"]);
  };
}
function phanTichThanhTong(min: number, max: number): Gen {
  return () => {
    const n = rnd(min, max);
    const nghin = Math.floor(n / 1000) * 1000;
    const tram = Math.floor((n % 1000) / 100) * 100;
    const chuc = Math.floor((n % 100) / 10) * 10;
    const dv = n % 10;
    // Bo qua so hang nghin khi n < 1000 (tranh hien "0 +" vo nghia o dau bieu thuc).
    const parts = nghin > 0 ? [fmtSo(nghin), fmtSo(tram), fmtSo(chuc)] : [fmtSo(tram), fmtSo(chuc)];
    return mcNumeric(`${fmtSo(n)} = ${parts.join(" + ")} + ?`, dv, 4);
  };
}
const LA_MA = [
  "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
];
function docLaMa(): Gen {
  return () => {
    const n = rnd(1, 20);
    const isToRoman = Math.random() < 0.5;
    if (isToRoman) {
      return mcFixed(`Số ${n} viết bằng chữ số La Mã là:`, LA_MA[n], [
        LA_MA[Math.min(20, n + 1)],
        LA_MA[Math.max(1, n - 1)],
        LA_MA[Math.min(20, n + 2)],
      ]);
    }
    return mcNumeric(`Chữ số La Mã "${LA_MA[n]}" có giá trị là:`, n, 2);
  };
}
function lamTronSo(place: 10 | 100 | 1000 | 10000): Gen {
  return () => {
    const range =
      place === 10 ? [20, 9990] : place === 100 ? [150, 99000] : place === 1000 ? [1500, 99000] : [15000, 99000];
    const n = rnd(range[0], range[1]);
    const down = Math.floor(n / place) * place;
    const up = down + place;
    const remainder = n - down;
    const correct = remainder * 2 >= place ? up : down;
    const label = place === 10 ? "chục" : place === 100 ? "trăm" : place === 1000 ? "nghìn" : "chục nghìn";
    return mcNumericFmt(`Làm tròn số ${fmtSo(n)} đến hàng ${label}:`, correct, place);
  };
}
function chuViTamGiacTuGiac(): Gen {
  return () => {
    const nCanh = pick([3, 4]);
    const canh = Array.from({ length: nCanh }, () => rnd(2, 15));
    const tong = canh.reduce((x, y) => x + y, 0);
    return mcNumeric(
      `Tính chu vi hình ${nCanh === 3 ? "tam giác" : "tứ giác"} có độ dài các cạnh là ${canh.join(" cm, ")} cm.`,
      tong,
      4,
    );
  };
}
function chuViHCNVuong(reverse: boolean): Gen {
  return () => {
    const isVuong = Math.random() < 0.4;
    if (isVuong) {
      const canh = rnd(3, 20);
      if (!reverse) return mcNumeric(`Tính chu vi hình vuông có cạnh ${canh} cm.`, canh * 4, 6);
      const cv = canh * 4;
      return mcNumeric(`Hình vuông có chu vi ${cv} cm. Độ dài cạnh là:`, canh, 3);
    }
    const rong = rnd(3, 15);
    const dai = rong + rnd(2, 15);
    if (!reverse) return mcNumeric(`Tính chu vi hình chữ nhật có chiều dài ${dai} cm, chiều rộng ${rong} cm.`, (dai + rong) * 2, 6);
    const cv = (dai + rong) * 2;
    return mcNumeric(`Hình chữ nhật có chu vi ${cv} cm, chiều rộng ${rong} cm. Chiều dài là:`, dai, 3);
  };
}
function dienTichHCNVuong(reverse: boolean): Gen {
  return () => {
    const isVuong = Math.random() < 0.4;
    if (isVuong) {
      const canh = rnd(3, 12);
      if (!reverse) return mcNumeric(`Tính diện tích hình vuông có cạnh ${canh} cm.`, canh * canh, Math.max(4, canh));
      const dt = canh * canh;
      return mcNumeric(`Hình vuông có diện tích ${dt} cm². Độ dài cạnh là:`, canh, 2);
    }
    const rong = rnd(3, 10);
    const dai = rong + rnd(2, 10);
    if (!reverse) return mcNumeric(`Tính diện tích hình chữ nhật có chiều dài ${dai} cm, chiều rộng ${rong} cm.`, dai * rong, Math.max(4, dai));
    const dt = dai * rong;
    return mcNumeric(`Hình chữ nhật có diện tích ${dt} cm², chiều rộng ${rong} cm. Chiều dài là:`, dai, 2);
  };
}
function phanBietChuViDienTich(): Gen {
  return () => {
    const canh = rnd(3, 15);
    const askDT = Math.random() < 0.5;
    return mcNumeric(`Hình vuông cạnh ${canh} cm. Tính ${askDT ? "diện tích (cm²)" : "chu vi (cm)"}.`, askDT ? canh * canh : canh * 4, 6);
  };
}
function congTruPhamViLon(ceiling: number): Gen {
  // ceiling = tran that cua pham vi (9999 hoac 99999) - tong 2 so PHAI <= ceiling
  // de dung voi ten node ("trong pham vi 10.000" / "100.000").
  return () => {
    const op = pick(["+", "-"]);
    if (op === "+") {
      const a = rnd(Math.floor(ceiling * 0.3), Math.floor(ceiling * 0.7));
      const b = rnd(100, ceiling - a - 1);
      return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} + ${fmtSo(b)} = ?`, a + b, Math.round((a + b) * 0.05) + 10);
    }
    const a = rnd(Math.floor(ceiling * 0.3), ceiling);
    const b = rnd(100, a - 1);
    return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} − ${fmtSo(b)} = ?`, a - b, Math.round(a * 0.05) + 10);
  };
}
function tinhNhamTronNghin(ceiling: number, unit: number): Gen {
  // unit = 1000 (tron nghin) hoac 10000 (tron chuc nghin). Tong/hieu PHAI <= ceiling.
  return () => {
    const maxK = Math.floor(ceiling / unit);
    const op = pick(["+", "-"]);
    if (op === "+") {
      const ka = rnd(2, Math.max(2, Math.floor(maxK * 0.6)));
      const kb = rnd(1, Math.max(1, maxK - ka - 1));
      const a = ka * unit;
      const b = kb * unit;
      return mcNumericFmt(`Tính nhẩm: ${fmtSo(a)} + ${fmtSo(b)} = ?`, a + b, unit * 2);
    }
    const ka = rnd(2, maxK);
    const kb = rnd(1, ka - 1 || 1);
    const a = ka * unit;
    const b = kb * unit;
    return mcNumericFmt(`Tính nhẩm: ${fmtSo(a)} − ${fmtSo(b)} = ?`, a - b, unit * 2);
  };
}
function nhanChiaSoLonCho1CS(digits: 4 | 5, mode?: "nhan" | "chia"): Gen {
  // digits: 4 hoac 5 -> so bi nhan/so bi chia PHAI co dung tung ay chu so.
  const range = digits === 4 ? [1000, 9999] : [10000, 99999];
  return () => {
    const isNhan = mode ? mode === "nhan" : Math.random() < 0.5;
    const b = rnd(2, 9);
    if (isNhan) {
      const a = rnd(range[0], range[1]);
      return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} × ${b} = ?`, a * b, Math.round((a * b) * 0.1) + 20);
    }
    const qMin = Math.ceil(range[0] / b);
    const qMax = Math.floor(range[1] / b);
    const q = rnd(qMin, qMax);
    const a = q * b;
    return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} : ${b} = ?`, q, Math.round(q * 0.1) + 20);
  };
}
function tinhKhoangThoiGian(): Gen {
  return () => {
    const gio1 = rnd(1, 10);
    const phut1 = pick([0, 5, 10, 15, 20, 25, 30]);
    const them = pick([10, 15, 20, 25, 30, 35, 40, 45, 50]);
    const totalPhut1 = gio1 * 60 + phut1;
    const totalPhut2 = totalPhut1 + them;
    const gio2 = Math.floor(totalPhut2 / 60);
    const phut2 = totalPhut2 % 60;
    return mcNumeric(
      `Bạn Nam bắt đầu làm bài lúc ${gio1} giờ ${phut1} phút, làm xong lúc ${gio2} giờ ${phut2} phút. Bạn Nam làm bài hết bao nhiêu phút?`,
      them,
      10,
    );
  };
}
function soNgayTrongThang(): Gen {
  return () => {
    const map31 = [1, 3, 5, 7, 8, 10, 12];
    const thang = rnd(1, 12);
    const soNgay = thang === 2 ? 28 : map31.includes(thang) ? 31 : 30;
    return mcNumeric(`Tháng ${thang} (không phải năm nhuận nếu là tháng 2, lấy 28 ngày) có bao nhiêu ngày?`, soNgay, 2);
  };
}
function tinhLichThu(): Gen {
  return () => {
    const thuList = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const startThu = rnd(0, 6);
    const soNgaySau = rnd(1, 6);
    const ketThu = (startThu + soNgaySau) % 7;
    return mcFixed(
      `Nếu hôm nay là ${thuList[startThu]}, thì ${soNgaySau} ngày sau là thứ mấy?`,
      thuList[ketThu],
      shuffleArr(thuList.filter((t) => t !== thuList[ketThu])).slice(0, 3),
    );
  };
}
const MENH_GIA = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
function tienVietNamTong(): Gen {
  return () => {
    const n = rnd(2, 4);
    const to = Array.from({ length: n }, () => pick(MENH_GIA));
    const tong = to.reduce((x, y) => x + y, 0);
    return mcNumericFmt(`Có các tờ tiền ${to.map((t) => fmtSo(t) + "đ").join(", ")}. Tổng số tiền là:`, tong, Math.round(tong * 0.15) + 2000);
  };
}
function tienVietNamDoi(): Gen {
  return () => {
    const idx = rnd(1, MENH_GIA.length - 1);
    const to = MENH_GIA[idx];
    const toNho = MENH_GIA[idx - 1];
    const soLuong = to / toNho;
    return mcNumeric(`1 tờ ${fmtSo(to)}đ đổi được mấy tờ ${fmtSo(toNho)}đ?`, soLuong, 2);
  };
}
function docBangSoLieu(): Gen {
  return () => {
    const nhan = ["Bò", "Gà", "Lợn", "Dê", "Vịt", "Ngan"];
    const chosen = shuffleArr(nhan).slice(0, 4);
    const soLuong = chosen.map(() => rnd(15, 130));
    const askMax = Math.random() < 0.5;
    const rows = chosen.map((n, i) => `${n}: ${soLuong[i]} con`).join(", ");
    if (askMax) {
      const maxIdx = soLuong.indexOf(Math.max(...soLuong));
      return mcFixed(`Bảng số liệu vật nuôi — ${rows}. Loại vật nuôi nào nhiều nhất?`, chosen[maxIdx], chosen.filter((_, i) => i !== maxIdx));
    }
    const minIdx = soLuong.indexOf(Math.min(...soLuong));
    return mcFixed(`Bảng số liệu vật nuôi — ${rows}. Loại vật nuôi nào ít nhất?`, chosen[minIdx], chosen.filter((_, i) => i !== minIdx));
  };
}
function demTally(): Gen {
  return () => {
    const n = rnd(6, 15);
    const sym = Array.from({ length: n }, () => pick(["×", "×", "×", "O"])).join("");
    const count = (sym.match(/×/g) || []).length;
    return mcNumeric(`Rô-bốt ghi kết quả ném bóng bằng ký hiệu (× = trúng, O = trượt): ${sym}. Số lần ném TRÚNG là bao nhiêu?`, count, 3);
  };
}
function khaNangXayRa(): Gen {
  return () => {
    const kind = pick(["chacchan", "cothe", "khongthe"]);
    const xanh = rnd(2, 5);
    const do_ = rnd(1, 4);
    const tong = xanh + do_;
    if (kind === "chacchan") {
      return mcFixed(
        `Hộp có ${xanh} bóng xanh và ${do_} bóng đỏ. Lấy ra 1 quả. Phát biểu nào ĐÚNG?`,
        "Có thể lấy được bóng xanh hoặc bóng đỏ",
        ["Chắc chắn lấy được bóng xanh", "Chắc chắn lấy được bóng đỏ", "Không thể lấy được bóng nào"],
      );
    }
    if (kind === "cothe") {
      return mcFixed(
        `Hộp có ${xanh} bóng xanh và ${do_} bóng đỏ, lấy ra 1 quả bất kì. Sự kiện nào CÓ THỂ xảy ra?`,
        "Lấy được bóng xanh",
        ["Lấy được bóng vàng", "Lấy được cả 2 màu cùng lúc", "Không lấy được quả nào"],
      );
    }
    return mcFixed(
      `Hộp chỉ có ${xanh} bóng xanh và ${do_} bóng đỏ (không có bóng vàng). Lấy ra 1 quả. Sự kiện nào KHÔNG THỂ xảy ra?`,
      "Lấy được bóng vàng",
      ["Lấy được bóng xanh", "Lấy được bóng đỏ", `Lấy được 1 trong ${tong} quả trong hộp`],
    );
  };
}
function timSoLonBeNhatNChuSo(askMax: boolean): Gen {
  return () => {
    const digits = shuffleArr([rnd(1, 9), rnd(0, 9), rnd(0, 9), rnd(0, 9)]);
    if (askMax) {
      const desc = digits.slice().sort((a, b) => b - a);
      const val = Number(desc.join(""));
      return mcNumericFmt(`Từ 4 chữ số ${digits.join(", ")}, số LỚN NHẤT có thể ghép được là:`, val, 500);
    }
    const asc = digits.slice().sort((a, b) => a - b);
    if (asc[0] === 0 && asc.length > 1) {
      const firstNonZero = asc.findIndex((d) => d !== 0);
      [asc[0], asc[firstNonZero]] = [asc[firstNonZero], asc[0]];
    }
    const val = Number(asc.join(""));
    return mcNumericFmt(`Từ 4 chữ số ${digits.join(", ")}, số BÉ NHẤT có thể ghép được là:`, val, 500);
  };
}
function onTapPhepTinhLon(max: number): Gen {
  return () => {
    const op = pick(["nhan", "chia", "bieuthuc"]);
    if (op === "nhan") {
      const a = rnd(1000, max);
      const b = rnd(2, 9);
      return mcNumericFmt(`Tính: ${fmtSo(a)} × ${b} = ?`, a * b, Math.round(a * b * 0.1) + 20);
    }
    if (op === "chia") {
      const b = rnd(2, 9);
      const q = rnd(1000, Math.floor(max / b));
      return mcNumericFmt(`Tính: ${fmtSo(q * b)} : ${b} = ?`, q, Math.round(q * 0.1) + 20);
    }
    const b = rnd(2, 9);
    const qBase = rnd(200, Math.floor(max / b));
    const aChia = qBase * b;
    const c = rnd(100, 2000);
    const correct = qBase + c;
    return mcNumericFmt(`Tính giá trị biểu thức: ${fmtSo(aChia)} : ${b} + ${fmtSo(c)} = ?`, correct, Math.round(c * 0.2) + 20);
  };
}

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
