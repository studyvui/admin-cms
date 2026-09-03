// Schema form + transform THUẦN cho trang Cài đặt (Settings, GĐ1) — tách khỏi
// app/(dashboard)/settings/*.tsx để test độc lập, không phụ thuộc React.

import { z } from "zod";
import type { SettingType, SettingValue } from "@/lib/types";

export const passwordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;

// Bỏ confirmPassword — trường chỉ dùng validate client. Backend `forbidNonWhitelisted` sẽ 400
// nếu payload có field thừa.
export function toChangePasswordPayload(
  values: PasswordFormValues,
): { oldPassword: string; newPassword: string } {
  return {
    oldPassword: values.oldPassword,
    newPassword: values.newPassword,
  };
}

export const profileSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// Ép giá trị nhập tay (string từ Input/Textarea, hoặc boolean từ Switch) về đúng SettingValue
// theo valueType của setting. Throw Error (thông báo tiếng Việt) nếu không ép được.
export function coerceSettingValue(
  valueType: SettingType,
  raw: unknown,
): SettingValue {
  switch (valueType) {
    case "boolean":
      return Boolean(raw);
    case "number": {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (typeof raw === "string" && raw.trim() === "") {
        throw new Error("Giá trị phải là số");
      }
      if (Number.isNaN(n)) {
        throw new Error("Giá trị phải là số");
      }
      return n;
    }
    case "string":
      return String(raw);
    case "json": {
      if (raw !== null && typeof raw === "object") {
        return raw as Record<string, unknown>;
      }
      if (typeof raw === "string") {
        try {
          return JSON.parse(raw) as Record<string, unknown>;
        } catch {
          throw new Error("JSON không hợp lệ");
        }
      }
      throw new Error("JSON không hợp lệ");
    }
    default:
      throw new Error("Loại giá trị không được hỗ trợ");
  }
}

// Payload PATCH /admin/settings/:key — CHỈ { value }, không field thừa nào khác (hợp đồng quan
// trọng nhất của endpoint này).
export function toSettingPayload(value: SettingValue): { value: SettingValue } {
  return { value };
}
