// Schema form + transform THUẦN cho trang Bài học — tách từ app/(dashboard)/lessons/page.tsx.
// `buildCode` (sinh mã bài) và toCreateInput/toUpdateInput/toFormValues đặt cạnh nhau để test.
// Hành vi giữ NGUYÊN VẸN so với bản inline cũ.

import { z } from "zod";
import type {
  Course,
  Lesson,
  CreateLessonInput,
  UpdateLessonInput,
  VocabItem,
} from "@/lib/types";

const vocabItemSchema = z.object({
  word: z.string().min(1, "Bắt buộc"),
  meaning: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
});

export const lessonSchema = z.object({
  courseId: z.string().uuid("Chọn khoá học"),
  code: z
    .string()
    .min(3, "Tối thiểu 3 ký tự")
    .regex(/^[A-Z0-9_]+$/, "Chỉ chữ HOA, số, dấu gạch dưới"),
  week: z.number().int().min(1).max(40),
  orderIndex: z.number().int().min(1).max(100),
  name: z.string().min(1, "Bắt buộc"),
  lessonType: z.string().min(1, "Bắt buộc"),
  skillsCsv: z.string().min(1, "Ít nhất 1 skill"),
  vocabulary: z.array(vocabItemSchema),
});

export type LessonFormValues = z.infer<typeof lessonSchema>;

const SUBJECT_CODE: Record<string, string> = { english: "ENG", math: "MATH" };

/**
 * Sinh mã bài `G{grade}_W{ww}_{order}_{SUBJECT}`. THỨ TỰ đặt TRƯỚC môn để tránh nhập nhằng
 * với mã câu hỏi (vd G1_W01_1_ENG → câu hỏi G1_W01_1_ENG_001). Giữ NGUYÊN VẸN.
 */
export function buildCode(
  courses: Course[],
  courseId: string,
  week: number,
  orderIndex: number,
): string {
  const course = courses.find((c) => c.id === courseId);
  if (!course || !week || week < 1) return "";
  const w = String(week).padStart(2, "0");
  const sub = SUBJECT_CODE[course.subject] ?? course.subject.toUpperCase();
  const order = orderIndex >= 1 ? orderIndex : 1;
  return `G${course.grade}_W${w}_${order}_${sub}`;
}

function splitSkills(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Form values → payload TẠO MỚI. THUẦN. */
export function toCreateInput(values: LessonFormValues): CreateLessonInput {
  return {
    courseId: values.courseId,
    code: values.code,
    week: values.week,
    orderIndex: values.orderIndex,
    name: values.name,
    lessonType: values.lessonType,
    skills: splitSkills(values.skillsCsv),
    vocabulary: values.vocabulary?.length ? values.vocabulary : undefined,
  };
}

/** Form values → payload CẬP NHẬT. THUẦN. */
export function toUpdateInput(values: LessonFormValues): UpdateLessonInput {
  return {
    name: values.name,
    lessonType: values.lessonType,
    skills: splitSkills(values.skillsCsv),
    week: values.week,
    orderIndex: values.orderIndex,
    vocabulary: values.vocabulary?.length ? values.vocabulary : undefined,
  };
}

/** Lesson đã lưu → form values (khi mở Sửa). THUẦN. */
export function toFormValues(editing: Lesson): LessonFormValues {
  return {
    courseId: editing.courseId,
    code: editing.code,
    week: editing.week,
    orderIndex: editing.orderIndex,
    name: editing.name,
    lessonType: editing.lessonType,
    skillsCsv: editing.skills.join(", "),
    vocabulary: (editing.vocabulary ?? []) as VocabItem[],
  };
}

/** Form values mặc định khi TẠO MỚI. THUẦN. `courseId` do component truyền vào. */
export function defaultFormValues(courseId: string): LessonFormValues {
  return {
    courseId,
    code: "",
    week: 1,
    orderIndex: 1,
    name: "",
    lessonType: "vocabulary",
    skillsCsv: "vocab, listening",
    vocabulary: [],
  };
}
