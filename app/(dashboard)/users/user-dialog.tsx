"use client";

// Dialog Thêm/Sửa người dùng. KHÁC question-dialog.tsx ở chỗ 2 chế độ dùng 2 schema có SHAPE
// khác hẳn nhau (tạo mới bắt buộc password, không có isActive; sửa không có password/grade) —
// nên dùng 2 useForm riêng (gọi KHÔNG điều kiện, đúng Rules of Hooks) thay vì ép chung 1 kiểu.
//
// Dialog tự sở hữu mutation + reset (giống change-password-dialog.tsx GĐ1): mọi đường đóng (Huỷ,
// Radix tự đóng do Esc/click ra ngoài, submit thành công) đều đi qua handleClose() duy nhất — bài
// học GĐ1: quên reset() form hoặc reset() lỗi mutation cũ sẽ rò rỉ dữ liệu/lỗi sang lần mở sau vì
// Radix Dialog KHÔNG unmount instance giữa các lần đóng/mở.

import type { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  createUserSchema,
  updateUserSchema,
  toCreatePayload,
  toUpdatePayload,
  USER_ROLES,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "@/lib/users/user-form";
import { USER_ROLE_LABELS } from "@/lib/users/labels";
import type { AdminUser, CreateUserInput, UpdateUserInput } from "@/lib/types";
import { extractError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// createUserSchema dùng z.coerce cho "grade" (ô nhập lớp là <input type="number">, giá trị thô từ
// DOM là string) — với zod v4, kiểu TRƯỚC coerce (input) khác kiểu SAU coerce (output: number).
// react-hook-form hỗ trợ tách 2 kiểu qua generic thứ 3 (TTransformedValues) chính cho tình huống
// này: useForm<Input, Context, Output> — Input cho defaultValues/register, Output cho onSubmit.
type CreateUserFormInput = z.input<typeof createUserSchema>;

export function UserDialog({
  open,
  onOpenChange,
  editing,
  disableRoleChange,
  createMut,
  updateMut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AdminUser | null;
  // Tự bảo vệ: admin đang xem chính hồ sơ của mình → không cho tự đổi role của chính mình.
  disableRoleChange: boolean;
  createMut: UseMutationResult<AdminUser, unknown, CreateUserInput>;
  updateMut: UseMutationResult<
    AdminUser,
    unknown,
    { id: string; input: UpdateUserInput }
  >;
}) {
  const createForm = useForm<CreateUserFormInput, unknown, CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "student",
      grade: undefined,
    },
  });

  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    values: editing
      ? { name: editing.name, email: editing.email, role: editing.role }
      : { name: "", email: "", role: "student" },
  });

  const handleClose = () => {
    onOpenChange(false);
    createForm.reset();
    editForm.reset();
    createMut.reset();
    updateMut.reset();
  };

  const onSubmitCreate = (values: CreateUserFormValues) => {
    createMut.mutate(toCreatePayload(values), { onSuccess: handleClose });
  };

  const onSubmitUpdate = (values: UpdateUserFormValues) => {
    if (!editing) return;
    const payload = toUpdatePayload(values, editForm.formState.dirtyFields);
    updateMut.mutate(
      { id: editing.id, input: payload },
      { onSuccess: handleClose },
    );
  };

  const submitting = editing ? updateMut.isPending : createMut.isPending;
  const mutError = editing ? updateMut.error : createMut.error;
  const errorMessage = mutError ? extractError(mutError) : null;

  const createRole = createForm.watch("role");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Sửa người dùng" : "Thêm người dùng mới"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Chỉ những trường đã thay đổi mới được gửi đi."
              : "Tài khoản mới có thể đăng nhập ngay bằng mật khẩu đặt ở đây."}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <form
            onSubmit={editForm.handleSubmit(onSubmitUpdate)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" {...editForm.register("email")} />
              {editForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên</Label>
              <Input id="edit-name" {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select
                value={editForm.watch("role")}
                onValueChange={(v) =>
                  editForm.setValue(
                    "role",
                    v as UpdateUserFormValues["role"],
                    { shouldValidate: true, shouldDirty: true },
                  )
                }
                disabled={disableRoleChange}
              >
                <SelectTrigger aria-label="Vai trò">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {USER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {disableRoleChange && (
                <p className="text-xs text-muted-foreground">
                  Không thể tự đổi vai trò của chính mình.
                </p>
              )}
            </div>

            {errorMessage && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Huỷ
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form
            onSubmit={createForm.handleSubmit(onSubmitCreate)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" {...createForm.register("email")} />
              {createForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Tên</Label>
              <Input id="create-name" {...createForm.register("name")} />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Mật khẩu</Label>
              <Input
                id="create-password"
                type="password"
                {...createForm.register("password")}
              />
              {createForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select
                value={createRole}
                onValueChange={(v) =>
                  createForm.setValue(
                    "role",
                    v as CreateUserFormValues["role"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger aria-label="Vai trò">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {USER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createRole === "student" && (
              <div className="space-y-2">
                <Label htmlFor="create-grade">Lớp</Label>
                <Input
                  id="create-grade"
                  type="number"
                  min={1}
                  max={5}
                  {...createForm.register("grade", {
                    // Ô để trống → "" thô từ DOM. z.coerce.number() sẽ đổi "" thành 0 (không phải
                    // NaN) và 0 < min(1) → lỗi validate dù field optional. Ép "" về undefined ở
                    // đây để .optional() trong schema hoạt động đúng — quan trọng hơn nữa: field
                    // này vẫn "nhớ" giá trị thô kể cả sau khi ẩn đi (đổi role khác student), nên
                    // phải chuẩn hoá ngay từ setValueAs chứ không chỉ dựa vào ẩn UI.
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
                {createForm.formState.errors.grade && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.grade.message}
                  </p>
                )}
              </div>
            )}

            {errorMessage && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Huỷ
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
