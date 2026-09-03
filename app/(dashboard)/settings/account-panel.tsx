"use client";

// Panel "Tài khoản của tôi" — nhận data/mutation qua props từ page.tsx (không tự gọi hook riêng),
// theo đúng nguyên tắc "page.tsx orchestration, con chỉ nhận props".

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/settings/settings-form";
import type { AuthTokens, MyProfile, UpdateMeInput } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuth } from "@/hooks/use-auth";
import { extractError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordDialog } from "./change-password-dialog";

export function AccountPanel({
  profile,
  isLoadingProfile,
  updateMeMut,
  changePasswordMut,
  logoutAllMut,
}: {
  profile: MyProfile | undefined;
  isLoadingProfile: boolean;
  updateMeMut: UseMutationResult<MyProfile, unknown, UpdateMeInput>;
  changePasswordMut: UseMutationResult<
    AuthTokens,
    unknown,
    { oldPassword: string; newPassword: string }
  >;
  logoutAllMut: UseMutationResult<{ message: string }, unknown, void>;
}) {
  const { logout } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: { name: profile?.name ?? "" },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateMeMut.mutate(
      { name: values.name },
      {
        onSuccess: (data) => {
          useAuthStore.getState().setUser(data);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
        onError: (err) => alert(extractError(err)),
      },
    );
  };

  const handleLogoutAll = () => {
    if (
      !confirm(
        "Đăng xuất khỏi mọi thiết bị? Thao tác này sẽ đăng xuất cả phiên hiện tại trên trình duyệt này.",
      )
    ) {
      return;
    }
    logoutAllMut.mutate(undefined, {
      onSuccess: () => {
        void logout();
      },
      onError: (err) => alert(extractError(err)),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProfile ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ""} disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Tên hiển thị</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              {/* TODO: avatar upload UI — có thể bổ sung sau, API đã sẵn sàng (usersApi.uploadAvatar) */}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={updateMeMut.isPending}>
                  {updateMeMut.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                {saved && (
                  <span className="text-sm text-emerald-600">Đã lưu</span>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bảo mật</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
            Đổi mật khẩu
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={logoutAllMut.isPending}
            onClick={handleLogoutAll}
          >
            {logoutAllMut.isPending
              ? "Đang đăng xuất..."
              : "Đăng xuất khỏi mọi thiết bị"}
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        changePasswordMut={changePasswordMut}
      />
    </div>
  );
}
