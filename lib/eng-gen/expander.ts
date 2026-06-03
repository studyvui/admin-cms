// ============================================================
// STUDYVUI — Template Expander (TS port của template_expander.js)
// Biến template + seed + context → QuestionSpec deterministic.
// KHÔNG dùng asset resolver (manifest) → dùng path quy ước, khớp parity
// khi golden cũng không nạp asset_picker.
// ============================================================
import type { Template, QuestionSpec, RenderSpec, Rng } from "./types";
import { makeRng, pickRng } from "./rng";

function _imagePath(grade: number, word: string | null, seed?: number): string | null {
  if (!word) return null;
  const safeWord = word.toLowerCase().replace(/\s+/g, "_");
  const variant = typeof seed === "number" ? (Math.abs(seed) % 3) + 1 : 1;
  return `assets/images/grade${grade}/english/${safeWord}_${variant}.png`;
}

function _audioPath(grade: number, word: string | null): string | null {
  if (!word) return null;
  const safeWord = word.toLowerCase().replace(/\s+/g, "_");
  return `assets/audio/grade${grade}/english/${safeWord}.mp3`;
}

interface ExpandCtx {
  grade?: number;
  week?: number;
  topic?: string;
  wordList?: string[];
  phonicsList?: string[];
  phonic_answers?: Record<string, string>;
  sentenceList?: string[];
}

function _pickVocabWord(template: Template, ctx: ExpandCtx, rng: Rng): string {
  if (Array.isArray(ctx.wordList) && ctx.wordList.length > 0) return pickRng(ctx.wordList, rng) as string;
  if (Array.isArray(template.vocab_pool) && template.vocab_pool.length > 0) return pickRng(template.vocab_pool, rng) as string;
  return "word";
}

interface ExpandResult {
  vocab_word: string | null;
  correct_answer: string;
  render_spec: RenderSpec;
}

function _expandVocabImage(template: Template, ctx: ExpandCtx, rng: Rng, grade: number): ExpandResult {
  const vocab_word = _pickVocabWord(template, ctx, rng);
  const imgSeed = Math.floor(rng() * 0xffffffff);
  const image_path = _imagePath(grade, vocab_word, imgSeed);
  const audio_path = _audioPath(grade, vocab_word);
  return {
    vocab_word,
    correct_answer: vocab_word,
    render_spec: {
      blueprint_type: template.blueprint_type, vocab_word, image_path, audio_path,
      missing_word: null, gap_position: null, correct_letter: null, sentence_words: null, correct_order: null,
    },
  };
}

function _expandVocabAudio(template: Template, ctx: ExpandCtx, rng: Rng, grade: number): ExpandResult {
  const vocab_word = _pickVocabWord(template, ctx, rng);
  const imgSeed = Math.floor(rng() * 0xffffffff);
  const image_path = _imagePath(grade, vocab_word, imgSeed);
  const audio_path = _audioPath(grade, vocab_word);
  return {
    vocab_word,
    correct_answer: vocab_word,
    render_spec: {
      blueprint_type: template.blueprint_type, vocab_word, image_path, audio_path,
      missing_word: null, gap_position: null, correct_letter: null, sentence_words: null, correct_order: null,
    },
  };
}

function _expandPhonics(template: Template, ctx: ExpandCtx, rng: Rng): ExpandResult {
  let pattern: string | null = null;
  if (Array.isArray(ctx.phonicsList) && ctx.phonicsList.length > 0) pattern = pickRng(ctx.phonicsList, rng) as string;
  else if (Array.isArray(template.phonics_pool) && template.phonics_pool.length > 0) pattern = pickRng(template.phonics_pool, rng) as string;
  if (!pattern) pattern = "c_t";

  const gap_position = pattern.indexOf("_");
  if (gap_position === -1) {
    const midPos = Math.floor(pattern.length / 2);
    const correct_letter = pattern[midPos];
    const missing_word = pattern.slice(0, midPos) + "_" + pattern.slice(midPos + 1);
    return {
      vocab_word: null, correct_answer: correct_letter,
      render_spec: { blueprint_type: "missing_letter", vocab_word: null, image_path: null, audio_path: null, missing_word, gap_position: midPos, correct_letter, sentence_words: null, correct_order: null },
    };
  }

  let correct_letter: string;
  if (ctx.phonic_answers && ctx.phonic_answers[pattern]) {
    correct_letter = ctx.phonic_answers[pattern];
  } else {
    const vowels = ["a", "e", "i", "o", "u"];
    const consonants = ["b", "c", "d", "f", "g", "h", "l", "m", "n", "p", "r", "s", "t"];
    if (gap_position > 0 && gap_position < pattern.length - 1) correct_letter = pickRng(vowels, rng) as string;
    else correct_letter = pickRng(consonants, rng) as string;
  }

  return {
    vocab_word: null, correct_answer: correct_letter,
    render_spec: { blueprint_type: "missing_letter", vocab_word: null, image_path: null, audio_path: null, missing_word: pattern, gap_position, correct_letter, sentence_words: null, correct_order: null },
  };
}

function _expandReorder(template: Template, ctx: ExpandCtx, rng: Rng): ExpandResult {
  let sentence: string | null = null;
  if (Array.isArray(ctx.sentenceList) && ctx.sentenceList.length > 0) sentence = pickRng(ctx.sentenceList, rng) as string;
  else if (Array.isArray(template.sentence_pool) && template.sentence_pool.length > 0) sentence = pickRng(template.sentence_pool, rng) as string;
  if (!sentence) sentence = "I am happy";

  const correct_order = sentence.trim().split(/\s+/);
  const shuffled = correct_order.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (correct_order.join(" ") === shuffled.join(" ") && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return {
    vocab_word: null, correct_answer: sentence,
    render_spec: { blueprint_type: "reorder", vocab_word: null, image_path: null, audio_path: null, missing_word: null, gap_position: null, correct_letter: null, sentence_words: shuffled, correct_order },
  };
}

function _expandTrueFalse(template: Template, ctx: ExpandCtx, rng: Rng): ExpandResult {
  let sentence: string | null = null;
  if (Array.isArray(ctx.sentenceList) && ctx.sentenceList.length > 0) sentence = pickRng(ctx.sentenceList, rng) as string;
  else if (Array.isArray(template.sentence_pool) && template.sentence_pool.length > 0) sentence = pickRng(template.sentence_pool, rng) as string;
  if (!sentence) sentence = "I am happy";

  const is_correct = rng() >= 0.5;
  let displayed_sentence = sentence;
  if (!is_correct) {
    const words = sentence.trim().split(/\s+/);
    const replaceIdx = Math.floor(rng() * words.length);
    const originalWord = words[replaceIdx];
    let replacement = originalWord;
    const wordList = Array.isArray(ctx.wordList) && ctx.wordList.length > 0 ? ctx.wordList : ["cat", "dog", "big", "red", "run"];
    for (let i = 0; i < 5; i++) {
      const candidate = pickRng(wordList, rng) as string;
      if (candidate && candidate.toLowerCase() !== originalWord.toLowerCase()) { replacement = candidate; break; }
    }
    words[replaceIdx] = replacement;
    displayed_sentence = words.join(" ");
  }
  const correct_answer = is_correct ? "True" : "False";
  return {
    vocab_word: null, correct_answer,
    render_spec: { blueprint_type: "true_false", vocab_word: null, image_path: null, audio_path: null, missing_word: null, gap_position: null, correct_letter: null, sentence_words: null, correct_order: null, displayed_sentence, is_correct },
  };
}

function _expandByBlueprintType(template: Template, ctx: ExpandCtx, rng: Rng, grade: number): ExpandResult {
  const bt = template.blueprint_type;
  if (bt === "image_choice") return _expandVocabImage(template, ctx, rng, grade);
  if (bt === "match_word") return _expandVocabImage(template, ctx, rng, grade);
  if (bt === "audio_choice") return _expandVocabAudio(template, ctx, rng, grade);
  if (bt === "missing_letter") return _expandPhonics(template, ctx, rng);
  if (bt === "reorder") return _expandReorder(template, ctx, rng);
  if (bt === "true_false") return _expandTrueFalse(template, ctx, rng);
  return _expandVocabImage(template, ctx, rng, grade);
}

export function expandEnglishTemplate(template: Template, seed: number | null, ctx: ExpandCtx): QuestionSpec | null {
  if (!template) return null;
  ctx = ctx || {};
  const grade = ctx.grade || 1;
  const week = ctx.week || 1;
  const topic = ctx.topic || "";
  const actualSeed = seed != null ? seed : Math.floor(Math.random() * 0xffffffff);
  const rng = makeRng(actualSeed);

  const question_text = (pickRng(template.question_text_pool, rng) as string) || "";
  const expanded = _expandByBlueprintType(template, ctx, rng, grade);
  if (!expanded) return null;
  const { vocab_word, correct_answer, render_spec } = expanded;
  if (correct_answer === null || correct_answer === undefined) return null;

  return {
    template_id: template.template_id,
    skill: template.skill,
    blueprint_type: template.blueprint_type,
    difficulty_range: template.difficulty_range,
    distractor_strategy: template.distractor_strategy,
    required_assets: template.required_assets || [],
    use_ai_wording: template.use_ai_wording || false,
    complexity_hint: template.complexity_hint || 1,
    question_text,
    vocab_word,
    correct_answer,
    distractors: [],
    render_spec,
    vars: { word: vocab_word, grade, week, topic },
    seed: actualSeed,
  };
}
