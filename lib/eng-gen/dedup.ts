// ============================================================
// STUDYVUI — Duplicate Detector v2 (TS port của duplicate_detector_english_v2.js)
// Question DNA (djb2). Port y nguyên để parity.
// ============================================================
import type { GeneratedQuestion } from "./types";

function _normalize(text: string): string {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()？！。、'"]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function _normalizeSentence(sentence: string): string {
  if (!sentence) return "";
  return _normalize(sentence).split(" ").sort().join(" ");
}

function _djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

type QComponents = { vocab?: string; distractors?: string[]; phonics_pattern?: string; sentence?: string };
type QLike = Partial<GeneratedQuestion> & {
  components?: QComponents;
  vocab_word?: string;
  distractors?: string[];
  phonics_pattern?: string;
  sentence?: string;
};

function _getBlueprintType(q: QLike): string {
  return q.blueprintType || q.blueprint_type || "";
}

export interface QuestionDNA {
  blueprint_type: string;
  skill: string;
  vocab_word: string;
  correct_answer: string;
  distractor_set: string;
  phonics_pattern: string;
  sentence_key: string;
  difficulty: number;
}

export function computeQuestionDNA(question: QLike): QuestionDNA {
  const comp: QComponents = question.components || {};
  const vocabWord = _normalize(comp.vocab || question.vocab_word || "");
  const correctAnswer = _normalize(question.correct_answer || comp.vocab || "");
  const distractors = comp.distractors || question.distractors || [];
  const distractorSet = distractors.map(_normalize).sort().join("|");
  const phonicsPattern = _normalize(comp.phonics_pattern || question.phonics_pattern || "");
  const sentenceKey = _normalizeSentence(comp.sentence || question.sentence || "");
  return {
    blueprint_type: _getBlueprintType(question),
    skill: question.skill || "",
    vocab_word: vocabWord,
    correct_answer: correctAnswer,
    distractor_set: distractorSet,
    phonics_pattern: phonicsPattern,
    sentence_key: sentenceKey,
    difficulty: question.difficulty || 1,
  };
}

function _dnaSignature(dna: QuestionDNA): string {
  return [dna.blueprint_type, dna.skill, dna.vocab_word, dna.correct_answer, dna.distractor_set, dna.phonics_pattern, dna.sentence_key, String(dna.difficulty)].join("||");
}

function _dnaBadge(dna: QuestionDNA): string {
  return _djb2Hash(_dnaSignature(dna));
}

export function isDuplicateDNA(question: QLike, existingDNAs: Set<string>): boolean {
  const dna = computeQuestionDNA(question);
  const badge = _dnaBadge(dna);
  if (existingDNAs.has(badge)) return true;
  if (existingDNAs.has(JSON.stringify(dna))) return true;
  return false;
}

export function addToDNASet(question: QLike, set: Set<string>): void {
  const dna = computeQuestionDNA(question);
  set.add(_dnaBadge(dna));
  set.add(JSON.stringify(dna));
}

export function generateEnglishQuestionHash(question: QLike): string {
  const comp: QComponents = question.components || {};
  const blueprint = _getBlueprintType(question);
  const normVocab = _normalize(comp.vocab || question.vocab_word || "");
  const distractors = comp.distractors || question.distractors || [];
  const normDist = distractors.map(_normalize).sort().join("|");
  const signature = `${blueprint}::${normVocab}::${normDist}`;
  return _djb2Hash(signature);
}
