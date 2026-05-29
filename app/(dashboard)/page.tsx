"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  ListChecks,
  FileQuestion,
  Activity,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { qaApi } from "@/lib/api/qa";
import { extractError } from "@/lib/errors";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  review: "Chờ duyệt",
  approved: "Đã duyệt",
  published: "Xuất bản",
  archived: "Lưu trữ",
  deprecated: "Ngừng dùng",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-200 text-gray-800",
  review: "bg-amber-100 text-amber-900",
  approved: "bg-blue-100 text-blue-900",
  published: "bg-green-100 text-green-900",
  archived: "bg-red-100 text-red-900",
  deprecated: "bg-red-100 text-red-900",
};

export default function DashboardHome() {
  const { user, hydrated, hasRole } = useAuth();
  const canSeeAdminData = hasRole("admin", "qa");

  const overviewQuery = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => qaApi.getOverview(),
    enabled: canSeeAdminData,
  });

  const queueQuery = useQuery({
    queryKey: ["dashboard", "review-queue-mini"],
    queryFn: () => qaApi.getReviewQueue(),
    enabled: canSeeAdminData,
  });

  if (!hydrated) return null;

  const o = overviewQuery.data;
  const q = queueQuery.data;
  const refreshing = overviewQuery.isFetching || queueQuery.isFetching;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground">
            Xin chào, <span className="font-medium">{user?.name}</span> — vai
            trò <span className="font-mono">{user?.role}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            overviewQuery.refetch();
            queueQuery.refetch();
          }}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {!canSeeAdminData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4 text-sm text-blue-900">
            Chào mừng <strong>{user?.name}</strong>! Anh/chị vào{" "}
            <Link href="/lessons" className="font-medium underline">
              Bài học
            </Link>{" "}
            hoặc{" "}
            <Link href="/questions" className="font-medium underline">
              Câu hỏi
            </Link>{" "}
            để bắt đầu soạn nội dung. Sau khi tạo xong, bấm{" "}
            <strong>Chuyển duyệt</strong> để admin xét duyệt.
          </CardContent>
        </Card>
      )}

      {canSeeAdminData && overviewQuery.error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-sm text-destructive">
            Lỗi tải overview: {extractError(overviewQuery.error)}
          </CardContent>
        </Card>
      )}

      {canSeeAdminData && (
      <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Người dùng"
          value={o?.users.total}
          sub={
            o ? `${o.users.activeLast7Days} active 7 ngày` : undefined
          }
          loading={overviewQuery.isLoading}
        />
        <StatCard
          icon={BookOpen}
          label="Khoá học"
          value={o?.content.courses}
          sub="Đang hoạt động"
          loading={overviewQuery.isLoading}
        />
        <StatCard
          icon={Activity}
          label="Lượt trả lời hôm nay"
          value={o?.activity.answersToday}
          sub="answerLog từ 0h"
          loading={overviewQuery.isLoading}
        />
        <StatCard
          icon={CreditCard}
          label="Subscription active"
          value={o?.business.activeSubscriptions}
          sub="Đang trả phí"
          loading={overviewQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentBreakdownCard
          icon={ListChecks}
          title="Bài học"
          total={o?.content.lessons.total}
          byStatus={o?.content.lessons.byStatus}
          loading={overviewQuery.isLoading}
          hrefAll="/lessons"
        />
        <ContentBreakdownCard
          icon={FileQuestion}
          title="Câu hỏi"
          total={o?.content.questions.total}
          byStatus={o?.content.questions.byStatus}
          loading={overviewQuery.isLoading}
          hrefAll="/questions"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Hàng đợi QA
          </CardTitle>
          <Link
            href="/qa/queue"
            className="text-xs text-primary hover:underline"
          >
            Mở QA Queue →
          </Link>
        </CardHeader>
        <CardContent>
          {queueQuery.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : queueQuery.error ? (
            <p className="text-sm text-destructive">
              {extractError(queueQuery.error)}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <QueueMiniBox
                label="Bài học chờ duyệt"
                count={q?.lessonsForReview.length ?? 0}
                href="/qa/queue"
              />
              <QueueMiniBox
                label="Câu hỏi chờ duyệt"
                count={q?.questionsForReview.length ?? 0}
                href="/qa/queue"
              />
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  sub?: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-bold">{value ?? "—"}</div>
        )}
        {sub && (
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ContentBreakdownCard({
  icon: Icon,
  title,
  total,
  byStatus,
  loading,
  hrefAll,
}: {
  icon: LucideIcon;
  title: string;
  total: number | undefined;
  byStatus: Record<string, number> | undefined;
  loading: boolean;
  hrefAll: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
        <Link
          href={hrefAll}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Xem tất cả <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            <div className="mb-3 text-3xl font-bold">{total ?? 0}</div>
            <div className="flex flex-wrap gap-2">
              {byStatus &&
              Object.entries(byStatus).filter(([, v]) => v > 0).length > 0 ? (
                Object.entries(byStatus)
                  .filter(([, v]) => v > 0)
                  .map(([status, count]) => (
                    <Badge
                      key={status}
                      variant="outline"
                      className={STATUS_COLOR[status] ?? ""}
                    >
                      {STATUS_LABEL[status] ?? status}: {count}
                    </Badge>
                  ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  Chưa có dữ liệu
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QueueMiniBox({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-accent"
    >
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">
          {count === 0 ? "Trống — không cần xử lý" : "Bấm để xử lý"}
        </div>
      </div>
      <div
        className={`text-3xl font-bold ${
          count > 0 ? "text-amber-600" : "text-muted-foreground"
        }`}
      >
        {count}
      </div>
    </Link>
  );
}
