"use client";

import { useMemo, useState } from "react";
import { Sparkles, Wand2, Loader2, Download, Info, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { generateEnglishQuestionsWithProgress } from "@/lib/eng-gen/master-generator";
import { toBulkRows, downloadBulkXlsx } from "@/lib/eng-gen/export-xlsx";
import { generatedToQuestion } from "@/lib/eng-gen/to-question";
import { QuestionPreviewModal } from "@/components/question-preview/question-preview-modal";
import type { Question } from "@/lib/types";
import type { GeneratedQuestion, GenReport, Skill, BlueprintType } from "@/lib/eng-gen/types";

const SKILLS: { value: Skill; label: string }[] = [
  { value: "vocabulary", label: "Từ vựng" },
  { value: "phonics", label: "Phonics" },
  { value: "sentence", label: "Câu (sắp xếp)" },
  { value: "listening", label: "Nghe" },
  { value: "review", label: "Ôn tập" },
];

const BLUEPRINTS_BY_SKILL: Record<Skill, { value: BlueprintType; label: string }[]> = {
  vocabulary: [
    { value: "image_choice", label: "🖼️ Nhìn hình chọn từ" },
    { value: "audio_choice", label: "🔊 Nghe chọn từ" },
    { value: "match_word", label: "🔗 Nối từ" },
  ],
  phonics: [{ value: "missing_letter", label: "✏️ Điền chữ thiếu" }],
  sentence: [{ value: "reorder", label: "🔀 Sắp xếp câu" }],
  listening: [{ value: "audio_choice", label: "🔊 Nghe chọn đáp án" }],
  review: [
    { value: "image_choice", label: "🖼️ Ôn qua hình" },
    { value: "audio_choice", label: "🔊 Ôn qua âm thanh" },
  ],
};

const EXPORTABLE = new Set(["image_choice", "audio_choice", "missing_letter", "multiple_choice"]);
const DIFF_COLOR: Record<number, string> = { 1: "#10b981", 2: "#f59e0b", 3: "#ef4444" };

export default function AiGeneratePage() {
  const [grade] = useState(1);
  const [week, setWeek] = useState(1);
  const [skill, setSkill] = useState<Skill>("vocabulary");
  const [blueprint, setBlueprint] = useState<BlueprintType>("image_choice");
  const [count, setCount] = useState(10);
  const [dMin, setDMin] = useState(1);
  const [dMax, setDMax] = useState(2);
  const [startSeq, setStartSeq] = useState(101);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [report, setReport] = useState<GenReport | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewQ, setPreviewQ] = useState<Question | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const blueprintOptions = BLUEPRINTS_BY_SKILL[skill];

  const selectedQuestions = useMemo(
    () => questions.filter((_, i) => selected.has(i)),
    [questions, selected],
  );
  const exportableCount = useMemo(
    () => selectedQuestions.filter((q) => EXPORTABLE.has(q.blueprintType)).length,
    [selectedQuestions],
  );

  function onSkillChange(v: string) {
    const s = v as Skill;
    setSkill(s);
    const first = BLUEPRINTS_BY_SKILL[s][0].value;
    setBlueprint(first);
  }

  async function runGenerate() {
    setGenerating(true);
    setProgress(0);
    setQuestions([]);
    setReport(null);
    setSelected(new Set());
    try {
      const range: [number, number] = [Math.min(dMin, dMax), Math.max(dMin, dMax)];
      const { questions: qs, report: rpt } = await generateEnglishQuestionsWithProgress(
        {
          grade,
          week,
          skill,
          blueprintType: blueprint,
          count,
          difficultyRange: range,
          options: { useAIWording: false, seed: Date.now(), wordList: [] },
        },
        (current, total) => setProgress(Math.round((current / total) * 100)),
      );
      setQuestions(qs);
      setReport(rpt);
      setSelected(new Set(qs.map((_, i) => i)));
      setProgress(100);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[ai-generate]", e);
      alert("Sinh đề lỗi: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setGenerating(false);
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function openPreview(q: GeneratedQuestion) {
    setPreviewQ(generatedToQuestion(q));
    setPreviewOpen(true);
  }

  function exportXlsx() {
    const { rows, skipped } = toBulkRows(selectedQuestions, { grade, week, startSeq });
    if (rows.length === 0) {
      alert(
        "Không có câu nào xuất được. Chỉ image_choice / audio_choice / missing_letter khớp định dạng 12 cột.",
      );
      return;
    }
    const ww = String(week).padStart(2, "0");
    downloadBulkXlsx(rows, `SinhDe_G${grade}_W${ww}_ENG.xlsx`);
    if (skipped.length > 0) {
      alert(`Đã xuất ${rows.length} câu. Bỏ qua ${skipped.length} câu không khớp định dạng 12 cột.`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6" />
          AI Sinh đề Tiếng Anh
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sinh câu hỏi tại chỗ (template + asset auto-map) — <strong>0 token</strong>. Xem trước → chọn
          → Xuất Excel 12 cột → nạp qua Bulk Import → QA publish.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cấu hình */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4" />
              Cấu hình
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Lớp</Label>
                <Input value={grade} disabled className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Tuần (1-35)</Label>
                <Input
                  type="number"
                  min={1}
                  max={35}
                  value={week}
                  onChange={(e) => setWeek(Math.min(35, Math.max(1, Number(e.target.value))))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kỹ năng</Label>
                <Select value={skill} onValueChange={onSkillChange}>
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
              <div>
                <Label className="text-xs">Loại câu</Label>
                <Select value={blueprint} onValueChange={(v) => setBlueprint(v as BlueprintType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {blueprintOptions.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Số câu (1-50)</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Độ khó từ</Label>
                <Input type="number" min={1} max={3} value={dMin} onChange={(e) => setDMin(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Đến</Label>
                <Input type="number" min={1} max={3} value={dMax} onChange={(e) => setDMax(Number(e.target.value))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Mã câu bắt đầu (seq)</Label>
              <Input type="number" min={1} value={startSeq} onChange={(e) => setStartSeq(Number(e.target.value))} className="mt-1" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Mặc định 101 để tránh đè câu seed cũ. Mã: G{grade}_W{String(week).padStart(2, "0")}_ENG_{String(startSeq).padStart(3, "0")}…
              </p>
            </div>

            <Button className="w-full" onClick={runGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang sinh… {progress}%
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate — Sinh {count} câu
                </>
              )}
            </Button>

            {report && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md border p-2">
                  <div className="text-lg font-bold text-emerald-600">{report.generated}</div>
                  <div className="text-muted-foreground">Đã sinh</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-lg font-bold text-amber-600">{report.duplicates}</div>
                  <div className="text-muted-foreground">Trùng</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-lg font-bold text-red-600">{report.qa_failed}</div>
                  <div className="text-muted-foreground">QA loại</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Xem trước ({selected.size}/{questions.length} chọn)</span>
              <Button size="sm" variant="outline" onClick={exportXlsx} disabled={exportableCount === 0}>
                <Download className="mr-1 h-4 w-4" />
                Xuất Excel 12 cột
              </Button>
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
      </div>

      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-sky-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
          <div>
            <div className="font-semibold">Quy trình</div>
            <p className="mt-1">
              Generate → chọn câu → <strong>Xuất Excel 12 cột</strong> → trang <strong>Bulk Import</strong> →
              Import (draft) → <strong>QA Queue</strong> duyệt → publish → học sinh thấy trên studyvui.vn.
              Loại <code className="rounded bg-sky-100 px-1">reorder</code>/
              <code className="rounded bg-sky-100 px-1">match_word</code> chưa xuất 12 cột (làm đợt sau).
            </p>
          </div>
        </CardContent>
      </Card>

      <QuestionPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} question={previewQ} />
    </div>
  );
}
