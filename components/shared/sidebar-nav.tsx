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
  Settings,
  FolderOpen,
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

const NAV: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard, roles: ["admin", "editor", "qa"] },
  { href: "/courses", label: "Khoá học", icon: BookOpen, roles: ["admin"] },
  { href: "/lessons", label: "Bài học", icon: ListChecks, roles: ["admin", "editor", "qa"] },
  { href: "/questions", label: "Câu hỏi", icon: FileQuestion, roles: ["admin", "editor", "qa"] },
  { href: "/assets", label: "Kho asset", icon: FolderOpen, roles: ["admin", "editor", "qa"] },
  { href: "/bulk-import", label: "Import Excel", icon: Upload, roles: ["admin", "editor"] },
  { href: "/qa/queue", label: "QA Queue", icon: ShieldCheck, roles: ["admin", "qa"] },
  { href: "/qa/audit", label: "Audit Log", icon: History, roles: ["admin", "qa"] },
  { href: "/ai-generate", label: "AI Generate", icon: Sparkles, roles: ["admin", "editor"] },
  { href: "/settings", label: "Cài đặt", icon: Settings, roles: ["admin"] },
];

export function SidebarNav() {
  const pathname = usePathname() ?? "/";
  const { hasRole, hydrated } = useAuth();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
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
    </nav>
  );
}
