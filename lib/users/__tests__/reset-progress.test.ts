import { describe, it, expect } from "vitest";
import { coPhepResetTienDo, moTaResetTienDo } from "../reset-progress";

// [PLAN.md muc 23 #8] Cong xac nhan cua thao tac "Reset tien do hoc tap".
//
// Day la thao tac XOA DU LIEU va KHONG HOAN TAC DUOC. Mot cu bam nham la mat toan bo tien
// do hoc cua mot dua tre. Vi vay nut chi duoc bat khi admin go DUNG email cua hoc sinh —
// cung co che ma GitHub dung cho thao tac xoa repo.
describe("coPhepResetTienDo — cong xac nhan go dung email", () => {
  const EMAIL = "be.an@studyvui.vn";

  it("go dung email -> cho phep", () => {
    expect(coPhepResetTienDo(EMAIL, EMAIL)).toBe(true);
  });

  it("go sai / go thieu -> CHAN", () => {
    expect(coPhepResetTienDo("be.an@studyvui.v", EMAIL)).toBe(false);
    expect(coPhepResetTienDo("be.an", EMAIL)).toBe(false);
    expect(coPhepResetTienDo("", EMAIL)).toBe(false);
  });

  it("bo qua khoang trang thua va HOA/thuong — admin copy-paste hay dinh khoang trang", () => {
    expect(coPhepResetTienDo("  be.an@studyvui.vn  ", EMAIL)).toBe(true);
    expect(coPhepResetTienDo("BE.AN@STUDYVUI.VN", EMAIL)).toBe(true);
  });

  it("email muc tieu rong/thieu -> CHAN (khong duoc bat nut khi chua biet xoa cua ai)", () => {
    expect(coPhepResetTienDo("", "")).toBe(false);
    expect(coPhepResetTienDo("bat ky", "")).toBe(false);
    expect(coPhepResetTienDo("bat ky", null)).toBe(false);
    expect(coPhepResetTienDo("bat ky", undefined)).toBe(false);
  });
});

describe("moTaResetTienDo — noi ro xoa gi, GIU gi", () => {
  it("liet ke du 4 thu bi xoa", () => {
    const t = moTaResetTienDo();
    expect(t.xoa).toHaveLength(4);
    expect(t.xoa.join(" ")).toMatch(/sao|thành thạo/i);
    expect(t.xoa.join(" ")).toMatch(/ôn tập/i);
  });

  it("noi ro nhung thu VAN GIU — tranh admin tuong xoa sach tai khoan", () => {
    const g = moTaResetTienDo().giu.join(" ");
    expect(g).toMatch(/xu/i);
    expect(g).toMatch(/huy hiệu|huy hieu/i);
  });

  it("canh bao khong hoan tac duoc", () => {
    expect(moTaResetTienDo().canhBao).toMatch(/không.*hoàn tác|khong.*hoan tac/i);
  });
});
