"use client";

import { Sparkles, Loader2, Download, Upload, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GeneratedQuestion } from "@/lib/eng-gen/types";
import { EXPORTABLE, DIFF_COLOR } from "./ai-generate-constants";

// Mục 93 Đợt 4c: Card Xem trước tách nguyên văn từ page.tsx (state, handler vẫn ở page.tsx).
export function AiGeneratePreviewCard({
  questions,
  selected,
  importing,
  exportableCount,
  importDirect,
  exportXlsx,
  toggle,
  openPreview,
}: {
  questions: GeneratedQuestion[];
  selected: Set<number>;
  importing: boolean;
  exportableCount: number;
  importDirect: () => void;
  exportXlsx: () => void;
  toggle: (i: number) => void;
  openPreview: (q: GeneratedQuestion) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Xem trước ({selected.size}/{questions.length} chọn)</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={importDirect} disabled={selected.size === 0 || importing}>
              {importing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              Tạo {selected.size} câu hỏi
            </Button>
            <Button size="sm" variant="outline" onClick={exportXlsx} disabled={exportableCount === 0}>
              <Download className="mr-1 h-4 w-4" />
              Xuất Excel
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Bấm Generate để sinh câu hỏi (0 token).</p>
          </div>
        ) : (
          <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {questions.map((q, i) => {
              const exportable = EXPORTABLE.has(q.blueprintType);
              return (
                <div key={q.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">{q.skill}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{q.blueprintType}</Badge>
                      <span
                        className="rounded px-1.5 text-[10px] font-bold"
                        style={{ color: DIFF_COLOR[q.difficulty] || "#64748b" }}
                      >
                        L{q.difficulty}
                      </span>
                      {!exportable && (
                        <Badge variant="outline" className="text-[10px] text-amber-600">
                          không xuất 12 cột
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto h-6 gap-1 px-2 text-[11px]"
                        onClick={() => openPreview(q)}
                      >
                        <Play className="h-3 w-3" />
                        Xem thử
                      </Button>
                    </div>
                    <div className="text-[13px]">
                      <span className="font-medium text-muted-foreground">{i + 1}.</span> {q.components.stem}
                    </div>
                    <div className="text-[12px] font-semibold text-emerald-600">✓ {q.correct_answer}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Nhiễu: {q.components.distractors.slice(0, 3).join(", ") || "(—)"}
                    </div>
                    {q.components.assets.image && q.blueprintType === "image_choice" && (
                      <div className="truncate text-[10px] text-violet-500">🖼 {q.components.assets.image}</div>
                    )}
                    {q.components.assets.audio && q.blueprintType === "audio_choice" && (
                      <div className="truncate text-[10px] text-sky-500">🔊 {q.components.assets.audio}</div>
                    )}
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
