import { describe, it, expect } from "vitest";
import type { Question } from "@/lib/types";
import {
  toPayload,
  toFormValues,
  defaultFormValues,
  questionFormSchema,
  type QuestionPayload,
} from "@/lib/questions/question-form";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const baseQ: Question = {
  id: "00000000-0000-4000-8000-000000000001",
  lessonId: "11111111-1111-4111-8111-111111111111",
  code: "G1_W01_1_ENG_001",
  type: "multiple_choice",
  skill: "vocab",
  difficulty: 2,
  content: {},
  correctAnswer: "",
  assetRefs: [],
  status: "draft",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

/** Áp payload đã sinh lên 1 Question (mô phỏng record sau khi lưu DB). */
function applyPayload(q: Question, p: QuestionPayload): Question {
  return {
    ...q,
    type: p.type,
    content: p.content,
    correctAnswer: p.correctAnswer,
    assetRefs: p.assetRefs,
  };
}

/**
 * Bất biến cốt lõi: toPayload∘toFormValues ỔN ĐỊNH (idempotent) — nạp lại form rồi lưu lại
 * phải ra payload y hệt. Đây là thứ chống "lệch hydrate↔submit" mà refactor dễ gây ra.
 */
function expectStableRoundTrip(q0: Question, seed = 123) {
  const f1 = toFormValues(q0);
  // form values phải hợp lệ theo schema (đảm bảo nạp lại không vỡ validation)
  expect(questionFormSchema.safeParse(f1).success).toBe(true);

  const p1 = toPayload(f1, mulberry32(seed));
  const q1 = applyPayload(q0, p1);
  const f2 = toFormValues(q1);
  const p2 = toPayload(f2, mulberry32(seed));
  expect(p2).toEqual(p1);
  return p1;
}

describe("toFormValues ↔ toPayload — round-trip ổn định", () => {
  it("mode mc (4 đáp án text, không ảnh đáp án)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "multiple_choice",
      skill: "vocab",
      difficulty: 2,
      content: { prompt: "Chọn từ đúng", options: ["cat", "dog", "fish", "bird"] },
      correctAnswer: "dog",
      assetRefs: ["bg.mp3"],
    });
    const p = expectStableRoundTrip(q);
    expect((p.content as { options: string[] }).options).toEqual([
      "cat",
      "dog",
      "fish",
      "bird",
    ]);
    expect(p.correctAnswer).toBe("dog");
    expect(p.type).toBe("multiple_choice");
  });

  it("mode mc với 4 ảnh đáp án (per-option image)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "multiple_choice",
      skill: "vocab",
      difficulty: 2,
      content: { prompt: "Nghe và chọn", options: ["cat", "dog", "fish", "bird"] },
      correctAnswer: "cat",
      assetRefs: ["q.mp3", "cat.png", "dog.png", "fish.png", "bird.png"],
    });
    const p = expectStableRoundTrip(q);
    // 4 ảnh đáp án phải nằm trong assetRefs, audio đề bài giữ lại.
    expect(p.assetRefs).toContain("cat.png");
    expect(p.assetRefs).toContain("q.mp3");
    expect(p.correctAnswer).toBe("cat");
  });

  it("mode image_choice (ảnh đề bài + 4 từ)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "image_choice",
      skill: "vocab",
      difficulty: 1,
      content: {
        prompt: "Đây là gì?",
        image: "apple.png",
        options: ["apple", "banana", "cherry", "grape"],
      },
      correctAnswer: "apple",
      assetRefs: ["apple.png"],
    });
    const p = expectStableRoundTrip(q);
    expect(p.type).toBe("image_choice");
    expect((p.content as { image: string }).image).toBe("apple.png");
    expect(p.correctAnswer).toBe("apple");
    expect(p.assetRefs[0]).toBe("apple.png"); // ảnh đề bài đứng đầu
  });

  it("mode audio_choice (audio đề bài + 4 ảnh đáp án)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "audio_choice",
      skill: "listening",
      difficulty: 2,
      content: {
        prompt: "Nghe rồi chọn",
        audio: "word.mp3",
        options: ["cat", "dog", "fish", "bird"],
        optionImages: ["cat.png", "dog.png", "fish.png", "bird.png"],
      },
      correctAnswer: "dog",
      assetRefs: ["word.mp3", "cat.png", "dog.png", "fish.png", "bird.png"],
    });
    const p = expectStableRoundTrip(q);
    expect(p.type).toBe("audio_choice");
    expect((p.content as { audio: string }).audio).toBe("word.mp3");
    expect((p.content as { optionImages: string[] }).optionImages).toEqual([
      "cat.png",
      "dog.png",
      "fish.png",
      "bird.png",
    ]);
    expect(p.correctAnswer).toBe("dog");
  });

  it("mode json (content tuỳ ý, loại chưa có mode riêng → JSON passthrough)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "matching", // loại chưa có form mode riêng → về mode json
      skill: "vocab",
      difficulty: 3,
      content: { prompt: "Nối từ", tokens: ["I", "am", "happy"] },
      correctAnswer: "I am happy",
      assetRefs: [],
    });
    const p = expectStableRoundTrip(q);
    expect(p.type).toBe("matching");
    expect(p.correctAnswer).toBe("I am happy");
    expect((p.content as { tokens: string[] }).tokens).toEqual([
      "I",
      "am",
      "happy",
    ]);
  });

  it("mode letter (điền chữ — phần xác định + bất biến tiles)", () => {
    const q: Question = {
      ...baseQ,
      type: "missing_letter",
      correctAnswer: "el",
      content: {
        prompt: "Điền chữ còn thiếu",
        word: "hello",
        prefix: "h",
        suffix: "lo",
        blanks: 2,
        tiles: ["e", "l", "x", "y"],
      },
      assetRefs: [],
    };
    const f = toFormValues(q);
    expect(questionFormSchema.safeParse(f).success).toBe(true);
    if (f.mode !== "letter") throw new Error("phải là mode letter");
    expect(f.markedWord).toBe("h[el]lo");

    const p = toPayload(f, mulberry32(99));
    expect(p.type).toBe("missing_letter");
    const c = p.content as {
      word: string;
      prefix: string;
      suffix: string;
      blanks: number;
      tiles: string[];
    };
    expect(c.word).toBe("hello");
    expect(c.prefix).toBe("h");
    expect(c.suffix).toBe("lo");
    expect(c.blanks).toBe(2);
    expect(p.correctAnswer).toBe("el");
    // tiles chứa đủ ký tự đáp án; không assert thứ tự (có ngẫu nhiên).
    expect(c.tiles).toContain("e");
    expect(c.tiles).toContain("l");
    expect(c.tiles.length).toBeGreaterThanOrEqual(2);
  });
});

describe("mode reorder (Câu sắp xếp)", () => {
  it("toPayload: câu đúng → content {items, correct_order} + type reorder", () => {
    const p = toPayload(
      {
        mode: "reorder",
        lessonId: "11111111-1111-4111-8111-111111111111",
        code: "G1_W03_5_ENG_001",
        type: "reorder",
        skill: "sentence",
        difficulty: 1,
        assetRefsCsv: "",
        prompt: "",
        sentence: "It is a pen",
      },
      mulberry32(7),
    );
    expect(p.type).toBe("reorder");
    expect(p.correctAnswer).toBe("It is a pen");
    const c = p.content as { correct_order: string[]; items: string[]; prompt: string };
    expect(c.correct_order).toEqual(["It", "is", "a", "pen"]);
    expect([...c.items].sort()).toEqual([...c.correct_order].sort());
    expect(c.prompt).toBe("Sắp xếp các từ thành câu đúng");
  });

  it("schema từ chối câu < 2 từ", () => {
    const bad = questionFormSchema.safeParse({
      mode: "reorder",
      lessonId: "11111111-1111-4111-8111-111111111111",
      code: "G1_W03_5_ENG_001",
      type: "reorder",
      skill: "sentence",
      difficulty: 1,
      sentence: "pen",
    });
    expect(bad.success).toBe(false);
  });

  it("round-trip ổn định (reorder)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "reorder",
      skill: "sentence",
      difficulty: 1,
      content: { prompt: "Sắp xếp các từ thành câu đúng", items: ["pen", "a", "is", "It"], correct_order: ["It", "is", "a", "pen"] },
      correctAnswer: "It is a pen",
      assetRefs: [],
    });
    const p = expectStableRoundTrip(q);
    expect((p.content as { correct_order: string[] }).correct_order).toEqual(["It", "is", "a", "pen"]);
  });
});

describe("defaultFormValues", () => {
  it("trả mode mc hợp lệ với lessonId cho trước", () => {
    const lessonId = "22222222-2222-4222-8222-222222222222";
    const f = defaultFormValues(lessonId);
    expect(f.mode).toBe("mc");
    expect(f.lessonId).toBe(lessonId);
    expect(f.type).toBe("multiple_choice");
  });
});
