// Builtin Toán Lớp 3 — hàm trợ giúp + factory (phần A). Tách từ builtins-grade3.ts, dời nguyên văn (mục 93 Đợt 4a).
// Danh sách mẫu GRADE3_BUILTIN_TEMPLATES nằm ở builtins-grade3.ts.
import type { RawGenerated } from "./types";
// ---- het tieu de tach file (muc 93 Dot 4a) ----

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

// ---- het phan chuyen nguyen van (muc 93 Dot 4a) ----
export {
  shuffleArr, rnd, pick, mcNumeric, fmtSo, mcNumericFmt, mcFixed, docSoVN, timThanhPhanCongTru,
  bangNhanChia, timThanhPhanNhanChia, motPhanMay, demCanhHinh, demMatKhoi, nhanSo2CS1CS,
  gapMotSoLenNLan, chiaHetChiaCoDu, chiaSo2CS1CS, giamMotSoDiNLan, baiToan2BuocNhanCong,
  donViDoNho, soSanhNhietDo, nhanChiaSo3CS1CS, toHopCongDatTong, bieuThucSo, soSanhGapMayLan,
  onTapTongHopPhepTinh, onTapChuViDonGian, type Gen,
};
