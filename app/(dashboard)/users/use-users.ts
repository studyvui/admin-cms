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

  const statsQuery = useQuery({
    queryKey: ["admin-users-stats"],
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
  };
}
