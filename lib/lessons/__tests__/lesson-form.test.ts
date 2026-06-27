import { describe, it, expect } from "vitest";
import type { Course, Lesson } from "@/lib/types";
import {
  buildCode,
  toCreateInput,
  toUpdateInput,
  toFormValues,
  defaultFormValues,
  lessonSchema,
  type LessonFormValues,
} from "@/lib/lessons/lesson-form";

const engCourse: Course = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "ENG_G1",
  name: "Tiếng Anh Lớp 1",
  subject: "english",
  grade: 1,
  isActive: true,
} as Course;

const mathCourse: Course = {
  ...engCourse,
  id: "22222222-2222-4222-8222-222222222222",
  subject: "math",
  grade: 2,
} as Course;

describe("buildCode", () => {
  it("đặt thứ tự TRƯỚC môn: G1_W01_1_ENG", () => {
    expect(buildCode([engCourse], engCourse.id, 1, 1)).toBe("G1_W01_1_ENG");
  });

  it("zero-pad tuần + order > 1 + môn MATH", () => {
    expect(buildCode([mathCourse], mathCourse.id, 7, 3)).toBe("G2_W07_3_MATH");
  });

  it("orderIndex < 1 ép về 1", () => {
    expect(buildCode([engCourse], engCourse.id, 5, 0)).toBe("G1_W05_1_ENG");
  });

  it("trả rỗng khi không tìm thấy khoá / tuần không hợp lệ", () => {
    expect(buildCode([engCourse], "khong-ton-tai", 1, 1)).toBe("");
    expect(buildCode([engCourse], engCourse.id, 0, 1)).toBe("");
  });
});

const baseLesson: Lesson = {
  id: "33333333-3333-4333-8333-333333333333",
  courseId: engCourse.id,
  code: "G1_W01_1_ENG",
  week: 1,
  orderIndex: 1,
  name: "Lời chào",
  lessonType: "vocabulary",
  skills: ["vocab", "listening"],
  status: "draft",
  isPremium: false,
  vocabulary: [{ word: "hello", meaning: "xin chào" }],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("toFormValues ↔ transforms", () => {
  it("toFormValues nạp đúng + hợp lệ schema", () => {
    const f = toFormValues(baseLesson);
    expect(lessonSchema.safeParse(f).success).toBe(true);
    expect(f.skillsCsv).toBe("vocab, listening");
    expect(f.vocabulary).toHaveLength(1);
  });

  it("toUpdateInput tách skillsCsv + giữ vocabulary", () => {
    const f = toFormValues(baseLesson);
    const u = toUpdateInput(f);
    expect(u.skills).toEqual(["vocab", "listening"]);
    expect(u.name).toBe("Lời chào");
    expect(u.vocabulary).toHaveLength(1);
  });

  it("round-trip ổn định: toFormValues → toUpdateInput khớp dữ liệu gốc", () => {
    const f = toFormValues(baseLesson);
    const u = toUpdateInput(f);
    expect(u).toEqual({
      name: baseLesson.name,
      lessonType: baseLesson.lessonType,
      skills: baseLesson.skills,
      week: baseLesson.week,
      orderIndex: baseLesson.orderIndex,
      vocabulary: baseLesson.vocabulary,
    });
  });

  it("vocabulary rỗng → undefined (không gửi mảng rỗng)", () => {
    const f: LessonFormValues = { ...toFormValues(baseLesson), vocabulary: [] };
    expect(toUpdateInput(f).vocabulary).toBeUndefined();
    expect(toCreateInput(f).vocabulary).toBeUndefined();
  });

  it("toCreateInput gồm courseId + code + skills tách", () => {
    const f = toFormValues(baseLesson);
    const c = toCreateInput(f);
    expect(c.courseId).toBe(engCourse.id);
    expect(c.code).toBe("G1_W01_1_ENG");
    expect(c.skills).toEqual(["vocab", "listening"]);
  });
});

describe("defaultFormValues", () => {
  it("mặc định hợp lệ với courseId cho trước", () => {
    const f = defaultFormValues(engCourse.id);
    expect(f.courseId).toBe(engCourse.id);
    expect(f.lessonType).toBe("vocabulary");
    expect(f.skillsCsv).toBe("vocab, listening");
    expect(f.week).toBe(1);
    expect(f.orderIndex).toBe(1);
  });
});
