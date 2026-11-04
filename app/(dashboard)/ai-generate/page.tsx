"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Wand2, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toBulkRows, downloadBulkXlsx } from "@/lib/eng-gen/export-xlsx";
import { generatedToQuestion } from "@/lib/eng-gen/to-question";
import {
  generateAudioChoiceFromVocab,
  generateImageChoiceFromVocab,
  generateLetterFromVocab,
  type VocabGenOpts,
} from "@/lib/eng-gen/page-generators";
import { QuestionPreviewModal } from "@/components/question-preview/question-preview-modal";
import { coursesApi } from "@/lib/api/courses";
import { lessonsApi } from "@/lib/api/lessons";
import { assetsApi } from "@/lib/api/assets";
import type { Course, CreateQuestionInput, Lesson } from "@/lib/types";
import type { Question } from "@/lib/types";
import { questionsApi } from "@/lib/api/questions";
import type { GeneratedQuestion, GenReport, Skill } from "@/lib/eng-gen/types";

import { AiGeneratePreviewCard } from "./ai-generate-preview-card";
import {
  SKILLS,
  INPUT_MODES,
  EXPORTABLE,
  DB_SKILL_TO_GENERATOR,
  type InputMode,
} from "./ai-generate-constants";


export default function AiGeneratePage() {
  /* ---- Courses & Lessons from API ---- */
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState<string>("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    setLoadingCourses(true);
    coursesApi
      .list()
      .then((data) => {
        const active = data.filter((c) => c.isActive && c.subject === "english");
        setCourses(active);
        if (active.length > 0) {
          setCourseId(active[0].id);
        }
      })
      .catch((e) => console.error("[ai-generate] load courses:", e))
      .finally(() => setLoadingCourses(false));
  }, []);

  // Fetch lessons when courseId changes
  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      setLessonId("");
      return;
    }
    setLoadingLessons(true);
    lessonsApi
      .list({ courseId })
      .then((data) => {
        // Sort by week then orderIndex
        const sorted = data.sort((a, b) => a.week - b.week || a.orderIndex - b.orderIndex);
        setLessons(sorted);
        setLessonId(sorted.length > 0 ? sorted[0].id : "");
      })
      .catch((e) => console.error("[ai-generate] load lessons:", e))
      .finally(() => setLoadingLessons(false));
  }, [courseId]);

  // Derived values from selected course/lesson
  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedLesson = lessons.find((l) => l.id === lessonId);
  const grade = selectedCourse?.grade ?? 1;
  const week = selectedLesson?.week ?? 1;

  // Filter skills based on selected lesson's skills array — computed every render
  // (only 5 items, no need for memoization)
  let availableSkills = SKILLS;
  if (selectedLesson && selectedLesson.skills && selectedLesson.skills.length > 0) {
    const mapped = new Set<Skill>();
    for (const s of selectedLesson.skills) {
      const gen = DB_SKILL_TO_GENERATOR[s.toLowerCase()];
      if (gen) mapped.add(gen);
    }
    if (mapped.size > 0) {
      const filtered = SKILLS.filter((sk) => mapped.has(sk.value));
      if (filtered.length > 0) availableSkills = filtered;
    }
  }

  /* ---- Generator config ---- */
  const [skill, setSkill] = useState<Skill>("vocabulary");
  const [mode, setMode] = useState<InputMode>("image_choice");
  const [count, setCount] = useState(10);
  const [dMin, setDMin] = useState(1);
  const [startSeq, setStartSeq] = useState(101);

  // Auto-reset skill when lesson changes and current skill is not available
  useEffect(() => {
    if (availableSkills.length > 0 && !availableSkills.some((s) => s.value === skill)) {
      const first = availableSkills[0].value;
      setSkill(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [report, setReport] = useState<GenReport | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewQ, setPreviewQ] = useState<Question | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedQuestions = useMemo(
    () => questions.filter((_, i) => selected.has(i)),
    [questions, selected],
  );
  const exportableCount = useMemo(
    () => selectedQuestions.filter((q) => EXPORTABLE.has(q.blueprintType)).length,
    [selectedQuestions],
  );

  function onSkillChange(v: string) {
    setSkill(v as Skill);
  }

  async function runGenerate() {
    setGenerating(true);
    setProgress(0);
    setQuestions([]);
    setReport(null);
    setSelected(new Set());
    try {
      if (!selectedLesson) throw new Error("Chưa chọn bài học.");
      const imgAssets = await assetsApi.list({ type: "image" });
      const genOpts: VocabGenOpts = {
        selectedLesson,
        allLessons: lessons,
        count,
        startSeq,
        grade,
        week,
        skill,
        dMin,
      };
      const { questions: qs, report: rpt } =
        mode === "audio_choice"
          ? generateAudioChoiceFromVocab(imgAssets, genOpts)
          : mode === "image_choice"
            ? generateImageChoiceFromVocab(imgAssets, genOpts)
            : generateLetterFromVocab(imgAssets, genOpts);

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

  const [importing, setImporting] = useState(false);

  function generatedToInput(q: GeneratedQuestion): CreateQuestionInput {
    const converted = generatedToQuestion(q);
    return {
      lessonId: selectedLesson!.id,
      code: q.id,
      type: converted.type,
      skill: q.skill,
      difficulty: q.difficulty,
      content: converted.content,
      correctAnswer: converted.correctAnswer,
      assetRefs: converted.assetRefs,
    };
  }

  async function importDirect() {
    if (selectedQuestions.length === 0) return;
    setImporting(true);
    try {
      const inputs = selectedQuestions.map(generatedToInput);
      const result = await questionsApi.bulkUpload(inputs);
      alert(`Tạo thành công ${result.created} câu hỏi.${result.skipped > 0 ? ` Bỏ qua ${result.skipped} câu trùng (code đã tồn tại).` : ""}`);
    } catch (e) {
      alert("Lỗi tạo câu hỏi: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setImporting(false);
    }
  }

  function exportXlsx() {
    const { rows, skipped } = toBulkRows(selectedQuestions, { grade, week, startSeq, lessonCode: selectedLesson?.code });
    if (rows.length === 0) {
      alert(
        "Không có câu nào xuất được. Chỉ image_choice / audio_choice / missing_letter / reorder khớp định dạng 12 cột.",
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
          → <strong>Tạo câu hỏi</strong> trực tiếp hoặc Xuất Excel.
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
              {/* Khóa học (thay cho Lớp) */}
              <div>
                <Label className="text-xs">Khóa học</Label>
                {loadingCourses ? (
                  <div className="mt-1 flex h-10 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
                  </div>
                ) : courses.length === 0 ? (
                  <div className="mt-1 flex h-10 items-center rounded-md border px-3 text-sm text-muted-foreground">
                    Chưa có khóa học
                  </div>
                ) : (
                  <Select value={courseId} onValueChange={(v) => setCourseId(v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn khóa học" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {/* Bài học (thay cho Tuần) */}
              <div>
                <Label className="text-xs">Bài học</Label>
                {loadingLessons ? (
                  <div className="mt-1 flex h-10 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="mt-1 flex h-10 items-center rounded-md border px-3 text-sm text-muted-foreground">
                    {courseId ? "Chưa có bài học" : "Chọn khóa học trước"}
                  </div>
                ) : (
                  <Select value={lessonId} onValueChange={(v) => setLessonId(v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn bài học" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          Tuần {l.week} — {l.name} ({l.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                    {availableSkills.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Chế độ nhập</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as InputMode)}>
                  <SelectTrigger className="mt-1" aria-label="Chế độ nhập">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INPUT_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs">Độ khó</Label>
                <Input type="number" min={1} max={3} value={dMin} onChange={(e) => setDMin(Number(e.target.value))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Mã câu bắt đầu (seq)</Label>
              <Input type="number" min={1} value={startSeq} onChange={(e) => setStartSeq(Number(e.target.value))} className="mt-1" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Mặc định 101 để tránh đè câu seed cũ. Mã: {selectedLesson?.code ?? `G${grade}_W${String(week).padStart(2, "0")}_ENG`}_{String(startSeq).padStart(3, "0")}…
              </p>
            </div>

            <Button className="w-full" onClick={runGenerate} disabled={generating || !courseId || !lessonId}>
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
        <AiGeneratePreviewCard
          questions={questions}
          selected={selected}
          importing={importing}
          exportableCount={exportableCount}
          importDirect={importDirect}
          exportXlsx={exportXlsx}
          toggle={toggle}
          openPreview={openPreview}
        />
      </div>

      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-sky-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
          <div>
            <div className="font-semibold">Quy trình</div>
            <p className="mt-1">
              Generate → chọn câu → <strong>Tạo câu hỏi</strong> (tạo trực tiếp vào hệ thống, status draft) →
              <strong>QA Queue</strong> duyệt → publish → học sinh thấy trên studyvui.vn.
              Hoặc <strong>Xuất Excel</strong> → <strong>Bulk Import</strong> (chỉ hỗ trợ loại trắc nghiệm/chọn ảnh/nghe chọn).
            </p>
          </div>
        </CardContent>
      </Card>

      <QuestionPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} question={previewQ} />
    </div>
  );
}

