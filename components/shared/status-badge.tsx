import { Badge } from "@/components/ui/badge";
import type { LessonStatus, QuestionStatus } from "@/lib/types";

const LABEL: Record<string, string> = {
  draft: "Nháp",
  review: "Chờ duyệt",
  approved: "Đã duyệt",
  published: "Xuất bản",
  archived: "Lưu trữ",
  deprecated: "Ngừng dùng",
};

const VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  review: "secondary",
  approved: "secondary",
  published: "default",
  archived: "destructive",
  deprecated: "destructive",
};

export function StatusBadge({
  status,
}: {
  status: LessonStatus | QuestionStatus;
}) {
  return (
    <Badge variant={VARIANT[status] ?? "outline"}>
      {LABEL[status] ?? status}
    </Badge>
  );
}
