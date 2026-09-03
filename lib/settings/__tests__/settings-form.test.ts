import { describe, it, expect } from "vitest";
import {
  passwordSchema,
  toChangePasswordPayload,
  coerceSettingValue,
  toSettingPayload,
} from "@/lib/settings/settings-form";

describe("passwordSchema", () => {
  it("từ chối newPassword ngắn hơn 8 ký tự", () => {
    const result = passwordSchema.safeParse({
      oldPassword: "old",
      newPassword: "short1",
      confirmPassword: "short1",
    });
    expect(result.success).toBe(false);
  });

  it("từ chối khi confirmPassword không khớp newPassword", () => {
    const result = passwordSchema.safeParse({
      oldPassword: "old",
      newPassword: "longenough1",
      confirmPassword: "longenough2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("chấp nhận khi hợp lệ", () => {
    const result = passwordSchema.safeParse({
      oldPassword: "old",
      newPassword: "longenough1",
      confirmPassword: "longenough1",
    });
    expect(result.success).toBe(true);
  });
});

describe("toChangePasswordPayload", () => {
  it("trả đúng object {oldPassword, newPassword}, KHÔNG có confirmPassword", () => {
    const payload = toChangePasswordPayload({
      oldPassword: "old-pw",
      newPassword: "new-password-1",
      confirmPassword: "new-password-1",
    });
    expect(payload).toEqual({
      oldPassword: "old-pw",
      newPassword: "new-password-1",
    });
    expect(Object.keys(payload).sort()).toEqual(["newPassword", "oldPassword"]);
  });
});

describe("coerceSettingValue", () => {
  it('coerceSettingValue("number", "30") -> 30 (number)', () => {
    const v = coerceSettingValue("number", "30");
    expect(v).toBe(30);
    expect(typeof v).toBe("number");
  });

  it('coerceSettingValue("number", "abc") -> throw', () => {
    expect(() => coerceSettingValue("number", "abc")).toThrow();
  });

  it('coerceSettingValue("number", "") -> throw', () => {
    expect(() => coerceSettingValue("number", "")).toThrow();
  });

  it('coerceSettingValue("boolean", true) -> true', () => {
    expect(coerceSettingValue("boolean", true)).toBe(true);
  });

  it('coerceSettingValue("boolean", false) -> false', () => {
    expect(coerceSettingValue("boolean", false)).toBe(false);
  });

  it('coerceSettingValue("string", 123) -> "123"', () => {
    expect(coerceSettingValue("string", 123)).toBe("123");
  });

  it('coerceSettingValue("json", object) trả nguyên object', () => {
    const obj = { a: 1 };
    expect(coerceSettingValue("json", obj)).toBe(obj);
  });

  it('coerceSettingValue("json", chuỗi JSON hợp lệ) -> parse thành object', () => {
    expect(coerceSettingValue("json", '{"a":1}')).toEqual({ a: 1 });
  });

  it('coerceSettingValue("json", chuỗi không hợp lệ) -> throw', () => {
    expect(() => coerceSettingValue("json", "{invalid")).toThrow();
  });
});

describe("toSettingPayload", () => {
  it("toSettingPayload(false) -> { value: false }, chỉ 1 field", () => {
    const payload = toSettingPayload(false);
    expect(payload).toEqual({ value: false });
    expect(Object.keys(payload)).toEqual(["value"]);
  });

  it("toSettingPayload(30) -> { value: 30 }, chỉ 1 field", () => {
    const payload = toSettingPayload(30);
    expect(payload).toEqual({ value: 30 });
    expect(Object.keys(payload)).toEqual(["value"]);
  });
});
