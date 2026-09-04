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
import type { HourHistogramPoint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatHourLabel, formatNumberVn } from "@/lib/analytics/analytics-format";

export function HourHistogramChart({ data }: { data: HourHistogramPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Khung giờ hoạt động (giờ Việt Nam)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={formatHourLabel} fontSize={11} interval={1} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip
                labelFormatter={(label) => formatHourLabel(Number(label))}
                formatter={(v) => [v, "Lượt trả lời"]}
              />
              <Bar dataKey="answers" fill="#7c3aed" radius={[4, 4, 0, 0]} />
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
                <th className="py-1">Giờ</th>
                <th className="py-1 text-right">Lượt trả lời</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.hour} className="border-t">
                  <td className="py-1">{formatHourLabel(row.hour)}</td>
                  <td className="py-1 text-right">{formatNumberVn(row.answers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  );
}
