// Builtin Toán Lớp 4 — hàm trợ giúp + factory (phần A). Tách từ builtins-grade4.ts, dời nguyên văn (mục 93 Đợt 4a).
// Danh sách mẫu GRADE4_BUILTIN_TEMPLATES nằm ở builtins-grade4.ts.
import type { RawGenerated } from "./types";
// ---- het tieu de tach file (muc 93 Dot 4a) ----

// ---------- Helpers thuần (port từ lop4_logic.js) ----------
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
    if (!seen.has(d)) {
      seen.add(d);
      uniq.push(d);
    }
  }
  const options = shuffleArr([correct, ...uniq]);
  return { text, correct_answer: correct, options };
}

type Gen = () => RawGenerated;

// ---------- Đọc số tiếng Việt (mở rộng tới hàng trăm triệu, khác Lớp 1-3) ----------
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
  const n = Math.max(0, Math.min(999999999, Math.round(nIn)));
  if (n === 0) return "không";
  if (n === 100000) return "một trăm nghìn";
  if (n === 1000000) return "một triệu";
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

// ---------- Engine phân số thuần TS (MỚI ở Lớp 4 — chưa có trong hệ thống thật) ----------
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

// ================= FACTORY: số tự nhiên lớn + đo lường =================

function docSoLon(min: number, max: number): Gen {
  return () => {
    const n = rnd(min, max);
    const near = shuffleArr([1, 10, 100, 1000]).slice(0, 3);
    return mcFixed(`Số ${fmtSo(n)} đọc là:`, docSoVN(n), near.map((d) => docSoVN(Math.min(max, Math.max(min, n + (Math.random() < 0.5 ? d : -d))))));
  };
}
function vietSoTuCachDoc(min: number, max: number): Gen {
  return () => {
    const n = rnd(min, max);
    const cau = `"${docSoVN(n)}" viết là số nào?`;
    return mcFixed(cau, fmtSo(n), [fmtSo(n + pick([1, 10, 100])), fmtSo(Math.max(0, n - pick([1, 10, 100]))), fmtSo(n + 1000)]);
  };
}
function soSanhSoLon(min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max), b = rnd(min, max);
    if (a === b) return soSanhSoLon(min, max)();
    return mcFixed(`So sánh: ${fmtSo(a)} và ${fmtSo(b)}. Dấu thích hợp là:`, a > b ? ">" : "<", ["=", a > b ? "<" : ">"]);
  };
}
const HANG_NAMES = ["đơn vị", "chục", "trăm", "nghìn", "chục nghìn", "trăm nghìn", "triệu", "chục triệu", "trăm triệu"];
function hangCuaChuSo(numDigits: number): Gen {
  return () => {
    const min = Math.pow(10, numDigits - 1), max = Math.pow(10, numDigits) - 1;
    const n = rnd(min, max);
    const str = String(n);
    const posFromRight = rnd(0, numDigits - 1);
    const digit = Number(str[str.length - 1 - posFromRight]);
    const hangName = HANG_NAMES[posFromRight];
    return mcNumeric(`Trong số ${fmtSo(n)}, chữ số hàng ${hangName} là:`, digit, 3);
  };
}
function lamTronSo(place: number): Gen {
  const hangNames: Record<number, string> = { 10: "chục", 100: "trăm", 1000: "nghìn", 10000: "chục nghìn", 100000: "trăm nghìn", 1000000: "triệu" };
  return () => {
    const n = rnd(place * 2, place * 900);
    const down = Math.floor(n / place) * place;
    const up = down + place;
    const remainder = n - down;
    const correct = remainder * 2 >= place ? up : down;
    return mcNumericFmt(`Làm tròn số ${fmtSo(n)} đến hàng ${hangNames[place] || place}:`, correct, place);
  };
}
function daySoTuNhien(): Gen {
  return () => {
    const start = rnd(2, 50), step = rnd(2, 15), count = 4;
    const seq = Array.from({ length: count }, (_, i) => start + i * step);
    return mcNumeric(`Dãy số: ${seq.join(", ")}, ... Số tiếp theo trong dãy là:`, start + count * step, step);
  };
}
function soChanLe(): Gen {
  return () => {
    const n = rnd(100, 99999);
    const isChan = n % 2 === 0;
    return mcFixed(`Số ${fmtSo(n)} là số:`, isChan ? "Số chẵn" : "Số lẻ", [isChan ? "Số lẻ" : "Số chẵn", "Vừa chẵn vừa lẻ", "Không xác định được"]);
  };
}
function bieuThucChuaChu(): Gen {
  return () => {
    const a = rnd(10, 90), b = rnd(5, 50);
    const op = pick(["+", "-", "×"]);
    let correct: number, text: string;
    if (op === "+") { correct = a + b; text = `Cho a = ${a}, b = ${b}. Giá trị biểu thức a + b là:`; }
    else if (op === "-") { const big = Math.max(a, b), small = Math.min(a, b); correct = big - small; text = `Cho a = ${big}, b = ${small}. Giá trị biểu thức a − b là:`; }
    else { const bVal = pick([2, 3]); correct = a * bVal; text = `Cho a = ${a}, b = ${bVal}. Giá trị biểu thức a × b là:`; }
    return mcNumeric(text, correct, Math.max(4, Math.round(correct * 0.15)));
  };
}
function baiToanBaBuoc(): Gen {
  return () => {
    const a = rnd(50, 200), b = rnd(20, 100), c = pick([2, 3, 4, 5]);
    const tong = a + b;
    const ban = Math.floor(tong / c);
    const conLai = tong - ban;
    return mcNumeric(`Một trại có ${a} con gà, mua thêm ${b} con nữa, sau đó bán đi 1/${c} tổng số gà. Hỏi trại còn lại bao nhiêu con gà?`, conLai, Math.round(conLai * 0.15) + 5);
  };
}
function soSanhGocSoDo(): Gen {
  return () => {
    const a = rnd(10, 179), b = rnd(10, 179);
    if (a === b) return soSanhGocSoDo()();
    const bigger = Math.max(a, b);
    return mcFixed(`Góc nào lớn hơn: góc ${a}° hay góc ${b}°?`, `Góc ${bigger}°`, [`Góc ${Math.min(a, b)}°`, `Hai góc bằng nhau`, `Không so sánh được`]);
  };
}
function phanLoaiGoc(): Gen {
  return () => {
    const kind = pick(["nhon", "vuong", "tu", "bet"]);
    let deg: number;
    if (kind === "nhon") deg = rnd(10, 89);
    else if (kind === "vuong") deg = 90;
    else if (kind === "tu") deg = rnd(91, 179);
    else deg = 180;
    const label = kind === "nhon" ? "Góc nhọn" : kind === "vuong" ? "Góc vuông" : kind === "tu" ? "Góc tù" : "Góc bẹt";
    const allLabels = ["Góc nhọn", "Góc vuông", "Góc tù", "Góc bẹt"];
    return mcFixed(`Góc có số đo ${deg}° là:`, label, allLabels.filter((l) => l !== label));
  };
}
function donViKhoiLuongLon(): Gen {
  return () => {
    const units = [{ name: "yến", kg: 10 }, { name: "tạ", kg: 100 }, { name: "tấn", kg: 1000 }];
    const kind = pick(["doi_don_vi", "tinh_tong"]);
    if (kind === "doi_don_vi") {
      const u = pick(units);
      const soLuong = rnd(2, 9);
      return mcNumeric(`${soLuong} ${u.name} = ? kg`, soLuong * u.kg, u.kg);
    }
    const u1 = pick(units);
    const u2 = pick(units.filter((x) => x !== u1));
    const a = rnd(1, 8), b = rnd(1, 8);
    const totalKg = a * u1.kg + b * u2.kg;
    return mcNumeric(`Tính: ${a} ${u1.name} + ${b} ${u2.name} = ? kg`, totalKg, Math.round(totalKg * 0.1) + 20);
  };
}
function donViDienTich(): Gen {
  return () => {
    const chain = [{ name: "mm²", factor: 1 }, { name: "cm²", factor: 100 }, { name: "dm²", factor: 10000 }, { name: "m²", factor: 1000000 }];
    const i = rnd(0, chain.length - 2);
    const from = chain[i], to = chain[i + 1];
    const soLuong = rnd(2, 9);
    const isUp = Math.random() < 0.5;
    if (isUp) return mcNumeric(`${soLuong} ${to.name} = ? ${from.name}`, soLuong * (to.factor / from.factor), to.factor / from.factor);
    const big = soLuong * (to.factor / from.factor);
    return mcNumeric(`${fmtSo(big)} ${from.name} = ? ${to.name}`, soLuong, 3);
  };
}
function donViThoiGian(): Gen {
  return () => {
    const kind = pick(["phut_giay", "the_ki"]);
    if (kind === "phut_giay") {
      const isUp = Math.random() < 0.5;
      const soPhut = rnd(1, 9);
      if (isUp) return mcNumeric(`${soPhut} phút = ? giây`, soPhut * 60, 30);
      return mcNumeric(`${soPhut * 60} giây = ? phút`, soPhut, 2);
    }
    const nam = rnd(1, 20) * 100 - rnd(0, 99);
    const theKi = Math.ceil(nam / 100);
    return mcNumeric(`Năm ${nam} thuộc thế kỉ thứ mấy?`, theKi, 2);
  };
}
function congTruSoLon(ceiling: number): Gen {
  return () => {
    const op = pick(["+", "-"]);
    if (op === "+") {
      const a = rnd(Math.floor(ceiling * 0.2), Math.floor(ceiling * 0.6));
      const b = rnd(1000, ceiling - a - 1);
      return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} + ${fmtSo(b)} = ?`, a + b, Math.round((a + b) * 0.05) + 100);
    }
    const a = rnd(Math.floor(ceiling * 0.4), ceiling);
    const b = rnd(1000, a - 1);
    return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} − ${fmtSo(b)} = ?`, a - b, Math.round(a * 0.05) + 100);
  };
}
function tinhChatPhepTinh(kinds: string[]): Gen {
  return () => {
    const kind = pick(kinds);
    const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9);
    if (kind === "giao_hoan_cong") return mcFixed(`Theo tính chất giao hoán của phép cộng, ${a} + ${b} = ?`, `${b} + ${a}`, [`${a} - ${b}`, `${a} × ${b}`, `${b} - ${a}`]);
    if (kind === "ket_hop_cong") return mcFixed(`Theo tính chất kết hợp, (${a} + ${b}) + ${c} = ?`, `${a} + (${b} + ${c})`, [`${a} + (${b} × ${c})`, `(${a} × ${b}) + ${c}`, `${a} - (${b} + ${c})`]);
    if (kind === "giao_hoan_nhan") return mcFixed(`Theo tính chất giao hoán của phép nhân, ${a} × ${b} = ?`, `${b} × ${a}`, [`${a} + ${b}`, `${a} : ${b}`, `${b} + ${a}`]);
    if (kind === "ket_hop_nhan") return mcFixed(`Theo tính chất kết hợp, (${a} × ${b}) × ${c} = ?`, `${a} × (${b} × ${c})`, [`${a} × (${b} + ${c})`, `(${a} + ${b}) × ${c}`, `${a} : (${b} × ${c})`]);
    if (kind === "phan_phoi") return mcFixed(`Theo tính chất phân phối, ${a} × (${b} + ${c}) = ?`, `${a} × ${b} + ${a} × ${c}`, [`${a} × ${b} × ${c}`, `${a} + ${b} × ${c}`, `${a} × ${b} - ${a} × ${c}`]);
    const big = b + c, small = c;
    return mcFixed(`Theo tính chất phân phối, ${a} × (${big} − ${small}) = ?`, `${a} × ${big} − ${a} × ${small}`, [`${a} × ${big} × ${small}`, `${a} × ${big} + ${a} × ${small}`, `${a} - ${big} × ${small}`]);
  };
}
function timHaiSoBietTongHieu(): Gen {
  return () => {
    const soBe = rnd(50, 500), hieu = rnd(10, 200);
    const soLon = soBe + hieu, tong = soBe + soLon;
    const askLon = Math.random() < 0.5;
    return mcNumeric(`Tổng của 2 số là ${tong}, hiệu của 2 số là ${hieu}. Tìm số ${askLon ? "lớn" : "bé"}.`, askLon ? soLon : soBe, 8);
  };
}
const SHAPE_LETTER_SETS = [["A", "B", "C", "D"], ["M", "N", "P", "Q"], ["E", "F", "G", "H"], ["W", "X", "Y", "Z"]];
function duongThangVuongGoc(): Gen {
  // Có 3 nhánh để tránh lặp 1 câu duy nhất (bản đầu chỉ có 1 phát biểu tĩnh, gây
  // 12 câu giống hệt nhau trong 1 tuần — phát hiện khi sinh thử rows Phase 3).
  return () => {
    const kind = pick(["concept", "split_angle", "labeled_shape"]);
    if (kind === "concept") {
      return mcFixed(`Hai đường thẳng vuông góc với nhau tạo thành góc vuông có số đo là:`, "90°", ["180°", "45°", "60°"]);
    }
    if (kind === "split_angle") {
      const x = rnd(10, 80);
      return mcNumeric(`Một góc vuông được chia thành 2 góc nhỏ bởi 1 tia. Một góc nhỏ là ${x}°. Góc nhỏ còn lại là bao nhiêu độ?`, 90 - x, 8);
    }
    const [a, b, c, d] = pick(SHAPE_LETTER_SETS);
    return mcFixed(`Trong hình chữ nhật ${a}${b}${c}${d}, cạnh ${a}${b} vuông góc với cạnh nào?`, `${b}${c}`, [`${c}${d}`, `${d}${a}`, `${a}${c}`]);
  };
}
function duongThangSongSong(): Gen {
  return () => {
    const kind = pick(["concept", "labeled_shape"]);
    if (kind === "concept") {
      return mcFixed(`Hai đường thẳng song song với nhau thì:`, "Không bao giờ cắt nhau", ["Luôn cắt nhau tại 1 điểm", "Trùng nhau hoàn toàn", "Vuông góc với nhau"]);
    }
    const [a, b, c, d] = pick(SHAPE_LETTER_SETS);
    const askFirst = Math.random() < 0.5;
    const side = askFirst ? `${a}${b}` : `${b}${c}`;
    const correct = askFirst ? `${c}${d}` : `${d}${a}`;
    const wrongSides = askFirst ? [`${b}${c}`, `${d}${a}`, `${a}${c}`] : [`${a}${b}`, `${c}${d}`, `${b}${d}`];
    return mcFixed(`Trong hình chữ nhật ${a}${b}${c}${d}, cạnh ${side} song song với cạnh nào?`, correct, wrongSides);
  };
}
function chuViHinhBinhHanh(): Gen {
  return () => {
    const a = rnd(5, 20), b = rnd(3, 15);
    return mcNumeric(`Hình bình hành có 2 cạnh liên tiếp dài ${a} cm và ${b} cm. Chu vi hình đó là:`, 2 * (a + b), 6);
  };
}
function chuViHinhThoi(): Gen {
  return () => {
    const a = rnd(3, 20);
    return mcNumeric(`Hình thoi có cạnh dài ${a} cm. Chu vi hình đó là:`, a * 4, 6);
  };
}

// ---- het phan chuyen nguyen van (muc 93 Dot 4a) ----
export {
  gcd, pick, shuffleArr, rnd, mcNumeric, fmtSo, mcNumericFmt, mcFixed, simplifyFrac, fracAdd,
  fracSub, fracMul, fracDiv, mcFracFixed, docSoLon, vietSoTuCachDoc, soSanhSoLon, hangCuaChuSo,
  lamTronSo, daySoTuNhien, soChanLe, bieuThucChuaChu, baiToanBaBuoc, soSanhGocSoDo, phanLoaiGoc,
  donViKhoiLuongLon, donViDienTich, donViThoiGian, congTruSoLon, tinhChatPhepTinh,
  timHaiSoBietTongHieu, duongThangVuongGoc, duongThangSongSong, chuViHinhBinhHanh,
  chuViHinhThoi, type Gen, type Frac,
};
