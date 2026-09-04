"use client";

// Dialog "Đặt lại mật khẩu" cho 1 user khác (khác change-password-dialog.tsx GĐ1 — dialog đó đổi
// mật khẩu CỦA CHÍNH MÌNH và có bẫy setTokens; ở đây admin đặt hộ mật khẩu cho user khác, không
// đụng tới token/phiên của admin nên không cần setTokens).
//
// Cùng nguyên tắc GĐ1: mọi đường đóng đi qua handleClose() duy nhất — reset form + reset lỗi
// mutation cũ, vì Radix Dialog không unmount instance giữa các lần mở.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  resetPasswordSchema,
  toResetPasswordPayload,
  type ResetPasswordFormValues,
} from "@/lib/users/user-form";
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

export function ResetPasswordDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserLabel,
  resetPasswordMut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string | null;
  targetUserLabel?: string;
  resetPasswordMut: UseMutationResult<
    { success: boolean },
    unknown,
    { id: string; newPassword: string }
  >;
}) {
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  });

  const handleClose = () => {
    onOpenChange(false);
    reset();
    resetPasswordMut.reset();
    setDone(false);
  };

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!targetUserId) return;
    const { newPassword } = toResetPasswordPayload(values);
    resetPasswordMut.mutate(
      { id: targetUserId, newPassword },
      {
        onSuccess: () => {
          reset();
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogDescription>
            {targetUserLabel
              ? `Đặt mật khẩu mới cho ${targetUserLabel}.`
              : "Đặt mật khẩu mới cho người dùng này."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          {!!resetPasswordMut.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {extractError(resetPasswordMut.error)}
            </p>
          )}

          <DialogFooter className="items-center">
            {done && (
              <span className="mr-auto text-sm text-emerald-600">
                Đã đặt lại mật khẩu
              </span>
            )}
            <Button type="button" variant="outline" onClick={handleClose}>
              Đóng
            </Button>
            <Button type="submit" disabled={resetPasswordMut.isPending}>
              {resetPasswordMut.isPending ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
