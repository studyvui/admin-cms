// ============================================================
// Map GeneratedMathQuestion → Question (shape admin-cms) để tái dùng
// modal Xem trước & Chỉnh sửa (giống trang Câu hỏi).
// ============================================================
import type { Question } from "@/lib/types";
import type { GeneratedMathQuestion } from "./types";

function stripAssetPrefix(path: string): string {
  return (path || "").replace(/^\/?assets\//, "").trim();
}

export function generatedToQuestion(q: GeneratedMathQuestion): Question {
  const now = new Date().toISOString();
  const options = Array.from(new Set([String(q.correct_answer), ...q.options.map(String)].filter(Boolean)));
  return {
    id: q.id,
    lessonId: "",
    code: q.id,
    type: "multiple_choice",
    skill: q.skill,
    difficulty: q.difficulty,
    content: { prompt: q.text, options },
    correctAnswer: String(q.correct_answer),
    assetRefs: (q.assetRefs || []).map(stripAssetPrefix).filter(Boolean),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}
