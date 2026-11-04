"use client";

import { BookOpen, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonTypeLabel, skillLabel } from "@/lib/math-gen/labels";
import type { Lesson } from "@/lib/types";

// Mục 93 Đợt 4c: Card "Bài học theo tuần" tách nguyên văn từ page.tsx (state vẫn ở page.tsx).
export function MathLessonPickerCard({
  grade,
  week,
  currentLesson,
  allowedSkills,
  onGradeChange,
  onWeekChange,
}: {
  grade: number;
  week: number;
  currentLesson: Lesson | null;
  allowedSkills: string[];
  onGradeChange: (v: number) => void;
  onWeekChange: (v: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Bài học theo tuần
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <div>
            <Label className="text-xs">Lớp</Label>
            <Select value={String(grade)} onValueChange={(v) => onGradeChange(Number(v))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Lớp {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tuần (1-35)</Label>
            <Input
              type="number"
              min={1}
              max={35}
              value={week}
              onChange={(e) => onWeekChange(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>
        {currentLesson ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{currentLesson.code}</span>
            <span className="font-semibold">{currentLesson.name}</span>
            <Badge variant="secondary">{lessonTypeLabel(currentLesson.lessonType)}</Badge>
            <span className="text-xs text-muted-foreground">Kỹ năng:</span>
            {allowedSkills.map((s) => (
              <Badge key={s} variant="outline" className="text-[10px]">{skillLabel(s)}</Badge>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Tuần {week} chưa có bài học Toán (<span className="font-mono">G{grade}_W{String(week).padStart(2, "0")}_MATH</span>).
            Tạo bài học ở trang <strong>Bài học</strong> trước.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
