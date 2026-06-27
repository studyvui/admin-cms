// Logic THUẦN cho trang AI Sinh đề Toán — tách từ page.tsx để test được. Giữ NGUYÊN VẸN.

import type { Lesson } from "@/lib/types";
import type { MathTemplate, ServerTemplate } from "@/lib/math-gen/types";

/** Template lưu backend (ServerTemplate) → MathTemplate dùng trong generator. */
export function serverToTemplate(s: ServerTemplate): MathTemplate {
  return {
    id: s.id,
    source: "user",
    lessonType: s.lessonType,
    skill: s.skill,
    grade: s.grade,
    text: s.text,
    formula: s.formula,
    condition: s.condition ?? undefined,
    vars: s.vars || [],
    distractorCount: s.distractorCount || 3,
  };
}

/**
 * Lập Map tuần → bài học Toán `G{grade}_W{week}_MATH` (mỗi tuần lấy bài đầu tiên).
 * Khóa Map theo `lesson.week` (không phải số trong code).
 */
export function buildMathLessonByWeek(
  lessons: Lesson[],
  grade: number,
): Map<number, Lesson> {
  const m = new Map<number, Lesson>();
  const re = new RegExp(`^G${grade}_W(\\d+)_MATH$`);
  for (const l of lessons) {
    const mt = re.exec(l.code);
    if (mt && !m.has(l.week)) m.set(l.week, l);
  }
  return m;
}
