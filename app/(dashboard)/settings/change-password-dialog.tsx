"use client";

// Dialog đổi mật khẩu — cấu trúc Dialog + react-hook-form theo mẫu question-dialog.tsx.
//
// ⚠️ Bẫy quan trọng: POST /auth/change-password thu hồi TOÀN BỘ refresh token hiện có và trả
// cặp token MỚI. onSuccess ở đây PHẢI gọi setTokens(...) trước khi đóng dialog, nếu không request
// kế tiếp của admin dùng access token cũ đã bị thu hồi → 401 → bị đăng xuất ngay sau khi vừa đổi
// mật khẩu thành công.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  passwordSchema,
  toChangePasswordPayload,
  type PasswordFormValues,
} from "@/lib/settings/settings-form";
import type { AuthTokens } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { extractError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ChangePasswordDialog({
  open,
  onOpenChange,
  changePasswordMut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changePasswordMut: UseMutationResult<
    AuthTokens,
    unknown,
    { oldPassword: string; newPassword: string }
  >;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  // Dialog KHÔNG unmount giữa các lần mở/đóng (Radix giữ instance) — phải tự dọn form + lỗi mutation
  // cũ mỗi lần đóng, dù đóng bằng Huỷ, submit thành công, hay Radix tự đóng (Esc/click ra ngoài).
  // Nếu chỉ gọi onOpenChange(false) suông: field mật khẩu cũ còn nguyên khi mở lại, và lỗi đổi mật
  // khẩu lần trước (changePasswordMut.error) hiện lại ngay dù người dùng chưa submit gì mới.
  const handleClose = () => {
    onOpenChange(false);
    reset();
    changePasswordMut.reset();
  };

  const onSubmit = (values: PasswordFormValues) => {
    const payload = toChangePasswordPayload(values);
    changePasswordMut.mutate(payload, {
      onSuccess: (data) => {
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        handleClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>
            Sau khi đổi, tất cả phiên đăng nhập khác trên các thiết bị khác sẽ vẫn giữ nguyên;
            chỉ token của phiên này được làm mới tự động.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
            <Input
              id="oldPassword"
              type="password"
              {...register("oldPassword")}
            />
            {errors.oldPassword && (
              <p className="text-xs text-destructive">
                {errors.oldPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {!!changePasswordMut.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {extractError(changePasswordMut.error)}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={changePasswordMut.isPending}>
              {changePasswordMut.isPending ? "Đang lưu..." : "Đổi mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
