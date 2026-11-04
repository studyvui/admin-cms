// Form câu hỏi — schema zod + kiểu QuestionFormValues / QuestionPayload. Tách từ question-form.ts, dời nguyên văn (mục 93 Đợt 4b).
// Facade question-form.ts re-export cả ba file; toPayload ở question-form-payload.ts, toFormValues ở question-form-values.ts.

import { z } from "zod";
import { parseMarkedWord, parseMarkedSentence } from "@/lib/questions/question-utils";
// ---- het tieu de tach file (muc 93 Dot 4b) ----

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

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
