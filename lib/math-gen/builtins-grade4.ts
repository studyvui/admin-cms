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
import type { MathTemplate, RawGenerated } from "./types";

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

// ================= FACTORY: HK2 - nhân/chia lớn + thống kê =================

function nhanSoLonCho1CS(digits: 4 | 5 | 6): Gen {
  const range = digits === 4 ? [1000, 9999] : digits === 5 ? [10000, 99999] : [100000, 999999];
  return () => {
    const a = rnd(range[0], range[1]), b = rnd(2, 9);
    return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} × ${b} = ?`, a * b, Math.round(a * b * 0.1) + 50);
  };
}
function chiaSoLonCho1CS(digits: 4 | 5 | 6): Gen {
  const range = digits === 4 ? [1000, 9999] : digits === 5 ? [10000, 99999] : [100000, 999999];
  return () => {
    const b = rnd(2, 9);
    const qMin = Math.ceil(range[0] / b), qMax = Math.floor(range[1] / b);
    const q = rnd(qMin, qMax);
    const a = q * b;
    return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} : ${b} = ?`, q, Math.round(q * 0.1) + 50);
  };
}
function nhanChiaNham101001000(): Gen {
  return () => {
    const unit = pick([10, 100, 1000]);
    const isNhan = Math.random() < 0.5;
    const a = rnd(2, 900);
    if (isNhan) return mcNumericFmt(`Tính nhẩm: ${a} × ${unit} = ?`, a * unit, unit);
    return mcNumericFmt(`Tính nhẩm: ${fmtSo(a * unit)} : ${unit} = ?`, a, 5);
  };
}
function nhanVoiSoCoHaiCS(): Gen {
  return () => {
    const a = rnd(101, 999), b = rnd(11, 99);
    return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} × ${b} = ?`, a * b, Math.round(a * b * 0.1) + 50);
  };
}
function chiaChoSoCoHaiCS(): Gen {
  return () => {
    const b = rnd(11, 99), q = rnd(11, 90);
    const a = b * q;
    return mcNumericFmt(`Đặt tính rồi tính: ${fmtSo(a)} : ${b} = ?`, q, 5);
  };
}
function genEstimateCheck(): Gen {
  return () => {
    const a = rnd(180, 950), b = rnd(180, 950);
    const op = pick(["+", "-"]);
    const real = op === "+" ? a + b : Math.max(a, b) - Math.min(a, b);
    const x = op === "+" ? a : Math.max(a, b);
    const y = op === "+" ? b : Math.min(a, b);
    const claimCorrect = Math.random() < 0.5;
    const claimed = claimCorrect ? real : real + pick([-1, 1]) * rnd(80, 200);
    const text = `Làm tròn để ước lượng nhanh: ${x} ${op} ${y} ≈ ${fmtSo(claimed)}. Ước lượng này:`;
    return mcFixed(text, claimCorrect ? "Hợp lý (gần đúng)" : "Không hợp lý", [claimCorrect ? "Không hợp lý" : "Hợp lý (gần đúng)", "Không thể xác định", "Cả hai đều đúng"]);
  };
}
function timTrungBinhCong(): Gen {
  return () => {
    const count = rnd(3, 5);
    const vals = Array.from({ length: count }, () => rnd(10, 90));
    const tong = vals.reduce((a, b) => a + b, 0);
    const avgApprox = Math.round(tong / count);
    vals[count - 1] += avgApprox * count - tong;
    const tong2 = vals.reduce((a, b) => a + b, 0);
    return mcNumeric(`Tìm số trung bình cộng của các số: ${vals.join(", ")}.`, tong2 / count, 4);
  };
}
function genUnitRateForward(): Gen {
  return () => {
    const n1 = rnd(2, 6), donGia = rnd(1000, 9000);
    const n2 = rnd(n1 + 1, n1 + 10);
    return mcNumericFmt(`Mua ${n1} quyển vở hết ${fmtSo(n1 * donGia)}đ (giá như nhau). Hỏi mua ${n2} quyển vở như thế hết bao nhiêu tiền?`, n2 * donGia, Math.round(n2 * donGia * 0.1) + 2000);
  };
}
function genUnitRateReverse(): Gen {
  return () => {
    const n1 = rnd(2, 6), donGia = rnd(1000, 9000);
    const k = rnd(2, 8);
    return mcNumeric(`Mua ${n1} quyển vở hết ${fmtSo(n1 * donGia)}đ (giá như nhau). Có ${fmtSo(donGia * k)}đ thì mua được bao nhiêu quyển vở như thế?`, k, 3);
  };
}
function genDataSequence(): Gen {
  return () => {
    const names = ["Lớp 4A", "Lớp 4B", "Lớp 4C", "Lớp 4D"];
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
function genEventFrequency(): Gen {
  return () => {
    const n = rnd(8, 20);
    const faces = ["Xanh", "Đỏ", "Vàng"];
    const seq = Array.from({ length: n }, () => pick(faces));
    const target = pick(faces);
    const count = seq.filter((x) => x === target).length;
    return mcNumeric(`Gieo 1 con quay màu ${n} lần, kết quả lần lượt là: ${seq.join(", ")}. Màu ${target} xuất hiện bao nhiêu lần?`, count, 3);
  };
}

// ================= FACTORY: PHÂN SỐ (MỚI HOÀN TOÀN ở Lớp 4) =================

function genFractionConcept(): Gen {
  return () => {
    const d = rnd(2, 12), n = rnd(1, d - 1);
    const kind = pick(["tu", "mau", "docsang"]);
    if (kind === "tu") return mcNumeric(`Phân số ${n}/${d} có tử số là:`, n, 3);
    if (kind === "mau") return mcNumeric(`Phân số ${n}/${d} có mẫu số là:`, d, 3);
    return mcFracFixed(`"${n} phần ${d}" viết dưới dạng phân số là:`, { n, d }, [{ n: d, d: n }, { n: n + 1, d }, { n, d: d + 1 }]);
  };
}
function genFractionEqualsDiv(): Gen {
  return () => {
    const kind = pick(["chia_thanh_phanso", "so_tu_nhien_thanh_phanso"]);
    if (kind === "chia_thanh_phanso") {
      const a = rnd(1, 20), b = rnd(2, 9);
      return mcFracFixed(`Phép chia ${a} : ${b} viết dưới dạng phân số là:`, { n: a, d: b }, [{ n: b, d: a }, { n: a + 1, d: b }, { n: a, d: b + 1 }]);
    }
    const n = rnd(2, 20);
    return mcFracFixed(`Số tự nhiên ${n} viết dưới dạng phân số có mẫu số là 1 là:`, { n, d: 1 }, [{ n, d: n }, { n: 1, d: n }, { n: n + 1, d: 1 }]);
  };
}
function genFractionBasicProperty(): Gen {
  return () => {
    const n = rnd(1, 8), d = rnd(n + 1, 12), k = rnd(2, 5);
    return mcFracFixed(`Theo tính chất cơ bản của phân số, nhân cả tử số và mẫu số của ${n}/${d} với ${k} ta được phân số:`, { n: n * k, d: d * k }, [{ n: n * k, d }, { n, d: d * k }, { n: n + k, d: d + k }]);
  };
}
function genFractionSimplify(): Gen {
  return () => {
    const k = rnd(2, 6);
    const nBase = rnd(1, 9), dBase = rnd(nBase + 1, 12);
    const g = gcd(nBase, dBase);
    const n0 = nBase / g, d0 = dBase / g;
    const n = n0 * k, d = d0 * k;
    return mcFracFixed(`Rút gọn phân số ${n}/${d} về phân số tối giản:`, { n: n0, d: d0 }, [{ n: n0 + 1, d: d0 }, { n: n0, d: d0 + 1 }, { n, d }]);
  };
}
function genFractionCommonDenom(): Gen {
  return () => {
    const d1 = rnd(2, 6), k = rnd(2, 4);
    const d2 = d1 * k;
    return mcNumeric(`Quy đồng mẫu số 2 phân số có mẫu là ${d1} và ${d2} (${d2} chia hết cho ${d1}). Mẫu số chung nên chọn là:`, d2, 3);
  };
}
function genFractionCompare(): Gen {
  return () => {
    const kind = pick(["cungmau", "cungtu", "so_voi_1"]);
    if (kind === "cungmau") {
      const d = rnd(3, 12);
      let n1 = rnd(1, d - 1), n2 = rnd(1, d - 1);
      if (n1 === n2) n2 = n2 === d - 1 ? n2 - 1 : n2 + 1;
      return mcFixed(`So sánh 2 phân số ${n1}/${d} và ${n2}/${d}. Dấu thích hợp là:`, n1 > n2 ? ">" : "<", ["=", n1 > n2 ? "<" : ">"]);
    }
    if (kind === "cungtu") {
      const n = rnd(2, 8);
      let d1 = rnd(n + 1, 12), d2 = rnd(n + 1, 12);
      if (d1 === d2) d2 = d2 === 12 ? d2 - 1 : d2 + 1;
      return mcFixed(`So sánh 2 phân số ${n}/${d1} và ${n}/${d2}. Dấu thích hợp là:`, d1 < d2 ? ">" : "<", ["=", d1 < d2 ? "<" : ">"]);
    }
    const isLess = Math.random() < 0.5;
    const d = rnd(2, 10);
    const n = isLess ? rnd(1, d - 1) : rnd(d + 1, d + 6);
    return mcFixed(`So sánh phân số ${n}/${d} với 1. Dấu thích hợp là:`, isLess ? "<" : ">", ["=", isLess ? ">" : "<"]);
  };
}
function genFractionAddSub(isAdd: boolean): Gen {
  const self: Gen = () => {
    const kind = pick(["cungmau", "khacmau", "voi_so_tu_nhien"]);
    if (kind === "cungmau") {
      const d = rnd(3, 10);
      const n1 = rnd(1, d - 1);
      const n2 = isAdd ? rnd(1, d - 1) : rnd(1, n1);
      const raw = isAdd ? { n: n1 + n2, d } : { n: n1 - n2, d };
      const result = simplifyFrac(raw);
      const op = isAdd ? "+" : "−";
      return mcFracFixed(`Tính: ${n1}/${d} ${op} ${n2}/${d} = ?`, result, [{ n: raw.n, d: d * 2 }, { n: Math.abs(n1 - n2) + 1, d }, { n: n1, d: d + n2 }]);
    }
    if (kind === "khacmau") {
      const d1 = rnd(2, 6), d2 = rnd(2, 6);
      if (d1 === d2) return self();
      const n1 = rnd(1, d1 - 1), n2 = rnd(1, d2 - 1);
      const f1: Frac = { n: n1, d: d1 }, f2: Frac = { n: n2, d: d2 };
      const raw = isAdd ? fracAdd(f1, f2) : fracSub(f1, f2);
      if (!isAdd && raw.n < 0) return self();
      const result = simplifyFrac(raw);
      const op = isAdd ? "+" : "−";
      return mcFracFixed(`Tính: ${n1}/${d1} ${op} ${n2}/${d2} = ?`, result, [simplifyFrac({ n: raw.n + 1, d: raw.d }), { n: raw.n, d: raw.d }, { n: n1, d: d1 }]);
    }
    const whole = rnd(1, 5), d = rnd(2, 8), n = rnd(1, d - 1);
    if (isAdd) {
      const result: Frac = { n: whole * d + n, d };
      return mcFracFixed(`Tính: ${whole} + ${n}/${d} = ?`, result, [{ n: whole * d - n, d }, { n: whole + n, d }, { n: whole * d + n + 1, d }]);
    }
    const result: Frac = { n: whole * d - n, d };
    return mcFracFixed(`Tính: ${whole} − ${n}/${d} = ?`, result, [{ n: whole * d + n, d }, { n: Math.max(0, whole - n), d }, { n: whole * d - n - 1, d }]);
  };
  return self;
}
function genFractionMulDiv(isMul: boolean): Gen {
  return () => {
    const kind = pick(["hai_phanso", "voi_so_tu_nhien"]);
    if (kind === "hai_phanso") {
      const n1 = rnd(1, 8), d1 = rnd(2, 9), n2 = rnd(1, 8), d2 = rnd(2, 9);
      const f1: Frac = { n: n1, d: d1 }, f2: Frac = { n: n2, d: d2 };
      const raw = isMul ? fracMul(f1, f2) : fracDiv(f1, f2);
      const result = simplifyFrac(raw);
      const op = isMul ? "×" : ":";
      return mcFracFixed(`Tính: ${n1}/${d1} ${op} ${n2}/${d2} = ?`, result, [simplifyFrac({ n: raw.n + 1, d: raw.d }), { n: raw.n, d: raw.d }, { n: n1, d: d1 }]);
    }
    const whole = rnd(2, 9), n = rnd(1, 8), d = rnd(2, 9);
    if (isMul) {
      const result = simplifyFrac({ n: whole * n, d });
      return mcFracFixed(`Tính: ${whole} × ${n}/${d} = ?`, result, [{ n: whole * n, d: d * whole }, simplifyFrac({ n: whole * n + 1, d }), { n, d }]);
    }
    const result = simplifyFrac({ n: whole * d, d: n });
    return mcFracFixed(`Tính: ${whole} : ${n}/${d} = ?`, result, [simplifyFrac({ n: whole * n, d }), { n: whole, d: n * d }, simplifyFrac({ n: whole * d + 1, d: n })]);
  };
}
function genFractionOfNumber(): Gen {
  return () => {
    const d = pick([2, 3, 4, 5, 6, 8, 10]);
    const n = rnd(1, d - 1);
    const kQ = rnd(2, 12);
    const total = d * kQ;
    const result = n * kQ;
    const item = pick(["quả cam", "học sinh", "trang sách", "cái kẹo", "con gà"]);
    return mcNumeric(`Một rổ có ${total} ${item}. Hỏi ${n}/${d} số ${item} đó là bao nhiêu ${item}?`, result, Math.max(3, Math.round(result * 0.2)));
  };
}

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
