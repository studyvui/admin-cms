"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { History, RefreshCw, Filter } from "lucide-react";
import { qaApi } from "@/lib/api/qa";
import { extractError } from "@/lib/errors";
import type { AuditAction, AuditLog } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACTION_LABEL: Record<AuditAction, string> = {
  create: "Tạo",
  update: "Sửa",
  delete: "Xoá",
  publish: "Xuất bản",
  archive: "Lưu trữ",
  bulk_import: "Bulk import",
  status_change: "Đổi trạng thái",
  rollback: "Phục hồi",
};

const ACTION_VARIANT: Record<
  AuditAction,
  "default" | "secondary" | "outline" | "destructive"
> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  publish: "default",
  archive: "destructive",
  bulk_import: "secondary",
  status_change: "outline",
  rollback: "outline",
};

const ALL = "__all__";
const ENTITY_TYPES = [ALL, "Lesson", "Question", "Course", "Asset"];
const ACTIONS: (typeof ALL | AuditAction)[] = [
  ALL,
  "create",
  "update",
  "delete",
  "publish",
  "archive",
  "bulk_import",
  "status_change",
  "rollback",
];

export default function AuditLogPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AuditLogInner />
    </Suspense>
  );
}

function AuditLogInner() {
  const searchParams = useSearchParams();
  const focusedEntity = searchParams.get("entity") ?? "";
  const focusedId = searchParams.get("id") ?? "";

  const [action, setAction] = useState<typeof ALL | AuditAction>(ALL);
  const [entityType, setEntityType] = useState(focusedEntity || ALL);

  const recentQuery = useQuery({
    queryKey: ["audit", "recent", action, entityType],
    queryFn: () =>
      qaApi.getRecentAudit({
        action: action !== ALL ? (action as AuditAction) : undefined,
        entityType: entityType !== ALL ? entityType : undefined,
        limit: 100,
      }),
    enabled: !focusedId,
  });

  const entityQuery = useQuery({
    queryKey: ["audit", "entity", focusedEntity, focusedId],
    queryFn: () => qaApi.getEntityAudit(focusedEntity, focusedId),
    enabled: !!focusedId && !!focusedEntity,
  });

  const isFocused = !!focusedId;
  const query = isFocused ? entityQuery : recentQuery;
  const logs = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <History className="h-6 w-6" />
            Audit Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFocused
              ? `Lịch sử của ${focusedEntity} ${focusedId}`
              : "Lịch sử mọi thao tác — ai làm gì, lúc nào, sửa gì."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {!isFocused && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs">Loại hành động</Label>
                <Select
                  value={action}
                  onValueChange={(v) =>
                    setAction(v as typeof ALL | AuditAction)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a === ALL ? "Tất cả" : ACTION_LABEL[a as AuditAction]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Loại đối tượng</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === ALL ? "Tất cả" : t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {query.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : query.error ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            {extractError(query.error)}
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Không có log nào khớp.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditLogCard({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const changes = useMemo(() => parseChanges(log.changes), [log.changes]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={ACTION_VARIANT[log.action] ?? "outline"}>
                {ACTION_LABEL[log.action] ?? log.action}
              </Badge>
              <span className="font-medium">{log.entityType}</span>
              {log.entityCode && (
                <span className="font-mono text-xs text-muted-foreground">
                  {log.entityCode}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {log.user?.name ?? log.user?.email ?? "—"}
              </span>
              {log.user?.role && (
                <span className="ml-1">({log.user.role})</span>
              )}
              <span className="mx-2">•</span>
              {new Date(log.createdAt).toLocaleString("vi-VN")}
              {log.ipAddress && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-mono">{log.ipAddress}</span>
                </>
              )}
            </div>
          </div>
          {changes.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded((x) => !x)}
            >
              {expanded ? "Ẩn" : `Xem diff (${changes.length})`}
            </Button>
          )}
        </div>

        {expanded && changes.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {changes.map((c) => (
              <div
                key={c.field}
                className="rounded-md border bg-muted/30 p-2 text-xs"
              >
                <div className="mb-1 font-mono font-semibold">{c.field}</div>
                {c.kind === "diff" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] uppercase text-red-700">
                        Trước
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-red-50 p-1 font-mono text-[11px] text-red-900">
                        {formatVal(c.from)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-green-700">
                        Sau
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-green-50 p-1 font-mono text-[11px] text-green-900">
                        {formatVal(c.to)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-background p-1 font-mono text-[11px]">
                    {formatVal(c.value)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ChangeEntry =
  | { field: string; kind: "diff"; from: unknown; to: unknown }
  | { field: string; kind: "snapshot"; value: unknown };

function parseChanges(changes: Record<string, unknown>): ChangeEntry[] {
  if (!changes || typeof changes !== "object") return [];
  const created = (changes as Record<string, unknown>).__created;
  if (created && typeof created === "object") {
    return Object.entries(created as Record<string, unknown>).map(([k, v]) => ({
      field: k,
      kind: "snapshot",
      value: v,
    }));
  }
  const deleted = (changes as Record<string, unknown>).__deleted;
  if (deleted && typeof deleted === "object") {
    return Object.entries(deleted as Record<string, unknown>).map(([k, v]) => ({
      field: k,
      kind: "snapshot",
      value: v,
    }));
  }
  return Object.entries(changes).map(([k, v]) => {
    if (v && typeof v === "object" && "from" in (v as object) && "to" in (v as object)) {
      const obj = v as { from: unknown; to: unknown };
      return { field: k, kind: "diff", from: obj.from, to: obj.to };
    }
    return { field: k, kind: "snapshot", value: v };
  });
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
