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
import type { MathTemplate, RawGenerated } from "./types";

// ---------- Helpers thuần (port từ lop2_logic.js) ----------
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
function numericDistractors(correct: number, count: number, spread?: number): number[] {
  const sp = spread || Math.max(3, Math.abs(correct) * 0.3 + 2);
  const set = new Set<number>([correct]);
  let tries = 0;
  while (set.size < count + 1 && tries < 300) {
    tries++;
    const d = correct + Math.round((Math.random() * 2 - 1) * sp);
    if (d >= 0 && !set.has(d)) set.add(d);
  }
  let pad = 1;
  while (set.size < count + 1 && pad < 2000) {
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

// ================================================================
// Factory nhóm HK1 (số đến 100, cộng trừ có/không nhớ)
// ================================================================
function decompose100(min: number, max: number): Gen {
  return () => {
    const chuc = rnd(Math.max(1, Math.floor(min / 10)), Math.floor(max / 10));
    const dv = rnd(0, 9);
    const n = chuc * 10 + dv;
    return mcFixed(`Số ${n} gồm mấy chục và mấy đơn vị?`, `${chuc} chục ${dv} đơn vị`, [
      `${dv} chục ${chuc} đơn vị`,
      `${chuc} chục ${(dv + 1) % 10} đơn vị`,
      `${(chuc % 9) + 1} chục ${dv} đơn vị`,
      `${chuc} chục ${(dv + 9) % 10} đơn vị`,
      `${(chuc % 9) + 2} chục ${dv} đơn vị`,
    ]);
  };
}
function tachThe3So(): Gen {
  return () => {
    const digits = shuffleArr([rnd(1, 9), rnd(0, 9), rnd(0, 9)]).slice(0, 3);
    const nums = new Set<number>();
    for (const a of digits)
      for (const b of digits)
        if (a !== b || digits.filter((x) => x === a).length > 1) {
          if (a === 0) continue;
          nums.add(a * 10 + b);
        }
    const correct = nums.size;
    return mcNumeric(
      `Từ ba thẻ số ${digits.join(", ")}, ghép hai thẻ được bao nhiêu số có hai chữ số khác nhau?`,
      correct,
      2,
    );
  };
}
function tongHieuThanhPhan(min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max);
    const b = rnd(min, max);
    const isTong = Math.random() < 0.5;
    if (isTong) return mcNumeric(`Tổng của ${a} và ${b} là:`, a + b);
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    return mcNumeric(`Hiệu của ${big} và ${small} là:`, big - small);
  };
}
function tinhCongTru(min: number, max: number, hasNho: boolean): Gen {
  void hasNho;
  return () => {
    const a = rnd(min, max);
    const b = rnd(1, Math.min(max, 20));
    const op = Math.random() < 0.5 ? "+" : "-";
    const x = op === "+" ? a : Math.max(a, b);
    const y = op === "+" ? b : Math.min(a, b);
    const correct = op === "+" ? x + y : x - y;
    return mcNumeric(`Tính: ${x} ${op} ${y} = ?`, correct);
  };
}
function soLienTruocSau(): Gen {
  return () => {
    const n = rnd(2, 98);
    const askSau = Math.random() < 0.5;
    return mcNumeric(`Số liền ${askSau ? "sau" : "trước"} của ${n} là số nào?`, askSau ? n + 1 : n - 1, 2);
  };
}
function daySoLienTiep(min: number, max: number, step = 1): Gen {
  return () => {
    const start = rnd(min, max - step * 4);
    const seq = [start, start + step, start + 2 * step, "?", start + 4 * step];
    return mcNumeric(`Điền số còn thiếu: ${seq.join(", ")}`, start + 3 * step, step + 1);
  };
}
function giaiToanThemBot(min: number, max: number): Gen {
  const contexts: [string, "+" | "-"][] = [
    ["Lọ hoa có {a} bông hoa, cắm thêm {b} bông. Hỏi lọ hoa có tất cả bao nhiêu bông?", "+"],
    ["Trên cành có {a} con chim, có {b} con bay đi. Hỏi trên cành còn lại bao nhiêu con?", "-"],
    ["Có {a} bạn đang chơi, có thêm {b} bạn đến chơi cùng. Hỏi có tất cả bao nhiêu bạn?", "+"],
    ["Đàn vịt có {a} con, đã bán {b} con. Hỏi còn lại bao nhiêu con?", "-"],
  ];
  return () => {
    const [tpl, op] = contexts[rnd(0, contexts.length - 1)];
    const a = rnd(min, max);
    let b = rnd(1, Math.min(20, max));
    if (op === "-" && b > a) b = rnd(1, a);
    const text = tpl.replace("{a}", String(a)).replace("{b}", String(b));
    return mcNumeric(text, op === "+" ? a + b : a - b);
  };
}
function giaiToanHonKem(min: number, max: number): Gen {
  const contexts: [string, "+" | "-"][] = [
    ["{name1} {a} tuổi, {name2} hơn {name1} {b} tuổi. Hỏi {name2} bao nhiêu tuổi?", "+"],
    ["Đội A có {a} người, đội B có ít hơn đội A {b} người. Hỏi đội B có bao nhiêu người?", "-"],
    ["{name1} có {a} viên bi, {name2} có nhiều hơn {name1} {b} viên. Hỏi {name2} có bao nhiêu viên bi?", "+"],
  ];
  const names = ["Mai", "Nam", "Việt", "Mi"];
  return () => {
    const [tpl, op] = contexts[rnd(0, contexts.length - 1)];
    const n1 = names[rnd(0, 3)];
    let n2 = names[rnd(0, 3)];
    while (n2 === n1) n2 = names[rnd(0, 3)];
    const a = rnd(min, max);
    const b = rnd(1, 20);
    const text = tpl.replace("{name1}", n1).replace("{name2}", n2).replace("{a}", String(a)).replace("{b}", String(b));
    return mcNumeric(text, op === "+" ? a + b : a - b);
  };
}
function soSanhBieuThuc(min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max);
    const b = rnd(min, max);
    const c = rnd(min, max);
    const left = a + b;
    const sign = left > c ? ">" : left < c ? "<" : "=";
    return mcFixed(`Điền dấu thích hợp: ${a} + ${b} ... ${c}`, sign, [">", "<", "="].filter((s) => s !== sign));
  };
}
function timChuoiChung3Buoc(min: number, max: number): Gen {
  return () => {
    const start = rnd(min, max);
    const b = rnd(5, 30);
    const c = rnd(5, 20);
    const step1 = start + b;
    const step2 = Math.max(1, step1 - c);
    const d = rnd(5, 15);
    const finalV = step2 + d;
    return mcNumeric(`Cho ${start}, cộng ${b}, trừ ${c}, cộng ${d}. Kết quả cuối cùng là?`, finalV);
  };
}
function noiKetQua(min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max);
    const b = rnd(1, Math.min(20, max));
    const op = Math.random() < 0.5 ? "+" : "-";
    const x = op === "+" ? a : Math.max(a, b);
    const y = op === "+" ? b : Math.min(a, b);
    const correct = op === "+" ? x + y : x - y;
    return mcNumeric(`${x} ${op} ${y} = ?`, correct);
  };
}
function chonPhepTinhKQLonNhat(min: number, max: number): Gen {
  return () => {
    const exprs: { text: string; val: number }[] = [];
    const seenText = new Set<string>();
    let guard = 0;
    while (exprs.length < 4 && guard < 100) {
      guard++;
      const a = rnd(min, max);
      const b = rnd(1, 20);
      const op = Math.random() < 0.5 ? "+" : "-";
      const x = op === "+" ? a : Math.max(a, b);
      const y = op === "+" ? b : Math.min(a, b);
      const text = `${x} ${op} ${y}`;
      if (seenText.has(text)) continue;
      seenText.add(text);
      exprs.push({ text, val: op === "+" ? x + y : x - y });
    }
    const maxVal = Math.max(...exprs.map((e) => e.val));
    const correctExpr = exprs.find((e) => e.val === maxVal)!.text;
    return mcFixed(
      "Phép tính nào dưới đây có kết quả lớn nhất?",
      correctExpr,
      exprs.filter((e) => e.text !== correctExpr).map((e) => e.text),
    );
  };
}
// Random hoa 4 gia tri + chon 1 cap dung ngau nhien lam dap an (truoc day dung
// items/target CO DINH nen chi ra dung 1 cau, khong co bien -> bi trung lap
// het khi sinh hang loat).
function chonToHopTong(unit: string): Gen {
  return () => {
    const n = 4;
    const vals = Array.from({ length: n }, () => rnd(2, 15));
    const i = rnd(0, n - 1);
    let j = rnd(0, n - 1);
    while (j === i) j = rnd(0, n - 1);
    const target = vals[i] + vals[j];
    const correct = `${vals[i]}${unit} và ${vals[j]}${unit}`;
    const allPairs: [number, number][] = [];
    for (let a = 0; a < n; a++)
      for (let b = a + 1; b < n; b++) if (vals[a] + vals[b] !== target) allPairs.push([a, b]);
    const wrongs = shuffleArr(allPairs)
      .slice(0, 3)
      .map(([a, b]) => `${vals[a]}${unit} và ${vals[b]}${unit}`);
    return mcFixed(
      `Có các túi ${vals.map((v) => v + unit).join(", ")}. Chọn hai túi để được ${target}${unit} là:`,
      correct,
      wrongs,
    );
  };
}

// ---------- Cân nặng / dung tích (kg, lít) ----------
function tinhDonVi(unit: string, min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max);
    const b = rnd(1, Math.min(30, max));
    const op = Math.random() < 0.5 ? "+" : "-";
    const x = op === "+" ? a : Math.max(a, b);
    const y = op === "+" ? b : Math.min(a, b);
    const correct = op === "+" ? x + y : x - y;
    return mcNumeric(`Tính: ${x}${unit} ${op} ${y}${unit} = ?`, correct);
  };
}
function soSanhCanNang3Con(): Gen {
  const sets = [
    ["gấu bông", "thỏ bông", "sóc bông"],
    ["mèo", "chó", "thỏ"],
    ["dưa hấu", "bưởi", "cam"],
  ];
  return () => {
    const names = sets[rnd(0, sets.length - 1)];
    const vals = shuffleArr([rnd(2, 10), rnd(2, 10), rnd(2, 10)]);
    const maxIdx = vals.indexOf(Math.max(...vals));
    return mcFixed(
      `${names[0]} nặng ${vals[0]}kg, ${names[1]} nặng ${vals[1]}kg, ${names[2]} nặng ${vals[2]}kg. Con nào nặng nhất?`,
      names[maxIdx],
      names.filter((_, i) => i !== maxIdx),
    );
  };
}
function giaiToanDonVi(unit: string): Gen {
  const label = unit === "kg" ? "cân nặng" : "chứa";
  return () => {
    const a = rnd(10, 60);
    const b = rnd(2, 20);
    const isHon = Math.random() < 0.5;
    const text = `Vật A ${label} ${a}${unit}, vật B ${isHon ? "nặng hơn" : "nhẹ hơn"} vật A ${b}${unit}. Hỏi vật B ${label} bao nhiêu ${unit}?`;
    return mcNumeric(text, isHon ? a + b : a - b);
  };
}

// ---------- Hình phẳng / độ dài ----------
// Nhieu bien the (shapeName,count) — tranh 1 template chi ra dung 1 cau (khong
// co bien so ngau nhien) khien batch sinh hang loat bi trung lap va bi loai.
function demDoanThang(pool: [string, number][]): Gen {
  return () => {
    const [shapeName, count] = pool[rnd(0, pool.length - 1)];
    return mcNumeric(`${shapeName} có mấy đoạn thẳng?`, count, 1);
  };
}
function doDaiGapKhuc(segCount: number): Gen {
  return () => {
    const parts = Array.from({ length: segCount }, () => rnd(3, 40));
    const total = parts.reduce((s, v) => s + v, 0);
    return mcNumeric(
      `Đường gấp khúc gồm ${parts.length} đoạn: ${parts.map((p) => p + "cm").join(", ")}. Độ dài đường gấp khúc là?`,
      total,
    );
  };
}
function soSanh2DuongDi(): Gen {
  return () => {
    const a1 = rnd(10, 40);
    const a2 = rnd(10, 40);
    const b1 = rnd(10, 40);
    const b2 = rnd(10, 40);
    const b3 = rnd(10, 30);
    const sumA = a1 + a2;
    const sumB = b1 + b2 + b3;
    const shorter = sumA < sumB ? "Đường A" : "Đường B";
    return mcFixed(
      `Đường A gồm 2 đoạn ${a1}cm, ${a2}cm (tổng ${sumA}cm). Đường B gồm 3 đoạn ${b1}cm, ${b2}cm, ${b3}cm (tổng ${sumB}cm). Đường nào ngắn hơn?`,
      shorter,
      [shorter === "Đường A" ? "Đường B" : "Đường A", "Bằng nhau"],
    );
  };
}

// ---------- Xem giờ / lịch ----------
const WEEKDAYS = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"];
function suyLuanThu(): Gen {
  return () => {
    const idx = rnd(0, 6);
    const mode = rnd(0, 2);
    let text: string;
    let correctIdx: number;
    if (mode === 0) {
      text = `Hôm nay là ${WEEKDAYS[idx]}. Ngày mai là thứ mấy?`;
      correctIdx = (idx + 1) % 7;
    } else if (mode === 1) {
      text = `Hôm nay là ${WEEKDAYS[idx]}. Hôm qua là thứ mấy?`;
      correctIdx = (idx + 6) % 7;
    } else {
      const days = rnd(2, 4);
      text = `Nếu hôm nay là ${WEEKDAYS[idx]} thì sau ${days} ngày nữa là thứ mấy?`;
      correctIdx = (idx + days) % 7;
    }
    const correct = WEEKDAYS[correctIdx];
    const wrongs = shuffleArr(WEEKDAYS.filter((w) => w !== correct)).slice(0, 3);
    return mcFixed(text, correct, wrongs);
  };
}
function doiGio12h24h(): Gen {
  return () => {
    const h = rnd(1, 11);
    const isPM = Math.random() < 0.5;
    const h24 = isPM ? h + 12 : h;
    const buoi = isPM ? (h + 12 >= 18 ? "tối" : "chiều") : "sáng";
    const wrongs = numericDistractors(h24, 3, 3)
      .filter((v) => v !== h24)
      .map((v) => `${String(((v % 24) + 24) % 24).padStart(2, "0")}:00`);
    return mcFixed(
      `Một bạn đi học lúc ${h} giờ ${buoi}. Đồng hồ điện tử nào chỉ đúng giờ đó?`,
      `${String(h24).padStart(2, "0")}:00`,
      wrongs,
    );
  };
}
function soGioMuonSom(): Gen {
  return () => {
    const start = rnd(7, 9) * 60;
    const names = ["Thỏ", "Rùa", "Sóc"];
    const offsets = shuffleArr([-15, 0, 15]);
    const times = names.map((n, i) => ({ name: n, t: start + offsets[i] }));
    const late = times.find((t) => t.t > start)!;
    return mcFixed(
      `Giờ vào học là ${Math.floor(start / 60)} giờ ${start % 60 === 0 ? "" : start % 60 + " phút"}. ${times
        .map((t) => `${t.name} đến lúc ${Math.floor(t.t / 60)} giờ ${t.t % 60} phút`)
        .join("; ")}. Ai đến muộn?`,
      late.name,
      names.filter((n) => n !== late.name),
    );
  };
}
function docLich(): Gen {
  const months31 = [1, 3, 5, 7, 8, 10, 12];
  return () => {
    const month = rnd(1, 12);
    const days = months31.includes(month) ? 31 : month === 2 ? 28 : 30;
    return mcNumeric(`Tháng ${month} có bao nhiêu ngày?`, days, 3);
  };
}

// ---------- Xác suất (mới, HK2) ----------
function xacSuatBong(): Gen {
  const c1 = "xanh";
  const c2 = "đỏ";
  return () => {
    const n1 = rnd(2, 5);
    const n2 = rnd(0, 3);
    let text: string;
    let correct: string;
    const mode = rnd(0, 2);
    if (n2 === 0) {
      text = `Hộp có ${n1} quả bóng màu ${c1}, không có bóng màu ${c2}. Lấy ra 1 quả, khả năng lấy được bóng màu ${c2} là:`;
      correct = "Không thể";
    } else if (mode === 0) {
      text = `Hộp có ${n1} quả bóng màu ${c1} và ${n2} quả bóng màu ${c2}. Lấy ra 1 quả, khả năng lấy được bóng màu ${c1} là:`;
      correct = "Có thể";
    } else {
      text = `Hộp chỉ có ${n1} quả bóng màu ${c1}. Lấy ra 1 quả, khả năng lấy được bóng màu ${c1} là:`;
      correct = "Chắc chắn";
    }
    return mcFixed(text, correct, ["Chắc chắn", "Có thể", "Không thể"].filter((s) => s !== correct));
  };
}

// ---------- Bảng nhân / chia ----------
function bangNhanChia(bang: number, isNhan: boolean): Gen {
  return () => {
    const b = rnd(1, 10);
    if (isNhan) return mcNumeric(`Tính: ${bang} x ${b} = ?`, bang * b);
    const kq = rnd(1, 10);
    return mcNumeric(`Tính: ${bang * kq} : ${bang} = ?`, kq);
  };
}
function timThuaSoTich(): Gen {
  return () => {
    const a = rnd(2, 10);
    const b = rnd(2, 10);
    const asks = ["Thừa số thứ nhất", "Thừa số thứ hai", "Tích"];
    const ask = asks[rnd(0, 2)];
    const correct = ask === "Tích" ? a * b : ask === "Thừa số thứ nhất" ? a : b;
    return mcNumeric(`Trong phép nhân ${a} x ${b} = ${a * b}, ${ask.toLowerCase()} là bao nhiêu?`, correct, 3);
  };
}
function timSoBiChia(): Gen {
  return () => {
    const b = rnd(2, 5);
    const kq = rnd(2, 10);
    const a = b * kq;
    const asks = ["số bị chia", "số chia", "thương"];
    const ask = asks[rnd(0, 2)];
    const correct = ask === "số bị chia" ? a : ask === "số chia" ? b : kq;
    return mcNumeric(`Trong phép chia ${a} : ${b} = ${kq}, ${ask} là bao nhiêu?`, correct, 3);
  };
}
function vietTongThanhTich(): Gen {
  return () => {
    const a = rnd(2, 9);
    const b = rnd(2, 6);
    let sum = "";
    for (let i = 0; i < b; i++) sum += (i ? " + " : "") + a;
    return mcFixed(`Viết ${sum} thành phép nhân rồi tính:`, `${a} x ${b} = ${a * b}`, [
      `${a} x ${b - 1} = ${a * (b - 1)}`,
      `${b} x ${a} = ${a * b + a}`,
      `${a + 1} x ${b} = ${(a + 1) * b}`,
    ]);
  };
}
function chiaDeu(): Gen {
  return () => {
    const b = rnd(2, 5);
    const kq = rnd(2, 8);
    const a = b * kq;
    const wrongs = numericDistractors(kq, 3, 2)
      .filter((v) => v !== kq)
      .map(String);
    return mcFixed(`Chia đều ${a} cái bánh vào ${b} hộp. Mỗi hộp có mấy cái?`, String(kq), wrongs);
  };
}
function soSanhNhanGiaoHoan(): Gen {
  return () => {
    const a = rnd(2, 9);
    const b = rnd(2, 9);
    return mcFixed(`Điền dấu: ${a} x ${b} ... ${b} x ${a}`, "=", [">", "<"]);
  };
}

// ---------- Số đến 1000 ----------
function decompose1000(): Gen {
  return () => {
    const tram = rnd(1, 9);
    const chuc = rnd(0, 9);
    const dv = rnd(0, 9);
    const n = tram * 100 + chuc * 10 + dv;
    return mcFixed(`Số ${n} gồm mấy trăm mấy chục mấy đơn vị?`, `${tram} trăm ${chuc} chục ${dv} đơn vị`, [
      `${tram} trăm ${dv} chục ${chuc} đơn vị`,
      `${chuc} trăm ${tram} chục ${dv} đơn vị`,
      `${tram} trăm ${(chuc + 1) % 10} chục ${dv} đơn vị`,
      `${tram} trăm ${(chuc + 9) % 10} chục ${dv} đơn vị`,
      `${(tram % 9) + 1} trăm ${chuc} chục ${dv} đơn vị`,
    ]);
  };
}
function demNhomChucTram(): Gen {
  return () => {
    const n = rnd(2, 9);
    const unit = Math.random() < 0.5 ? 10 : 100;
    return mcNumeric(`Mỗi khay có ${unit} cái bánh. Có ${n} khay, tất cả bao nhiêu cái bánh?`, n * unit, unit);
  };
}
function vietSoThanhTong(): Gen {
  return () => {
    const tram = rnd(1, 9);
    const chuc = rnd(0, 9);
    const dv = rnd(0, 9);
    const n = tram * 100 + chuc * 10 + dv;
    const correct = `${tram * 100} + ${chuc * 10} + ${dv}`;
    return mcFixed(`Viết số ${n} thành tổng các trăm, chục, đơn vị:`, correct, [
      `${tram * 100} + ${dv * 10} + ${chuc}`,
      `${chuc * 100} + ${tram * 10} + ${dv}`,
      `${tram * 100} + ${((chuc + 1) % 10) * 10} + ${dv}`,
      `${tram * 100} + ${((chuc + 9) % 10) * 10} + ${dv}`,
      `${((tram % 9) + 1) * 100} + ${chuc * 10} + ${dv}`,
    ]);
  };
}
function docSoBangChu(): Gen {
  const chuSo = ["không", "một", "hai", "ba", "tư", "năm", "sáu", "bảy", "tám", "chín"];
  function docSo(n: number): string {
    const tram = Math.floor(n / 100);
    const chuc = Math.floor((n % 100) / 10);
    const dv = n % 10;
    let s = "";
    if (tram) s += chuSo[tram] + " trăm ";
    if (chuc === 0 && dv > 0 && tram) s += "linh " + chuSo[dv];
    else if (chuc === 1) s += "mười " + (dv === 5 ? "lăm" : dv ? chuSo[dv] : "");
    else if (chuc > 1) s += chuSo[chuc] + " mươi " + (dv === 1 ? "mốt" : dv === 5 ? "lăm" : dv ? chuSo[dv] : "");
    else if (!tram) s += chuSo[dv];
    return s.trim();
  }
  return () => {
    const n = rnd(100, 999);
    return mcNumeric(`Số "${docSo(n)}" là số nào?`, n, 5);
  };
}
function soTronTramChuc(): Gen {
  return () => {
    const isChuc = Math.random() < 0.5;
    const correct = isChuc ? rnd(1, 9) * 10 : rnd(1, 9) * 100;
    const wrongs: number[] = [];
    while (wrongs.length < 3) {
      const d = rnd(10, 990);
      if (d !== correct && !wrongs.includes(d)) wrongs.push(d);
    }
    return mcFixed(
      `Trong các số sau, số nào là số tròn ${isChuc ? "chục" : "trăm"}: ${shuffleArr([correct, ...wrongs]).join(", ")}?`,
      String(correct),
      wrongs.map(String),
    );
  };
}
function soSanh1000(min: number, max: number): Gen {
  return () => {
    const a = rnd(min, max);
    const b = rnd(min, max);
    const sign = a > b ? ">" : a < b ? "<" : "=";
    return mcFixed(`Điền dấu thích hợp: ${a} ... ${b}`, sign, [">", "<", "="].filter((s) => s !== sign));
  };
}
function dungSaiSoSanh(): Gen {
  return () => {
    const a = rnd(100, 900);
    const b = rnd(100, 900);
    const real = a > b;
    const show = Math.random() < 0.5;
    const stmt = show ? `${a} > ${b}` : `${a} < ${b}`;
    const isCorrect = show ? real : !real;
    return mcFixed(`${stmt}. Đúng hay Sai?`, isCorrect ? "Đúng" : "Sai", [isCorrect ? "Sai" : "Đúng"]);
  };
}
function soSanhTenGiaTri(): Gen {
  const sets = [
    ["Đà điểu", "Hươu cao cổ", "Voi", "Gấu"],
    ["Trường Lê Lợi", "Trường Nguyễn Trãi", "Trường Thắng Lợi", "Trường Kim Đồng"],
  ];
  return () => {
    const names = sets[rnd(0, sets.length - 1)];
    const vals = shuffleArr([rnd(100, 900), rnd(100, 900), rnd(100, 900), rnd(100, 900)]);
    const askMax = Math.random() < 0.5;
    const target = askMax ? Math.max(...vals) : Math.min(...vals);
    const idx = vals.indexOf(target);
    return mcFixed(
      `${names.map((n, i) => `${n} có ${vals[i]}`).join(", ")}. Nơi nào ${askMax ? "nhiều" : "ít"} nhất?`,
      names[idx],
      names.filter((_, i) => i !== idx),
    );
  };
}
function ghepTheMinMax(): Gen {
  return () => {
    const digits = shuffleArr([rnd(1, 9), rnd(0, 9), rnd(0, 9)]);
    const sorted = [...digits].sort((a, b) => b - a);
    const sortedAsc = [...digits].sort((a, b) => a - b);
    const maxNum = Number(sorted.join(""));
    const ascCopy = [...sortedAsc];
    if (ascCopy[0] === 0) {
      const nz = ascCopy.findIndex((d) => d !== 0);
      [ascCopy[0], ascCopy[nz]] = [ascCopy[nz], ascCopy[0]];
    }
    const minNum = Number(ascCopy.join(""));
    const askMax = Math.random() < 0.5;
    return mcNumeric(
      `Ghép ba thẻ số ${digits.join(", ")} thành số ${askMax ? "lớn" : "bé"} nhất có thể:`,
      askMax ? maxNum : minNum,
      20,
    );
  };
}
function demTheoNguong(): Gen {
  return () => {
    const nums = Array.from({ length: 6 }, () => rnd(100, 900));
    const threshold = rnd(200, 800);
    const count = nums.filter((n) => n > threshold).length;
    return mcNumeric(`Trong các số ${nums.join(", ")}, có bao nhiêu số lớn hơn ${threshold}?`, count, 2);
  };
}
function timChuSoChoBatDangThuc(): Gen {
  return () => {
    const correct = rnd(0, 9);
    return mcNumeric(`Tìm chữ số thích hợp: 2?9 nhỏ hơn 2${correct + 1}0 khi ? = `, correct, 2);
  };
}
function timSoTheoDieuKien(): Gen {
  return () => {
    const askSingle = Math.random() < 0.5;
    if (askSingle) {
      const c = rnd(1, 9);
      const wrongs: number[] = [];
      while (wrongs.length < 3) {
        const d = rnd(10, 98);
        if (!wrongs.includes(d)) wrongs.push(d);
      }
      return mcFixed(
        `Trong các số sau, số nào là số CÓ MỘT CHỮ SỐ: ${shuffleArr([c, ...wrongs]).join(", ")}?`,
        String(c),
        wrongs.map(String),
      );
    }
    const c = rnd(1, 9) * 10;
    const wrongs: number[] = [];
    while (wrongs.length < 3) {
      const d = rnd(10, 98);
      if (d % 10 !== 0 && !wrongs.includes(d)) wrongs.push(d);
    }
    return mcFixed(
      `Trong các số sau, số nào là số TRÒN CHỤC: ${shuffleArr([c, ...wrongs]).join(", ")}?`,
      String(c),
      wrongs.map(String),
    );
  };
}
function soLonBeNhat3CsKhacNhau(): Gen {
  const modes: [string, string, string[]][] = [
    ["lớn nhất có 3 chữ số khác nhau", "987", ["999", "998", "789"]],
    ["bé nhất có 3 chữ số", "100", ["101", "999", "110"]],
    ["lớn nhất có 3 chữ số", "999", ["998", "990", "899"]],
    ["bé nhất có 3 chữ số khác nhau", "102", ["100", "120", "112"]],
  ];
  return () => {
    const [label, correct, wrongs] = modes[rnd(0, modes.length - 1)];
    return mcFixed(`Số ${label} là:`, correct, wrongs);
  };
}

// ---------- Độ dài dm/m/km + tiền VN ----------
function doiDonVi(): Gen {
  const pairs: [string, string, number][] = [
    ["dm", "cm", 10],
    ["m", "dm", 10],
    ["m", "cm", 100],
  ];
  return () => {
    const [big, small, ratio] = pairs[rnd(0, pairs.length - 1)];
    const n = rnd(1, 9);
    return mcNumeric(`${n}${big} = ? ${small}`, n * ratio, ratio);
  };
}
function chonDonViDo(): Gen {
  const items: [string, string[], number][] = [
    ["Chiếc bút chì dài khoảng", ["15cm", "15dm", "15m", "15km"], 0],
    ["Quãng đường từ nhà đến trường dài khoảng", ["2cm", "2dm", "2m", "2km"], 3],
    ["Cột cờ trường cao khoảng", ["5cm", "5dm", "5m", "5km"], 2],
    ["Cây thước kẻ dài khoảng", ["20cm", "20dm", "20m", "20km"], 0],
  ];
  return () => {
    const [text, opts, correctIdx] = items[rnd(0, items.length - 1)];
    return mcFixed(`${text}:`, opts[correctIdx], opts.filter((_, i) => i !== correctIdx));
  };
}
function toanDoDiaDanhVN(): Gen {
  const routes: [string, string, number][] = [
    ["Hà Nội", "Cao Bằng", 240],
    ["Hà Nội", "Vinh", 308],
    ["Vinh", "Đà Nẵng", 463],
    ["Đà Nẵng", "TP.HCM", 858],
    ["TP.HCM", "Cần Thơ", 174],
  ];
  return () => {
    const [a, b, dist] = routes[rnd(0, routes.length - 1)];
    const [c, d, dist2] = routes[rnd(0, routes.length - 1)];
    return mcNumeric(
      `Quãng đường ${a} - ${b} dài ${dist}km, quãng đường ${c} - ${d} dài ${dist2}km. Tổng hai quãng đường là bao nhiêu km?`,
      dist + dist2,
      50,
    );
  };
}
function demTongTien(): Gen {
  const vals = [1000, 2000, 5000, 10000, 20000];
  return () => {
    const a = vals[rnd(0, 4)];
    const b = vals[rnd(0, 4)];
    return mcNumeric(`Có 1 tờ ${a}đ và 1 tờ ${b}đ. Tổng số tiền là bao nhiêu đồng?`, a + b, 5000);
  };
}
function chonToHopTien(): Gen {
  const denoms = [1000, 2000, 5000, 10000, 20000, 50000];
  return () => {
    const vals = shuffleArr(denoms).slice(0, 4);
    const i = rnd(0, 3);
    let j = rnd(0, 3);
    while (j === i) j = rnd(0, 3);
    const target = vals[i] + vals[j];
    const correct = `${vals[i]}đ và ${vals[j]}đ`;
    const allPairs: [number, number][] = [];
    for (let a = 0; a < 4; a++)
      for (let b = a + 1; b < 4; b++) if (vals[a] + vals[b] !== target) allPairs.push([a, b]);
    const wrongs = shuffleArr(allPairs)
      .slice(0, 3)
      .map(([a, b]) => `${vals[a]}đ và ${vals[b]}đ`);
    return mcFixed(`Có các tờ ${vals.map((v) => v + "đ").join(", ")}. Chọn 2 tờ để đủ ${target}đ:`, correct, wrongs);
  };
}
function doNLanThuoc(): Gen {
  return () => {
    const n = rnd(2, 6);
    return mcNumeric(`Đo được ${n} lần thước 2dm. Vật dài bao nhiêu dm?`, n * 2, 2);
  };
}
function chuViHangRao(): Gen {
  return () => {
    const a = rnd(5, 20);
    const b = rnd(5, 20);
    const c = rnd(5, 20);
    return mcNumeric(`Hàng rào 3 cạnh dài ${a}m, ${b}m, ${c}m. Chu vi hàng rào là?`, a + b + c);
  };
}
function tauQuaCau(): Gen {
  return () => {
    const a = rnd(60, 120);
    const b = rnd(20, a - 10);
    return mcNumeric(`Đoàn tàu dài ${a}m đi qua cây cầu dài ${b}m. Phần tàu vượt khỏi cầu dài bao nhiêu mét?`, a - b);
  };
}

// ---------- Cộng trừ 3 chữ số (phạm vi 1000) ----------
function tinh3CsCong(min1: number, max1: number, min2: number, max2: number): Gen {
  return () => {
    const a = rnd(min1, max1);
    const b = rnd(min2, max2);
    return mcNumeric(`Tính: ${a} + ${b} = ?`, a + b);
  };
}
function tinh3CsTru(minA: number, maxA: number, minGap: number): Gen {
  return () => {
    const a = rnd(minA, maxA);
    const b = rnd(minGap, Math.max(minGap, a - 100));
    return mcNumeric(`Tính: ${a} - ${b} = ?`, a - b);
  };
}
function timPhepTinhSai(): Gen {
  return () => {
    const correct: string[] = [];
    for (let i = 0; i < 3; i++) {
      const a = rnd(100, 500);
      const b = rnd(100, 400);
      correct.push(`${a}+${b}=${a + b}`);
    }
    const a = rnd(100, 500);
    const b = rnd(100, 400);
    const wrong = `${a}+${b}=${a + b + rnd(1, 9)}`;
    return mcFixed("Phép tính nào dưới đây SAI?", wrong, correct);
  };
}
function timChuSoDatCot(): Gen {
  return () => {
    const miss = rnd(1, 9);
    return mcNumeric(`Tìm chữ số thích hợp: 3${miss} + ?2 = 7?  (ẩn hàng chục kết quả)`, miss, 3);
  };
}

// ---------- Hình khối / quy luật ----------
function nhanDienKhoi(): Gen {
  const shapes = ["khối lập phương", "khối cầu", "khối trụ", "khối hộp chữ nhật"];
  const objs: Record<string, string> = {
    "khối lập phương": "viên xúc xắc",
    "khối cầu": "quả bóng",
    "khối trụ": "lon nước",
    "khối hộp chữ nhật": "hộp bút",
  };
  return () => {
    const target = shapes[rnd(0, 3)];
    return mcFixed(`Vật nào có dạng ${target}?`, objs[target], shapes.filter((s) => s !== target).map((s) => objs[s]));
  };
}
function quyLuatHinhKhoi(isShape: boolean): Gen {
  const shapes = ["hình tròn", "hình vuông", "hình tam giác", "hình chữ nhật"];
  const khoi = ["khối cầu", "khối lập phương", "khối trụ"];
  const pool = isShape ? shapes : khoi;
  return () => {
    const cycleLen = isShape ? (Math.random() < 0.5 ? 3 : 4) : 3;
    const cyc = shuffleArr(pool).slice(0, cycleLen);
    const seq: string[] = [];
    for (let i = 0; i < cycleLen * 2 + 1; i++) seq.push(cyc[i % cycleLen]);
    const correct = seq[seq.length - 1];
    seq[seq.length - 1] = "?";
    const wrongs = pool.filter((s) => s !== correct);
    return mcFixed(`Dãy lặp theo chu kỳ: ${seq.join(", ")}. Vị trí ? là gì?`, correct, wrongs.slice(0, 3));
  };
}

// ---------- Biểu đồ / thống kê ----------
function pictograph(): Gen {
  const items = [
    ["quả cam", "quả táo", "quả xoài"],
    ["con mèo", "con chó", "con thỏ"],
  ];
  return () => {
    const names = items[rnd(0, items.length - 1)];
    const counts = [rnd(2, 5) * 10 + rnd(0, 9), rnd(2, 5) * 10, rnd(2, 5) * 10 + rnd(0, 9)];
    const maxIdx = counts.indexOf(Math.max(...counts));
    return mcFixed(
      `Biểu đồ tranh: ${names.map((n, i) => `${n}: ${counts[i]}`).join(", ")}. Loại nào nhiều nhất?`,
      names[maxIdx],
      names.filter((_, i) => i !== maxIdx),
    );
  };
}

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
    const words = ["một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"];
    const w = n <= 10 ? words[n - 1] : `${words[Math.floor(n / 10) - 1]} mươi`;
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
