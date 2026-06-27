import { describe, it, expect } from "vitest";
import type { Lesson } from "@/lib/types";
import type { ServerTemplate } from "@/lib/math-gen/types";
import {
  serverToTemplate,
  buildMathLessonByWeek,
} from "@/lib/math-gen/page-helpers";

describe("serverToTemplate", () => {
  it("map ServerTemplate → MathTemplate (source user, default vars/distractor)", () => {
    const s = {
      id: "t1",
      lessonType: "calculation",
      skill: "calculation",
      grade: 1,
      text: "{a} + {b} = ?",
      formula: "a + b",
      condition: null,
    } as unknown as ServerTemplate;
    const t = serverToTemplate(s);
    expect(t.source).toBe("user");
    expect(t.id).toBe("t1");
    expect(t.formula).toBe("a + b");
    expect(t.condition).toBeUndefined(); // null → undefined
    expect(t.vars).toEqual([]); // mặc định []
    expect(t.distractorCount).toBe(3); // mặc định 3
  });

  it("giữ vars + distractorCount khi có", () => {
    const s = {
      id: "t2",
      lessonType: "calculation",
      skill: "calculation",
      grade: 1,
      text: "x",
      formula: "a - b",
      condition: "a >= b",
      vars: [{ name: "a", kind: "number", min: 1, max: 9 }],
      distractorCount: 4,
    } as unknown as ServerTemplate;
    const t = serverToTemplate(s);
    expect(t.condition).toBe("a >= b");
    expect(t.vars).toHaveLength(1);
    expect(t.distractorCount).toBe(4);
  });
});

function lesson(code: string, week: number, partial: Partial<Lesson> = {}): Lesson {
  return {
    id: `id-${code}`,
    courseId: "c1",
    code,
    week,
    orderIndex: 1,
    name: code,
    lessonType: "calculation",
    skills: [],
    status: "published",
    isPremium: false,
    createdAt: "",
    updatedAt: "",
    ...partial,
  } as Lesson;
}

describe("buildMathLessonByWeek", () => {
  it("chỉ lấy bài G{grade}_W..._MATH, khóa theo lesson.week", () => {
    const lessons = [
      lesson("G1_W01_MATH", 1),
      lesson("G1_W02_MATH", 2),
      lesson("G1_W01_ENG", 1), // không phải MATH → bỏ
      lesson("G2_W01_MATH", 1), // khác grade → bỏ
    ];
    const m = buildMathLessonByWeek(lessons, 1);
    expect(m.size).toBe(2);
    expect(m.get(1)?.code).toBe("G1_W01_MATH");
    expect(m.get(2)?.code).toBe("G1_W02_MATH");
  });

  it("mỗi tuần lấy bài đầu tiên (bỏ trùng tuần)", () => {
    const lessons = [
      lesson("G1_W01_MATH", 1, { name: "A" }),
      lesson("G1_W01_MATH", 1, { name: "B" }),
    ];
    const m = buildMathLessonByWeek(lessons, 1);
    expect(m.size).toBe(1);
    expect(m.get(1)?.name).toBe("A");
  });
});
