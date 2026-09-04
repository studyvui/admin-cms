"use client";

// Data layer cho trang Cài đặt — tách từ page.tsx. Mutation CHỈ invalidate (data concern);
// side-effect UI (đóng dialog, setTokens sau đổi mật khẩu, cập nhật user sau đổi tên...) do
// component tự gắn qua `.mutate(input, { onSuccess })`, KHÔNG nằm trong hook này.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api/settings";
import { usersApi } from "@/lib/api/users";
import type { SettingValue, UpdateMeInput } from "@/lib/types";

export function useSettings() {
  const queryClient = useQueryClient();
  const invalidateSettings = () =>
    queryClient.invalidateQueries({ queryKey: ["settings"] });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.list(),
  });
  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => usersApi.myProfile(),
  });

  const updateSettingMut = useMutation({
    mutationFn: ({ key, value }: { key: string; value: SettingValue }) =>
      settingsApi.update(key, value),
    onSuccess: invalidateSettings,
  });

  const updateManyMut = useMutation({
    mutationFn: (items: { key: string; value: SettingValue }[]) =>
      settingsApi.updateMany(items),
    onSuccess: invalidateSettings,
  });

  const updateMeMut = useMutation({
    mutationFn: (input: UpdateMeInput) => usersApi.updateMe(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-profile"] }),
  });

  // Không invalidate gì ở đây — thành công thu hồi TOÀN BỘ token cũ và trả cặp token mới.
  // Component gọi (dialog) PHẢI setTokens(...) trong onSuccess của chính .mutate(), nếu không
  // request kế tiếp dùng access token cũ đã bị thu hồi → 401 → mất phiên ngay sau khi đổi mật khẩu.
  const changePasswordMut = useMutation({
    mutationFn: ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => usersApi.changePassword(oldPassword, newPassword),
  });

  const logoutAllMut = useMutation({
    mutationFn: () => usersApi.logoutAll(),
  });

  return {
    settings: settingsQuery.data,
    isLoadingSettings: settingsQuery.isLoading,
    settingsError: settingsQuery.error,
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    profileError: profileQuery.error,
    updateSettingMut,
    updateManyMut,
    updateMeMut,
    changePasswordMut,
    logoutAllMut,
  };
}
