// ============================================================
// PARITY TEST — chứng minh bản TS port cho output GIỐNG vanilla
// ở các building-block xác định (seed cố định).
// ============================================================
import { describe, it, expect } from "vitest";
import { loadVanilla } from "./load-vanilla";
import { getAllTemplates } from "../templates";
import { expandEnglishTemplate } from "../expander";
import { applyEnglishDifficultyConstraints } from "../difficulty";
import { pickEnglishDistractors } from "../distractor";
import { generateEnglishQuestionHash, computeQuestionDNA } from "../dedup";
import { runEnglishVisualQA } from "../qa";
import { makeRng } from "../rng";
import type { Template } from "../types";

const V = loadVanilla();
const SEEDS = [1, 7, 42, 123, 9999, 1234567, 2024, 88888];
const WORD_LIST = ["hello", "hi", "bye", "goodbye", "name", "apple", "cat", "dog"];

const TEMPLATE_IDS = getAllTemplates().map((t) => t.template_id);

function getVanillaTemplate(id: string): unknown {
  return V.EnglishTemplateRegistry.getById(id);
}
function getTsTemplate(id: string): Template {
  return getAllTemplates().find((t) => t.template_id === id)!;
}

describe("parity: expandEnglishTemplate", () => {
  for (const id of TEMPLATE_IDS) {
    for (const seed of SEEDS) {
      it(`${id} @seed=${seed}`, () => {
        const ctx = { grade: 1, week: 1, wordList: WORD_LIST };
        const vt = getVanillaTemplate(id);
        const tt = getTsTemplate(id);
        const vSpec = V.expandEnglishTemplate(vt, seed, ctx) as Record<string, unknown>;
        const tSpec = expandEnglishTemplate(tt, seed, ctx) as unknown as Record<string, unknown>;
        // So khớp các field nội dung xác định
        expect(tSpec.question_text).toBe(vSpec.question_text);
        expect(tSpec.vocab_word).toBe(vSpec.vocab_word);
        expect(tSpec.correct_answer).toBe(vSpec.correct_answer);
        expect(tSpec.render_spec).toEqual(vSpec.render_spec);
      });
    }
  }
});

describe("parity: applyEnglishDifficultyConstraints", () => {
  for (const id of TEMPLATE_IDS) {
    for (const level of [1, 2, 3]) {
      it(`${id} @L${level}`, () => {
        const vt = V.applyEnglishDifficultyConstraints(getVanillaTemplate(id), level) as Record<string, unknown>;
        const tt = applyEnglishDifficultyConstraints(getTsTemplate(id), level) as unknown as Record<string, unknown>;
        expect(tt.distractor_strategy).toBe(vt.distractor_strategy);
        expect(tt.distractor_similarity).toBe(vt.distractor_similarity);
        expect(tt.phonics_complexity).toBe(vt.phonics_complexity);
        expect(tt.min_edit_distance).toBe(vt.min_edit_distance);
        expect(tt.sentence_words).toBe(vt.sentence_words);
      });
    }
  }
});

describe("parity: pickEnglishDistractors", () => {
  const words = ["apple", "cat", "dog", "red", "hello", "frog", "elephant", "sun"];
  const strategies = ["same_topic", "similar_spelling", "similar_sound", "mixed"];
  for (const word of words) {
    for (const strategy of strategies) {
      for (const seed of SEEDS.slice(0, 4)) {
        it(`${word}/${strategy}@${seed}`, () => {
          const vRng = V._makeRng(seed);
          const tRng = makeRng(seed);
          const vOut = V.pickEnglishDistractors(word, 3, strategy, { rng: vRng });
          const tOut = pickEnglishDistractors(word, 3, strategy as never, { rng: tRng });
          expect(tOut).toEqual(vOut);
        });
      }
    }
  }
});

describe("parity: hash + DNA + QA", () => {
  // Dựng vài câu hỏi mẫu rồi so hash/DNA/QA giữa 2 bản
  const samples = [
    { blueprintType: "image_choice", skill: "vocabulary", correct_answer: "apple", components: { vocab: "apple", distractors: ["cat", "dog", "fish"] }, difficulty: 1 },
    { blueprintType: "audio_choice", skill: "vocabulary", correct_answer: "red", components: { vocab: "red", distractors: ["blue", "green", "pink"] }, difficulty: 1 },
    { blueprintType: "image_choice", skill: "review", correct_answer: "elephant", components: { vocab: "elephant", distractors: ["tiger", "lion", "bear"] }, difficulty: 3 },
  ];
  samples.forEach((s, i) => {
    it(`hash #${i}`, () => {
      expect(generateEnglishQuestionHash(s as never)).toBe(V.generateEnglishQuestionHash(s));
    });
    it(`DNA #${i}`, () => {
      expect(computeQuestionDNA(s as never)).toEqual(V.computeEnglishQuestionDNA(s));
    });
    it(`QA #${i}`, () => {
      const t = runEnglishVisualQA(s as never);
      const v = V.runEnglishVisualQA(s) as { passed: boolean; score: number };
      expect(t.passed).toBe(v.passed);
      expect(t.score).toBe(v.score);
    });
  });
});
