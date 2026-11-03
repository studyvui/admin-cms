// Builtin Toán Lớp 5 — factory (phần B). Tách từ builtins-grade5.ts, dời nguyên văn (mục 93 Đợt 4a).
// Dùng hàm trợ giúp ở builtins-grade5-gen-a.ts; danh sách mẫu nằm ở builtins-grade5.ts.
import {
  gcd, shuffleArr, rnd, pick, mcNumeric, fmtSo, mcFixed, roundDp, fmtVN, mcDecFixed,
  mcFracFixed, type Gen,
} from "./builtins-grade5-gen-a";
// ---- het tieu de tach file (muc 93 Dot 4a) ----
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

// ---- het phan chuyen nguyen van (muc 93 Dot 4a) ----
export {
  dienTichTamGiac, dienTichHinhThang, chuViHinhTron, dienTichHinhTron, tiSo, tiLeBanDo,
  tongTiSo, hieuTiSo, timTiSoPhanTramCuaHaiSo, timGiaTriPhanTram, doiDonViTheTichNho,
  doiDonViTheTichLon, theTichHHCN, theTichHLP, dienTichHHCN, dienTichHLP, doiDonViThoiGian,
  congTruThoiGian, nhanChiaThoiGian, vanTocQuangDuongThoiGian, doiDonViVanToc, docBangSoLieu,
  timGiaTriPhanTramBieuDoQuat, tiSoLanLapLai, khaNangXayRa,
};
