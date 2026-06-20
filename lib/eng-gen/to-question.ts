// ============================================================
// Map GeneratedQuestion (bộ sinh đề) → Question (shape của admin-cms)
// để tái dùng QuestionPreviewModal ("Xem thử" như trang Câu hỏi).
// ============================================================
import type { Question } from "@/lib/types";
import type { GeneratedQuestion } from "./types";

function stripAssetPrefix(path: string): string {
  // CDN key thật giữ tiền tố images/ · audio/ (vd images/grade1/english/hello_1.png),
  // chỉ bỏ tiền tố "assets/" của đường dẫn nội bộ.
  return (path || "").replace(/^\/?assets\//, "").trim();
}

/** Đề bài hiển thị — với missing_letter ghép thêm pattern có ô trống. */
export function displayPrompt(q: GeneratedQuestion): string {
  const stem = q.components.stem || "";
  if (q.blueprintType === "missing_letter") {
    const pattern = q.render_spec?.missing_word || "";
    if (pattern) return `${stem}  —  ${pattern.replace(/_/g, " _ ")}`;
  }
  return stem;
}

/** Danh sách lựa chọn: [đáp án đúng, ...nhiễu] (duy nhất). */
export function buildOptions(q: GeneratedQuestion): string[] {
  if (q.blueprintType === "missing_letter") {
    const hiddenChars = (q.variable_values?.hiddenChars as string[] | undefined) ?? q.correct_answer.split("");
    const distractors = (q.components.distractors || []).map((d) => String(d).trim()).filter(Boolean);
    return Array.from(new Set([...hiddenChars, ...distractors].filter(Boolean)));
  }
  const correct = String(q.correct_answer || q.components.vocab || "").trim();
  const distractors = (q.components.distractors || []).map((d) => String(d).trim()).filter(Boolean);
  return Array.from(new Set([correct, ...distractors].filter(Boolean)));
}

/** Asset key (đã bỏ tiền tố) để QuestionPreviewModal ghép CDN. */
export function buildAssetRefs(q: GeneratedQuestion): string[] {
  if (q.blueprintType === "image_choice") {
    const refs: string[] = [];
    const imgKey = stripAssetPrefix(q.components.assets.image);
    if (imgKey) refs.push(imgKey);
    const audioKey = stripAssetPrefix(q.components.assets.audio);
    if (audioKey) refs.push(audioKey);
    return refs;
  }
  if (q.blueprintType === "audio_choice") {
    const audioKey = stripAssetPrefix(q.components.assets.audio);
    const optImgs = (q.variable_values?.optionImages as string[] | undefined) ?? [];
    if (optImgs.length > 0) {
      return [audioKey, ...optImgs.map(stripAssetPrefix)].filter(Boolean);
    }
    return audioKey ? [audioKey] : [];
  }
  if (q.blueprintType === "missing_letter") {
    const refs: string[] = [];
    const imgKey = stripAssetPrefix(q.components.assets.image);
    if (imgKey) refs.push(imgKey);
    const audioKey = stripAssetPrefix(q.components.assets.audio);
    if (audioKey) refs.push(audioKey);
    return refs;
  }
  return [];
}

/** GeneratedQuestion → Question (đủ field để QuestionPreviewModal render). */
export function generatedToQuestion(q: GeneratedQuestion): Question {
  const options = buildOptions(q);
  const now = new Date().toISOString();

  let content: Record<string, unknown> = { prompt: displayPrompt(q), options };

  if (q.blueprintType === "missing_letter" && q.variable_values) {
    const word = String(q.components.vocab || "");
    const hiddenChars = (q.variable_values.hiddenChars as string[]) ?? [];
    const pattern = String(q.variable_values.pattern || "");
    const tiles = (q.variable_values.tiles as string[]) ?? options;

    content = {
      prompt: q.components.stem || "Điền chữ còn thiếu",
      word,
      pattern,
      blanks: hiddenChars.length,
      tiles,
    };
  }

  return {
    id: q.id,
    lessonId: "",
    code: q.id,
    type: q.blueprintType,
    skill: q.skill,
    difficulty: q.difficulty,
    content,
    correctAnswer: String(q.correct_answer || q.components.vocab || "").trim(),
    assetRefs: buildAssetRefs(q),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}
