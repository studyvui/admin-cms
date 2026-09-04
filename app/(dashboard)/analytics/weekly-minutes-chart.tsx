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
import type { WeeklyMinutesPoint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MINUTES_DISCLAIMER } from "@/lib/analytics/labels";

export function WeeklyMinutesChart({ data }: { data: WeeklyMinutesPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{MINUTES_DISCLAIMER}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis allowDecimals fontSize={12} />
              <Tooltip formatter={(v) => [`${v} phút`, "TB/học viên"]} />
              <Bar dataKey="avgMinutesPerLearner" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
                <th className="py-1">Tuần</th>
                <th className="py-1 text-right">Học viên</th>
                <th className="py-1 text-right">TB phút/học viên</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.weekStart} className="border-t">
                  <td className="py-1">{row.label}</td>
                  <td className="py-1 text-right">{row.learners}</td>
                  <td className="py-1 text-right">{row.avgMinutesPerLearner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  );
}
