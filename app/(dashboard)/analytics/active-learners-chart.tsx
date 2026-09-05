"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ActiveLearnerPoint, ActiveLearnerDetailItem } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumberVn, formatPercent } from "@/lib/analytics/analytics-format";
import { SUBJECT_LABELS } from "@/lib/analytics/labels";
import { extractError } from "@/lib/errors";
import { Skeleton } from "@/components/ui/skeleton";

function formatDayLabel(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

interface ActiveLearnersChartProps {
  data: ActiveLearnerPoint[];
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  // Cùng hình dạng {data?, isLoading, error} với `query` của ChartSlot (page.tsx) — nhất quán cách
  // truyền trạng thái 1 query cho component con thay vì tách rời 3 prop riêng lẻ.
  detailQuery: {
    data?: ActiveLearnerDetailItem[];
    isLoading: boolean;
    error: unknown;
  };
}

export function ActiveLearnersChart({
  data,
  selectedDay,
  onSelectDay,
  detailQuery,
}: ActiveLearnersChartProps) {
  const { data: detail, isLoading: detailLoading, error: detailError } = detailQuery;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Học viên hoạt động theo ngày</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={formatDayLabel} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip
                labelFormatter={(label) => formatDayLabel(String(label))}
                formatter={(v) => [v, "Học viên"]}
              />
              <Bar
                dataKey="learners"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(entry: { payload?: { day?: string } }) => {
                  const day = entry?.payload?.day;
                  if (day) onSelectDay(day);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Xem số liệu
          </summary>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Ngày</th>
                <th className="py-1 text-right">Học viên hoạt động</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.day} className="border-t">
                  <td className="py-1">{formatDayLabel(row.day)}</td>
                  <td className="py-1 text-right">{formatNumberVn(row.learners)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>

        {selectedDay && (
          <div className="mt-4 rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">
                Học viên hoạt động ngày {formatDayLabel(selectedDay)}
              </p>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => onSelectDay(selectedDay)}
              >
                Đóng
              </button>
            </div>
            {detailLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : detailError ? (
              <p className="text-sm text-destructive">{extractError(detailError)}</p>
            ) : !detail || detail.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Không có học viên nào hoạt động trong ngày này.
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1">Tên</th>
                    <th className="py-1">Email</th>
                    <th className="py-1 text-right">Số câu</th>
                    <th className="py-1 text-right">Độ chính xác</th>
                    <th className="py-1">Môn chủ yếu</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="py-1">{d.name}</td>
                      <td className="py-1">{d.email}</td>
                      <td className="py-1 text-right">{formatNumberVn(d.answers)}</td>
                      <td className="py-1 text-right">{formatPercent(d.accuracy)}</td>
                      <td className="py-1">{SUBJECT_LABELS[d.mainSubject] ?? d.mainSubject}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
