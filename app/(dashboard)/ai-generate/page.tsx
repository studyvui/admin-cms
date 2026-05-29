"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Wand2,
  Construction,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { lessonsApi } from "@/lib/api/lessons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Trắc nghiệm" },
  { value: "image_choice", label: "Chọn ảnh" },
  { value: "audio_choice", label: "Chọn audio" },
  { value: "missing_letter", label: "Điền chữ thiếu" },
  { value: "fill_blank", label: "Điền chỗ trống" },
  { value: "matching", label: "Nối cặp" },
  { value: "reorder", label: "Sắp xếp" },
  { value: "count_objects", label: "Đếm đồ vật" },
];

const SKILLS = [
  { value: "vocab", label: "Tu vung" },
  { value: "phonics", label: "Phonics" },
  { value: "listening", label: "Nghe" },
  { value: "grammar", label: "Ngu phap" },
  { value: "counting", label: "Dem" },
  { value: "addition", label: "Cong" },
  { value: "subtraction", label: "Tru" },
];

export default function AiGeneratePage() {
  const [lessonId, setLessonId] = useState("");
  const [type, setType] = useState("multiple_choice");
  const [skill, setSkill] = useState("vocab");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState(1);
  const [contextNote, setContextNote] = useState("");

  const lessonsQuery = useQuery({
    queryKey: ["lessons", "ai-generate"],
    queryFn: () => lessonsApi.list({}),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6" />
          AI Generate
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sinh câu hỏi tự động bằng Claude API — chọn bài học, loại câu, độ khó.
        </p>
      </div>

      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="flex items-start gap-3 py-4">
          <Construction className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="text-sm text-amber-900">
            <div className="font-semibold">
              Tính năng đang chờ Backend GD10 (AI & Scale Infrastructure)
            </div>
            <p className="mt-1">
              UI form bên dưới đã hoàn thiện — chỉ cần backend mở endpoint{" "}
              <code className="rounded bg-amber-100 px-1 font-mono text-xs">
                POST /admin/ai/generate
              </code>{" "}
              thì nút <em>Sinh câu hỏi</em> sẽ tự kích hoạt. Hiện tại pipeline
              sinh đề thủ công vẫn dùng tab <strong>Import Excel</strong> hoặc
              nhập tay ở trang <strong>Câu hỏi</strong>.
            </p>
            <a
              href="https://github.com/studyvui/backend/issues?q=GD10"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Tiến độ GD10
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4" />
              Cấu hình
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Bài học đích</Label>
              <Select value={lessonId} onValueChange={setLessonId}>
                <SelectTrigger className="mt-1">
                  <SelectValue
                    placeholder={
                      lessonsQuery.isLoading
                        ? "Đang tải..."
                        : "Chọn bài học"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(lessonsQuery.data ?? []).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} — {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lessonsQuery.isLoading && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                  Đang tải danh sách bài học...
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Loại câu hỏi</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Kỹ năng</Label>
                <Select value={skill} onValueChange={setSkill}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILLS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Số lượng (1-50)</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Độ khó (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">
                Ghi chú ngữ cảnh (tuỳ chọn)
              </Label>
              <Textarea
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                placeholder="Ví dụ: tránh từ vựng trùng các bài trước, ưu tiên động vật quen thuộc với trẻ em VN..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <Button
              disabled
              className="w-full"
              title="Chờ backend GD10 mở /admin/ai/generate"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Sinh {count} câu hỏi (chờ GD10)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kết quả xem trước</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <div className="text-sm font-medium">Chưa có kết quả</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sau khi backend GD10 sẵn sàng, câu hỏi sinh ra sẽ hiện ở đây
                  trước khi anh chọn lưu vào DB (status = <em>draft</em>).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lộ trình tích hợp</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">
                1
              </Badge>
              Backend GD10 mở endpoint{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">
                POST /admin/ai/generate
              </code>{" "}
              nhận payload {`{ lessonId, type, skill, count, difficulty, context }`}
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">
                2
              </Badge>
              Backend gọi Claude API → validate → trả về danh sách câu hỏi (chưa
              lưu DB)
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">
                3
              </Badge>
              UI hiện preview, cho admin chọn câu nào lưu, câu nào bỏ
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">
                4
              </Badge>
              Bấm <em>Lưu</em> → batch insert vào DB với status <em>draft</em>{" "}
              → qua QA Queue như câu thường
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
