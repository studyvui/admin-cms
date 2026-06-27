import { describe, it, expect } from "vitest";
import type { Lesson } from "@/lib/types";
import {
  cdnToAssetKey,
  labelFromPath,
  generateLetterFromVocab,
  generateImageChoiceFromVocab,
  type VocabGenOpts,
} from "@/lib/eng-gen/page-generators";

function lesson(vocab: { word: string; meaning?: string; audioUrl?: string; imageUrl?: string }[]): Lesson {
  return {
    id: "L1",
    courseId: "C1",
    code: "G1_W01_1_ENG",
    week: 1,
    orderIndex: 1,
    name: "Test",
    lessonType: "vocabulary",
    skills: ["vocab"],
    status: "published",
    isPremium: false,
    vocabulary: vocab,
    createdAt: "",
    updatedAt: "",
  } as Lesson;
}

function opts(l: Lesson, count: number): VocabGenOpts {
  return {
    selectedLesson: l,
    allLessons: [l],
    count,
    startSeq: 101,
    grade: 1,
    week: 1,
    skill: "vocabulary",
    dMin: 1,
  };
}

describe("helpers", () => {
  it("cdnToAssetKey lấy key sau domain CDN", () => {
    expect(cdnToAssetKey("https://cdn.studyvui.vn/grade1/english/cat.png")).toBe(
      "grade1/english/cat.png",
    );
    expect(cdnToAssetKey("")).toBe("");
  });
  it("labelFromPath bỏ folder + đuôi", () => {
    expect(labelFromPath("grade1/english/cat_1.png")).toBe("cat_1");
  });
});

describe("generateLetterFromVocab", () => {
  it("sinh đúng count câu missing_letter, code tuần tự", () => {
    const l = lesson([{ word: "hello" }, { word: "cat" }]);
    const { questions, report } = generateLetterFromVocab([], opts(l, 5));
    expect(questions).toHaveLength(5);
    expect(report.generated).toBe(5);
    questions.forEach((q, i) => {
      expect(q.blueprintType).toBe("missing_letter");
      expect(q.correct_answer.length).toBeGreaterThan(0);
      expect(q.id).toBe(`G1_W01_1_ENG_${String(101 + i).padStart(3, "0")}`);
    });
  });

  it("ném lỗi khi bài không có từ vựng", () => {
    expect(() => generateLetterFromVocab([], opts(lesson([]), 3))).toThrow();
  });
});

describe("generateImageChoiceFromVocab", () => {
  it("cần ≥3 distractor (đủ nghĩa) → sinh được", () => {
    const l = lesson([
      { word: "cat", meaning: "con mèo" },
      { word: "dog", meaning: "con chó" },
      { word: "fish", meaning: "con cá" },
      { word: "bird", meaning: "con chim" },
    ]);
    const { questions } = generateImageChoiceFromVocab([], opts(l, 4));
    expect(questions.length).toBeGreaterThan(0);
    questions.forEach((q) => {
      expect(q.blueprintType).toBe("image_choice");
      expect((q.components.distractors as string[]).length).toBe(3);
    });
  });
});
