"use client";

import { Users as UsersIcon, UserCheck, UserX, UserPlus } from "lucide-react";
import type { UserStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mục 93 Đợt 4c: 4 thẻ tóm tắt tách nguyên văn từ page.tsx.
export function UsersSummaryCards({ stats }: { stats: UserStats | undefined }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        icon={UsersIcon}
        label="Tổng số"
        value={stats?.total}
        color="text-blue-600"
      />
      <SummaryCard
        icon={UserCheck}
        label="Đang hoạt động"
        value={stats?.active}
        color="text-green-600"
      />
      <SummaryCard
        icon={UserX}
        label="Đã khoá"
        value={stats?.inactive}
        color="text-amber-600"
      />
      <SummaryCard
        icon={UserPlus}
        label="Mới trong 30 ngày"
        value={stats?.newLast30Days}
        color="text-purple-600"
      />
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
  value: number | undefined;
  color: string;
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
        {value === undefined ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={`text-3xl font-bold ${color}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
