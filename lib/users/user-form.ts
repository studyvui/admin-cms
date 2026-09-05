// Schema form + transform THUẦN cho trang Quản lý người dùng (GĐ2) — tách khỏi
// app/(dashboard)/users/*.tsx để test độc lập, không phụ thuộc React.
//
// Hợp đồng quan trọng nhất ở đây (đọc kỹ trước khi sửa):
// 1) toCreatePayload CHỈ thêm key "grade" khi role === "student" — backend
//    `forbidNonWhitelisted` sẽ 400 nếu payload có field lạ, và gửi grade cho role khác student
//    là dữ liệu vô nghĩa (chỉ student mới có studentProfile.grade).
// 2) toUpdatePayload CHỈ đưa vào payload những field THỰC SỰ đã đổi (dựa trên dirtyFields của
//    react-hook-form) — backend coi field NÀO CÓ MẶT trong payload PATCH là field admin CHỦ Ý
//    đổi (vd không vô tình gửi lại role/isActive cũ mà backend hiểu nhầm là "đổi về chính nó").

import { z } from "zod";
import type { CreateUserInput, UpdateUserInput, UserRole } from "@/lib/types";

export const USER_ROLES: [UserRole, ...UserRole[]] = [
  "student",
  "parent",
  "teacher",
  "editor",
  "admin",
  "qa",
  "support",
];

export const createUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().min(1, "Tên không được để trống"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  role: z.enum(USER_ROLES),
  grade: z.coerce.number().int().min(1).max(5).optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// Tất cả field optional trừ password/grade (không đổi qua dialog Sửa — đổi mật khẩu có dialog
// riêng "Đặt lại mật khẩu"; grade chỉ set được lúc tạo mới).
export const updateUserSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/**
 * Form tạo mới → payload POST /admin/users. THUẦN. Chỉ thêm "grade" vào object khi role là
 * student VÀ có giá trị — role khác thì object trả về KHÔNG có key "grade" (không gửi
 * `grade: undefined`, vì Object.keys vẫn liệt kê key có giá trị undefined trong object literal).
 */
export function toCreatePayload(values: CreateUserFormValues): CreateUserInput {
  const base = {
    email: values.email,
    name: values.name,
    password: values.password,
    role: values.role,
  };
  if (values.role === "student" && values.grade !== undefined) {
    return { ...base, grade: values.grade };
  }
  return base;
}

/**
 * Form sửa → payload PATCH /admin/users/:id. THUẦN. `dirtyFields` là formState.dirtyFields của
 * react-hook-form (hoặc object tương đương do test tự dựng) — CHỈ field có dirtyFields[key] truthy
 * mới được đưa vào payload, kể cả khi values có đủ mọi field (đã prefill từ user gốc).
 */
export function toUpdatePayload(
  values: UpdateUserFormValues,
  dirtyFields: Partial<Record<keyof UpdateUserFormValues, boolean>>,
): UpdateUserInput {
  const payload: UpdateUserInput = {};
  if (dirtyFields.name && values.name !== undefined) payload.name = values.name;
  if (dirtyFields.email && values.email !== undefined) payload.email = values.email;
  if (dirtyFields.role && values.role !== undefined) payload.role = values.role;
  if (dirtyFields.isActive && values.isActive !== undefined) {
    payload.isActive = values.isActive;
  }
  return payload;
}

export function toResetPasswordPayload(
  values: ResetPasswordFormValues,
): { newPassword: string } {
  return { newPassword: values.newPassword };
}
