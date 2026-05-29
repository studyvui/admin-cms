"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, X, RefreshCw, ExternalLink, ShieldCheck } from "lucide-react";
import { qaApi } from "@/lib/api/qa";
import { lessonsApi } from "@/lib/api/lessons";
import { questionsApi } from "@/lib/api/questions";
import { extractError } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function QaQueuePage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canReview = hasRole("admin", "qa");

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["qa", "review-queue"],
    queryFn: () => qaApi.getReviewQueue(),
  });

  const lessonMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "draft" }) =>
      lessonsApi.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa", "review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
    onError: (err) => alert(extractError(err)),
  });

  const questionMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "draft" }) =>
      questionsApi.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa", "review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (err) => alert(extractError(err)),
  });

  const counts = useMemo(
    () => ({
      lessons: data?.lessonsForReview.length ?? 0,
      questions: data?.questionsForReview.length ?? 0,
    }),
    [data],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {extractError(error)}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6" /> QA Queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bài học và câu hỏi đang chờ duyệt. Bấm{" "}
            <span className="font-medium text-green-700">Duyệt</span> để chuyển
            sang <em>approved</em>; bấm{" "}
            <span className="font-medium text-red-700">Trả lại</span> để đưa về{" "}
            <em>draft</em>.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {!canReview && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-3 text-sm text-yellow-900">
            Bạn đang ở vai trò không có quyền duyệt. Chỉ xem.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Bài học chờ duyệt</CardTitle>
          <Badge variant="secondary">{counts.lessons}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {counts.lessons === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Không có bài học nào đang chờ duyệt.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Khoá</TableHead>
                  <TableHead>Bài học</TableHead>
                  <TableHead className="w-[80px]">Tuần</TableHead>
                  <TableHead className="w-[140px]">Loại</TableHead>
                  <TableHead className="w-[150px]">Cập nhật</TableHead>
                  <TableHead className="w-[240px] text-right">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.lessonsForReview.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.course?.code ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.code}
                      </div>
                    </TableCell>
                    <TableCell>{l.week}</TableCell>
                    <TableCell className="text-xs">{l.lessonType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(l.updatedAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canReview || lessonMut.isPending}
                          onClick={() =>
                            lessonMut.mutate({ id: l.id, status: "draft" })
                          }
                          className="text-red-700 hover:bg-red-50"
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Trả lại
                        </Button>
                        <Button
                          size="sm"
                          disabled={!canReview || lessonMut.isPending}
                          onClick={() =>
                            lessonMut.mutate({ id: l.id, status: "approved" })
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Duyệt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Câu hỏi chờ duyệt</CardTitle>
          <Badge variant="secondary">{counts.questions}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {counts.questions === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Không có câu hỏi nào đang chờ duyệt.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Bài học</TableHead>
                  <TableHead>Mã + Đề bài</TableHead>
                  <TableHead className="w-[110px]">Loại</TableHead>
                  <TableHead className="w-[80px]">Khó</TableHead>
                  <TableHead className="w-[150px]">Cập nhật</TableHead>
                  <TableHead className="w-[240px] text-right">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.questionsForReview.map((q) => {
                  const prompt =
                    (q.content as { prompt?: string })?.prompt ?? "(no prompt)";
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {q.lesson?.code ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="line-clamp-2 text-sm">{prompt}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{q.code}</span>
                          <Link
                            href={`/qa/audit?entity=Question&id=${q.id}`}
                            className="inline-flex items-center gap-0.5 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Lịch sử
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{q.type}</TableCell>
                      <TableCell>{q.difficulty}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(q.updatedAt).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canReview || questionMut.isPending}
                            onClick={() =>
                              questionMut.mutate({ id: q.id, status: "draft" })
                            }
                            className="text-red-700 hover:bg-red-50"
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Trả lại
                          </Button>
                          <Button
                            size="sm"
                            disabled={!canReview || questionMut.isPending}
                            onClick={() =>
                              questionMut.mutate({
                                id: q.id,
                                status: "approved",
                              })
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Duyệt
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
