import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { AuthTokens, MyProfile, UpdateMeInput } from "@/lib/types";

// API tài khoản cá nhân (GĐ1 Settings) — CHỈ phần "tôi" (me). CRUD user đầy đủ (admin quản lý
// user khác) thuộc Giai đoạn 2, không làm ở đây.
export const usersApi = {
  myProfile: () => apiGet<MyProfile>("/users/me/profile"),
  updateMe: (input: UpdateMeInput) => apiPatch<MyProfile>("/users/me", input),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiPost<{ avatarUrl: string }>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  changePassword: (oldPassword: string, newPassword: string) =>
    apiPost<AuthTokens>("/auth/change-password", { oldPassword, newPassword }),
  logoutAll: () => apiPost<{ message: string }>("/auth/logout-all"),
};
