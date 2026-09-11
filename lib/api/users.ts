import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type {
  AdminUser,
  AdminUserDetail,
  AuthTokens,
  CreateUserInput,
  MyProfile,
  UpdateMeInput,
  UpdateUserInput,
  UserStats,
  UserStatus,
} from "@/lib/types";

// API tài khoản cá nhân (GĐ1 Settings, "tôi") + CRUD user đầy đủ (GĐ2, admin quản lý user khác)
// gộp chung 1 object usersApi — cùng resource /users, /admin/users trên backend.
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

  // GĐ2 — quản lý người dùng (admin only, khớp @Roles(UserRole.admin) trên toàn bộ admin/users).
  list: (params: {
    q?: string;
    role?: string;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }) =>
    apiGet<{ items: AdminUser[]; total: number; page: number; limit: number }>(
      "/admin/users",
      { params },
    ),
  stats: () => apiGet<UserStats>("/admin/users/stats"),
  get: (id: string) => apiGet<AdminUserDetail>(`/admin/users/${id}`),
  create: (input: CreateUserInput) => apiPost<AdminUser>("/admin/users", input),
  update: (id: string, input: UpdateUserInput) =>
    apiPatch<AdminUser>(`/admin/users/${id}`, input),
  resetPassword: (id: string, newPassword: string) =>
    apiPatch<{ success: boolean }>(`/admin/users/${id}/password`, {
      newPassword,
    }),
  delete: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`/admin/users/${id}`),
  restore: (id: string) => apiPost<AdminUser>(`/admin/users/${id}/restore`),
  // [PLAN.md muc 23 #8] Xoa tien do hoc tap (sao/lich su/SRS/boss). GIU xu, cap, huy hieu,
  // vat pham, va giu nguyen tai khoan. POST chu khong DELETE: day la HANH DONG tren tai
  // nguyen User, khong phai xoa tai nguyen do.
  resetProgress: (id: string) =>
    apiPost<{
      id: string;
      deleted: { progress: number; answerLog: number; reviewQueueItem: number; userBossProgress: number };
      progressResetAt: string;
    }>(`/admin/users/${id}/reset-progress`),
};
