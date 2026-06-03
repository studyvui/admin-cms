// ============================================================
// STUDYVUI — Difficulty Engine (TS port của difficulty_engine.js)
// ============================================================
import type { Template, GeneratedQuestion } from "./types";

interface LevelConstraint {
  vocab_complexity: string;
  word_length_range: [number, number];
  phonics_complexity: string;
  distractor_similarity: "low" | "medium" | "high";
  distractor_strategy: Template["distractor_strategy"];
  sentence_words: number;
  time_bonus_multiplier: number;
  min_edit_distance: number;
}

export const LEVEL_CONSTRAINTS: Record<number, LevelConstraint> = {
  1: { vocab_complexity: "simple", word_length_range: [2, 4], phonics_complexity: "CVC", distractor_similarity: "low", distractor_strategy: "same_topic", sentence_words: 3, time_bonus_multiplier: 1.5, min_edit_distance: 3 },
  2: { vocab_complexity: "medium", word_length_range: [4, 6], phonics_complexity: "CCVC", distractor_similarity: "medium", distractor_strategy: "similar_spelling", sentence_words: 5, time_bonus_multiplier: 1.0, min_edit_distance: 2 },
  3: { vocab_complexity: "complex", word_length_range: [6, 12], phonics_complexity: "digraph", distractor_similarity: "high", distractor_strategy: "similar_sound", sentence_words: 6, time_bonus_multiplier: 0.8, min_edit_distance: 1 },
};

const DIFFICULTY_PHASES = [
  { phase: 1, weeks: [1, 9], label: "Mo dau", ratios: { 1: 0.7, 2: 0.25, 3: 0.05 } as Record<number, number>, roundPriority: "low" },
  { phase: 2, weeks: [10, 18], label: "Co ban", ratios: { 1: 0.3, 2: 0.5, 3: 0.2 } as Record<number, number>, roundPriority: "mid" },
  { phase: 3, weeks: [19, 35], label: "Nang cao", ratios: { 1: 0.1, 2: 0.4, 3: 0.5 } as Record<number, number>, roundPriority: "high" },
];

export function getEnglishDifficultyPhase(week: number) {
  week = Math.min(35, Math.max(1, week || 1));
  for (const p of DIFFICULTY_PHASES) {
    if (week >= p.weeks[0] && week <= p.weeks[1]) return p;
  }
  return DIFFICULTY_PHASES[0];
}

export function applyEnglishDifficultyConstraints(template: Template, level: number): Template {
  if (!template) return template;
  level = Math.min(3, Math.max(1, parseInt(String(level)) || 1));
  const c = LEVEL_CONSTRAINTS[level];
  if (!c) return template;

  const t: Template = { ...template };
  t.render_hint = { ...(template.render_hint || {}) };
  t.phonics_complexity = c.phonics_complexity;
  t.vocab_complexity = c.vocab_complexity;
  t.distractor_strategy = c.distractor_strategy;
  t.distractor_similarity = c.distractor_similarity;
  t.min_edit_distance = c.min_edit_distance;
  t.sentence_words = c.sentence_words;
  t.time_bonus_multiplier = c.time_bonus_multiplier;

  if (level === 1) {
    t.render_hint.font_size = "clamp(1.2rem, 4vw, 1.8rem)";
    t.render_hint.letter_size = "large";
  } else if (level === 2) {
    t.render_hint.font_size = "clamp(1rem, 3.5vw, 1.5rem)";
    t.render_hint.letter_size = "medium";
  } else {
    t.render_hint.font_size = "clamp(0.9rem, 3vw, 1.3rem)";
    t.render_hint.letter_size = "small";
  }
  t._appliedDifficulty = level;
  return t;
}

/**
 * Phân bổ level cho batch. CHÚ Ý: bản vanilla shuffle bằng Math.random
 * (không seed) → không deterministic. Bản TS cho phép truyền rng để
 * reproducible (cải tiến); nếu không truyền thì dùng Math.random như cũ.
 */
export function getEnglishDifficultyDistribution(
  week: number,
  total: number,
  rng?: () => number,
): number[] {
  const phase = getEnglishDifficultyPhase(week);
  const ratios = phase.ratios;
  const counts: Record<number, number> = {};
  let assigned = 0;
  for (const [lvl, ratio] of Object.entries(ratios)) {
    counts[Number(lvl)] = Math.floor(ratio * total);
    assigned += counts[Number(lvl)];
  }
  let remainder = total - assigned;
  const sortedLevels = Object.keys(ratios).map(Number);
  if (phase.roundPriority === "high") sortedLevels.sort((a, b) => b - a);
  else if (phase.roundPriority === "low") sortedLevels.sort((a, b) => a - b);

  for (const lvl of sortedLevels) {
    if (remainder <= 0) break;
    if (ratios[lvl] > 0) {
      counts[lvl]++;
      remainder--;
    }
  }
  const distribution: number[] = [];
  for (const [lvl, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) distribution.push(parseInt(lvl));
  }
  const rand = rng || Math.random;
  for (let i = distribution.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [distribution[i], distribution[j]] = [distribution[j], distribution[i]];
  }
  return distribution;
}

export function getEnglishAutoDifficultyScore(question: Partial<GeneratedQuestion> & { word?: string; distractor_similarity?: string; phonics_complexity?: string }): number {
  const q = question || {};
  let score = 0;
  const word = q.word || q.correct_answer || "";
  const wordLen = word.length;
  if (wordLen <= 3) score += 1;
  else if (wordLen <= 5) score += 2;
  else score += 3;

  const simMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
  score += simMap[q.distractor_similarity || ""] || 1;
  const phonicsMap: Record<string, number> = { CVC: 1, CCVC: 2, digraph: 3 };
  score += phonicsMap[q.phonics_complexity || ""] || 1;

  const avg = score / 3;
  if (avg <= 1.5) return 1;
  if (avg <= 2.5) return 2;
  return 3;
}
