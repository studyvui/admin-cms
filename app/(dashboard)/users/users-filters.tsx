"use client";

import type { Dispatch, SetStateAction } from "react";
import type { UserFilters } from "./use-users";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/users/labels";
import { USER_ROLES } from "@/lib/users/user-form";
import type { UserRole, UserStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mục 93 Đợt 4c: Card Bộ lọc tách nguyên văn từ page.tsx (state vẫn ở page.tsx).
const ALL_ROLES = "__all__";

export function UsersFilters({
  qInput,
  setQInput,
  filters,
  setFilters,
}: {
  qInput: string;
  setQInput: (v: string) => void;
  filters: UserFilters;
  setFilters: Dispatch<SetStateAction<UserFilters>>;
}) {
  return (
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
  );
}
