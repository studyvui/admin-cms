// [PLAN.md muc 25, diem ghi nhan #3] Dien giai truong `vipUntil` (backend
// AdminUserListItemDto) thanh noi dung cot "VIP den ngay" trong bang Quan ly nguoi dung.
//
// Backend tra endsAt cua goi status=active co han XA NHAT va KHONG loc theo hien tai —
// co y de admin thay ca goi vua het han (biet ai can moi gia han, tranh cap chong). Viec
// phan biet con han / het han nam o day.
//
// Ngu nghia "con han" khop TUYET DOI voi nguon su that cua backend
// (SubscriptionService.hasActiveSubscription: endsAt > now, khong phai >=).

const MOT_NGAY_MS = 24 * 60 * 60 * 1000;

export interface TrangThaiVip {
  /** Ngay het han dang doc duoc (vi-VN), hoac "—" khi chua tung mua / du lieu hong. */
  nhan: string;
  conHan: boolean;
  /** Chi co khi con han — de hien "(con N ngay)". */
  soNgayConLai: number | null;
}

const KHONG_CO: TrangThaiVip = { nhan: "—", conHan: false, soNgayConLai: null };

export function trangThaiVip(vipUntil: string | null | undefined, now: Date): TrangThaiVip {
  if (!vipUntil) return KHONG_CO;
  const het = new Date(vipUntil);
  const ms = het.getTime();
  if (!Number.isFinite(ms)) return KHONG_CO; // du lieu hong -> khong lam vo bang
  const nhan = het.toLocaleDateString("vi-VN");
  if (ms <= now.getTime()) return { nhan, conHan: false, soNgayConLai: null };
  return { nhan, conHan: true, soNgayConLai: Math.ceil((ms - now.getTime()) / MOT_NGAY_MS) };
}
