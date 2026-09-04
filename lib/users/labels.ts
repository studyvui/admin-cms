// Nhãn hiển thị cho trang Quản lý người dùng (GĐ2). Thuần dữ liệu, không React.
//
// Đây là bộ nhãn ĐẦY ĐỦ 7 role đầu tiên trong repo — components/shared/topbar.tsx hiện chỉ có
// nhãn ngắn cho 4 role (dùng cho 1 Badge nhỏ ở topbar, cố ý khác chuỗi — "Biên tập" thay vì
// "Biên tập viên" — để gọn chỗ); KHÔNG gộp 2 map này để tránh đổi text hiển thị hiện có ở topbar.

import type { UserRole, UserStatus } from "@/lib/types";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  student: "Học sinh",
  parent: "Phụ huynh",
  teacher: "Giáo viên",
  editor: "Biên tập viên",
  admin: "Quản trị viên",
  qa: "Kiểm duyệt viên",
  support: "Hỗ trợ",
};

export const USER_STATUS_LABELS: Record<Exclude<UserStatus, "all">, string> = {
  active: "Đang hoạt động",
  inactive: "Đã khoá",
  deleted: "Đã xoá",
};

export const USER_STATUS_VARIANT: Record<
  Exclude<UserStatus, "all">,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  inactive: "secondary",
  deleted: "destructive",
};

/** Trạng thái hiển thị của 1 user, suy ra từ isActive/deletedAt (không phải field riêng của API). */
export function userStatusOf(user: {
  isActive: boolean;
  deletedAt?: string | null;
}): Exclude<UserStatus, "all"> {
  if (user.deletedAt) return "deleted";
  return user.isActive ? "active" : "inactive";
}
