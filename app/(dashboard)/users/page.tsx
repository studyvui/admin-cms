"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  Users as UsersIcon,
  UserCheck,
  UserX,
  UserPlus,
} from "lucide-react";
import { useUsers, type UserFilters } from "./use-users";
import { UserDialog } from "./user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_VARIANT,
  userStatusOf,
} from "@/lib/users/labels";
import { USER_ROLES } from "@/lib/users/user-form";
import type { AdminUser, UserRole, UserStatus } from "@/lib/types";
import { extractError } from "@/lib/errors";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ALL_ROLES = "__all__";
const PAGE_LIMIT = 20;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN");
}

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

  const {
    users,
    isLoading,
    error,
    stats,
    createMut,
    updateMut,
    resetPasswordMut,
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={UsersIcon}
          label="Tổng số"
          value={stats?.total}
          color="text-blue-600"
        />
        <SummaryCard
          icon={UserCheck}
          label="Đang hoạt động"
          value={stats?.active}
          color="text-green-600"
        />
        <SummaryCard
          icon={UserX}
          label="Đã khoá"
          value={stats?.inactive}
          color="text-amber-600"
        />
        <SummaryCard
          icon={UserPlus}
          label="Mới trong 30 ngày"
          value={stats?.newLast30Days}
          color="text-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs">Tìm kiếm</Label>
              <Input
                placeholder="Email hoặc tên..."
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Vai trò</Label>
              <Select
                value={filters.role ?? ALL_ROLES}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    role: v === ALL_ROLES ? undefined : (v as UserRole),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ROLES}>Tất cả</SelectItem>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {USER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Trạng thái</Label>
              <Select
                value={filters.status ?? "active"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    status: v as UserStatus,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    {USER_STATUS_LABELS.active}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {USER_STATUS_LABELS.inactive}
                  </SelectItem>
                  <SelectItem value="deleted">
                    {USER_STATUS_LABELS.deleted}
                  </SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách ({total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {extractError(error)}
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Không có người dùng khớp bộ lọc.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-40 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => {
                  const status = userStatusOf(u);
                  const isSelf = !!currentUser && currentUser.id === u.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {USER_ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={USER_STATUS_VARIANT[status]}>
                          {USER_STATUS_LABELS[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Sửa người dùng"
                            onClick={() => openEdit(u)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Đặt lại mật khẩu"
                            onClick={() => openResetPassword(u)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {!isSelf && status !== "deleted" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={updateMut.isPending}
                              title={u.isActive ? "Khoá tài khoản" : "Mở khoá tài khoản"}
                              onClick={() => toggleActive(u)}
                            >
                              {u.isActive ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {!isSelf && status !== "deleted" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deleteMut.isPending}
                              title="Xoá người dùng"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(u)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {status === "deleted" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={restoreMut.isPending}
                              title="Khôi phục"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => restoreMut.mutate(u.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {!isLoading && !error && items.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Trang {page} / {totalPages} · Tổng {total} người dùng
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
                }
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                }
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

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

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: number | undefined;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {value === undefined ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={`text-3xl font-bold ${color}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
