import { describe, it, expect } from "vitest";
import type { AssetItem, Lesson } from "@/lib/types";
import {
  cdnToAssetKey,
  labelFromPath,
  generateAudioChoiceFromVocab,
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

// Kho asset R2 giu MOI phien ban anh cua 1 tu (anh loi cu `_1` khong bao gio bi xoa — ND-05). Anh dung cho
// cau hoi phai la anh da gan cho tu trong bai (imageUrl, da soat, khop the hoc tu), KHONG boc ngau nhien
// (STUDYVUI README/PLAN.md muc 50 dot 3: boc ngau nhien tung lay ca anh in chu lo dap an).
describe("Ảnh câu hỏi lấy từ imageUrl của từ vựng", () => {
  const CDN = "https://cdn.studyvui.vn/";
  const WORDS = ["duck", "cat", "dog", "pig"];
  const kho: AssetItem[] = WORDS.flatMap((w) =>
    [1, 2, 3].map((n) => ({
      key: `images/grade2/english/${w}_${n}.webp`,
      url: `${CDN}images/grade2/english/${w}_${n}.webp`,
      size: 1,
      lastModified: "",
      type: "image" as const,
    })),
  );
  const bai = lesson(
    WORDS.map((w) => ({
      word: w,
      meaning: `nghĩa ${w}`,
      imageUrl: `${CDN}images/grade2/english/${w}_2.webp`,
      audioUrl: `${CDN}audio/grade2/english/${w}.mp3`,
    })),
  );
  const anhDung = new Set(WORDS.map((w) => `images/grade2/english/${w}_2.webp`));

  it("image_choice: ảnh đề = imageUrl của từ", () => {
    const { questions } = generateImageChoiceFromVocab(kho, opts(bai, 12));
    questions.forEach((q) => {
      const assets = q.components.assets as { image: string };
      expect(assets.image).toBe(`images/grade2/english/${q.components.vocab}_2.webp`);
    });
  });

  it("missing_letter: ảnh = imageUrl của từ", () => {
    const { questions } = generateLetterFromVocab(kho, opts(bai, 12));
    questions.forEach((q) => {
      const assets = q.components.assets as { image: string };
      expect(assets.image).toBe(`images/grade2/english/${q.components.vocab}_2.webp`);
    });
  });

  it("audio_choice: ảnh đáp án đúng VÀ ảnh nhiễu đều = imageUrl của từ", () => {
    const { questions } = generateAudioChoiceFromVocab(kho, opts(bai, 12));
    expect(questions).toHaveLength(12);
    questions.forEach((q) => {
      const imgs = (q.variable_values as { optionImages: string[] }).optionImages;
      expect(imgs).toHaveLength(4);
      imgs.forEach((k) => expect(anhDung.has(k)).toBe(true));
      expect(imgs[0]).toBe(`images/grade2/english/${q.components.vocab}_2.webp`);
    });
  });

  it("từ CHƯA có imageUrl → vẫn bốc trong kho asset theo tên từ", () => {
    const chuaCoAnh = lesson(WORDS.map((w) => ({ word: w, meaning: `nghĩa ${w}` })));
    const { questions } = generateLetterFromVocab(kho, opts(chuaCoAnh, 4));
    questions.forEach((q) => {
      const assets = q.components.assets as { image: string };
      expect(assets.image).toMatch(new RegExp(`/${q.components.vocab}_[123]\\.webp$`));
    });
  });
});
