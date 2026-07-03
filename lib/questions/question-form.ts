// Schema form + transform THUẦN cho trang Câu hỏi — tách từ app/(dashboard)/questions/page.tsx.
// `toPayload` (form → payload lưu DB) và `toFormValues` (Question đã lưu → form) phải ĐỐI XỨNG;
// đặt cạnh nhau ở đây để test round-trip. Hành vi giữ NGUYÊN VẸN so với bản inline cũ.

import { z } from "zod";
import type { Question } from "@/lib/types";
import { isImageKey, isAudioKey } from "@/lib/assets/asset-kind";
import {
  parseMarkedWord,
  parseMarkedSentence,
  shuffleArr,
  genDistractorLetters,
} from "@/lib/questions/question-utils";

const baseSchema = z.object({
  lessonId: z.string().uuid("Chọn bài học"),
  code: z
    .string()
    .min(3)
    .regex(/^[A-Z0-9_]+$/, "Chỉ chữ HOA, số, dấu gạch dưới"),
  type: z.string().min(1),
  skill: z.string().min(1),
  difficulty: z.number().int().min(1).max(5),
  assetRefsCsv: z.string().optional(),
});

// "Trắc nghiệm 4 lựa chọn (đơn giản)": đề bài text (bắt buộc) + 4 đáp án text +
// ảnh tuỳ chọn cho từng đáp án + đáp án đúng. Loại câu hỏi do người dùng chọn.
const mcSchema = baseSchema.extend({
  mode: z.literal("mc"),
  prompt: z.string().min(1, "Cần đề bài"),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  // Ảnh cho từng đáp án (câu "chọn hình đúng từ âm thanh"). Chọn đủ 4 ảnh → ảnh[i] ↔ đáp án[i].
  optionAImg: z.string().optional(),
  optionBImg: z.string().optional(),
  optionCImg: z.string().optional(),
  optionDImg: z.string().optional(),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

// "Ảnh rồi chọn từ": ảnh đề bài BẮT BUỘC (text đề bài tuỳ chọn); 4 lựa chọn là
// TỪ (text, bắt buộc).
const imageChoiceSchema = baseSchema.extend({
  mode: z.literal("image_choice"),
  prompt: z.string().optional(),
  promptImage: z.string().min(1, "Cần chọn ảnh đề bài"),
  optionA: z.string().min(1, "Cần nhập từ cho lựa chọn A"),
  optionB: z.string().min(1, "Cần nhập từ cho lựa chọn B"),
  optionC: z.string().min(1, "Cần nhập từ cho lựa chọn C"),
  optionD: z.string().min(1, "Cần nhập từ cho lựa chọn D"),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

// "Nghe rồi chọn ảnh": audio đề bài BẮT BUỘC (text đề bài tuỳ chọn); 4 lựa chọn là
// ẢNH (bắt buộc), KHÔNG nhập text.
const audioChoiceSchema = baseSchema.extend({
  mode: z.literal("audio_choice"),
  prompt: z.string().optional(),
  promptAudio: z.string().min(1, "Cần chọn audio đề bài"),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  optionAImg: z.string().min(1, "Chọn ảnh cho lựa chọn A"),
  optionBImg: z.string().min(1, "Chọn ảnh cho lựa chọn B"),
  optionCImg: z.string().min(1, "Chọn ảnh cho lựa chọn C"),
  optionDImg: z.string().min(1, "Chọn ảnh cho lựa chọn D"),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

const jsonSchema = baseSchema.extend({
  mode: z.literal("json"),
  contentJson: z.string().refine((v) => {
    try {
      JSON.parse(v);
      return true;
    } catch {
      return false;
    }
  }, "JSON không hợp lệ"),
  correctAnswer: z.string().min(1),
});

const letterSchema = baseSchema.extend({
  mode: z.literal("letter"),
  prompt: z.string().optional(),
  markedWord: z
    .string()
    .min(1)
    .refine((v) => parseMarkedWord(v) !== null, {
      message: "Gõ từ có đúng 1 cặp [..] bao chữ ẩn, vd: h[el]lo",
    }),
});

// "Câu (sắp xếp)": gõ CẢ CÂU đúng (≥ 2 từ); hệ thống tự xáo trộn thành thẻ từ cho học sinh xếp lại.
const reorderSchema = baseSchema.extend({
  mode: z.literal("reorder"),
  prompt: z.string().optional(),
  sentence: z
    .string()
    .min(1, "Nhập câu đúng")
    .refine((v) => v.trim().split(/\s+/).filter(Boolean).length >= 2, {
      message: "Câu cần ít nhất 2 từ",
    }),
  promptAudio: z.string().optional(), // audio đọc cả câu (tuỳ chọn) — HS bấm 🔊 nghe lại
});

// "Ghép cặp theo tranh": 1 ảnh minh hoạ (bắt buộc) + 1 cặp hỏi–đáp ĐÚNG khớp ảnh +
// 1–3 cặp NHIỄU (chọn từ ngân hàng mẫu câu L1). Học sinh chỉ cần nối đúng 1 cặp theo tranh.
const matchingSchema = baseSchema.extend({
  mode: z.literal("matching"),
  prompt: z.string().optional(),
  promptImage: z.string().min(1, "Cần chọn ảnh minh hoạ"),
  pairLeft: z.string().min(1, "Cần câu hỏi của cặp đúng"),
  pairRight: z.string().min(1, "Cần câu trả lời của cặp đúng"),
  promptAudio: z.string().optional(), // audio đọc cặp câu (tuỳ chọn) — HS bấm 🔊 nghe lại
  distractors: z
    .array(
      z.object({
        left: z.string().min(1, "Chọn cặp nhiễu"),
        right: z.string().min(1, "Chọn cặp nhiễu"),
      }),
    )
    .min(1, "Cần ít nhất 1 cặp nhiễu")
    .max(3, "Tối đa 3 cặp nhiễu"),
});

// "Điền từ vào câu": gõ CẢ CÂU với [..] bao đúng 1 TỪ ẩn (vd "It is a [pen]") +
// từ nhiễu (CSV). Học sinh chạm từ đúng trong ngân hàng để điền vào chỗ trống.
const wordBlankSchema = baseSchema.extend({
  mode: z.literal("word_blank"),
  prompt: z.string().optional(),
  markedSentence: z
    .string()
    .min(1)
    .refine((v) => parseMarkedSentence(v) !== null, {
      message: "Gõ cả câu, bao đúng 1 TỪ ẩn trong [..], vd: It is a [pen]",
    }),
  wordDistractors: z
    .string()
    .min(1)
    .refine((v) => v.split(",").map((s) => s.trim()).filter(Boolean).length >= 1, {
      message: "Cần ít nhất 1 từ nhiễu (cách nhau dấu phẩy)",
    }),
  promptImage: z.string().optional(),
  promptAudio: z.string().optional(),
});

/** Chuẩn hoá vế câu để so trùng (trim + lowercase, bỏ khoảng trắng thừa). */
function normSide(s: string): string {
  return (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export const questionFormSchema = z
  .discriminatedUnion("mode", [
    mcSchema,
    audioChoiceSchema,
    imageChoiceSchema,
    jsonSchema,
    letterSchema,
    reorderSchema,
    matchingSchema,
    wordBlankSchema,
  ])
  // Matching: cặp nhiễu KHÔNG được trùng vế (câu hỏi/câu trả lời) với cặp đúng
  // hay với cặp nhiễu khác — 2 thẻ giống hệt nhau trên màn sẽ làm học sinh bối rối
  // (chạm thẻ "sai" dù chữ y hệt thẻ đúng).
  .superRefine((v, ctx) => {
    if (v.mode !== "matching") return;
    const seenLeft = new Set([normSide(v.pairLeft)]);
    const seenRight = new Set([normSide(v.pairRight)]);
    v.distractors.forEach((d, i) => {
      const l = normSide(d.left);
      const r = normSide(d.right);
      if (l && seenLeft.has(l)) {
        ctx.addIssue({
          code: "custom",
          path: ["distractors"],
          message: `Cặp nhiễu ${i + 1} trùng CÂU HỎI "${d.left}" với cặp đúng hoặc cặp nhiễu khác — chọn cặp có câu hỏi khác`,
        });
      }
      if (r && seenRight.has(r)) {
        ctx.addIssue({
          code: "custom",
          path: ["distractors"],
          message: `Cặp nhiễu ${i + 1} trùng CÂU TRẢ LỜI "${d.right}" với cặp đúng hoặc cặp nhiễu khác — chọn cặp có câu trả lời khác`,
        });
      }
      if (l) seenLeft.add(l);
      if (r) seenRight.add(r);
    });
  });

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

/** Phần payload dùng chung cho cả create lẫn update (create thêm lessonId + code từ form values). */
export interface QuestionPayload {
  type: string;
  skill: string;
  difficulty: number;
  content: Record<string, unknown>;
  correctAnswer: string;
  assetRefs: string[];
}

/**
 * Form values → payload lưu DB. THUẦN. `rng` mặc định Math.random (mode "letter" có trộn thẻ chữ);
 * tiêm rng để test xác định. Logic giữ NGUYÊN VẸN so với onSubmit cũ.
 */
export function toPayload(
  values: QuestionFormValues,
  rng: () => number = Math.random,
): QuestionPayload {
  let assetRefs = (values.assetRefsCsv ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let content: Record<string, unknown>;
  let correctAnswer: string;
  let finalType = values.type;

  if (values.mode === "mc") {
    const options = [
      { key: "A", text: values.optionA },
      { key: "B", text: values.optionB },
      { key: "C", text: values.optionC },
      { key: "D", text: values.optionD },
    ];
    content = {
      prompt: values.prompt,
      options: options.map((o) => o.text),
    };
    correctAnswer =
      options.find((o) => o.key === values.correctOption)?.text ?? "";

    // Câu "chọn hình đúng": nếu CHỌN ĐỦ 4 ảnh đáp án → ghép vào assetRefs theo thứ tự A→D
    // (quy ước: số ảnh == số options → ảnh[i] là đáp án i). Audio đề bài giữ nguyên.
    const optImgs = [
      values.optionAImg,
      values.optionBImg,
      values.optionCImg,
      values.optionDImg,
    ].map((s) => (s ?? "").trim());
    if (optImgs.every(Boolean)) {
      const nonImage = assetRefs.filter((r) => !isImageKey(r));
      assetRefs = [...nonImage, ...optImgs];
    }
  } else if (values.mode === "image_choice") {
    // "Ảnh rồi chọn từ": ảnh đề bài (bắt buộc) + 4 TỪ đáp án (text).
    const options = [
      values.optionA,
      values.optionB,
      values.optionC,
      values.optionD,
    ];
    const correctIdx = { A: 0, B: 1, C: 2, D: 3 }[values.correctOption];
    content = {
      prompt: (values.prompt ?? "").trim(),
      image: values.promptImage,
      options,
    };
    correctAnswer = options[correctIdx] ?? "";
    finalType = "image_choice";
    // assetRefs = ảnh đề bài + phần asset khác (không phải ảnh, vd audio nếu có).
    const nonImage = assetRefs.filter((r) => !isImageKey(r));
    assetRefs = [values.promptImage, ...nonImage];
  } else if (values.mode === "audio_choice") {
    // "Nghe rồi chọn ảnh": audio đề bài + 4 ẢNH đáp án (không text).
    // Nhãn đáp án tự suy ra từ tên file ảnh (để có correctAnswer định danh được;
    // ảnh hiển thị lấy theo thứ tự assetRefs ảnh[i] ↔ đáp án[i]).
    const optImgs = [
      values.optionAImg,
      values.optionBImg,
      values.optionCImg,
      values.optionDImg,
    ].map((s) => (s ?? "").trim());
    const labelFromKey = (k: string) =>
      (k.split("/").pop() ?? k).replace(/\.[a-z0-9]+$/i, "");
    const labels = optImgs.map(labelFromKey);
    const correctIdx = { A: 0, B: 1, C: 2, D: 3 }[values.correctOption];
    content = {
      prompt: (values.prompt ?? "").trim(),
      audio: values.promptAudio,
      options: labels,
      optionImages: optImgs, // ảnh tương ứng từng đáp án, đúng thứ tự A→D
    };
    correctAnswer = labels[correctIdx] ?? "";
    finalType = "audio_choice";
    // assetRefs = audio đề bài + 4 ảnh đáp án (thứ tự A→D), bỏ trùng/ảnh cũ.
    const others = assetRefs.filter((r) => !isImageKey(r) && !isAudioKey(r));
    assetRefs = [...others, values.promptAudio, ...optImgs];
  } else if (values.mode === "letter") {
    // Loại "Điền chữ còn thiếu": parse markedWord, tự sinh chữ nhiễu, trộn thành thẻ chữ.
    const parsed = parseMarkedWord(values.markedWord)!; // schema đã refine hợp lệ
    const hiddenChars = parsed.hidden.toLowerCase().split("");
    const answerSet = new Set(hiddenChars);
    const distractors = genDistractorLetters(
      answerSet,
      Math.max(2, 4 - hiddenChars.length),
      rng,
    );
    const tiles = shuffleArr([...hiddenChars, ...distractors], rng);
    content = {
      prompt: (values.prompt ?? "").trim() || "Điền chữ còn thiếu",
      word: parsed.prefix + parsed.hidden + parsed.suffix,
      prefix: parsed.prefix,
      suffix: parsed.suffix,
      blanks: hiddenChars.length,
      tiles,
    };
    correctAnswer = parsed.hidden.toLowerCase();
    finalType = "missing_letter"; // ép loại, bỏ qua dropdown
  } else if (values.mode === "reorder") {
    // "Câu (sắp xếp)": tách câu đúng thành từ, xáo trộn thành thẻ (items) cho học sinh xếp lại.
    const correct_order = values.sentence.trim().split(/\s+/).filter(Boolean);
    const items = shuffleArr(correct_order.slice(), rng);
    content = {
      prompt: (values.prompt ?? "").trim() || "Sắp xếp các từ thành câu đúng",
      items,
      correct_order,
    };
    correctAnswer = correct_order.join(" ");
    finalType = "reorder"; // ép loại
    // Audio đọc câu (nếu chọn) đưa vào assetRefs — renderer HS tự nhặt file .mp3.
    if (values.promptAudio?.trim()) {
      assetRefs = [
        ...assetRefs.filter((r) => !isAudioKey(r)),
        values.promptAudio.trim(),
      ];
    }
  } else if (values.mode === "matching") {
    // "Ghép cặp theo tranh": 1 ảnh + 1 cặp đúng + cặp nhiễu. Render xáo 2 cột phía học sinh.
    const pair = { left: values.pairLeft.trim(), right: values.pairRight.trim() };
    content = {
      prompt:
        (values.prompt ?? "").trim() ||
        "Nhìn tranh — nối câu hỏi với câu trả lời đúng",
      image: values.promptImage,
      pair,
      distractors: values.distractors.map((d) => ({
        left: d.left.trim(),
        right: d.right.trim(),
      })),
    };
    correctAnswer = `${pair.left} → ${pair.right}`;
    finalType = "matching"; // ép loại
    // assetRefs = ảnh minh hoạ + audio đọc câu (nếu chọn) + phần asset khác.
    const others = assetRefs.filter((r) => !isImageKey(r) && !isAudioKey(r));
    assetRefs = [
      values.promptImage,
      ...(values.promptAudio?.trim() ? [values.promptAudio.trim()] : []),
      ...others,
    ];
  } else if (values.mode === "word_blank") {
    // "Điền từ vào câu": parse câu [từ ẩn] → options = đáp án + từ nhiễu (xáo).
    const parsed = parseMarkedSentence(values.markedSentence)!; // schema đã refine hợp lệ
    const distractorWords = values.wordDistractors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const options = shuffleArr([parsed.answer, ...distractorWords], rng);
    content = {
      prompt:
        (values.prompt ?? "").trim() || "Chọn từ đúng điền vào chỗ trống",
      prefix: parsed.prefix,
      suffix: parsed.suffix,
      answer: parsed.answer,
      // distractors giữ THỨ TỰ GỐC admin gõ (để mở Sửa → lưu lại ổn định);
      // options = đáp án + nhiễu ĐÃ XÁO (cho render/preview).
      distractors: distractorWords,
      options,
      ...(values.promptImage?.trim() ? { image: values.promptImage.trim() } : {}),
    };
    correctAnswer = parsed.answer;
    finalType = "fill_blank"; // ép loại
    // assetRefs = ảnh gợi ý + audio (nếu có) + phần asset khác.
    const others = assetRefs.filter((r) => !isImageKey(r) && !isAudioKey(r));
    assetRefs = [
      ...others,
      ...(values.promptImage?.trim() ? [values.promptImage.trim()] : []),
      ...(values.promptAudio?.trim() ? [values.promptAudio.trim()] : []),
    ];
  } else {
    content = JSON.parse(values.contentJson);
    correctAnswer = values.correctAnswer;
  }

  return {
    type: finalType,
    skill: values.skill,
    difficulty: values.difficulty,
    content,
    correctAnswer,
    assetRefs,
  };
}

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
