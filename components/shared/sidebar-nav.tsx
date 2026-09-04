"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  ListChecks,
  Upload,
  ShieldCheck,
  History,
  Sparkles,
  Calculator,
  Settings,
  FolderOpen,
  BarChart3,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// 4 nhóm cho GĐ1 Settings: "Tổng quan" tách riêng ở đầu (Dashboard + số liệu cá nhân — khác
// concern với quản lý nội dung), "Bảng tin"/"Phân tích" CHƯA thêm vì trang chưa tồn tại (GĐ sau).
// href/icon/roles của từng mục giữ NGUYÊN VẸN so với danh sách phẳng cũ — chỉ gom nhóm hiển thị.
const NAV_SECTIONS: NavSection[] = [
  {
    title: "Tổng quan",
    items: [
      { href: "/", label: "Tổng quan", icon: LayoutDashboard, roles: ["admin", "editor", "qa"] },
      { href: "/my-stats", label: "Năng suất của tôi", icon: BarChart3, roles: ["admin", "editor", "qa"] },
    ],
  },
  {
    title: "Nội dung",
    items: [
      { href: "/courses", label: "Khoá học", icon: BookOpen, roles: ["admin"] },
      { href: "/lessons", label: "Bài học", icon: ListChecks, roles: ["admin", "editor", "qa"] },
      { href: "/questions", label: "Câu hỏi", icon: FileQuestion, roles: ["admin", "editor", "qa"] },
      { href: "/assets", label: "Kho asset", icon: FolderOpen, roles: ["admin", "editor", "qa"] },
      { href: "/bulk-import", label: "Import Excel", icon: Upload, roles: ["admin", "editor"] },
      { href: "/ai-generate", label: "AI Sinh đề Tiếng Anh", icon: Sparkles, roles: ["admin", "editor"] },
      { href: "/ai-generate-math", label: "AI Sinh đề Toán", icon: Calculator, roles: ["admin", "editor"] },
    ],
  },
  {
    title: "Kiểm duyệt",
    items: [
      { href: "/qa/queue", label: "QA Queue", icon: ShieldCheck, roles: ["admin", "qa"] },
      { href: "/qa/audit", label: "Audit Log", icon: History, roles: ["admin", "qa"] },
    ],
  },
  {
    title: "Quản trị",
    items: [
      { href: "/users", label: "Người dùng", icon: Users, roles: ["admin"] },
      { href: "/settings", label: "Cài đặt", icon: Settings, roles: ["admin"] },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname() ?? "/";
  const { hasRole, hydrated } = useAuth();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_SECTIONS.map((section) => {
        const visibleCount = section.items.filter((i) =>
          hasRole(...i.roles),
        ).length;
        if (hydrated && visibleCount === 0) return null;
        return (
          <div key={section.title}>
            <h3 className="px-3 pt-4 pb-1 text-xs font-semibold uppercase text-muted-foreground">
              {section.title}
            </h3>
            {section.items.map((item) => {
              if (hydrated && !hasRole(...item.roles)) return null;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
