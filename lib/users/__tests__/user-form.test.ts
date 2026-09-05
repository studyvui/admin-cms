import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  toCreatePayload,
  toUpdatePayload,
  toResetPasswordPayload,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "@/lib/users/user-form";

describe("toCreatePayload", () => {
  it("role student + grade → đúng 4 key {email,name,password,role,grade}", () => {
    const values: CreateUserFormValues = {
      email: "hs@studyvui.vn",
      name: "Học sinh A",
      password: "12345678",
      role: "student",
      grade: 3,
    };
    const payload = toCreatePayload(values);
    expect(Object.keys(payload).sort()).toEqual(
      ["email", "grade", "name", "password", "role"].sort(),
    );
    expect(payload).toEqual({
      email: "hs@studyvui.vn",
      name: "Học sinh A",
      password: "12345678",
      role: "student",
      grade: 3,
    });
  });

  it("role khác student → đúng 4 key, KHÔNG có key grade", () => {
    const values: CreateUserFormValues = {
      email: "gv@studyvui.vn",
      name: "Giáo viên B",
      password: "12345678",
      role: "teacher",
    };
    const payload = toCreatePayload(values);
    expect(Object.keys(payload).sort()).toEqual(
      ["email", "name", "password", "role"].sort(),
    );
    expect("grade" in payload).toBe(false);
  });

  it("role student nhưng KHÔNG có grade → vẫn không có key grade (không gửi undefined rác)", () => {
    const values: CreateUserFormValues = {
      email: "hs2@studyvui.vn",
      name: "Học sinh C",
      password: "12345678",
      role: "student",
    };
    const payload = toCreatePayload(values);
    expect("grade" in payload).toBe(false);
  });

  it("khớp createUserSchema thật (không chỉ fixture tay)", () => {
    const parsed = createUserSchema.parse({
      email: "hs@studyvui.vn",
      name: "Học sinh A",
      password: "12345678",
      role: "student",
      grade: 3,
    });
    expect(toCreatePayload(parsed)).toEqual({
      email: "hs@studyvui.vn",
      name: "Học sinh A",
      password: "12345678",
      role: "student",
      grade: 3,
    });
  });
});

describe("toUpdatePayload", () => {
  const values: UpdateUserFormValues = {
    name: "Tên mới",
    email: "cu@studyvui.vn",
    role: "editor",
    isActive: true,
  };

  it("chỉ gửi field đã đổi (name) — các field khác dù có mặt trong values cũng KHÔNG vào payload", () => {
    const payload = toUpdatePayload(values, { name: true });
    expect(payload).toEqual({ name: "Tên mới" });
  });

  it("2 field đổi (email + role) → payload chỉ chứa đúng 2 key đó", () => {
    const payload = toUpdatePayload(values, { email: true, role: true });
    expect(payload).toEqual({
      email: "cu@studyvui.vn",
      role: "editor",
    });
  });

  it("không field nào dirty → payload rỗng", () => {
    expect(toUpdatePayload(values, {})).toEqual({});
  });

  it("khớp updateUserSchema thật", () => {
    const parsed = updateUserSchema.parse({ name: "Tên mới" });
    expect(toUpdatePayload(parsed, { name: true })).toEqual({
      name: "Tên mới",
    });
  });
});

describe("resetPasswordSchema", () => {
  it("từ chối mật khẩu < 8 ký tự", () => {
    const result = resetPasswordSchema.safeParse({ newPassword: "1234567" });
    expect(result.success).toBe(false);
  });

  it("chấp nhận mật khẩu đủ 8 ký tự", () => {
    const result = resetPasswordSchema.safeParse({ newPassword: "12345678" });
    expect(result.success).toBe(true);
  });

  it("toResetPasswordPayload trả đúng {newPassword}", () => {
    expect(toResetPasswordPayload({ newPassword: "12345678" })).toEqual({
      newPassword: "12345678",
    });
  });
});
