"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Clock,
  XCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { questionsApi } from "@/lib/api/questions";
import { extractError } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";

const DAY_RANGES = [
  { value: "7", label: "7 ngày qua" },
  { value: "14", label: "14 ngày qua" },
  { value: "30", label: "30 ngày qua" },
  { value: "60", label: "60 ngày qua" },
  { value: "90", label: "90 ngày qua" },
];

function formatDay(iso: string) {
  const d = new Date(iso);
  const dow = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
  return `${dow} ${d.getDate()}/${d.getMonth() + 1}`;
}

export default function MyStatsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState("30");

  const statsQuery = useQuery({
    queryKey: ["my-stats", days],
    queryFn: () => questionsApi.myStats(parseInt(days, 10)),
  });

  const totals = useMemo(() => {
    const rows = statsQuery.data ?? [];
    return rows.reduce(
      (acc, r) => ({
        created: acc.created + r.created,
        approved: acc.approved + r.approved + r.published,
        review: acc.review + r.review,
        rejected: acc.rejected + r.rejected,
        draftNew: acc.draftNew + r.draftNew,
      }),
      { created: 0, approved: 0, review: 0, rejected: 0, draftNew: 0 },
    );
  }, [statsQuery.data]);

  const approvalRate = totals.created > 0
    ? Math.round((totals.approved / totals.created) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="h-6 w-6" />
            Năng suất của tôi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thống kê câu hỏi <span className="font-medium">{user?.name}</span>{" "}
            tạo, nhóm theo ngày.{" "}
            <em>Đã duyệt</em> = approved + published.{" "}
            <em>Bị trả lại</em> = câu từng được chuyển duyệt nhưng admin trả về Nháp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => statsQuery.refetch()}
            disabled={statsQuery.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${statsQuery.isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          icon={FileText}
          label="Tổng tạo"
          value={totals.created}
          color="text-blue-600"
          loading={statsQuery.isLoading}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Đã duyệt"
          value={totals.approved}
          color="text-green-600"
          sub={`${approvalRate}% tỉ lệ duyệt`}
          loading={statsQuery.isLoading}
        />
        <SummaryCard
          icon={Clock}
          label="Đang chờ"
          value={totals.review}
          color="text-amber-600"
          loading={statsQuery.isLoading}
        />
        <SummaryCard
          icon={XCircle}
          label="Bị trả lại"
          value={totals.rejected}
          color="text-red-600"
          sub="Cần sửa lại"
          loading={statsQuery.isLoading}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Còn ở Nháp"
          value={totals.draftNew}
          color="text-gray-600"
          sub="Chưa submit"
          loading={statsQuery.isLoading}
        />
      </div>

      {/* Daily table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết theo ngày</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {statsQuery.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : statsQuery.error ? (
            <p className="px-6 py-8 text-center text-sm text-destructive">
              {extractError(statsQuery.error)}
            </p>
          ) : (statsQuery.data ?? []).length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Chưa có câu hỏi nào trong {days} ngày qua. Vào{" "}
              <a href="/questions" className="text-primary underline">
                Câu hỏi
              </a>{" "}
              để bắt đầu soạn.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Ngày</TableHead>
                  <TableHead className="text-right">Tạo</TableHead>
                  <TableHead className="text-right">Đã duyệt</TableHead>
                  <TableHead className="text-right">Đã xuất bản</TableHead>
                  <TableHead className="text-right">Chờ duyệt</TableHead>
                  <TableHead className="text-right">Bị trả lại</TableHead>
                  <TableHead className="text-right">Còn Nháp</TableHead>
                  <TableHead className="text-right">Tỉ lệ duyệt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(statsQuery.data ?? []).map((r) => {
                  const approvedTotal = r.approved + r.published;
                  const rate = r.created > 0
                    ? Math.round((approvedTotal / r.created) * 100)
                    : 0;
                  return (
                    <TableRow key={r.day}>
                      <TableCell className="font-medium">
                        {formatDay(r.day)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {r.created}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        {r.approved}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        {r.published}
                      </TableCell>
                      <TableCell className="text-right text-amber-700">
                        {r.review}
                      </TableCell>
                      <TableCell className="text-right text-red-700">
                        {r.rejected}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.draftNew}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-xs font-semibold ${
                            rate >= 80
                              ? "text-green-700"
                              : rate >= 50
                                ? "text-amber-700"
                                : "text-red-700"
                          }`}
                        >
                          {rate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  loading,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  sub?: string;
  color: string;
  loading: boolean;
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
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={`text-3xl font-bold ${color}`}>{value}</div>
        )}
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
