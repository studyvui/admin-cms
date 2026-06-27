// Bộ sinh đề client-side từ TỪ VỰNG bài học (image_choice / audio_choice / missing_letter)
// — tách THUẦN từ ai-generate/page.tsx để test được. Nhận `opts` thay vì đọc state component.
// Dùng Math.random (không seeded) → test assert số lượng/cấu trúc, không assert nội dung.

import type { AssetItem, Lesson } from "@/lib/types";
import type { GeneratedQuestion, GenReport, Skill } from "@/lib/eng-gen/types";

export interface VocabGenOpts {
  selectedLesson: Lesson;
  allLessons: Lesson[];
  count: number;
  startSeq: number;
  grade: number;
  week: number;
  skill: Skill;
  dMin: number;
}

export function cdnToAssetKey(url: string): string {
  if (!url) return "";
  const m = url.match(/cdn\.studyvui\.vn\/(.+)$/);
  if (m) return m[1];
  if (url.startsWith("http")) {
    try {
      return new URL(url).pathname.replace(/^\//, "");
    } catch {
      /* fall through */
    }
  }
  return url;
}

export function labelFromPath(p: string): string {
  return (p.split("/").pop() ?? p).replace(/\.[a-z0-9]+$/i, "");
}

export function pickRandomImage(word: string, imageAssets: AssetItem[]): string {
  const lower = word.toLowerCase().replace(/\s+/g, "_");
  const matches = imageAssets.filter((a) => {
    const filename = (a.key.split("/").pop() ?? "").toLowerCase();
    return filename.startsWith(lower + "_") || filename.startsWith(lower + ".");
  });
  if (matches.length === 0) return "";
  return matches[Math.floor(Math.random() * matches.length)].key;
}

export function generateAudioChoiceFromVocab(
  imageAssets: AssetItem[],
  opts: VocabGenOpts,
): { questions: GeneratedQuestion[]; report: GenReport } {
  const { selectedLesson, allLessons, count, startSeq, grade, week, skill, dMin } = opts;
  const vocab = selectedLesson.vocabulary ?? [];
  const withAudio = vocab.filter((v) => v.audioUrl);
  if (withAudio.length === 0) throw new Error("Bài học này chưa có từ vựng có audio.");

  const allVocab = allLessons.flatMap((l) => l.vocabulary ?? []);
  const qs: GeneratedQuestion[] = [];
  const report: GenReport = { generated: 0, duplicates: 0, qa_failed: 0, missing_assets: [] };
  const lessonCode = selectedLesson.code;

  for (let i = 0; i < count; i++) {
    const vi = withAudio[i % withAudio.length];
    const word = vi.word;

    const correctImageKey = pickRandomImage(word, imageAssets) || cdnToAssetKey(vi.imageUrl ?? "");
    if (!correctImageKey) { report.qa_failed++; continue; }

    const distractorPool = allVocab.filter((v) => v.word !== word);
    const shuffled = [...distractorPool].sort(() => Math.random() - 0.5);
    const distractorImagePaths: string[] = [];
    for (const dv of shuffled) {
      if (distractorImagePaths.length >= 3) break;
      const img = pickRandomImage(dv.word, imageAssets);
      if (img) distractorImagePaths.push(img);
    }

    if (distractorImagePaths.length < 3) { report.qa_failed++; continue; }

    const audioKey = cdnToAssetKey(vi.audioUrl!);
    const correctLabel = labelFromPath(correctImageKey);
    const distractorLabels = distractorImagePaths.map(labelFromPath);

    const seq = startSeq + i;
    const code = `${lessonCode}_${String(seq).padStart(3, "0")}`;

    qs.push({
      id: code,
      grade, week, skill,
      blueprintType: "audio_choice",
      blueprint_type: "audio_choice",
      difficulty: dMin,
      lifecycleStatus: "draft",
      components: {
        stem: "Nghe và chọn hình đúng",
        vocab: word,
        meaning: vi.meaning ?? null,
        distractors: distractorLabels,
        assets: { audio: audioKey, image: correctImageKey },
      },
      correct_answer: correctLabel,
      render_spec: null,
      variable_values: {
        word, grade, week,
        optionImages: [correctImageKey, ...distractorImagePaths],
      },
      distractor_strategy: "same_topic",
      template_id: `audio_choice_vocab_${i}`,
      syncStatus: "pending",
      tags: [],
    });
    report.generated++;
  }
  return { questions: qs, report };
}

export function generateImageChoiceFromVocab(
  imageAssets: AssetItem[],
  opts: VocabGenOpts,
): { questions: GeneratedQuestion[]; report: GenReport } {
  const { selectedLesson, allLessons, count, startSeq, grade, week, skill, dMin } = opts;
  const vocab = selectedLesson.vocabulary ?? [];
  const withAssets = vocab.filter((v) => v.meaning);
  if (withAssets.length === 0) throw new Error("Bài học này chưa có từ vựng có nghĩa tiếng Việt.");

  const allVocab = allLessons.flatMap((l) => l.vocabulary ?? []).filter((v) => v.meaning);
  const qs: GeneratedQuestion[] = [];
  const report: GenReport = { generated: 0, duplicates: 0, qa_failed: 0, missing_assets: [] };
  const lessonCode = selectedLesson.code;

  for (let i = 0; i < count; i++) {
    const vi = withAssets[i % withAssets.length];
    const word = vi.word;
    const correctMeaning = vi.meaning!;

    const distractorPool = allVocab.filter((v) => v.word !== word && v.meaning && v.meaning !== correctMeaning);
    const shuffled = [...distractorPool].sort(() => Math.random() - 0.5);
    const distractorMeanings = shuffled.slice(0, 3).map((v) => v.meaning!);

    if (distractorMeanings.length < 3) { report.qa_failed++; continue; }

    const imageKey = pickRandomImage(word, imageAssets) || cdnToAssetKey(vi.imageUrl ?? "");
    const audioKey = vi.audioUrl ? cdnToAssetKey(vi.audioUrl) : "";

    const seq = startSeq + i;
    const code = `${lessonCode}_${String(seq).padStart(3, "0")}`;

    qs.push({
      id: code,
      grade, week, skill,
      blueprintType: "image_choice",
      blueprint_type: "image_choice",
      difficulty: dMin,
      lifecycleStatus: "draft",
      components: {
        stem: "Nhìn hình và chọn nghĩa đúng",
        vocab: word,
        meaning: correctMeaning,
        distractors: distractorMeanings,
        assets: { image: imageKey, audio: audioKey },
      },
      correct_answer: correctMeaning,
      render_spec: null,
      variable_values: { word, grade, week },
      distractor_strategy: "same_topic",
      template_id: `image_choice_vocab_${i}`,
      syncStatus: "pending",
      tags: [],
    });
    report.generated++;
  }
  return { questions: qs, report };
}

export function generateLetterFromVocab(
  imageAssets: AssetItem[],
  opts: VocabGenOpts,
): { questions: GeneratedQuestion[]; report: GenReport } {
  const { selectedLesson, count, startSeq, grade, week, skill, dMin } = opts;
  const vocab = selectedLesson.vocabulary ?? [];
  if (vocab.length === 0) throw new Error("Bài học này chưa có từ vựng.");

  const qs: GeneratedQuestion[] = [];
  const report: GenReport = { generated: 0, duplicates: 0, qa_failed: 0, missing_assets: [] };
  const lessonCode = selectedLesson.code;
  const allLetters = "abcdefghijklmnopqrstuvwxyz";

  for (let i = 0; i < count; i++) {
    const vi = vocab[i % vocab.length];
    const word = vi.word.toLowerCase();
    const hideCount = word.length <= 2 ? 1 : 2;

    const startPos = Math.floor(Math.random() * (word.length - hideCount + 1));
    const hiddenIndices = Array.from({ length: hideCount }, (_, k) => startPos + k);
    const hiddenChars = hiddenIndices.map((idx) => word[idx]);

    const prefix = word.slice(0, startPos);
    const suffix = word.slice(startPos + hideCount);
    let pattern = "";
    for (let c = 0; c < word.length; c++) {
      pattern += hiddenIndices.includes(c) ? "_" : word[c];
    }

    const answerSet = new Set(hiddenChars);
    const distractorLetters: string[] = [];
    const pool = allLetters.split("").filter((ch) => !answerSet.has(ch));
    for (let d = pool.length - 1; d > 0; d--) {
      const k = Math.floor(Math.random() * (d + 1));
      [pool[d], pool[k]] = [pool[k], pool[d]];
    }
    const needed = Math.max(2, 4 - hideCount);
    distractorLetters.push(...pool.slice(0, needed));

    const imageKey = pickRandomImage(vi.word, imageAssets) || cdnToAssetKey(vi.imageUrl ?? "");
    const audioKey = vi.audioUrl ? cdnToAssetKey(vi.audioUrl) : "";

    const seq = startSeq + i;
    const code = `${lessonCode}_${String(seq).padStart(3, "0")}`;

    qs.push({
      id: code,
      grade, week, skill,
      blueprintType: "missing_letter",
      blueprint_type: "missing_letter",
      difficulty: dMin,
      lifecycleStatus: "draft",
      components: {
        stem: "Điền chữ còn thiếu",
        vocab: word,
        meaning: vi.meaning ?? null,
        distractors: distractorLetters,
        assets: { image: imageKey, audio: audioKey },
      },
      correct_answer: hiddenChars.join(""),
      render_spec: {
        blueprint_type: "missing_letter",
        vocab_word: word,
        image_path: imageKey,
        audio_path: audioKey,
        correct_letter: hiddenChars.join(""),
        missing_word: pattern,
        gap_position: hiddenIndices[0],
        sentence_words: null,
        correct_order: null,
      },
      variable_values: { word, grade, week, pattern, prefix, suffix, hiddenChars, tiles: [...hiddenChars, ...distractorLetters] },
      distractor_strategy: "mixed",
      template_id: `letter_vocab_${i}`,
      syncStatus: "pending",
      tags: [],
    });
    report.generated++;
  }
  return { questions: qs, report };
}
