"use client";

import { Calculator, Download, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GeneratedMathQuestion } from "@/lib/math-gen/types";

const DIFF_COLOR: Record<number, string> = { 1: "#10b981", 2: "#f59e0b", 3: "#ef4444" };

// Mục 93 Đợt 4c: Card "Xem trước" tách nguyên văn từ page.tsx (state, handler vẫn ở page.tsx).
export function MathPreviewListCard({
  questions,
  selectedQ,
  exportableCount,
  exportXlsx,
  toggleQ,
  openPreview,
}: {
  questions: GeneratedMathQuestion[];
  selectedQ: Set<number>;
  exportableCount: number;
  exportXlsx: () => void;
  toggleQ: (i: number) => void;
  openPreview: (i: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Xem trước ({selectedQ.size}/{questions.length} chọn)</span>
          <Button size="sm" variant="outline" onClick={exportXlsx} disabled={exportableCount === 0}>
            <Download className="mr-1 h-4 w-4" /> Xuất Excel 12 cột
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
            <Calculator className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Chọn mẫu → bấm Generate (0 token).</p>
          </div>
        ) : (
          <div className="grid max-h-[460px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {questions.map((q, i) => {
              const exportable = q.optionsType !== "comparison";
              return (
                <div key={q.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <input type="checkbox" checked={selectedQ.has(i)} onChange={() => toggleQ(i)} className="mt-1 h-4 w-4" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1">
                      <span className="rounded px-1.5 text-[10px] font-bold" style={{ color: DIFF_COLOR[q.difficulty] || "#64748b" }}>
                        L{q.difficulty}
                      </span>
                      {q.assetRefs.length > 0 && (
                        <Badge variant="outline" className="text-[10px] text-violet-500">🖼 {q.assetRefs.length}</Badge>
                      )}
                      {!exportable && (
                        <Badge variant="outline" className="text-[10px] text-amber-600">không xuất 12 cột</Badge>
                      )}
                      <Button size="sm" variant="outline" className="ml-auto h-6 gap-1 px-2 text-[11px]" onClick={() => openPreview(i)}>
                        <Play className="h-3 w-3" /> Xem trước
                      </Button>
                    </div>
                    <div className="text-[13px]">
                      <span className="font-medium text-muted-foreground">{i + 1}.</span> {q.text}
                    </div>
                    <div className="text-[12px] font-semibold text-emerald-600">✓ {q.correct_answer}</div>
                    <div className="text-[11px] text-muted-foreground">Đáp án: {q.options.join(", ")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
