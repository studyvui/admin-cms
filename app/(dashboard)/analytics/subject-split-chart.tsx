"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { SubjectSplitItem } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SUBJECT_LABELS, SUBJECT_COLORS } from "@/lib/analytics/labels";
import { formatPercent, formatNumberVn } from "@/lib/analytics/analytics-format";

export function SubjectSplitChart({ data }: { data: SubjectSplitItem[] }) {
  const chartData = data.map((row) => ({
    ...row,
    name: SUBJECT_LABELS[row.subject] ?? row.subject,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Phân bố hoạt động theo môn</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="answers"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry: PieLabelRenderProps) => `${entry.name}: ${entry.value}`}
              >
                {chartData.map((row) => (
                  <Cell key={row.subject} fill={SUBJECT_COLORS[row.subject] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [formatNumberVn(Number(v)), "Lượt trả lời"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Xem số liệu
          </summary>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Môn</th>
                <th className="py-1 text-right">Lượt trả lời</th>
                <th className="py-1 text-right">Độ chính xác</th>
                <th className="py-1 text-right">Học viên</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.subject} className="border-t">
                  <td className="py-1">{SUBJECT_LABELS[row.subject] ?? row.subject}</td>
                  <td className="py-1 text-right">{formatNumberVn(row.answers)}</td>
                  <td className="py-1 text-right">{formatPercent(row.accuracy)}</td>
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
