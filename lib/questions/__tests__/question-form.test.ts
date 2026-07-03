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

  it("mode json (content tuỳ ý, không đúng shape mode nào → JSON passthrough)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "matching", // matching nhưng content KHÔNG có pair → về mode json (legacy)
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

  it("reorder có audio đọc câu → assetRefs giữ mp3, Sửa dựng lại promptAudio", () => {
    const q: Question = applyPayload(baseQ, {
      type: "reorder",
      skill: "sentence",
      difficulty: 1,
      content: { prompt: "Sắp xếp các từ thành câu đúng", items: ["pen", "a", "is", "It"], correct_order: ["It", "is", "a", "pen"] },
      correctAnswer: "It is a pen",
      assetRefs: ["audio/grade1/english/g1_sent_it_is_a_pen.mp3"],
    });
    const f = toFormValues(q);
    if (f.mode !== "reorder") throw new Error("phải là mode reorder");
    expect(f.promptAudio).toBe("audio/grade1/english/g1_sent_it_is_a_pen.mp3");
    const p = expectStableRoundTrip(q);
    expect(p.assetRefs).toContain("audio/grade1/english/g1_sent_it_is_a_pen.mp3");
  });
});

describe("mode matching (Ghép cặp theo tranh)", () => {
  it("toPayload: 1 ảnh + cặp đúng + nhiễu → content {image, pair, distractors}", () => {
    const p = toPayload(
      {
        mode: "matching",
        lessonId: "11111111-1111-4111-8111-111111111111",
        code: "G1_W09_5_ENG_001",
        type: "matching",
        skill: "sentence",
        difficulty: 1,
        assetRefsCsv: "",
        prompt: "",
        promptImage: "images/grade1/english/g1_sent_name_nam.webp",
        promptAudio: "audio/grade1/english/g1_sent_what_is_your_name.mp3",
        pairLeft: "What is your name?",
        pairRight: "I am Nam",
        distractors: [
          { left: "What is this?", right: "It is a pen" },
          { left: "How old are you?", right: "I am six" },
        ],
      },
      mulberry32(7),
    );
    expect(p.type).toBe("matching");
    expect(p.correctAnswer).toBe("What is your name? → I am Nam");
    // Audio đọc câu nằm trong assetRefs (renderer HS tự nhặt .mp3).
    expect(p.assetRefs).toContain("audio/grade1/english/g1_sent_what_is_your_name.mp3");
    const c = p.content as {
      image: string;
      pair: { left: string; right: string };
      distractors: { left: string; right: string }[];
      prompt: string;
    };
    expect(c.image).toBe("images/grade1/english/g1_sent_name_nam.webp");
    expect(c.pair).toEqual({ left: "What is your name?", right: "I am Nam" });
    expect(c.distractors).toHaveLength(2);
    expect(c.prompt).toBe("Nhìn tranh — nối câu hỏi với câu trả lời đúng");
    // Ảnh minh hoạ đứng đầu assetRefs.
    expect(p.assetRefs[0]).toBe("images/grade1/english/g1_sent_name_nam.webp");
  });

  it("schema từ chối khi thiếu ảnh hoặc 0 cặp nhiễu", () => {
    const base = {
      mode: "matching" as const,
      lessonId: "11111111-1111-4111-8111-111111111111",
      code: "G1_W09_5_ENG_001",
      type: "matching",
      skill: "sentence",
      difficulty: 1,
      pairLeft: "What is your name?",
      pairRight: "I am Nam",
    };
    expect(
      questionFormSchema.safeParse({
        ...base,
        promptImage: "",
        distractors: [{ left: "a", right: "b" }],
      }).success,
    ).toBe(false);
    expect(
      questionFormSchema.safeParse({
        ...base,
        promptImage: "x.webp",
        distractors: [],
      }).success,
    ).toBe(false);
  });

  it("schema từ chối cặp nhiễu trùng VẾ với cặp đúng hoặc nhiễu khác", () => {
    const base = {
      mode: "matching" as const,
      lessonId: "11111111-1111-4111-8111-111111111111",
      code: "G1_W03_5_ENG_001",
      type: "matching",
      skill: "sentence",
      difficulty: 1,
      promptImage: "g1_sent_this_pen.webp",
      pairLeft: "What is this?",
      pairRight: "It is a pen",
    };
    // Nhiễu trùng CÂU HỎI với cặp đúng (case-insensitive) → reject.
    expect(
      questionFormSchema.safeParse({
        ...base,
        distractors: [{ left: "what is this?", right: "It is a book" }],
      }).success,
    ).toBe(false);
    // Nhiễu trùng CÂU TRẢ LỜI với cặp đúng → reject.
    expect(
      questionFormSchema.safeParse({
        ...base,
        distractors: [{ left: "How old are you?", right: "It is a pen" }],
      }).success,
    ).toBe(false);
    // 2 nhiễu trùng vế nhau → reject.
    expect(
      questionFormSchema.safeParse({
        ...base,
        distractors: [
          { left: "How old are you?", right: "I am six" },
          { left: "How old are you?", right: "I am Nam" },
        ],
      }).success,
    ).toBe(false);
    // Nhiễu khác vế hoàn toàn → pass.
    expect(
      questionFormSchema.safeParse({
        ...base,
        distractors: [
          { left: "How old are you?", right: "I am six" },
          { left: "What is your name?", right: "I am Nam" },
        ],
      }).success,
    ).toBe(true);
  });

  it("round-trip ổn định (matching)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "matching",
      skill: "sentence",
      difficulty: 1,
      content: {
        prompt: "Nhìn tranh — nối câu hỏi với câu trả lời đúng",
        image: "images/grade1/english/g1_sent_name_nam.webp",
        pair: { left: "What is your name?", right: "I am Nam" },
        distractors: [{ left: "What is this?", right: "It is a pen" }],
      },
      correctAnswer: "What is your name? → I am Nam",
      assetRefs: ["images/grade1/english/g1_sent_name_nam.webp"],
    });
    const p = expectStableRoundTrip(q);
    expect((p.content as { pair: { left: string } }).pair.left).toBe(
      "What is your name?",
    );
  });
});

describe("mode word_blank (Điền từ vào câu)", () => {
  it("toPayload: câu [từ ẩn] + nhiễu → content {prefix, suffix, answer, options} + type fill_blank", () => {
    const p = toPayload(
      {
        mode: "word_blank",
        lessonId: "11111111-1111-4111-8111-111111111111",
        code: "G1_W03_5_ENG_002",
        type: "fill_blank",
        skill: "sentence",
        difficulty: 1,
        assetRefsCsv: "",
        prompt: "",
        markedSentence: "It is a [pen]",
        wordDistractors: "book, bag",
        promptImage: "images/grade1/english/g1_sent_this_pen.webp",
        promptAudio: "audio/grade1/english/pen.mp3",
      },
      mulberry32(7),
    );
    expect(p.type).toBe("fill_blank");
    expect(p.correctAnswer).toBe("pen");
    const c = p.content as {
      prefix: string;
      suffix: string;
      answer: string;
      distractors: string[];
      options: string[];
      image: string;
    };
    expect(c.prefix).toBe("It is a");
    expect(c.suffix).toBe("");
    expect(c.answer).toBe("pen");
    expect(c.distractors).toEqual(["book", "bag"]);
    expect([...c.options].sort()).toEqual(["bag", "book", "pen"]);
    expect(c.image).toBe("images/grade1/english/g1_sent_this_pen.webp");
    // assetRefs chứa ảnh + audio.
    expect(p.assetRefs).toContain("images/grade1/english/g1_sent_this_pen.webp");
    expect(p.assetRefs).toContain("audio/grade1/english/pen.mp3");
  });

  it("schema từ chối câu không có [từ ẩn] hoặc thiếu từ nhiễu", () => {
    const base = {
      mode: "word_blank" as const,
      lessonId: "11111111-1111-4111-8111-111111111111",
      code: "G1_W03_5_ENG_002",
      type: "fill_blank",
      skill: "sentence",
      difficulty: 1,
    };
    expect(
      questionFormSchema.safeParse({
        ...base,
        markedSentence: "It is a pen",
        wordDistractors: "book",
      }).success,
    ).toBe(false);
    expect(
      questionFormSchema.safeParse({
        ...base,
        markedSentence: "It is a [pen]",
        wordDistractors: "  ",
      }).success,
    ).toBe(false);
  });

  it("round-trip ổn định (word_blank — distractors giữ thứ tự gốc)", () => {
    const q: Question = applyPayload(baseQ, {
      type: "fill_blank",
      skill: "sentence",
      difficulty: 1,
      content: {
        prompt: "Chọn từ đúng điền vào chỗ trống",
        prefix: "It is a",
        suffix: "",
        answer: "pen",
        distractors: ["book", "bag"],
        options: ["bag", "pen", "book"],
        image: "images/grade1/english/g1_sent_this_pen.webp",
      },
      correctAnswer: "pen",
      assetRefs: ["images/grade1/english/g1_sent_this_pen.webp"],
    });
    const p = expectStableRoundTrip(q);
    expect((p.content as { answer: string }).answer).toBe("pen");
    expect((p.content as { distractors: string[] }).distractors).toEqual([
      "book",
      "bag",
    ]);
  });

  it("data cũ không có distractors → suy từ options∖answer, vẫn nạp form được", () => {
    const q: Question = applyPayload(baseQ, {
      type: "fill_blank",
      skill: "sentence",
      difficulty: 1,
      content: {
        prefix: "I am",
        suffix: "",
        answer: "six",
        options: ["six", "ten", "two"],
      },
      correctAnswer: "six",
      assetRefs: [],
    });
    const f = toFormValues(q);
    if (f.mode !== "word_blank") throw new Error("phải là mode word_blank");
    expect(f.markedSentence).toBe("I am [six]");
    expect(f.wordDistractors).toBe("ten, two");
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
