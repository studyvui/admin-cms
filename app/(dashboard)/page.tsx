"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardHome() {
  const { user, hydrated } = useAuth();
  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground">
          Hệ thống quản trị nội dung StudyVui
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Đã đăng nhập</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{user?.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vai trò: <span className="font-mono">{user?.role}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Backend API</CardTitle>
            <CardDescription>Trạng thái kết nối</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-primary">
              {process.env.NEXT_PUBLIC_API_URL ?? "(default api.studyvui.vn)"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Phase</CardTitle>
            <CardDescription>Tiến độ build</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">Phase 1 ✓</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bootstrap · Auth · Layout
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Các bước tiếp theo</CardTitle>
          <CardDescription>
            Build CMS theo PLAN/BACKEND/ke_hoach_admin_cms_nextjs.html
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>Phase 2 — CRUD Courses / Lessons / Questions (Math + English)</li>
            <li>Phase 3 — Asset Picker (R2 image/audio browser)</li>
            <li>Phase 4 — Bulk import Excel</li>
            <li>Phase 5 — QA Workflow + Audit Log viewer</li>
            <li>Phase 6 — Dashboard reports</li>
            <li>Phase 7 — AI Generate (disabled, chờ GD10)</li>
            <li>Phase 8 — Deploy Vercel + E2E test</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
