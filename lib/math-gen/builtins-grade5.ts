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
import type { MathTemplate, RawGenerated } from "./types";

// ---------- Helpers thuần (port từ lop5_logic.js) ----------
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
  const seen = new Set([correct]);
  const uniq: string[] = [];
  for (const d of distractors) {
    if (uniq.length >= 3) break;
    if (!seen.has(d)) { seen.add(d); uniq.push(d); }
  }
  const options = shuffleArr([correct, ...uniq]);
  return { text, correct_answer: correct, options };
}

type Gen = () => RawGenerated;

// ---------- So thap phan (STP) helpers ----------
function roundDp(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
function fmtVN(n: number): string {
  const s = String(n);
  if (s.indexOf(".") === -1) return s;
  return s.replace(".", ",");
}
function rndDec(min: number, max: number, dp: number): number {
  const f = Math.pow(10, dp);
  const n = rnd(Math.round(min * f), Math.round(max * f));
  return roundDp(n / f, dp);
}
function mcDecFixed(text: string, correct: number, spread: number, dp: number): RawGenerated {
  const factor = Math.pow(10, dp);
  const correctInt = Math.round(correct * factor);
  const raw = numericDistractors(correctInt, 3, spread * factor);
  const vals = raw.map((x) => roundDp(x / factor, dp));
  const options = vals.map(fmtVN);
  const correctStr = fmtVN(roundDp(correct, dp));
  return { text, correct_answer: correctStr, options };
}

// ---------- Engine phan so (tai su dung nguyen ven tu builtins-grade4.ts) ----------
interface Frac { n: number; d: number }
function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
function simplifyFrac(f: Frac): Frac {
  const g = gcd(f.n, f.d);
  let n = f.n / g, d = f.d / g;
  if (d < 0) { n = -n; d = -d; }
  return { n, d };
}
function fracStr(f: Frac): string { return `${f.n}/${f.d}`; }
function fracAdd(a: Frac, b: Frac): Frac { return { n: a.n * b.d + b.n * a.d, d: a.d * b.d }; }
function fracSub(a: Frac, b: Frac): Frac { return { n: a.n * b.d - b.n * a.d, d: a.d * b.d }; }
function fracMul(a: Frac, b: Frac): Frac { return { n: a.n * b.n, d: a.d * b.d }; }
function fracDiv(a: Frac, b: Frac): Frac { return { n: a.n * b.d, d: a.d * b.n }; }
function mcFracFixed(text: string, correct: Frac, wrongs: Frac[]): RawGenerated {
  const correctStr = fracStr(correct);
  const seen = new Set([correctStr]);
  const uniq: string[] = [];
  for (const w of wrongs) {
    const s = fracStr(w);
    if (uniq.length >= 3) break;
    if (!seen.has(s)) { seen.add(s); uniq.push(s); }
  }
  const options = shuffleArr([correctStr, ...uniq]);
  return { text, correct_answer: correctStr, options };
}
function honSoStr(n: number, d: number): string {
  const whole = Math.floor(n / d), rem = n % d;
  if (rem === 0) return String(whole);
  return `${whole} ${rem}/${d}`;
}

// ================= FACTORY: On tap so tu nhien / phan so (T1-T3) =================

function docSoLon(min: number, max: number): Gen {
  const DV = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  function doc2CS(n: number): string {
    if (n === 0) return "";
    if (n < 10) return DV[n];
    const chuc = Math.floor(n / 10), dv = n % 10;
    let s = chuc === 1 ? "mười" : DV[chuc] + " mươi";
    if (dv === 0) return s;
    if (dv === 1 && chuc >= 2) return s + " mốt";
    if (dv === 5) return s + " lăm";
    return s + " " + DV[dv];
  }
  function doc3CS(n: number): string {
    if (n === 0) return "";
    const tram = Math.floor(n / 100), rest = n % 100;
    let s = "";
    if (tram > 0) s += DV[tram] + " trăm";
    if (rest === 0) return s;
    if (tram > 0 && rest < 10) s += " linh " + DV[rest];
    else s += (s ? " " : "") + doc2CS(rest);
    return s.trim();
  }
  function docSoVN(nIn: number): string {
    const n = Math.max(0, Math.min(999999999, Math.round(nIn)));
    if (n === 0) return "không";
    const trieu = Math.floor(n / 1000000);
    const nghin = Math.floor((n % 1000000) / 1000);
    const don = n % 1000;
    const parts: string[] = [];
    if (trieu > 0) parts.push((trieu < 10 ? DV[trieu] : trieu < 100 ? doc2CS(trieu) : doc3CS(trieu)) + " triệu");
    if (nghin > 0) parts.push((nghin < 10 ? DV[nghin] : nghin < 100 ? doc2CS(nghin) : doc3CS(nghin)) + " nghìn");
    if (don > 0) {
      if ((trieu > 0 || nghin > 0) && don < 100) parts.push("không trăm" + (don < 10 ? " linh " + DV[don] : " " + doc2CS(don)));
      else parts.push(doc3CS(don));
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }
  return () => {
    const n = rnd(min, max);
    const near = shuffleArr([1, 10, 100, 1000]).slice(0, 3);
    return mcFixed(`Số ${fmtSo(n)} đọc là:`, docSoVN(n), near.map((d) => docSoVN(Math.min(max, Math.max(min, n + (Math.random() < 0.5 ? d : -d))))));
  };
}
function soSanhSoLon(min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max), b = rnd(min, max);
    if (a === b) return soSanhSoLon(min, max)();
    return mcFixed(`So sánh: ${fmtSo(a)} và ${fmtSo(b)}. Dấu thích hợp là:`, a > b ? ">" : "<", ["=", a > b ? "<" : ">"]);
  };
}
function congTruSoLon(ceiling: number): Gen {
  return () => {
    const op = pick(["+", "-"]);
    if (op === "+") {
      const a = rnd(Math.floor(ceiling * 0.2), Math.floor(ceiling * 0.6));
      const b = rnd(1000, ceiling - a - 1);
      return mcNumericFmt(`Tính: ${fmtSo(a)} + ${fmtSo(b)} = ?`, a + b, Math.round((a + b) * 0.05) + 100);
    }
    const a = rnd(Math.floor(ceiling * 0.4), ceiling);
    const b = rnd(1000, a - 1);
    return mcNumericFmt(`Tính: ${fmtSo(a)} − ${fmtSo(b)} = ?`, a - b, Math.round(a * 0.05) + 100);
  };
}
function rutGonPhanSo(): Gen {
  return () => {
    const k = rnd(2, 6);
    const nBase = rnd(1, 9), dBase = rnd(nBase + 1, 12);
    const g = gcd(nBase, dBase);
    const n0 = nBase / g, d0 = dBase / g;
    return mcFracFixed(`Rút gọn phân số ${n0 * k}/${d0 * k} về phân số tối giản:`, { n: n0, d: d0 }, [{ n: n0 + 1, d: d0 }, { n: n0, d: d0 + 1 }, { n: n0 * k, d: d0 * k }]);
  };
}
function nhanDienPhanSoThapPhan(): Gen {
  return () => {
    const isPSTP = Math.random() < 0.5;
    let n: number, d: number;
    if (isPSTP) { d = pick([10, 100, 1000]); n = rnd(1, d - 1); }
    else { d = pick([3, 7, 9, 12, 25]); n = rnd(1, d - 1); }
    return mcFixed(`Phân số ${n}/${d} có phải là phân số thập phân không? (mẫu số là 10, 100, 1000, ...)`, isPSTP ? "Có, là phân số thập phân" : "Không phải phân số thập phân", ["Có, là phân số thập phân", "Không phải phân số thập phân", "Không xác định được"]);
  };
}
function vietPhanSoThanhPSTP(): Gen {
  const self: Gen = () => {
    const d0 = pick([2, 4, 5, 20, 25, 50]);
    const target = pick([10, 100]);
    if (target % d0 !== 0) return self();
    const k = target / d0;
    const n0 = rnd(1, d0 - 1);
    return mcFracFixed(`Viết phân số ${n0}/${d0} thành phân số thập phân (mẫu số ${target}):`, { n: n0 * k, d: target }, [{ n: n0, d: target }, { n: n0 * k + 1, d: target }, { n: n0 * k, d: target * 10 }]);
  };
  return self;
}
function phepTinhPhanSo(): Gen {
  const self: Gen = () => {
    const op = pick(["+", "-", "×", ":"]);
    const d1 = rnd(2, 8), d2 = rnd(2, 8);
    const n1 = rnd(1, d1 - 1), n2 = rnd(1, d2 - 1);
    const f1: Frac = { n: n1, d: d1 }, f2: Frac = { n: n2, d: d2 };
    let raw: Frac;
    if (op === "+") raw = fracAdd(f1, f2);
    else if (op === "-") { if (n1 / d1 < n2 / d2) return self(); raw = fracSub(f1, f2); }
    else if (op === "×") raw = fracMul(f1, f2);
    else raw = fracDiv(f1, f2);
    const result = simplifyFrac(raw);
    return mcFracFixed(`Tính: ${n1}/${d1} ${op} ${n2}/${d2} = ?`, result, [simplifyFrac({ n: raw.n + 1, d: raw.d }), { n: raw.n, d: raw.d }, { n: n1, d: d1 }]);
  };
  return self;
}
function congTruPhanSoKhacMau(isAdd: boolean): Gen {
  const self: Gen = () => {
    const d1 = rnd(2, 9), d2 = rnd(2, 9);
    if (d1 === d2) return self();
    const n1 = rnd(1, d1 - 1), n2 = rnd(1, d2 - 1);
    const f1: Frac = { n: n1, d: d1 }, f2: Frac = { n: n2, d: d2 };
    if (!isAdd && n1 / d1 < n2 / d2) return self();
    const raw = isAdd ? fracAdd(f1, f2) : fracSub(f1, f2);
    const result = simplifyFrac(raw);
    const op = isAdd ? "+" : "−";
    return mcFracFixed(`Tính: ${n1}/${d1} ${op} ${n2}/${d2} = ?`, result, [simplifyFrac({ n: raw.n + 1, d: raw.d }), { n: raw.n, d: raw.d }, { n: n1, d: d1 }]);
  };
  return self;
}
function honSoDoiPhanSo(): Gen {
  return () => {
    const d = rnd(2, 10), whole = rnd(1, 9), rem = rnd(1, d - 1);
    const kind = pick(["hs_to_ps", "ps_to_hs", "phan_nguyen"]);
    const n = whole * d + rem;
    if (kind === "hs_to_ps") return mcFracFixed(`Đổi hỗn số ${whole} ${rem}/${d} thành phân số:`, { n, d }, [{ n: whole * d, d }, { n: n + 1, d }, { n: rem, d }]);
    if (kind === "ps_to_hs") return mcFixed(`Đổi phân số ${n}/${d} thành hỗn số:`, honSoStr(n, d), [honSoStr(n + d, d), honSoStr(n - 1, d), `${whole} ${rem + 1}/${d}`]);
    return mcNumeric(`Hỗn số ${whole} ${rem}/${d} có phần nguyên là:`, whole, 2);
  };
}

// ================= FACTORY: So thap phan (T4-T11) =================

function doiDonViKhoiLuongLon(): Gen {
  return () => {
    const units = [{ name: "yến", kg: 10 }, { name: "tạ", kg: 100 }, { name: "tấn", kg: 1000 }];
    const u = pick(units);
    const soLuong = rnd(2, 9);
    return mcNumeric(`${soLuong} ${u.name} = ? kg`, soLuong * u.kg, u.kg);
  };
}
function docVietSTPCoBan(): Gen {
  return () => {
    const phanNguyen = rnd(0, 99), phanThap = rnd(1, 99);
    const n = roundDp(phanNguyen + phanThap / 100, 2);
    const kind = pick(["phannguyen", "phanthapphan"]);
    if (kind === "phannguyen") return mcNumeric(`Số thập phân ${fmtVN(n)} có phần nguyên là:`, phanNguyen, 3);
    return mcFixed(`Số thập phân ${fmtVN(n)} có phần thập phân là:`, fmtVN(roundDp(phanThap / 100, 2)), [fmtVN(roundDp((100 - phanThap) / 100, 2)), fmtVN(roundDp(phanThap / 10, 2)), String(phanThap)]);
  };
}
function soSanhSTP(): Gen {
  const self: Gen = () => {
    const dp = pick([1, 2]);
    const a = rndDec(0, 200, dp), b = rndDec(0, 200, dp);
    if (a === b) return self();
    return mcFixed(`So sánh: ${fmtVN(a)} và ${fmtVN(b)}. Dấu thích hợp là:`, a > b ? ">" : "<", ["=", a > b ? "<" : ">"]);
  };
  return self;
}
function vietSoDoDuoiDangSTP(): Gen {
  return () => {
    const kind = pick(["dodai", "khoiluong"]);
    if (kind === "dodai") {
      const m = rnd(1, 20), cm = rnd(1, 99);
      return mcDecFixed(`${m}m ${cm}cm = ? m`, roundDp(m + cm / 100, 2), 5, 2);
    }
    const kg = rnd(1, 20), g = rnd(1, 999);
    return mcDecFixed(`${kg}kg ${g}g = ? kg`, roundDp(kg + g / 1000, 3), 5, 3);
  };
}
function vietSoDoDienTichDuoiDangSTP(): Gen {
  return () => {
    const m2 = rnd(1, 10), dm2 = rnd(1, 99);
    return mcDecFixed(`${m2}m² ${dm2}dm² = ? m²`, roundDp(m2 + dm2 / 100, 2), 5, 2);
  };
}
function lamTronSTP(): Gen {
  return () => {
    const kind = pick(["so_tu_nhien", "phan_muoi", "phan_tram"]);
    if (kind === "so_tu_nhien") {
      const n = rndDec(1, 200, 2);
      const down = Math.floor(n);
      const remainder = n - down;
      const correct = remainder >= 0.5 ? down + 1 : down;
      return mcNumeric(`Làm tròn số ${fmtVN(n)} đến số tự nhiên gần nhất:`, correct, 3);
    }
    const dp = kind === "phan_muoi" ? 1 : 2;
    const n = rndDec(1, 100, dp + 1);
    const factor = Math.pow(10, dp);
    const down = Math.floor(n * factor) / factor;
    const up = roundDp(down + 1 / factor, dp);
    const remainder = roundDp((n - down) * factor * 10, 0);
    const correct = remainder >= 5 ? up : down;
    return mcDecFixed(`Làm tròn số ${fmtVN(n)} đến hàng ${dp === 1 ? "phần mười" : "phần trăm"}:`, correct, 3, dp);
  };
}
function doiDonViDienTichLon(): Gen {
  return () => {
    const chain = [{ name: "m²", factor: 1 }, { name: "ha", factor: 10000 }, { name: "km²", factor: 1000000 }];
    const i = rnd(0, chain.length - 2);
    const from = chain[i], to = chain[i + 1];
    const soLuong = rnd(2, 9);
    const isUp = Math.random() < 0.5;
    if (isUp) return mcNumeric(`${soLuong} ${to.name} = ? ${from.name}`, soLuong * (to.factor / from.factor), to.factor / from.factor);
    const big = soLuong * (to.factor / from.factor);
    return mcNumericFmt(`${fmtSo(big)} ${from.name} = ? ${to.name}`, soLuong, 3);
  };
}
function congSTP(): Gen {
  return () => {
    const dp = pick([1, 2]);
    const a = rndDec(1, 90, dp), b = rndDec(1, 90, dp);
    return mcDecFixed(`Tính: ${fmtVN(a)} + ${fmtVN(b)} = ?`, roundDp(a + b, dp), 6, dp);
  };
}
function truSTP(): Gen {
  return () => {
    const dp = pick([1, 2]);
    const a = rndDec(10, 99, dp);
    const b = rndDec(1, a - 1, dp);
    return mcDecFixed(`Tính: ${fmtVN(a)} − ${fmtVN(b)} = ?`, roundDp(a - b, dp), 6, dp);
  };
}
function tinhChatSTP(isAdd: boolean): Gen {
  return () => {
    const a = rndDec(1, 20, 1), b = rndDec(1, 20, 1), c = rndDec(1, 20, 1);
    if (isAdd) return mcFixed(`Theo tính chất giao hoán, ${fmtVN(a)} + ${fmtVN(b)} = ?`, `${fmtVN(b)} + ${fmtVN(a)}`, [`${fmtVN(a)} − ${fmtVN(b)}`, `${fmtVN(a)} × ${fmtVN(b)}`, `${fmtVN(b)} − ${fmtVN(a)}`]);
    return mcFixed(`Theo tính chất kết hợp, (${fmtVN(a)} + ${fmtVN(b)}) + ${fmtVN(c)} = ?`, `${fmtVN(a)} + (${fmtVN(b)} + ${fmtVN(c)})`, [`${fmtVN(a)} + (${fmtVN(b)} × ${fmtVN(c)})`, `(${fmtVN(a)} × ${fmtVN(b)}) + ${fmtVN(c)}`, `${fmtVN(a)} − (${fmtVN(b)} + ${fmtVN(c)})`]);
  };
}
function nhanSTP(): Gen {
  return () => {
    const kind = pick(["stp_tunhien", "stp_stp"]);
    if (kind === "stp_tunhien") {
      const a = rndDec(1, 30, 2), b = rnd(2, 9);
      return mcDecFixed(`Tính: ${fmtVN(a)} × ${b} = ?`, roundDp(a * b, 2), 8, 2);
    }
    const a = rndDec(1, 15, 1), b = rndDec(1, 9, 1);
    return mcDecFixed(`Tính: ${fmtVN(a)} × ${fmtVN(b)} = ?`, roundDp(a * b, 2), 8, 2);
  };
}
function chiaSTP(): Gen {
  return () => {
    const kind = pick(["stp_tunhien", "tunhien_stp", "stp_stp"]);
    if (kind === "stp_tunhien") {
      const b = rnd(2, 9), q = rndDec(2, 50, 1);
      const a = roundDp(q * b, 2);
      return mcDecFixed(`Tính: ${fmtVN(a)} : ${b} = ?`, q, 5, 1);
    }
    if (kind === "tunhien_stp") {
      const b = rndDec(1, 9, 1), q = rnd(2, 30);
      const a = roundDp(q * b, 1);
      return mcNumeric(`Tính: ${fmtVN(a)} : ${fmtVN(b)} = ?`, q, 3);
    }
    const b = rndDec(1, 9, 1), q = rndDec(1, 20, 1);
    const a = roundDp(q * b, 2);
    return mcDecFixed(`Tính: ${fmtVN(a)} : ${fmtVN(b)} = ?`, q, 4, 1);
  };
}
function nhanChiaSTPVoi101001000(): Gen {
  return () => {
    const unit = pick([10, 100, 1000]);
    const isNhan = Math.random() < 0.5;
    const dp = pick([1, 2]);
    const a = rndDec(1, 90, dp);
    if (isNhan) return mcDecFixed(`Tính nhẩm: ${fmtVN(a)} × ${unit} = ?`, roundDp(a * unit, Math.max(0, dp - String(unit).length + 1)), unit, 2);
    const bigA = rndDec(10, 900, dp);
    return mcDecFixed(`Tính nhẩm: ${fmtVN(bigA)} : ${unit} = ?`, roundDp(bigA / unit, dp + 3), 5, dp + 3);
  };
}

// ================= FACTORY: Hinh hoc phang (T12-T14, T17) =================

function dienTichTamGiac(): Gen {
  return () => {
    const day = rnd(3, 30), cao = rnd(3, 30);
    return mcNumeric(`Tính diện tích hình tam giác có đáy ${day}cm, chiều cao ${cao}cm.`, (day * cao) / 2, 6);
  };
}
function dienTichHinhThang(): Gen {
  return () => {
    const a = rnd(5, 30), b = rnd(5, 30), h = rnd(3, 20);
    return mcNumeric(`Tính diện tích hình thang có 2 đáy ${a}cm, ${b}cm và chiều cao ${h}cm.`, ((a + b) * h) / 2, 8);
  };
}
function chuViHinhTron(): Gen {
  return () => {
    const isBanKinh = Math.random() < 0.5;
    const r = rnd(2, 20);
    if (isBanKinh) return mcDecFixed(`Tính chu vi hình tròn có bán kính ${r}cm (lấy π=3,14).`, roundDp(2 * 3.14 * r, 2), 6, 2);
    const d = r * 2;
    return mcDecFixed(`Tính chu vi hình tròn có đường kính ${d}cm (lấy π=3,14).`, roundDp(3.14 * d, 2), 6, 2);
  };
}
function dienTichHinhTron(): Gen {
  return () => {
    const r = rnd(2, 15);
    return mcDecFixed(`Tính diện tích hình tròn có bán kính ${r}cm (lấy π=3,14).`, roundDp(3.14 * r * r, 2), 10, 2);
  };
}

// ================= FACTORY: Ti so, ti so % (T19-T21) =================

function tiSo(): Gen {
  const self: Gen = () => {
    const a = rnd(5, 40), b = rnd(5, 40);
    if (a === b) return self();
    return mcFixed(`Tỉ số của ${a} và ${b} là:`, `${a}:${b}`, [`${b}:${a}`, `${a + 1}:${b}`, `${a}:${b + 1}`]);
  };
  return self;
}
function tiLeBanDo(): Gen {
  return () => {
    const tiLe = pick([500, 1000, 2000, 5000, 10000]);
    const isThuan = Math.random() < 0.5;
    if (isThuan) {
      const cm = rnd(2, 20);
      const thucTeCm = cm * tiLe;
      const thucTeM = thucTeCm / 100;
      return mcNumeric(`Bản đồ tỉ lệ 1:${fmtSo(tiLe)}, khoảng cách trên bản đồ là ${cm}cm. Khoảng cách thực tế là bao nhiêu mét?`, thucTeM, Math.max(5, Math.round(thucTeM * 0.1)));
    }
    const thucTeM = rnd(5, 200) * (tiLe / 100);
    const cm = (thucTeM * 100) / tiLe;
    return mcNumeric(`Bản đồ tỉ lệ 1:${fmtSo(tiLe)}, khoảng cách thực tế là ${fmtSo(thucTeM)}m. Khoảng cách trên bản đồ là bao nhiêu cm?`, cm, 3);
  };
}
function tongTiSo(): Gen {
  const self: Gen = () => {
    const p1 = rnd(2, 8), p2 = rnd(2, 8);
    if (p1 === p2) return self();
    const k = rnd(3, 20);
    const so1 = p1 * k, so2 = p2 * k;
    const tong = so1 + so2;
    const askLon = Math.random() < 0.5;
    return mcNumeric(`Tổng của 2 số là ${tong}, tỉ số của 2 số là ${p1}/${p2}. Tìm số ${askLon ? "lớn" : "bé"}.`, askLon ? Math.max(so1, so2) : Math.min(so1, so2), 8);
  };
  return self;
}
function hieuTiSo(): Gen {
  const self: Gen = () => {
    const p1 = rnd(2, 8), p2 = rnd(2, 8);
    if (p1 === p2) return self();
    const k = rnd(3, 20);
    const so1 = p1 * k, so2 = p2 * k;
    const hieu = Math.abs(so1 - so2);
    const askLon = Math.random() < 0.5;
    return mcNumeric(`Hiệu của 2 số là ${hieu}, tỉ số của 2 số là ${Math.min(p1, p2)}/${Math.max(p1, p2)}. Tìm số ${askLon ? "lớn" : "bé"}.`, askLon ? Math.max(so1, so2) : Math.min(so1, so2), 8);
  };
  return self;
}
function timTiSoPhanTramCuaHaiSo(): Gen {
  return () => {
    const b = rnd(20, 100);
    const pct = rnd(10, 150);
    const a = Math.round((b * pct) / 100);
    const realPct = roundDp((a / b) * 100, 1);
    return mcFixed(`Tìm tỉ số phần trăm của ${a} và ${b}:`, `${fmtVN(realPct)}%`, [`${fmtVN(roundDp(realPct + 5, 1))}%`, `${fmtVN(roundDp(realPct / 10, 1))}%`, `${fmtVN(roundDp(realPct * 10, 1))}%`]);
  };
}
function timGiaTriPhanTram(): Gen {
  return () => {
    const kind = pick(["thuan", "nguoc"]);
    const pct = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
    if (kind === "thuan") {
      const total = rnd(2, 50) * (100 / gcd(pct, 100));
      const value = Math.round((total * pct) / 100);
      return mcNumeric(`Tìm ${pct}% của ${total}:`, value, Math.max(3, Math.round(value * 0.15)));
    }
    const base = rnd(2, 40);
    const value = base * pct;
    const total = (value * 100) / pct;
    return mcNumeric(`Biết ${pct}% của một số là ${value}. Số đó là:`, total, Math.max(5, Math.round(total * 0.1)));
  };
}

// ================= FACTORY: The tich, hinh khoi (T22-T25) =================

function doiDonViTheTichNho(): Gen {
  return () => {
    const isUp = Math.random() < 0.5;
    const soLuong = rnd(2, 9);
    if (isUp) return mcNumeric(`${soLuong} dm³ = ? cm³`, soLuong * 1000, 200);
    const big = soLuong * 1000;
    return mcNumeric(`${fmtSo(big)} cm³ = ? dm³`, soLuong, 3);
  };
}
function doiDonViTheTichLon(): Gen {
  return () => {
    const soLuong = rnd(2, 9);
    const isUp = Math.random() < 0.5;
    if (isUp) return mcNumeric(`${soLuong} m³ = ? dm³`, soLuong * 1000, 200);
    const big = soLuong * 1000;
    return mcNumeric(`${fmtSo(big)} dm³ = ? m³`, soLuong, 3);
  };
}
function theTichHHCN(): Gen {
  return () => {
    const a = rnd(2, 20), b = rnd(2, 20), c = rnd(2, 20);
    return mcNumeric(`Tính thể tích hình hộp chữ nhật có chiều dài ${a}cm, chiều rộng ${b}cm, chiều cao ${c}cm.`, a * b * c, Math.max(10, Math.round(a * b * c * 0.1)));
  };
}
function theTichHLP(): Gen {
  return () => {
    const a = rnd(2, 20);
    return mcNumeric(`Tính thể tích hình lập phương có cạnh ${a}cm.`, a * a * a, Math.max(10, Math.round(a * a * a * 0.15)));
  };
}
function dienTichHHCN(): Gen {
  return () => {
    const a = rnd(3, 20), b = rnd(3, 20), c = rnd(3, 20);
    const kind = pick(["xungquanh", "toanphan"]);
    const sxq = 2 * (a + b) * c;
    if (kind === "xungquanh") return mcNumeric(`Tính diện tích xung quanh hình hộp chữ nhật dài ${a}cm, rộng ${b}cm, cao ${c}cm.`, sxq, Math.max(8, Math.round(sxq * 0.1)));
    const stp = sxq + 2 * a * b;
    return mcNumeric(`Tính diện tích toàn phần hình hộp chữ nhật dài ${a}cm, rộng ${b}cm, cao ${c}cm.`, stp, Math.max(8, Math.round(stp * 0.1)));
  };
}
function dienTichHLP(): Gen {
  return () => {
    const a = rnd(3, 20);
    const kind = pick(["xungquanh", "toanphan"]);
    if (kind === "xungquanh") return mcNumeric(`Tính diện tích xung quanh hình lập phương cạnh ${a}cm.`, a * a * 4, Math.max(6, Math.round(a * a * 0.4)));
    return mcNumeric(`Tính diện tích toàn phần hình lập phương cạnh ${a}cm.`, a * a * 6, Math.max(8, Math.round(a * a * 0.5)));
  };
}

// ================= FACTORY: Thoi gian, van toc (T26-T29) =================

function doiDonViThoiGian(): Gen {
  return () => {
    const pairs: [string, string, number][] = [
      ["thế kỉ", "năm", 100], ["năm", "tháng", 12], ["ngày", "giờ", 24],
      ["giờ", "phút", 60], ["phút", "giây", 60],
    ];
    const [big, small, factor] = pick(pairs);
    const isUp = Math.random() < 0.5;
    const soLuong = rnd(2, 9);
    if (isUp) return mcNumeric(`${soLuong} ${big} = ? ${small}`, soLuong * factor, factor);
    const total = soLuong * factor;
    return mcNumeric(`${total} ${small} = ? ${big}`, soLuong, 3);
  };
}
function congTruThoiGian(): Gen {
  return () => {
    const isAdd = Math.random() < 0.5;
    const g1 = rnd(1, 12), p1 = rnd(0, 59);
    const g2 = rnd(1, 8), p2 = rnd(0, 59);
    if (isAdd) {
      let totalP = p1 + p2, totalG = g1 + g2;
      if (totalP >= 60) { totalP -= 60; totalG += 1; }
      return mcFixed(`Tính: ${g1} giờ ${p1} phút + ${g2} giờ ${p2} phút = ?`, `${totalG} giờ ${totalP} phút`, [`${totalG + 1} giờ ${totalP} phút`, `${totalG} giờ ${totalP + 1} phút`, `${g1 + g2} giờ ${p1 + p2} phút`]);
    }
    let totalMin1 = g1 * 60 + p1;
    let totalMin2 = g2 * 60 + p2;
    if (totalMin2 >= totalMin1) [totalMin1, totalMin2] = [totalMin2, totalMin1];
    const diff = totalMin1 - totalMin2;
    const dG = Math.floor(diff / 60), dP = diff % 60;
    const G1 = Math.floor(totalMin1 / 60), P1 = totalMin1 % 60;
    const G2 = Math.floor(totalMin2 / 60), P2 = totalMin2 % 60;
    return mcFixed(`Tính: ${G1} giờ ${P1} phút − ${G2} giờ ${P2} phút = ?`, `${dG} giờ ${dP} phút`, [`${dG + 1} giờ ${dP} phút`, `${dG} giờ ${dP + 1} phút`, `${Math.abs(G1 - G2)} giờ ${Math.abs(P1 - P2)} phút`]);
  };
}
function nhanChiaThoiGian(): Gen {
  return () => {
    const isNhan = Math.random() < 0.5;
    if (isNhan) {
      const g = rnd(1, 5), p = rnd(0, 59), k = rnd(2, 6);
      const totalMin = (g * 60 + p) * k;
      const G = Math.floor(totalMin / 60), P = totalMin % 60;
      return mcFixed(`Tính: ${g} giờ ${p} phút × ${k} = ?`, `${G} giờ ${P} phút`, [`${G + 1} giờ ${P} phút`, `${G} giờ ${P + 1} phút`, `${g * k} giờ ${p * k} phút`]);
    }
    const k = rnd(2, 6);
    const G0 = rnd(1, 10), P0raw = rnd(0, 59);
    const P0 = P0raw - (P0raw % k);
    const bigMin = (G0 * 60 + Math.max(0, P0)) * k;
    const G = Math.floor(bigMin / 60), P = bigMin % 60;
    const resG = Math.floor((G * 60 + P) / k / 60), resP = Math.floor((G * 60 + P) / k) % 60;
    return mcFixed(`Tính: ${G} giờ ${P} phút : ${k} = ?`, `${resG} giờ ${resP} phút`, [`${resG + 1} giờ ${resP} phút`, `${resG} giờ ${resP + 1} phút`, `${Math.floor(G / k)} giờ ${Math.floor(P / k)} phút`]);
  };
}
function vanTocQuangDuongThoiGian(): Gen {
  return () => {
    const kind = pick(["v", "s", "t"]);
    const v = rnd(10, 90), t = rnd(2, 8);
    const s = v * t;
    if (kind === "v") return mcNumeric(`Một xe đi ${s}km trong ${t} giờ. Tính vận tốc (km/h).`, v, 5);
    if (kind === "s") return mcNumeric(`Một xe đi với vận tốc ${v}km/h trong ${t} giờ. Tính quãng đường đi được (km).`, s, Math.round(s * 0.1) + 5);
    return mcNumeric(`Một xe đi quãng đường ${s}km với vận tốc ${v}km/h. Tính thời gian đi (giờ).`, t, 2);
  };
}
function doiDonViVanToc(): Gen {
  return () => {
    const kmh = pick([18, 36, 54, 72, 90, 108]);
    const ms = roundDp(kmh / 3.6, 1);
    const isUp = Math.random() < 0.5;
    if (isUp) return mcDecFixed(`Đổi: ${kmh}km/h = ? m/s`, ms, 5, 1);
    return mcNumeric(`Đổi: ${fmtVN(ms)}m/s = ? km/h`, kmh, 10);
  };
}

// ================= FACTORY: Thong ke, xac suat (T30-T31, T35) =================

function docBangSoLieu(): Gen {
  return () => {
    const names = ["Lớp 5A", "Lớp 5B", "Lớp 5C", "Lớp 5D"];
    const chosen = shuffleArr(names).slice(0, 4);
    const vals = chosen.map(() => rnd(20, 45));
    const rows = chosen.map((n, i) => `${n}: ${vals[i]} học sinh`).join(", ");
    const kind = pick(["max", "min", "tong"]);
    if (kind === "max") { const m = Math.max(...vals); return mcFixed(`Số liệu học sinh các lớp — ${rows}. Lớp nào có nhiều học sinh nhất?`, chosen[vals.indexOf(m)], chosen.filter((_, i) => vals[i] !== m)); }
    if (kind === "min") { const m = Math.min(...vals); return mcFixed(`Số liệu học sinh các lớp — ${rows}. Lớp nào có ít học sinh nhất?`, chosen[vals.indexOf(m)], chosen.filter((_, i) => vals[i] !== m)); }
    const tong = vals.reduce((a, b) => a + b, 0);
    return mcNumeric(`Số liệu học sinh các lớp — ${rows}. Tổng số học sinh cả 4 lớp là bao nhiêu?`, tong, 6);
  };
}
function timGiaTriPhanTramBieuDoQuat(): Gen {
  return () => {
    const names = ["Bóng đá", "Cầu lông", "Bơi lội", "Cờ vua"];
    const percents = [40, 30, 20, 10];
    const idx = rnd(0, 3);
    const total = pick([100, 200, 400, 500]);
    const value = (total * percents[idx]) / 100;
    return mcNumeric(`Biểu đồ quạt tỉ lệ % học sinh chọn môn thể thao: ${names[0]} ${percents[0]}%, ${names[1]} ${percents[1]}%, ${names[2]} ${percents[2]}%, ${names[3]} ${percents[3]}%. Tổng ${total} học sinh, số học sinh chọn ${names[idx]} là bao nhiêu?`, value, Math.max(3, Math.round(value * 0.15)));
  };
}
function tiSoLanLapLai(): Gen {
  return () => {
    const total = rnd(15, 30);
    const count = rnd(3, total - 3);
    return mcFracFixed(`Gieo 1 con xúc xắc ${total} lần, mặt 6 chấm xuất hiện ${count} lần. Viết tỉ số của số lần xuất hiện mặt 6 chấm so với tổng số lần gieo:`, { n: count, d: total }, [{ n: total - count, d: total }, { n: count, d: total - count }, { n: count + 1, d: total }]);
  };
}
function khaNangXayRa(): Gen {
  return () => {
    const kind = pick(["chacchan", "cothe", "khongthe"]);
    const xanh = rnd(2, 5), do_ = rnd(1, 4);
    if (kind === "chacchan") return mcFixed(`Hộp có ${xanh} bóng xanh và ${do_} bóng đỏ (không có màu khác). Lấy ra 1 quả. Phát biểu nào ĐÚNG?`, "Chắc chắn lấy được bóng xanh hoặc bóng đỏ", ["Chắc chắn lấy được bóng xanh", "Chắc chắn lấy được bóng đỏ", "Không thể lấy được quả nào"]);
    if (kind === "cothe") return mcFixed(`Hộp có ${xanh} bóng xanh và ${do_} bóng đỏ, lấy ra 1 quả bất kì. Sự kiện nào CÓ THỂ xảy ra?`, "Lấy được bóng xanh", ["Lấy được bóng vàng", "Lấy được cả 2 màu cùng lúc", "Không lấy được quả nào"]);
    return mcFixed(`Hộp chỉ có ${xanh} bóng xanh và ${do_} bóng đỏ. Lấy ra 1 quả. Sự kiện nào KHÔNG THỂ xảy ra?`, "Lấy được bóng vàng", ["Lấy được bóng xanh", "Lấy được bóng đỏ", "Lấy được 1 quả bất kì trong hộp"]);
  };
}

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
