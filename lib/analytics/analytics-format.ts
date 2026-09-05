// Hàm thuần format số liệu cho trang Báo cáo phân tích (GĐ3). Không phụ thuộc React, test độc lập.

/** Tỉ lệ 0-1 -> chuỗi phần trăm 1 chữ số thập phân, vd 0.756 -> "75.6%". */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** Giờ trong ngày (0-23) -> nhãn 2 chữ số, vd 8 -> "08:00". */
export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** Số nguyên -> chuỗi có dấu phân cách nghìn kiểu Việt Nam (dấu chấm), vd 12345 -> "12.345". */
export function formatNumberVn(n: number): string {
  return n.toLocaleString("vi-VN");
}
