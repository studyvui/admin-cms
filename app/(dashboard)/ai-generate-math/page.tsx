"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Wand2,
  Loader2,
  Download,
  Info,
  Play,
  Plus,
  Pencil,
  Trash2,
  Settings2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { extractError } from "@/lib/errors";
import { questionTemplatesApi } from "@/lib/api/question-templates";
import {
  getBuiltinsForLessonType,
} from "@/lib/math-gen/builtins";
import { generateBatch } from "@/lib/math-gen/generate";
import { toBulkRows, downloadBulkXlsx } from "@/lib/math-gen/export-xlsx";
import { TemplateEditorModal } from "@/components/math-template/template-editor-modal";
import { MathPreviewEditModal } from "@/components/question-preview/math-preview-edit-modal";
import type {
  GeneratedMathQuestion,
  MathGenReport,
  MathTemplate,
  ServerTemplate,
  TemplateInput,
} from "@/lib/math-gen/types";

const LESSON_TYPES: { value: string; label: string }[] = [
  { value: "counting", label: "Đếm số (Counting)" },
  { value: "comparison", label: "So sánh dấu > < = (Comparison)" },
  { value: "compare_quantity", label: "So sánh số lượng (Compare Quantity)" },
  { value: "sequence", label: "Dãy số quy luật (Sequence)" },
  { value: "sort_numbers", label: "Sắp xếp dãy số (Sort Numbers)" },
  { value: "number_decompose", label: "Tách gộp số (Decompose)" },
  { value: "write_equation", label: "Nhìn hình viết phép tính" },
  { value: "complete_table", label: "Hoàn thành bảng (Complete Table)" },
  { value: "chain_calculation", label: "Chuỗi phép tính (Chain Calc)" },
  { value: "find_missing_number", label: "Tìm số ẩn (Find Missing)" },
  { value: "calculation", label: "Tính kết quả (Calculation)" },
  { value: "fill_blank", label: "Điền số còn thiếu (Fill Blank)" },
  { value: "word_problem", label: "Toán có lời văn (Word Problem)" },
  { value: "classify_2d", label: "Phân loại hình phẳng (2D)" },
];

const DIFF_COLOR: Record<number, string> = { 1: "#10b981", 2: "#f59e0b", 3: "#ef4444" };

function serverToTemplate(s: ServerTemplate): MathTemplate {
  return {
    id: s.id,
    source: "user",
    lessonType: s.lessonType,
    skill: s.skill,
    grade: s.grade,
    text: s.text,
    formula: s.formula,
    vars: s.vars || [],
    distractorCount: s.distractorCount || 3,
  };
}

export default function AiGenerateMathPage() {
  const qc = useQueryClient();
  const [grade] = useState(1);
  const [week, setWeek] = useState(1);
  const [lessonType, setLessonType] = useState("calculation");
  const [count, setCount] = useState(10);
  const [startSeq, setStartSeq] = useState(101);

  const [selectedTplId, setSelectedTplId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<GeneratedMathQuestion[]>([]);
  const [report, setReport] = useState<MathGenReport | null>(null);
  const [selectedQ, setSelectedQ] = useState<Set<number>>(new Set());

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ServerTemplate | null>(null);
  const [cloneSeed, setCloneSeed] = useState<TemplateInput | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Templates: built-in + user (backend)
  const builtins = useMemo(() => getBuiltinsForLessonType(lessonType), [lessonType]);
  const { data: userTemplates = [], isLoading } = useQuery({
    queryKey: ["question-templates", lessonType],
    queryFn: () => questionTemplatesApi.list({ lessonType }),
  });
  const allTemplates: MathTemplate[] = useMemo(
    () => [...builtins, ...userTemplates.map(serverToTemplate)],
    [builtins, userTemplates],
  );
  const selectedTemplate = allTemplates.find((t) => t.id === selectedTplId) || null;

  const createMut = useMutation({
    mutationFn: (input: TemplateInput) => questionTemplatesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["question-templates"] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TemplateInput> }) =>
      questionTemplatesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["question-templates"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => questionTemplatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["question-templates"] }),
  });
  const saving = createMut.isPending || updateMut.isPending;

  const selectedQuestions = useMemo(
    () => questions.filter((_, i) => selectedQ.has(i)),
    [questions, selectedQ],
  );
  const exportableCount = useMemo(
    () => selectedQuestions.filter((q) => q.optionsType !== "comparison").length,
    [selectedQuestions],
  );

  function onLessonTypeChange(v: string) {
    setLessonType(v);
    setSelectedTplId(null);
  }

  function runGenerate() {
    if (!selectedTemplate) {
      alert("Hãy chọn 1 mẫu để sinh đề (built-in hoặc tự tạo).");
      return;
    }
    setGenerating(true);
    try {
      const { questions: qs, report: rpt } = generateBatch(selectedTemplate, {
        grade,
        week,
        count,
        lessonType,
      });
      setQuestions(qs);
      setReport(rpt);
      setSelectedQ(new Set(qs.map((_, i) => i)));
    } catch (e) {
      alert("Sinh đề lỗi: " + extractError(e));
    } finally {
      setGenerating(false);
    }
  }

  function toggleQ(i: number) {
    setSelectedQ((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function openPreview(i: number) {
    setPreviewIdx(i);
    setPreviewOpen(true);
  }

  function saveAssetRefs(refs: string[]) {
    if (previewIdx == null) return;
    setQuestions((prev) =>
      prev.map((q, i) => (i === previewIdx ? { ...q, assetRefs: refs } : q)),
    );
  }

  function exportXlsx() {
    const { rows, skipped } = toBulkRows(selectedQuestions, { grade, week, startSeq });
    if (rows.length === 0) {
      alert("Không có câu nào xuất được (comparison chỉ 3 lựa chọn → bỏ).");
      return;
    }
    const ww = String(week).padStart(2, "0");
    downloadBulkXlsx(rows, `SinhDe_G${grade}_W${ww}_MATH.xlsx`);
    if (skipped.length > 0) {
      alert(`Đã xuất ${rows.length} câu. Bỏ qua ${skipped.length} câu không khớp 12 cột (comparison).`);
    }
  }

  function onSubmitTemplate(input: TemplateInput, id?: string) {
    if (id) {
      updateMut.mutate(
        { id, input },
        { onSuccess: () => setEditorOpen(false), onError: (e) => alert(extractError(e)) },
      );
    } else {
      createMut.mutate(input, {
        onSuccess: () => setEditorOpen(false),
        onError: (e) => alert(extractError(e)),
      });
    }
  }

  function handleDelete(id: string) {
    if (!confirm("Xoá template này?")) return;
    deleteMut.mutate(id, { onError: (e) => alert(extractError(e)) });
  }

  const previewQuestion = previewIdx != null ? questions[previewIdx] : null;

  function openAddTemplate() {
    setEditing(null);
    setCloneSeed(null);
    setEditorOpen(true);
  }
  function openEditUser(t: MathTemplate) {
    setEditing(userTemplates.find((s) => s.id === t.id) ?? null);
    setCloneSeed(null);
    setEditorOpen(true);
  }
  function openCloneBuiltin(t: MathTemplate) {
    setEditing(null);
    setCloneSeed({
      lessonType,
      skill: t.skill,
      grade: 1,
      text: t.text,
      formula: t.formula,
      condition: t.condition,
      vars: t.vars,
      distractorCount: t.distractorCount,
    });
    setEditorOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Calculator className="h-6 w-6" />
          AI Sinh đề Toán
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ngân hàng mẫu (template + biến min–max / danh sách chữ). Sinh tại chỗ <strong>0 token</strong> →
          xem trước &amp; gắn ảnh/audio → Xuất Excel 12 cột → Bulk Import → QA publish.
        </p>
      </div>

      {/* Lesson type + manager */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* (A) Template manager */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Ngân hàng mẫu
              </span>
              <Button size="sm" onClick={openAddTemplate}>
                <Plus className="mr-1 h-4 w-4" /> Thêm mẫu
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Lesson type</Label>
              <Select value={lessonType} onValueChange={onLessonTypeChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LESSON_TYPES.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {isLoading && <p className="text-xs text-muted-foreground">Đang tải mẫu…</p>}
              {allTemplates.length === 0 && !isLoading && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Chưa có mẫu cho lesson type này. Bấm “Thêm mẫu”.
                </p>
              )}
              {allTemplates.map((t) => {
                const isSel = selectedTplId === t.id;
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "cursor-pointer rounded-md border p-2 text-sm transition-colors",
                      isSel ? "border-primary bg-primary/5" : "hover:bg-accent",
                    )}
                    onClick={() => setSelectedTplId(t.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{t.text}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {t.source === "builtin" ? (
                            <Badge variant="outline" className="text-[10px] text-amber-600">⚙️ Built-in</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-600">✏️ Custom</Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">{t.skill}</Badge>
                          {t.formula !== "built-in" && (
                            <code className="rounded bg-muted px-1 text-[10px]">{t.formula}</code>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                        {t.source === "user" ? (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Sửa" onClick={() => openEditUser(t)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Xoá" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          // Built-in dạng khai báo (không có generator) → cho phép "Sửa" = sao chép thành mẫu custom
                          t.formula !== "built-in" && (
                            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]" title="Sửa (tạo bản sao)" onClick={() => openCloneBuiltin(t)}>
                              <Pencil className="h-3.5 w-3.5" /> Sửa
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* (B) Generate config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4" />
              Sinh đề
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-2 text-xs">
              Mẫu đang chọn:{" "}
              {selectedTemplate ? (
                <strong>{selectedTemplate.text}</strong>
              ) : (
                <span className="text-muted-foreground">— chọn 1 mẫu ở bên trái —</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Lớp</Label>
                <Input value={grade} disabled className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Tuần (1-35)</Label>
                <Input
                  type="number" min={1} max={35} value={week}
                  onChange={(e) => setWeek(Math.min(35, Math.max(1, Number(e.target.value))))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Số câu (1-50)</Label>
                <Input
                  type="number" min={1} max={50} value={count}
                  onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Mã câu bắt đầu (seq)</Label>
                <Input type="number" min={1} value={startSeq} onChange={(e) => setStartSeq(Number(e.target.value))} className="mt-1" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Mã: G{grade}_W{String(week).padStart(2, "0")}_MATH_{String(startSeq).padStart(3, "0")}…
            </p>

            <Button className="w-full" onClick={runGenerate} disabled={generating || !selectedTemplate}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate — Sinh {count} câu
            </Button>

            {report && (
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-md border p-2">
                  <div className="text-lg font-bold text-emerald-600">{report.generated}</div>
                  <div className="text-muted-foreground">Đã sinh</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-lg font-bold text-amber-600">{report.skipped_dup}</div>
                  <div className="text-muted-foreground">Trùng (bỏ)</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview list */}
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
                      <div className="text-[11px] text-muted-foreground">
                        Đáp án: {q.options.join(", ")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-sky-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
          <div>
            <div className="font-semibold">Quy trình</div>
            <p className="mt-1">
              Chọn/tạo mẫu → Generate → <strong>Xem trước &amp; Chỉnh sửa</strong> (gắn ảnh/audio nếu cần) →
              <strong> Xuất Excel 12 cột</strong> → <strong>Bulk Import</strong> (cần bài <code className="rounded bg-sky-100 px-1">G{grade}_W{String(week).padStart(2, "0")}_MATH</code>) →
              QA Queue duyệt → publish. Loại <code className="rounded bg-sky-100 px-1">comparison</code> (dấu &gt; &lt; =) chưa xuất 12 cột.
            </p>
          </div>
        </CardContent>
      </Card>

      <TemplateEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        lessonType={lessonType}
        editing={editing}
        initial={cloneSeed}
        saving={saving}
        onSubmit={onSubmitTemplate}
      />
      <MathPreviewEditModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        question={previewQuestion}
        onSave={saveAssetRefs}
      />
    </div>
  );
}
