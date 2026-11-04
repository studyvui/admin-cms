// Form câu hỏi — toPayload (form → payload lưu DB). Tách từ question-form.ts, dời nguyên văn (mục 93 Đợt 4b).
// Schema + kiểu dùng chung ở question-form-schema.ts; facade question-form.ts re-export.

import { isImageKey, isAudioKey } from "@/lib/assets/asset-kind";
import {
  parseMarkedWord,
  parseMarkedSentence,
  shuffleArr,
  genDistractorLetters,
} from "@/lib/questions/question-utils";
import type { QuestionFormValues, QuestionPayload } from "./question-form-schema";
// ---- het tieu de tach file (muc 93 Dot 4b) ----

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

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
