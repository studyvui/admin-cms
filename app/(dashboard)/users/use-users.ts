"use client";

// Data layer cho trang Quản lý người dùng — tách từ page.tsx. Per-entity (KHÔNG generic).
// Mỗi mutation chỉ lo invalidate (data concern); side-effect UI (đóng dialog, thông báo...) do
// component tự gắn qua per-call `.mutate(input, { onSuccess })`.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import type { UpdateUserInput, UserRole, UserStatus } from "@/lib/types";

export interface UserFilters {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export function useUsers(filters: UserFilters) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const usersQuery = useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => usersApi.list(filters),
  });

  // Key CON của "admin-users" (không phải key "anh em" đứng riêng) — để invalidate({queryKey:
  // ["admin-users"]}) tự động phủ luôn theo cơ chế prefix-match của TanStack Query. Trước đây
  // dùng key rời ["admin-users-stats"] nên không bao giờ bị invalidate cùng, khiến 4 thẻ thống
  // kê hiện số CŨ sau khi tạo/khoá/xoá/khôi phục user (staleTime 30s ở app/providers.tsx càng
  // che giấu bug này lâu hơn).
  const statsQuery = useQuery({
    queryKey: ["admin-users", "stats"],
    queryFn: () => usersApi.stats(),
  });

  const createMut = useMutation({
    mutationFn: usersApi.create,
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersApi.update(id, input),
    onSuccess: invalidate,
  });

  // KHÔNG invalidate danh sách/stats — đổi mật khẩu không đổi dữ liệu hiển thị nào ở bảng.
  const resetPasswordMut = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersApi.resetPassword(id, newPassword),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: invalidate,
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => usersApi.restore(id),
    onSuccess: invalidate,
  });

  // [PLAN.md muc 23 #8] Xoa tien do -> bang/stats co the doi (vd cot "hoat dong gan nhat")
  // nen invalidate nhu delete/restore.
  const resetProgressMut = useMutation({
    mutationFn: (id: string) => usersApi.resetProgress(id),
    onSuccess: invalidate,
  });

  return {
    users: usersQuery.data,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    stats: statsQuery.data,
    createMut,
    updateMut,
    resetPasswordMut,
    deleteMut,
    restoreMut,
    resetProgressMut,
  };
}
