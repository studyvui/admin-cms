"use client";

import type { ProblemLessonItem } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SUBJECT_LABELS } from "@/lib/analytics/labels";
import { formatPercent, formatNumberVn } from "@/lib/analytics/analytics-format";

export function ProblemLessonsTable({ data }: { data: ProblemLessonItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bài học có tỉ lệ sai cao nhất</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa đủ dữ liệu để xếp hạng (cần đủ số lượt làm bài tối thiểu theo cấu hình hệ thống).
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài học</TableHead>
                <TableHead>Môn</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead className="text-right">Lượt làm</TableHead>
                <TableHead className="text-right">Học viên</TableHead>
                <TableHead className="text-right">Tỉ lệ sai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.name}
                    <span className="ml-1 text-xs text-muted-foreground">({row.code})</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {SUBJECT_LABELS[row.subject] ?? row.subject}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.grade}</TableCell>
                  <TableCell className="text-right">{formatNumberVn(row.attempts)}</TableCell>
                  <TableCell className="text-right">{formatNumberVn(row.learners)}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatPercent(row.wrongRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
