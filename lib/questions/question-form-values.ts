// Form câu hỏi — toFormValues / defaultFormValues (Question → form). Tách từ question-form.ts, dời nguyên văn (mục 93 Đợt 4b).
// Schema + kiểu dùng chung ở question-form-schema.ts; facade question-form.ts re-export.

import type { Question } from "@/lib/types";
import { isImageKey, isAudioKey } from "@/lib/assets/asset-kind";
import type { QuestionFormValues } from "./question-form-schema";
// ---- het tieu de tach file (muc 93 Dot 4b) ----

/**
 * Question đã lưu → form values (khi mở Sửa). THUẦN. Logic giữ NGUYÊN VẸN so với phần
 * `defaults` (nhánh editing) của QuestionDialog cũ.
 */
export function toFormValues(editing: Question): QuestionFormValues {
  const c = editing.content as {
    prompt?: string;
    options?: string[];
  };
  const opts = Array.isArray(c?.options) ? c.options : [];

  // Loại "Điền chữ còn thiếu": content có `tiles` → mode "letter", dựng lại markedWord.
  const cl = editing.content as {
    prompt?: string;
    prefix?: string;
    suffix?: string;
    tiles?: unknown;
  };
  if (Array.isArray(cl.tiles)) {
    const prefix = typeof cl.prefix === "string" ? cl.prefix : "";
    const suffix = typeof cl.suffix === "string" ? cl.suffix : "";
    return {
      mode: "letter",
      lessonId: editing.lessonId,
      code: editing.code,
      type: editing.type,
      skill: editing.skill,
      difficulty: editing.difficulty,
      assetRefsCsv: editing.assetRefs.join(", "),
      prompt: cl.prompt ?? "",
      markedWord: prefix + "[" + editing.correctAnswer + "]" + suffix,
    };
  }

  // "Nghe rồi chọn ảnh" (audio_choice): audio đề bài + 4 ảnh đáp án (không text).
  if (editing.type === "audio_choice") {
    const ca = editing.content as {
      prompt?: string;
      audio?: string;
      optionImages?: string[];
    };
    const imageRefs = Array.isArray(ca.optionImages)
      ? ca.optionImages
      : editing.assetRefs.filter(isImageKey);
    const audioRef = ca.audio ?? editing.assetRefs.find(isAudioKey) ?? "";
    const correctIdx = opts.findIndex((o) => o === editing.correctAnswer);
    return {
      mode: "audio_choice",
      lessonId: editing.lessonId,
      code: editing.code,
      type: editing.type,
      skill: editing.skill,
      difficulty: editing.difficulty,
      // Audio đề bài + ảnh đáp án có field riêng → "Asset đính kèm" chỉ giữ phần còn lại.
      assetRefsCsv: editing.assetRefs
        .filter((r) => !isImageKey(r) && !isAudioKey(r))
        .join(", "),
      prompt: ca.prompt ?? "",
      promptAudio: audioRef,
      optionA: opts[0] ?? "",
      optionB: opts[1] ?? "",
      optionC: opts[2] ?? "",
      optionD: opts[3] ?? "",
      optionAImg: imageRefs[0] ?? "",
      optionBImg: imageRefs[1] ?? "",
      optionCImg: imageRefs[2] ?? "",
      optionDImg: imageRefs[3] ?? "",
      correctOption: (["A", "B", "C", "D"][correctIdx] ?? "A") as
        | "A"
        | "B"
        | "C"
        | "D",
    };
  }

  // "Ảnh rồi chọn từ" (image_choice): ảnh đề bài + 4 TỪ đáp án (text).
  if (editing.type === "image_choice") {
    const ci = editing.content as { prompt?: string; image?: string };
    const promptImage = ci.image ?? editing.assetRefs.find(isImageKey) ?? "";
    const correctIdx = opts.findIndex((o) => o === editing.correctAnswer);
    return {
      mode: "image_choice",
      lessonId: editing.lessonId,
      code: editing.code,
      type: editing.type,
      skill: editing.skill,
      difficulty: editing.difficulty,
      // Ảnh đề bài có field riêng → "Asset đính kèm" chỉ giữ phần còn lại.
      assetRefsCsv: editing.assetRefs
        .filter((r) => r !== promptImage)
        .join(", "),
      prompt: ci.prompt ?? "",
      promptImage,
      optionA: opts[0] ?? "",
      optionB: opts[1] ?? "",
      optionC: opts[2] ?? "",
      optionD: opts[3] ?? "",
      correctOption: (["A", "B", "C", "D"][correctIdx] ?? "A") as
        | "A"
        | "B"
        | "C"
        | "D",
    };
  }

  // "Ghép cặp theo tranh" (matching): content đúng shape (có pair.left/right) → dựng lại form.
  // Matching content dạng khác (legacy/tự do) rơi xuống mode json như cũ.
  {
    const cm = editing.content as {
      prompt?: string;
      image?: string;
      pair?: { left?: string; right?: string };
      distractors?: { left?: string; right?: string }[];
    };
    if (editing.type === "matching" && cm.pair?.left && cm.pair?.right) {
      const promptImage = cm.image ?? editing.assetRefs.find(isImageKey) ?? "";
      const promptAudio = editing.assetRefs.find(isAudioKey) ?? "";
      const distractors = (Array.isArray(cm.distractors) ? cm.distractors : [])
        .map((d) => ({ left: d?.left ?? "", right: d?.right ?? "" }))
        .filter((d) => d.left && d.right);
      return {
        mode: "matching",
        lessonId: editing.lessonId,
        code: editing.code,
        type: editing.type,
        skill: editing.skill,
        difficulty: editing.difficulty,
        // Ảnh + audio có field riêng → "Asset đính kèm" chỉ giữ phần còn lại.
        assetRefsCsv: editing.assetRefs
          .filter((r) => r !== promptImage && r !== promptAudio)
          .join(", "),
        prompt: cm.prompt ?? "",
        promptImage,
        promptAudio,
        pairLeft: cm.pair.left,
        pairRight: cm.pair.right,
        distractors: distractors.length ? distractors : [{ left: "", right: "" }],
      };
    }
  }

  // "Điền từ vào câu" (fill_blank có options): dựng lại markedSentence + từ nhiễu.
  {
    const cw = editing.content as {
      prompt?: string;
      prefix?: string;
      suffix?: string;
      answer?: string;
      distractors?: unknown;
      options?: unknown;
      image?: string;
    };
    if (
      editing.type === "fill_blank" &&
      typeof cw.answer === "string" &&
      cw.answer &&
      Array.isArray(cw.options)
    ) {
      const promptImage =
        cw.image ?? editing.assetRefs.find(isImageKey) ?? "";
      const promptAudio = editing.assetRefs.find(isAudioKey) ?? "";
      // Ưu tiên distractors gốc (thứ tự admin gõ); fallback options∖answer cho data cũ.
      const distractorWords = (
        Array.isArray(cw.distractors) && cw.distractors.length
          ? (cw.distractors as string[])
          : (cw.options as string[]).filter((o) => String(o) !== cw.answer)
      ).map(String);
      const prefix = typeof cw.prefix === "string" ? cw.prefix : "";
      const suffix = typeof cw.suffix === "string" ? cw.suffix : "";
      return {
        mode: "word_blank",
        lessonId: editing.lessonId,
        code: editing.code,
        type: editing.type,
        skill: editing.skill,
        difficulty: editing.difficulty,
        assetRefsCsv: editing.assetRefs
          .filter((r) => r !== promptImage && r !== promptAudio)
          .join(", "),
        prompt: cw.prompt ?? "",
        markedSentence: [prefix, `[${cw.answer}]`, suffix]
          .filter(Boolean)
          .join(" "),
        wordDistractors: distractorWords.join(", "),
        promptImage,
        promptAudio,
      };
    }
  }

  // "Câu (sắp xếp)" (reorder): content có correct_order → dựng lại câu đúng.
  if (editing.type === "reorder") {
    const cr = editing.content as { prompt?: string; correct_order?: unknown };
    const order = Array.isArray(cr.correct_order)
      ? (cr.correct_order as string[])
      : String(editing.correctAnswer).trim().split(/\s+/).filter(Boolean);
    const promptAudio = editing.assetRefs.find(isAudioKey) ?? "";
    return {
      mode: "reorder",
      lessonId: editing.lessonId,
      code: editing.code,
      type: editing.type,
      skill: editing.skill,
      difficulty: editing.difficulty,
      // Audio có field riêng → "Asset đính kèm" chỉ giữ phần còn lại.
      assetRefsCsv: editing.assetRefs.filter((r) => r !== promptAudio).join(", "),
      prompt: cr.prompt ?? "",
      sentence: order.join(" "),
      promptAudio,
    };
  }

  const isFourOption = opts.length === 4;
  if (isFourOption) {
    const correctIdx = opts.findIndex((o) => o === editing.correctAnswer);
    // Tách ảnh đáp án: nếu số ảnh trong assetRefs == số options → ảnh[i] ↔ đáp án[i].
    const imageRefs = editing.assetRefs.filter(isImageKey);
    const perOptionImg = imageRefs.length === opts.length;
    const nonImageRefs = editing.assetRefs.filter((r) => !isImageKey(r));
    return {
      mode: "mc",
      lessonId: editing.lessonId,
      code: editing.code,
      type: editing.type,
      skill: editing.skill,
      difficulty: editing.difficulty,
      // Khi ảnh là đáp án → field "Asset đính kèm" chỉ giữ audio đề bài.
      assetRefsCsv: (perOptionImg ? nonImageRefs : editing.assetRefs).join(", "),
      prompt: c.prompt ?? "",
      optionA: opts[0] ?? "",
      optionB: opts[1] ?? "",
      optionC: opts[2] ?? "",
      optionD: opts[3] ?? "",
      optionAImg: perOptionImg ? imageRefs[0] : "",
      optionBImg: perOptionImg ? imageRefs[1] : "",
      optionCImg: perOptionImg ? imageRefs[2] : "",
      optionDImg: perOptionImg ? imageRefs[3] : "",
      correctOption: (["A", "B", "C", "D"][correctIdx] ?? "A") as
        | "A"
        | "B"
        | "C"
        | "D",
    } as QuestionFormValues; // mode là union McLike (3 nhánh cùng shape) → cast về union form.
  }

  return {
    mode: "json",
    lessonId: editing.lessonId,
    code: editing.code,
    type: editing.type,
    skill: editing.skill,
    difficulty: editing.difficulty,
    assetRefsCsv: editing.assetRefs.join(", "),
    contentJson: JSON.stringify(editing.content, null, 2),
    correctAnswer: editing.correctAnswer,
  };
}

/** Form values mặc định khi TẠO MỚI (mode mc). THUẦN. `lessonId` do component truyền vào. */
export function defaultFormValues(lessonId: string): QuestionFormValues {
  return {
    mode: "mc",
    lessonId,
    code: "",
    type: "multiple_choice",
    skill: "vocab",
    difficulty: 1,
    assetRefsCsv: "",
    prompt: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    optionAImg: "",
    optionBImg: "",
    optionCImg: "",
    optionDImg: "",
    correctOption: "A",
  };
}

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
