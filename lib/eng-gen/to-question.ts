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
  const correct = String(q.correct_answer || q.components.vocab || "").trim();
  const distractors = (q.components.distractors || []).map((d) => String(d).trim()).filter(Boolean);
  return Array.from(new Set([correct, ...distractors].filter(Boolean)));
}

/** Asset key (đã bỏ tiền tố) để QuestionPreviewModal ghép CDN. */
export function buildAssetRefs(q: GeneratedQuestion): string[] {
  if (q.blueprintType === "image_choice") {
    const k = stripAssetPrefix(q.components.assets.image);
    return k ? [k] : [];
  }
  if (q.blueprintType === "audio_choice") {
    const k = stripAssetPrefix(q.components.assets.audio);
    return k ? [k] : [];
  }
  return [];
}

/** GeneratedQuestion → Question (đủ field để QuestionPreviewModal render). */
export function generatedToQuestion(q: GeneratedQuestion): Question {
  const options = buildOptions(q);
  const now = new Date().toISOString();
  return {
    id: q.id,
    lessonId: "",
    code: q.id,
    type: q.blueprintType,
    skill: q.skill,
    difficulty: q.difficulty,
    content: { prompt: displayPrompt(q), options },
    correctAnswer: String(q.correct_answer || q.components.vocab || "").trim(),
    assetRefs: buildAssetRefs(q),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}
