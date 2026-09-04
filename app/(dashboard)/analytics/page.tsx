"use client";

import { useState } from "react";
import { Users as UsersIcon, TrendingUp, Percent } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { extractError } from "@/lib/errors";
import { TIME_RANGE_OPTIONS } from "@/lib/analytics/labels";
import { formatPercent, formatNumberVn } from "@/lib/analytics/analytics-format";
import {
  useAnalyticsOverview,
  useActiveLearners,
  useWeeklyMinutes,
  useHourHistogram,
  useSubjectSplit,
  useProblemLessons,
} from "./use-analytics";
import { ActiveLearnersChart } from "./active-learners-chart";
import { WeeklyMinutesChart } from "./weekly-minutes-chart";
import { HourHistogramChart } from "./hour-histogram-chart";
import { SubjectSplitChart } from "./subject-split-chart";
import { ProblemLessonsTable } from "./problem-lessons-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const WEEKLY_MINUTES_WEEKS = 8;

export default function AnalyticsPage() {
  const { hasRole, hydrated } = useAuth();
  const [days, setDays] = useState(30);

  const overviewQuery = useAnalyticsOverview();
  const activeLearnersQuery = useActiveLearners(days);
  const weeklyMinutesQuery = useWeeklyMinutes(WEEKLY_MINUTES_WEEKS);
  const hourHistogramQuery = useHourHistogram(days);
  const subjectSplitQuery = useSubjectSplit(days);
  const problemLessonsQuery = useProblemLessons();

  if (!hydrated) return null;
  if (!hasRole("admin")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const overview = overviewQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo phân tích</h1>
          <p className="text-muted-foreground">
            Thống kê học viên, thời lượng học và nội dung cần chú ý
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4 thẻ tóm tắt: DAU/WAU/MAU + độ chính xác 30 ngày */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={UsersIcon}
          label="Hoạt động hôm nay (DAU)"
          value={overview ? formatNumberVn(overview.dau) : undefined}
          color="text-blue-600"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Hoạt động 7 ngày (WAU)"
          value={overview ? formatNumberVn(overview.wau) : undefined}
          color="text-green-600"
        />
        <SummaryCard
          icon={UsersIcon}
          label="Hoạt động 30 ngày (MAU)"
          value={overview ? formatNumberVn(overview.mau) : undefined}
          color="text-purple-600"
        />
        <SummaryCard
          icon={Percent}
          label="Độ chính xác (30 ngày)"
          value={overview ? formatPercent(overview.accuracyLast30Days) : undefined}
          color="text-amber-600"
        />
      </div>
      {overviewQuery.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {extractError(overviewQuery.error)}
        </div>
      )}

      <ChartSlot query={activeLearnersQuery}>
        {(data) => <ActiveLearnersChart data={data} />}
      </ChartSlot>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSlot query={hourHistogramQuery}>
          {(data) => <HourHistogramChart data={data} />}
        </ChartSlot>
        <ChartSlot query={subjectSplitQuery}>
          {(data) => <SubjectSplitChart data={data} />}
        </ChartSlot>
      </div>

      <ChartSlot query={weeklyMinutesQuery}>
        {(data) => <WeeklyMinutesChart data={data} />}
      </ChartSlot>

      <ChartSlot query={problemLessonsQuery}>
        {(data) => <ProblemLessonsTable data={data} />}
      </ChartSlot>
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
  value: string | undefined;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {value === undefined ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={`text-3xl font-bold ${color}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Bọc chung loading/error cho mọi chart — mỗi endpoint có thể lỗi/đang tải độc lập với các endpoint
// khác, nên KHÔNG gộp isLoading/error của cả trang vào 1 biến duy nhất (1 endpoint lỗi không được
// làm trắng toàn bộ các chart khác đã tải xong).
function ChartSlot<T>({
  query,
  children,
}: {
  query: { data?: T; isLoading: boolean; error: unknown };
  children: (data: T) => React.ReactNode;
}) {
  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }
  if (query.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {extractError(query.error)}
      </div>
    );
  }
  return <>{children(query.data as T)}</>;
}
