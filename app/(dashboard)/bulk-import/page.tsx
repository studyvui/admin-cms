"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { lessonsApi } from "@/lib/api/lessons";
import { questionsApi } from "@/lib/api/questions";
import type { Lesson } from "@/lib/types";
import { extractError } from "@/lib/errors";
import {
  parseWorkbook,
  validateRows,
  toCreateInput,
  downloadTemplateXlsx,
  chunk,
  BULK_COLUMNS,
  BULK_HEADER_LABELS,
  type ImportRowResult,
} from "@/lib/bulk-import";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BATCH_SIZE = 50;

interface SubmitProgress {
  total: number;
  inserted: number;
  skipped: number;
  failed: { rowNumber: number; message: string }[];
  done: boolean;
}

export default function BulkImportPage() {
  const { hasRole, hydrated } = useAuth();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRowResult[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<SubmitProgress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["lessons", "for-bulk-import"],
    queryFn: () => lessonsApi.list(),
    enabled: hydrated && hasRole("admin", "editor"),
  });

  const lessonByCode = useMemo(() => {
    const m = new Map<string, Lesson>();
    lessons?.forEach((l) => m.set(l.code, l));
    return m;
  }, [lessons]);

  const stats = useMemo(() => {
    const valid = rows.filter((r) => r.status === "valid").length;
    const invalid = rows.length - valid;
    return { total: rows.length, valid, invalid };
  }, [rows]);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setRows([]);
      setParseError(null);
      setProgress(null);
      try {
        const buffer = await file.arrayBuffer();
        const raw = parseWorkbook(buffer);
        if (raw.length === 0) {
          setParseError("File rỗng hoặc không có sheet hợp lệ.");
          return;
        }
        const validated = validateRows(raw, lessonByCode);
        setRows(validated);
      } catch (err) {
        setParseError(extractError(err));
      }
    },
    [lessonByCode],
  );

  const onSubmit = useCallback(async () => {
    const valid = rows.filter((r) => r.status === "valid");
    if (valid.length === 0) return;
    setSubmitting(true);
    setProgress({
      total: valid.length,
      inserted: 0,
      skipped: 0,
      failed: [],
      done: false,
    });

    const batches = chunk(valid, BATCH_SIZE);
    let inserted = 0;
    let skipped = 0;
    const failed: SubmitProgress["failed"] = [];

    for (const batch of batches) {
      const payload = batch
        .map(toCreateInput)
        .filter((q): q is NonNullable<ReturnType<typeof toCreateInput>> => q !== null);
      try {
        const res = await questionsApi.bulkUpload(payload);
        inserted += res.inserted ?? 0;
        skipped += res.skipped ?? 0;
        (res.errors ?? []).forEach((e) => {
          const row = batch[e.index];
          failed.push({
            rowNumber: row?.rowNumber ?? -1,
            message: e.message,
          });
        });
      } catch (err) {
        const msg = extractError(err);
        batch.forEach((r) =>
          failed.push({ rowNumber: r.rowNumber, message: msg }),
        );
      }
      setProgress({
        total: valid.length,
        inserted,
        skipped,
        failed: [...failed],
        done: false,
      });
    }

    setProgress({ total: valid.length, inserted, skipped, failed, done: true });
    setSubmitting(false);
  }, [rows]);

  if (!hydrated) return null;
  if (!hasRole("admin", "editor")) {
    return (
      <div className="text-center text-muted-foreground">
        Chỉ Admin / Editor được truy cập trang này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Excel</h1>
        <p className="text-muted-foreground">
          Nhập hàng loạt câu hỏi từ file Excel — gửi theo batch{" "}
          {BATCH_SIZE}/lần qua endpoint bulk-upload
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bước 1 — Tải file mẫu</CardTitle>
          <CardDescription>
            Mở file mẫu bằng Excel/Google Sheets → điền câu hỏi theo cột →
            lưu lại để upload ở Bước 2. Mã bài học (cột đầu) phải khớp{" "}
            <span className="font-mono">code</span> của Lesson đã có trong hệ
            thống.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadTemplateXlsx()}
          >
            <Download className="mr-2 h-4 w-4" />
            Tải file mẫu (questions_template.xlsx)
          </Button>

          <div className="rounded-md border bg-muted/30 p-3 text-xs">
            <p className="mb-2 font-semibold">Cấu trúc cột:</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {BULK_COLUMNS.map((c) => (
                <li key={c} className="font-mono">
                  <span className="text-primary">{c}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {BULK_HEADER_LABELS[c]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bước 2 — Upload file</CardTitle>
          <CardDescription>
            Chấp nhận <code>.xlsx</code> hoặc <code>.xls</code>. Hệ thống
            validate từng dòng, hiển thị preview trước khi gửi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lessonsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <p className="text-xs text-muted-foreground">
              Đã load {lessons?.length ?? 0} bài học từ DB để khớp{" "}
              <span className="font-mono">lessonCode</span>.
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="button" onClick={() => inputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Chọn file .xlsx
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            {fileName && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName}
              </span>
            )}
          </div>

          {parseError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {parseError}
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bước 3 — Preview</CardTitle>
            <CardDescription>
              Tổng {stats.total} dòng — <span className="text-emerald-600 font-semibold">{stats.valid} hợp lệ</span> /{" "}
              <span className="text-destructive font-semibold">{stats.invalid} lỗi</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-16">Dòng</TableHead>
                    <TableHead className="w-24">Tình trạng</TableHead>
                    <TableHead>lessonCode</TableHead>
                    <TableHead>code</TableHead>
                    <TableHead>prompt</TableHead>
                    <TableHead>correct</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.rowNumber}
                      className={cn(
                        r.status === "valid"
                          ? "bg-emerald-50/50"
                          : "bg-destructive/5",
                      )}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {r.rowNumber}
                      </TableCell>
                      <TableCell>
                        {r.status === "valid" ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500 text-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Lỗi
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {String(r.raw.lessonCode ?? "")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {String(r.raw.code ?? "")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">
                        {String(r.raw.prompt ?? "")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {String(r.raw.correct ?? "")}
                      </TableCell>
                      <TableCell className="text-xs text-destructive">
                        {r.errors.length > 0 ? r.errors.join("; ") : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {stats.invalid > 0 &&
                  "Các dòng lỗi sẽ bị bỏ qua khi submit. "}
                Chỉ {stats.valid} dòng hợp lệ sẽ được gửi lên backend.
              </p>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={submitting || stats.valid === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>Gửi {stats.valid} câu hợp lệ</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {progress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bước 4 — Kết quả</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Inserted</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {progress.inserted}
                </p>
              </div>
              <div className="rounded-md border bg-yellow-50 p-3">
                <p className="text-xs text-yellow-700">
                  Skipped (trùng code)
                </p>
                <p className="text-2xl font-bold text-yellow-700">
                  {progress.skipped}
                </p>
              </div>
              <div className="rounded-md border bg-destructive/10 p-3">
                <p className="text-xs text-destructive">Failed</p>
                <p className="text-2xl font-bold text-destructive">
                  {progress.failed.length}
                </p>
              </div>
            </div>

            {progress.failed.length > 0 && (
              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-semibold">Chi tiết lỗi:</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                  {progress.failed.map((f, i) => (
                    <li key={i} className="font-mono text-destructive">
                      Dòng {f.rowNumber}: {f.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {progress.done && (
              <p className="text-sm text-muted-foreground">
                ✅ Hoàn tất. Câu hỏi vừa import nằm ở status{" "}
                <span className="font-mono">draft</span> — chờ duyệt trước
                khi xuất bản.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
