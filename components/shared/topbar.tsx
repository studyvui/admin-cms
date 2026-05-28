"use client";

import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const ROLE_LABEL: Record<string, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập",
  qa: "Kiểm duyệt",
  teacher: "Giáo viên",
};

export function Topbar() {
  const { user, logout, hydrated } = useAuth();
  if (!hydrated || !user) return null;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="text-sm text-muted-foreground">
        Xin chào, <span className="font-medium text-foreground">{user.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary">
          {ROLE_LABEL[user.role] ?? user.role}
        </Badge>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}
