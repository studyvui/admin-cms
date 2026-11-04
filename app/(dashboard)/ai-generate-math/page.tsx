"use client";

import { useMemo, useState } from "react";
import { Calculator, Wand2, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { extractError } from "@/lib/errors";
import { getBuiltinsForLessonType } from "@/lib/math-gen/builtins";
import { getGrade1ShapeBuiltinsForLessonType } from "@/lib/math-gen/builtins-grade1-shapes";
import { getGrade2BuiltinsForLessonType } from "@/lib/math-gen/builtins-grade2";
import { getGrade3BuiltinsForLessonType } from "@/lib/math-gen/builtins-grade3";
import { getGrade4BuiltinsForLessonType } from "@/lib/math-gen/builtins-grade4";
import { getGrade5BuiltinsForLessonType } from "@/lib/math-gen/builtins-grade5";
import { serverToTemplate } from "@/lib/math-gen/page-helpers";
import { useMathGen } from "./use-math-gen";
import { generateBatch } from "@/lib/math-gen/generate";
import { toBulkRows, downloadBulkXlsx } from "@/lib/math-gen/export-xlsx";
import { TemplateEditorModal } from "@/components/math-template/template-editor-modal";
import {
  SequenceRangeModal,
  DEFAULT_SEQUENCE_RANGE,
  type SequenceRangeValue,
} from "@/components/math-template/sequence-range-modal";
import { MathPreviewEditModal } from "@/components/question-preview/math-preview-edit-modal";
import type {
  GeneratedMathQuestion,
  MathGenReport,
  MathTemplate,
  ServerTemplate,
  TemplateInput,
} from "@/lib/math-gen/types";
import { MathLessonPickerCard } from "./math-lesson-picker-card";
import { MathTemplateBankCard } from "./math-template-bank-card";
import { MathPreviewListCard } from "./math-preview-list-card";

export default function AiGenerateMathPage() {
  const [grade, setGrade] = useState(1);
  const [week, setWeek] = useState(1);
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
  const [seqRangeOpen, setSeqRangeOpen] = useState(false);
  const [seqRange, setSeqRange] = useState<SequenceRangeValue>(DEFAULT_SEQUENCE_RANGE);

  // Data layer (bài học theo tuần + ngân hàng mẫu + CRUD mẫu) — xem use-math-gen.ts
  const {
    currentLesson,
    lessonType,
    allowedSkills,
    userTemplates,
    isLoading,
    createMut,
    updateMut,
    deleteMut,
    saving,
  } = useMathGen({ grade, week });

  // ── Templates: built-in + user (backend), lọc theo lessonType của tuần ──
  // Built-in Lớp 1-5 nằm ở 5 registry riêng (builtins.ts / builtins-grade2.ts /
  // builtins-grade3.ts / builtins-grade4.ts / builtins-grade5.ts) vì phạm vi số
  // mỗi lớp khác hẳn nhau. Lớp 5 là lớp cuối lộ trình 5 lớp (2026-08-13).
  const builtins = useMemo(() => {
    if (!lessonType) return [];
    if (grade === 1) {
      return [...getBuiltinsForLessonType(lessonType, 1), ...getGrade1ShapeBuiltinsForLessonType(lessonType)];
    }
    if (grade === 2) return getGrade2BuiltinsForLessonType(lessonType);
    if (grade === 3) return getGrade3BuiltinsForLessonType(lessonType);
    if (grade === 4) return getGrade4BuiltinsForLessonType(lessonType);
    if (grade === 5) return getGrade5BuiltinsForLessonType(lessonType);
    return [];
  }, [lessonType, grade]);
  const allTemplates: MathTemplate[] = useMemo(
    () => [...builtins, ...userTemplates.map(serverToTemplate)],
    [builtins, userTemplates],
  );
  const selectedTemplate = allTemplates.find((t) => t.id === selectedTplId) || null;

  const selectedQuestions = useMemo(
    () => questions.filter((_, i) => selectedQ.has(i)),
    [questions, selectedQ],
  );
  const exportableCount = useMemo(
    () => selectedQuestions.filter((q) => q.optionsType !== "comparison").length,
    [selectedQuestions],
  );

  function onWeekChange(v: number) {
    setWeek(Math.min(35, Math.max(1, v)));
    setSelectedTplId(null);
  }

  function onGradeChange(v: number) {
    setGrade(v);
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
        builtinParams: selectedTemplate.id === "TPL_SEQ_01" ? seqRange : undefined,
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
    setQuestions((prev) => prev.map((q, i) => (i === previewIdx ? { ...q, assetRefs: refs } : q)));
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
    const opts = {
      onSuccess: () => setEditorOpen(false),
      onError: (e: unknown) => alert(extractError(e)),
    };
    if (id) updateMut.mutate({ id, input }, opts);
    else createMut.mutate(input, opts);
  }

  function handleDelete(id: string) {
    if (!confirm("Xoá template này?")) return;
    deleteMut.mutate(id, { onError: (e) => alert(extractError(e)) });
  }

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
  function openSequenceRange() {
    setSeqRangeOpen(true);
  }
  function openCloneBuiltin(t: MathTemplate) {
    setEditing(null);
    setCloneSeed({
      lessonType,
      skill: t.skill,
      grade,
      text: t.text,
      formula: t.formula,
      condition: t.condition,
      vars: t.vars,
      distractorCount: t.distractorCount,
    });
    setEditorOpen(true);
  }

  const previewQuestion = previewIdx != null ? questions[previewIdx] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Calculator className="h-6 w-6" />
          AI Sinh đề Toán
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn tuần → bám theo bài học của tuần đó. Ngân hàng mẫu (biến min–max / danh sách chữ + điều kiện),
          sinh tại chỗ <strong>0 token</strong> → xem trước &amp; gắn ảnh/audio → Xuất Excel 12 cột.
        </p>
      </div>

      {/* Chọn bài học theo tuần */}
      <MathLessonPickerCard
        grade={grade}
        week={week}
        currentLesson={currentLesson}
        allowedSkills={allowedSkills}
        onGradeChange={onGradeChange}
        onWeekChange={onWeekChange}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* (A) Template manager */}
        <MathTemplateBankCard
          lessonType={lessonType}
          isLoading={isLoading}
          allTemplates={allTemplates}
          selectedTplId={selectedTplId}
          setSelectedTplId={setSelectedTplId}
          openAddTemplate={openAddTemplate}
          openEditUser={openEditUser}
          handleDelete={handleDelete}
          openCloneBuiltin={openCloneBuiltin}
          openSequenceRange={openSequenceRange}
        />

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
      <MathPreviewListCard
        questions={questions}
        selectedQ={selectedQ}
        exportableCount={exportableCount}
        exportXlsx={exportXlsx}
        toggleQ={toggleQ}
        openPreview={openPreview}
      />

      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-sky-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
          <div>
            <div className="font-semibold">Quy trình</div>
            <p className="mt-1">
              Chọn tuần (bám bài học) → chọn/tạo mẫu → Generate → <strong>Xem trước &amp; Chỉnh sửa</strong> (gắn ảnh/audio) →
              <strong> Xuất Excel 12 cột</strong> → <strong>Bulk Import</strong> → QA Queue duyệt → publish.
              Loại <code className="rounded bg-sky-100 px-1">comparison</code> (dấu &gt; &lt; =) chưa xuất 12 cột.
            </p>
          </div>
        </CardContent>
      </Card>

      <TemplateEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        lessonType={lessonType}
        grade={grade}
        editing={editing}
        initial={cloneSeed}
        allowedSkills={allowedSkills}
        saving={saving}
        onSubmit={onSubmitTemplate}
      />
      <MathPreviewEditModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        question={previewQuestion}
        onSave={saveAssetRefs}
      />
      <SequenceRangeModal
        open={seqRangeOpen}
        onOpenChange={setSeqRangeOpen}
        initial={seqRange}
        onApply={setSeqRange}
      />
    </div>
  );
}
