// Builtin Toán Lớp 3 — factory (phần B). Tách từ builtins-grade3.ts, dời nguyên văn (mục 93 Đợt 4a).
// Dùng hàm trợ giúp ở builtins-grade3-gen-a.ts; danh sách mẫu nằm ở builtins-grade3.ts.
import {
  shuffleArr, rnd, pick, mcNumeric, fmtSo, mcNumericFmt, mcFixed, docSoVN, type Gen,
} from "./builtins-grade3-gen-a";
// ---- het tieu de tach file (muc 93 Dot 4a) ----
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

// ---- het phan chuyen nguyen van (muc 93 Dot 4a) ----
export {
  docSoLon, vietSoTuCachDoc, soLienTruocSauLon, soSanhSoLon, phanTichThanhTong, docLaMa,
  lamTronSo, chuViTamGiacTuGiac, chuViHCNVuong, dienTichHCNVuong, phanBietChuViDienTich,
  congTruPhamViLon, tinhNhamTronNghin, nhanChiaSoLonCho1CS, tinhKhoangThoiGian,
  soNgayTrongThang, tinhLichThu, tienVietNamTong, tienVietNamDoi, docBangSoLieu, demTally,
  khaNangXayRa, timSoLonBeNhatNChuSo, onTapPhepTinhLon,
};
