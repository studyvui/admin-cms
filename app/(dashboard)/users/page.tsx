"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useUsers, type UserFilters } from "./use-users";
import { UserDialog } from "./user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { ResetProgressDialog } from "./reset-progress-dialog";
import { GrantVipDialog } from "./grant-vip-dialog";
import { UsersSummaryCards } from "./users-summary-cards";
import { UsersFilters } from "./users-filters";
import { UsersListCard } from "./users-list-card";
import type { AdminUser } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const PAGE_LIMIT = 20;

export default function UsersPage() {
  const { hasRole, hydrated, user: currentUser } = useAuth();

  const [qInput, setQInput] = useState("");
  const [filters, setFilters] = useState<UserFilters>({
    status: "active",
    page: 1,
    limit: PAGE_LIMIT,
  });

  // Debounce ô tìm kiếm 300ms — tránh gọi API mỗi phím gõ.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, q: qInput.trim() || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  // [PLAN.md muc 23 #8] Muc tieu cua dialog "Reset tien do hoc tap" (khac resetTarget o tren
  // — do la dialog doi mat khau).
  const [resetTienDoTarget, setResetTienDoTarget] = useState<AdminUser | null>(null);
  // [PLAN.md muc 25] Muc tieu cua dialog "Kich hoat VIP".
  const [grantVipTarget, setGrantVipTarget] = useState<AdminUser | null>(null);

  const {
    users,
    isLoading,
    error,
    stats,
    createMut,
    updateMut,
    resetPasswordMut,
    resetProgressMut,
    grantVipMut,
    deleteMut,
    restoreMut,
  } = useUsers(filters);

  if (!hydrated) return null;
  if (!hasRole("admin")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const items = users?.items ?? [];
  const total = users?.total ?? 0;
  const limit = users?.limit ?? filters.limit ?? PAGE_LIMIT;
  const page = users?.page ?? filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };
  const openEdit = (u: AdminUser) => {
    // updateMut dùng CHUNG cho cả nút Khoá/Mở khoá ở bảng lẫn form Sửa — nếu 1 lần Khoá/Mở khoá
    // trước đó fail (lỗi mạng/403), updateMut.error còn sót lại sẽ hiện NHẦM thành banner lỗi
    // ngay khi mở dialog Sửa cho 1 user khác, dù chưa submit gì mới. Reset trước khi mở.
    updateMut.reset();
    setEditingUser(u);
    setDialogOpen(true);
  };
  const openResetPassword = (u: AdminUser) => {
    setResetTarget(u);
    setResetOpen(true);
  };

  const toggleActive = (u: AdminUser) => {
    if (u.isActive) {
      if (!confirm(`Khoá tài khoản "${u.email}"?`)) return;
      updateMut.mutate({ id: u.id, input: { isActive: false } });
    } else {
      updateMut.mutate({ id: u.id, input: { isActive: true } });
    }
  };

  const handleDelete = (u: AdminUser) => {
    if (
      !confirm(`Xoá người dùng "${u.email}"? Có thể khôi phục lại sau.`)
    ) {
      return;
    }
    deleteMut.mutate(u.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Người dùng</h1>
          <p className="text-muted-foreground">
            Quản lý tài khoản, vai trò và trạng thái người dùng
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* 4 thẻ tóm tắt */}
      <UsersSummaryCards stats={stats} />

      <UsersFilters
        qInput={qInput}
        setQInput={setQInput}
        filters={filters}
        setFilters={setFilters}
      />

      <UsersListCard
        items={items}
        total={total}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        error={error}
        currentUser={currentUser}
        updateMut={updateMut}
        deleteMut={deleteMut}
        restoreMut={restoreMut}
        setFilters={setFilters}
        openEdit={openEdit}
        openResetPassword={openResetPassword}
        setResetTienDoTarget={setResetTienDoTarget}
        setGrantVipTarget={setGrantVipTarget}
        toggleActive={toggleActive}
        handleDelete={handleDelete}
      />

      <UserDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingUser(null);
        }}
        editing={editingUser}
        disableRoleChange={
          !!editingUser && !!currentUser && editingUser.id === currentUser.id
        }
        createMut={createMut}
        updateMut={updateMut}
      />

      <ResetProgressDialog
        open={!!resetTienDoTarget}
        onOpenChange={(o) => {
          if (!o) setResetTienDoTarget(null);
        }}
        targetUserId={resetTienDoTarget?.id ?? null}
        targetUserEmail={resetTienDoTarget?.email ?? null}
        targetUserName={resetTienDoTarget?.name ?? null}
        resetProgressMut={resetProgressMut}
      />

      <GrantVipDialog
        open={!!grantVipTarget}
        onOpenChange={(o) => {
          if (!o) setGrantVipTarget(null);
        }}
        targetUserId={grantVipTarget?.id ?? null}
        targetUserName={grantVipTarget?.name ?? null}
        grantVipMut={grantVipMut}
      />

      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={(o) => {
          setResetOpen(o);
          if (!o) setResetTarget(null);
        }}
        targetUserId={resetTarget?.id ?? null}
        targetUserLabel={resetTarget?.email}
        resetPasswordMut={resetPasswordMut}
      />
    </div>
  );
}
