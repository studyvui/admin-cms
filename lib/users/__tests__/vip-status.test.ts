import { describe, it, expect } from "vitest";
import { trangThaiVip } from "../vip-status";

// [PLAN.md muc 25, diem ghi nhan #3] Cot "VIP den ngay" trong bang Quan ly nguoi dung.
// Noi dau that su: admin khong biet ai sap/vua het han -> de cap chong. Vi vay goi DA HET
// HAN van phai hien ngay (kem nhan "het han"), khong duoc an di nhu chua tung mua.
describe("trangThaiVip", () => {
  const NOW = new Date("2026-09-16T10:00:00+07:00");

  it("chua tung mua (null) -> gach ngang, khong phai VIP", () => {
    expect(trangThaiVip(null, NOW)).toEqual({ nhan: "—", conHan: false, soNgayConLai: null });
  });

  it("khong co truong (undefined, backend cu) -> gach ngang", () => {
    expect(trangThaiVip(undefined, NOW)).toEqual({ nhan: "—", conHan: false, soNgayConLai: null });
  });

  it("con han -> hien ngay + so ngay con lai", () => {
    const kq = trangThaiVip("2026-09-30T10:00:00+07:00", NOW);
    expect(kq.conHan).toBe(true);
    expect(kq.soNgayConLai).toBe(14);
    expect(kq.nhan).toBe("30/9/2026");
  });

  it("da het han -> VAN hien ngay nhung bao het han", () => {
    const kq = trangThaiVip("2026-09-02T10:00:00+07:00", NOW);
    expect(kq.conHan).toBe(false);
    expect(kq.soNgayConLai).toBeNull();
    expect(kq.nhan).toBe("2/9/2026");
  });

  // Bien: khop dung ngu nghia cua backend (hasActiveSubscription: endsAt > now, KHONG >=).
  it("dung dung thoi diem het han -> coi la HET HAN", () => {
    expect(trangThaiVip(NOW.toISOString(), NOW).conHan).toBe(false);
  });

  it("chuoi rac -> gach ngang, khong vo giao dien", () => {
    expect(trangThaiVip("khong-phai-ngay", NOW)).toEqual({ nhan: "—", conHan: false, soNgayConLai: null });
  });
});
