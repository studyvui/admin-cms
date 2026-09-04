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
import type { ActiveLearnerPoint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumberVn } from "@/lib/analytics/analytics-format";

function formatDayLabel(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function ActiveLearnersChart({ data }: { data: ActiveLearnerPoint[] }) {
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
              <Bar dataKey="learners" fill="#2563eb" radius={[4, 4, 0, 0]} />
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
      </CardContent>
    </Card>
  );
}
