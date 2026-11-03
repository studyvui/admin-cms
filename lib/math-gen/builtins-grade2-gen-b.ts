// Builtin Toán Lớp 2 — factory (phần B). Tách từ builtins-grade2.ts, dời nguyên văn (mục 93 Đợt 4a).
// Dùng hàm trợ giúp ở builtins-grade2-gen-a.ts; danh sách mẫu nằm ở builtins-grade2.ts.
import {
  shuffleArr, rnd, numericDistractors, mcNumeric, mcFixed, type Gen,
} from "./builtins-grade2-gen-a";
// ---- het tieu de tach file (muc 93 Dot 4a) ----
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

// ---- het phan chuyen nguyen van (muc 93 Dot 4a) ----
export {
  bangNhanChia, timThuaSoTich, timSoBiChia, vietTongThanhTich, chiaDeu, soSanhNhanGiaoHoan,
  decompose1000, demNhomChucTram, vietSoThanhTong, docSoBangChu, soTronTramChuc, soSanh1000,
  dungSaiSoSanh, soSanhTenGiaTri, ghepTheMinMax, demTheoNguong, timChuSoChoBatDangThuc,
  timSoTheoDieuKien, soLonBeNhat3CsKhacNhau, doiDonVi, chonDonViDo, toanDoDiaDanhVN,
  demTongTien, chonToHopTien, doNLanThuoc, chuViHangRao, tauQuaCau, tinh3CsCong, tinh3CsTru,
  timPhepTinhSai, timChuSoDatCot, nhanDienKhoi, quyLuatHinhKhoi, pictograph,
};
