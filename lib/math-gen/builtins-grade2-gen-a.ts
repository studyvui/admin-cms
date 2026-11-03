// Builtin Toán Lớp 2 — hàm trợ giúp + factory (phần A). Tách từ builtins-grade2.ts, dời nguyên văn (mục 93 Đợt 4a).
// Danh sách mẫu GRADE2_BUILTIN_TEMPLATES nằm ở builtins-grade2.ts.
import type { RawGenerated } from "./types";
// ---- het tieu de tach file (muc 93 Dot 4a) ----

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
    const text = tpl
      .replaceAll("{name1}", n1)
      .replaceAll("{name2}", n2)
      .replaceAll("{a}", String(a))
      .replaceAll("{b}", String(b));
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
    const isHon = Math.random() < 0.5;
    // "nhẹ hơn" (trừ) phải đảm bảo b < a — khối lượng/dung tích không thể ra số âm.
    const b = isHon ? rnd(2, 20) : rnd(2, Math.min(20, a - 1));
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

// ---- het phan chuyen nguyen van (muc 93 Dot 4a) ----
export {
  shuffleArr, rnd, numericDistractors, mcNumeric, mcFixed, decompose100, tachThe3So,
  tongHieuThanhPhan, tinhCongTru, soLienTruocSau, daySoLienTiep, giaiToanThemBot,
  giaiToanHonKem, soSanhBieuThuc, timChuoiChung3Buoc, noiKetQua, chonPhepTinhKQLonNhat,
  chonToHopTong, tinhDonVi, soSanhCanNang3Con, giaiToanDonVi, demDoanThang, doDaiGapKhuc,
  soSanh2DuongDi, suyLuanThu, doiGio12h24h, soGioMuonSom, docLich, xacSuatBong, type Gen,
};
