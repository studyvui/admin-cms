"use client";

import {
  Pencil,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  Star,
} from "lucide-react";
import type { useUsers, UserFilters } from "./use-users";
import type { Dispatch, SetStateAction } from "react";
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_VARIANT,
  userStatusOf,
} from "@/lib/users/labels";
import { trangThaiVip } from "@/lib/users/vip-status";
import type { AdminUser } from "@/lib/types";
import { extractError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type UsersHook = ReturnType<typeof useUsers>;

// Mục 93 Đợt 4c: Card Danh sách tách nguyên văn từ page.tsx. Mutation truyền nguyên đối tượng
// của page.tsx (không sao chép) để các `disabled={…Mut.isPending}` vẫn đọc đúng nguồn.
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN");
}

export function UsersListCard({
  items,
  total,
  page,
  totalPages,
  isLoading,
  error,
  currentUser,
  updateMut,
  deleteMut,
  restoreMut,
  setFilters,
  openEdit,
  openResetPassword,
  setResetTienDoTarget,
  setGrantVipTarget,
  toggleActive,
  handleDelete,
}: {
  items: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: unknown;
  currentUser: { id: string } | null | undefined;
  updateMut: UsersHook["updateMut"];
  deleteMut: UsersHook["deleteMut"];
  restoreMut: UsersHook["restoreMut"];
  setFilters: Dispatch<SetStateAction<UserFilters>>;
  openEdit: (u: AdminUser) => void;
  openResetPassword: (u: AdminUser) => void;
  setResetTienDoTarget: (u: AdminUser) => void;
  setGrantVipTarget: (u: AdminUser) => void;
  toggleActive: (u: AdminUser) => void;
  handleDelete: (u: AdminUser) => void;
}) {
  return (
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
                <TableHead>VIP đến ngày</TableHead>
                <TableHead className="w-40 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((u) => {
                const status = userStatusOf(u);
                const isSelf = !!currentUser && currentUser.id === u.id;
                const vip = trangThaiVip(u.vipUntil, new Date());
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
                    {/* [PLAN.md muc 25 #3] Goi DA HET HAN van hien (mo + nhan "hết hạn")
                        thay vi an di — de admin biet ai can moi gia han. */}
                    <TableCell className="text-xs">
                      {!vip.conHan && vip.soNgayConLai === null && vip.nhan === "—" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : vip.conHan ? (
                        <span>
                          {vip.nhan}{" "}
                          <span className="text-muted-foreground">
                            (còn {vip.soNgayConLai} ngày)
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {vip.nhan}{" "}
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            hết hạn
                          </Badge>
                        </span>
                      )}
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
                        {/* [PLAN.md muc 23 #8] Chi hoc sinh moi co tien do hoc tap de reset. */}
                        {u.role === "student" && status !== "deleted" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reset tiến độ học tập"
                            onClick={() => setResetTienDoTarget(u)}
                          >
                            <RotateCcw className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        {/* [PLAN.md muc 25] Kich hoat VIP thu cong — chi hoc sinh moi mua VIP. */}
                        {u.role === "student" && status !== "deleted" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Kích hoạt VIP"
                            onClick={() => setGrantVipTarget(u)}
                          >
                            <Star className="h-4 w-4 text-amber-500" />
                          </Button>
                        )}
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
  );
}
