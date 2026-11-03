// Builtin Toán Lớp 4 — factory (phần B). Tách từ builtins-grade4.ts, dời nguyên văn (mục 93 Đợt 4a).
// Dùng hàm trợ giúp ở builtins-grade4-gen-a.ts; danh sách mẫu nằm ở builtins-grade4.ts.
import {
  gcd, pick, shuffleArr, rnd, mcNumeric, fmtSo, mcNumericFmt, mcFixed, simplifyFrac, fracAdd,
  fracSub, fracMul, fracDiv, mcFracFixed, type Gen, type Frac,
} from "./builtins-grade4-gen-a";
// ---- het tieu de tach file (muc 93 Dot 4a) ----
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

// ---- het phan chuyen nguyen van (muc 93 Dot 4a) ----
export {
  nhanSoLonCho1CS, chiaSoLonCho1CS, nhanChiaNham101001000, nhanVoiSoCoHaiCS, chiaChoSoCoHaiCS,
  genEstimateCheck, timTrungBinhCong, genUnitRateForward, genUnitRateReverse, genDataSequence,
  genEventFrequency, genFractionConcept, genFractionEqualsDiv, genFractionBasicProperty,
  genFractionSimplify, genFractionCommonDenom, genFractionCompare, genFractionAddSub,
  genFractionMulDiv, genFractionOfNumber,
};
