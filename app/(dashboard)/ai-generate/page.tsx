"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Wand2, Loader2, Download, Upload, Info, Play } from "lucide-react";
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
import { coursesApi } from "@/lib/api/courses";
import { lessonsApi } from "@/lib/api/lessons";
import { assetsApi } from "@/lib/api/assets";
import type { AssetItem, Course, CreateQuestionInput, Lesson } from "@/lib/types";
import type { Question } from "@/lib/types";
import { questionsApi } from "@/lib/api/questions";
import type { GeneratedQuestion, GenReport, Skill, BlueprintType } from "@/lib/eng-gen/types";

const SKILLS: { value: Skill; label: string }[] = [
  { value: "vocabulary", label: "Từ vựng" },
  { value: "phonics", label: "Phonics" },
  { value: "sentence", label: "Câu (sắp xếp)" },
  { value: "listening", label: "Nghe" },
  { value: "review", label: "Ôn tập" },
];


type InputMode = "mc" | "letter" | "audio_choice" | "image_choice";

const INPUT_MODES: { value: InputMode; label: string }[] = [
  { value: "mc", label: "Trắc nghiệm 4 lựa chọn (đơn giản)" },
  { value: "letter", label: "Điền chữ còn thiếu (kéo thẻ chữ)" },
  { value: "audio_choice", label: "Nghe rồi chọn ảnh" },
  { value: "image_choice", label: "Ảnh rồi chọn từ" },
];

const MODE_TO_BLUEPRINT: Record<InputMode, BlueprintType> = {
  mc: "image_choice",
  letter: "missing_letter",
  audio_choice: "audio_choice",
  image_choice: "image_choice",
};

const EXPORTABLE = new Set(["image_choice", "audio_choice", "missing_letter", "multiple_choice"]);
const DIFF_COLOR: Record<number, string> = { 1: "#10b981", 2: "#f59e0b", 3: "#ef4444" };

// Mapping DB skill keys → generator Skill type (case-insensitive lookup)
const DB_SKILL_TO_GENERATOR: Record<string, Skill> = {
  vocabulary: "vocabulary",
  vocab: "vocabulary",
  "từ vựng": "vocabulary",
  phonics: "phonics",
  sentence: "sentence",
  listening: "listening",
  nghe: "listening",
  review: "review",
  "ôn tập": "review",
};

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
  const [dMax, setDMax] = useState(2);
  const [startSeq, setStartSeq] = useState(101);

  const blueprint = MODE_TO_BLUEPRINT[mode];

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

  function cdnToAssetKey(url: string): string {
    if (!url) return "";
    const m = url.match(/cdn\.studyvui\.vn\/(.+)$/);
    if (m) return m[1];
    if (url.startsWith("http")) { try { return new URL(url).pathname.replace(/^\//, ""); } catch { /* fall through */ } }
    return url;
  }

  function labelFromPath(p: string): string {
    return (p.split("/").pop() ?? p).replace(/\.[a-z0-9]+$/i, "");
  }

  function pickRandomImage(word: string, imageAssets: AssetItem[]): string {
    const lower = word.toLowerCase().replace(/\s+/g, "_");
    const matches = imageAssets.filter((a) => {
      const filename = (a.key.split("/").pop() ?? "").toLowerCase();
      return filename.startsWith(lower + "_") || filename.startsWith(lower + ".");
    });
    if (matches.length === 0) return "";
    return matches[Math.floor(Math.random() * matches.length)].key;
  }

  function generateAudioChoice(imageAssets: AssetItem[]): { questions: GeneratedQuestion[]; report: GenReport } {
    const vocab = selectedLesson?.vocabulary ?? [];
    const withAudio = vocab.filter((v) => v.audioUrl);
    if (withAudio.length === 0) throw new Error("Bài học này chưa có từ vựng có audio.");

    const allVocab = lessons.flatMap((l) => l.vocabulary ?? []);
    const qs: GeneratedQuestion[] = [];
    const report: GenReport = { generated: 0, duplicates: 0, qa_failed: 0, missing_assets: [] };
    const lessonCode = selectedLesson!.code;

    for (let i = 0; i < count; i++) {
      const vi = withAudio[i % withAudio.length];
      const word = vi.word;

      const correctImageKey = pickRandomImage(word, imageAssets) || cdnToAssetKey(vi.imageUrl ?? "");
      if (!correctImageKey) { report.qa_failed++; continue; }

      const distractorPool = allVocab.filter((v) => v.word !== word);
      const shuffled = [...distractorPool].sort(() => Math.random() - 0.5);
      const distractorImagePaths: string[] = [];
      for (const dv of shuffled) {
        if (distractorImagePaths.length >= 3) break;
        const img = pickRandomImage(dv.word, imageAssets);
        if (img) distractorImagePaths.push(img);
      }

      if (distractorImagePaths.length < 3) { report.qa_failed++; continue; }

      const audioKey = cdnToAssetKey(vi.audioUrl!);
      const correctLabel = labelFromPath(correctImageKey);
      const distractorLabels = distractorImagePaths.map(labelFromPath);

      const seq = startSeq + i;
      const code = `${lessonCode}_${String(seq).padStart(3, "0")}`;

      qs.push({
        id: code,
        grade, week, skill,
        blueprintType: "audio_choice",
        blueprint_type: "audio_choice",
        difficulty: dMin,
        lifecycleStatus: "draft",
        components: {
          stem: "Nghe và chọn hình đúng",
          vocab: word,
          meaning: vi.meaning ?? null,
          distractors: distractorLabels,
          assets: { audio: audioKey, image: correctImageKey },
        },
        correct_answer: correctLabel,
        render_spec: null,
        variable_values: {
          word, grade, week,
          optionImages: [correctImageKey, ...distractorImagePaths],
        },
        distractor_strategy: "same_topic",
        template_id: `audio_choice_vocab_${i}`,
        syncStatus: "pending",
        tags: [],
      });
      report.generated++;
    }
    return { questions: qs, report };
  }

  function generateImageChoiceFromVocab(imageAssets: AssetItem[]): { questions: GeneratedQuestion[]; report: GenReport } {
    const vocab = selectedLesson?.vocabulary ?? [];
    const withAssets = vocab.filter((v) => v.meaning);
    if (withAssets.length === 0) throw new Error("Bài học này chưa có từ vựng có nghĩa tiếng Việt.");

    const allVocab = lessons.flatMap((l) => l.vocabulary ?? []).filter((v) => v.meaning);
    const qs: GeneratedQuestion[] = [];
    const report: GenReport = { generated: 0, duplicates: 0, qa_failed: 0, missing_assets: [] };
    const lessonCode = selectedLesson!.code;

    for (let i = 0; i < count; i++) {
      const vi = withAssets[i % withAssets.length];
      const word = vi.word;
      const correctMeaning = vi.meaning!;

      const distractorPool = allVocab.filter((v) => v.word !== word && v.meaning && v.meaning !== correctMeaning);
      const shuffled = [...distractorPool].sort(() => Math.random() - 0.5);
      const distractorMeanings = shuffled.slice(0, 3).map((v) => v.meaning!);

      if (distractorMeanings.length < 3) { report.qa_failed++; continue; }

      const imageKey = pickRandomImage(word, imageAssets) || cdnToAssetKey(vi.imageUrl ?? "");
      const audioKey = vi.audioUrl ? cdnToAssetKey(vi.audioUrl) : "";

      const seq = startSeq + i;
      const code = `${lessonCode}_${String(seq).padStart(3, "0")}`;

      qs.push({
        id: code,
        grade, week, skill,
        blueprintType: "image_choice",
        blueprint_type: "image_choice",
        difficulty: dMin,
        lifecycleStatus: "draft",
        components: {
          stem: "Nhìn hình và chọn nghĩa đúng",
          vocab: word,
          meaning: correctMeaning,
          distractors: distractorMeanings,
          assets: { image: imageKey, audio: audioKey },
        },
        correct_answer: correctMeaning,
        render_spec: null,
        variable_values: { word, grade, week },
        distractor_strategy: "same_topic",
        template_id: `image_choice_vocab_${i}`,
        syncStatus: "pending",
        tags: [],
      });
      report.generated++;
    }
    return { questions: qs, report };
  }

  function generateLetterFromVocab(imageAssets: AssetItem[]): { questions: GeneratedQuestion[]; report: GenReport } {
    const vocab = selectedLesson?.vocabulary ?? [];
    if (vocab.length === 0) throw new Error("Bài học này chưa có từ vựng.");

    const qs: GeneratedQuestion[] = [];
    const report: GenReport = { generated: 0, duplicates: 0, qa_failed: 0, missing_assets: [] };
    const lessonCode = selectedLesson!.code;
    const allLetters = "abcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < count; i++) {
      const vi = vocab[i % vocab.length];
      const word = vi.word.toLowerCase();
      const hideCount = word.length <= 2 ? 1 : 2;

      const indices = Array.from({ length: word.length }, (_, idx) => idx);
      for (let j = indices.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [indices[j], indices[k]] = [indices[k], indices[j]];
      }
      const hiddenIndices = indices.slice(0, hideCount).sort((a, b) => a - b);
      const hiddenChars = hiddenIndices.map((idx) => word[idx]);

      let pattern = "";
      for (let c = 0; c < word.length; c++) {
        pattern += hiddenIndices.includes(c) ? "_" : word[c];
      }

      const answerSet = new Set(hiddenChars);
      const distractorLetters: string[] = [];
      const pool = allLetters.split("").filter((ch) => !answerSet.has(ch));
      for (let d = pool.length - 1; d > 0; d--) {
        const k = Math.floor(Math.random() * (d + 1));
        [pool[d], pool[k]] = [pool[k], pool[d]];
      }
      const needed = Math.max(2, 4 - hideCount);
      distractorLetters.push(...pool.slice(0, needed));

      const imageKey = pickRandomImage(vi.word, imageAssets) || cdnToAssetKey(vi.imageUrl ?? "");
      const audioKey = vi.audioUrl ? cdnToAssetKey(vi.audioUrl) : "";

      const seq = startSeq + i;
      const code = `${lessonCode}_${String(seq).padStart(3, "0")}`;

      qs.push({
        id: code,
        grade, week, skill,
        blueprintType: "missing_letter",
        blueprint_type: "missing_letter",
        difficulty: dMin,
        lifecycleStatus: "draft",
        components: {
          stem: "Điền chữ còn thiếu",
          vocab: word,
          meaning: vi.meaning ?? null,
          distractors: distractorLetters,
          assets: { image: imageKey, audio: audioKey },
        },
        correct_answer: hiddenChars.join(""),
        render_spec: {
          blueprint_type: "missing_letter",
          vocab_word: word,
          image_path: imageKey,
          audio_path: audioKey,
          correct_letter: hiddenChars.join(""),
          missing_word: pattern,
          gap_position: hiddenIndices[0],
          sentence_words: null,
          correct_order: null,
        },
        variable_values: { word, grade, week, pattern, hiddenChars, tiles: [...hiddenChars, ...distractorLetters] },
        distractor_strategy: "mixed",
        template_id: `letter_vocab_${i}`,
        syncStatus: "pending",
        tags: [],
      });
      report.generated++;
    }
    return { questions: qs, report };
  }

  async function runGenerate() {
    setGenerating(true);
    setProgress(0);
    setQuestions([]);
    setReport(null);
    setSelected(new Set());
    try {
      let qs: GeneratedQuestion[];
      let rpt: GenReport;

      if (mode === "audio_choice" || mode === "image_choice" || mode === "letter") {
        const imgAssets = await assetsApi.list({ type: "image" });
        const result = mode === "audio_choice"
          ? generateAudioChoice(imgAssets)
          : mode === "image_choice"
            ? generateImageChoiceFromVocab(imgAssets)
            : generateLetterFromVocab(imgAssets);
        qs = result.questions;
        rpt = result.report;
      } else {
        const range: [number, number] = [Math.min(dMin, dMax), Math.max(dMin, dMax)];
        const result = await generateEnglishQuestionsWithProgress(
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
        qs = result.questions;
        rpt = result.report;
      }

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
      alert(`Tạo thành công ${result.inserted} câu hỏi.${result.skipped > 0 ? ` Bỏ qua ${result.skipped} câu trùng.` : ""}`);
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
                  <SelectTrigger className="mt-1">
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

