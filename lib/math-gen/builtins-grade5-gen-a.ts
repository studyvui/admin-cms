// Builtin Toán Lớp 5 — hàm trợ giúp + factory (phần A). Tách từ builtins-grade5.ts, dời nguyên văn (mục 93 Đợt 4a).
// Danh sách mẫu GRADE5_BUILTIN_TEMPLATES nằm ở builtins-grade5.ts.
import type { RawGenerated } from "./types";
// ---- het tieu de tach file (muc 93 Dot 4a) ----

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

// ---- het phan chuyen nguyen van (muc 93 Dot 4a) ----
export {
  gcd, shuffleArr, rnd, pick, mcNumeric, fmtSo, mcFixed, roundDp, fmtVN, mcDecFixed,
  mcFracFixed, soSanhSoLon, congTruSoLon, rutGonPhanSo, nhanDienPhanSoThapPhan,
  vietPhanSoThanhPSTP, phepTinhPhanSo, congTruPhanSoKhacMau, honSoDoiPhanSo,
  doiDonViKhoiLuongLon, docVietSTPCoBan, soSanhSTP, vietSoDoDuoiDangSTP,
  vietSoDoDienTichDuoiDangSTP, lamTronSTP, doiDonViDienTichLon, congSTP, truSTP, tinhChatSTP,
  nhanSTP, chiaSTP, nhanChiaSTPVoi101001000, type Gen,
};
