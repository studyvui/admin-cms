// ============================================================
// STUDYVUI — Visual QA (TS port của visual_qa_english.js)
// 6 checks + pipeline. Safety/structural modules vắng mặt → bỏ qua
// (giống vanilla khi các module đó chưa load).
// ============================================================
import type { GeneratedQuestion } from "./types";
import { getEnglishAutoDifficultyScore } from "./difficulty";

type QLike = Partial<GeneratedQuestion> & {
  components?: { vocab?: string; distractors?: string[]; assets?: { image?: string; audio?: string } };
  vocab_word?: string;
  distractors?: string[];
  assets?: { image?: string; audio?: string };
  image?: string;
  audio?: string;
};

interface Issue {
  check: string;
  severity: "critical" | "warning" | "info";
  detail: string;
}

function _bp(q: QLike): string {
  return q.blueprintType || q.blueprint_type || "";
}
function _vocab(q: QLike): string {
  return q.components?.vocab || q.vocab_word || q.correct_answer || "";
}
function _distractors(q: QLike): string[] {
  return q.components?.distractors || q.distractors || [];
}

function _checkAnswerInChoices(q: QLike, issues: Issue[]): number {
  const bp = _bp(q);
  if (!["image_choice", "audio_choice"].includes(bp)) return 0;
  const vocab = _vocab(q).toLowerCase().trim();
  const correctAns = (q.correct_answer || "").toLowerCase().trim();
  const answerToCheck = correctAns || vocab;
  if (!answerToCheck) {
    issues.push({ check: "check_answer_in_choices", severity: "critical", detail: "Câu hỏi không có correct_answer hoặc vocab_word." });
    return 25;
  }
  const distractors = _distractors(q);
  if (distractors.length === 0) {
    issues.push({ check: "check_answer_in_choices", severity: "critical", detail: `Loại "${bp}" cần có distractors để học sinh chọn.` });
    return 25;
  }
  return 0;
}

function _checkDistractorCount(q: QLike, issues: Issue[]): number {
  const bp = _bp(q);
  if (!["image_choice", "audio_choice"].includes(bp)) return 0;
  const distractors = _distractors(q);
  if (distractors.length !== 3) {
    issues.push({ check: "check_distractor_count", severity: "warning", detail: `Cần đúng 3 distractors (hiện có ${distractors.length}).` });
    return 20;
  }
  return 0;
}

function _checkNoDuplicateChoices(q: QLike, issues: Issue[]): number {
  const vocab = _vocab(q).toLowerCase().trim();
  const distractors = _distractors(q).map((d) => String(d).toLowerCase().trim());
  const allChoices = [vocab, ...distractors].filter(Boolean);
  const uniqueChoices = new Set(allChoices);
  if (uniqueChoices.size < allChoices.length) {
    const seen = new Set<string>();
    const dupFound: string[] = [];
    allChoices.forEach((c) => {
      if (seen.has(c)) dupFound.push(c);
      else seen.add(c);
    });
    issues.push({ check: "check_no_duplicate_choices", severity: "critical", detail: `Lựa chọn bị trùng: "${dupFound.join('", "')}"` });
    return 20;
  }
  return 0;
}

function _checkAssetFields(q: QLike, issues: Issue[]): number {
  const bp = _bp(q);
  const assets = q.components?.assets || q.assets || {};
  let penalty = 0;
  if (bp === "image_choice") {
    if (!(assets.image || q.image || "")) {
      issues.push({ check: "check_asset_fields", severity: "warning", detail: 'Loại "image_choice" cần có đường dẫn hình ảnh (assets.image).' });
      penalty += 15;
    }
  }
  if (bp === "audio_choice") {
    if (!(assets.audio || q.audio || "")) {
      issues.push({ check: "check_asset_fields", severity: "warning", detail: 'Loại "audio_choice" cần có đường dẫn âm thanh (assets.audio).' });
      penalty += 15;
    }
  }
  return penalty;
}

function _checkDifficultyMatch(q: QLike, issues: Issue[]): number {
  const vocab = _vocab(q);
  const wordLen = vocab ? vocab.length : 0;
  const difficulty = q.difficulty || 1;
  let mismatch = false;
  let detail = "";
  if (difficulty === 1 && wordLen > 5) {
    mismatch = true;
    detail = `L1 nên dùng từ ≤5 ký tự, nhưng "${vocab}" có ${wordLen} ký tự.`;
  } else if (difficulty === 2 && (wordLen < 4 || wordLen > 7)) {
    mismatch = true;
    detail = `L2 nên dùng từ 4-7 ký tự, nhưng "${vocab}" có ${wordLen} ký tự.`;
  }
  if (mismatch) {
    issues.push({ check: "check_difficulty_match", severity: "info", detail });
    return 10;
  }
  return 0;
}

function _checkDistractorPlausibility(q: QLike, issues: Issue[]): number {
  const vocab = _vocab(q).toLowerCase().trim();
  const distractors = _distractors(q);
  if (!vocab || distractors.length === 0) return 0;
  const identical = distractors.filter((d) => String(d).toLowerCase().trim() === vocab);
  if (identical.length > 0) {
    issues.push({ check: "check_distractor_plausibility", severity: "critical", detail: `Distractor giống hệt đáp án đúng: "${identical.join('", "')}"` });
    return 30;
  }
  return 0;
}

export interface QAResult {
  passed: boolean;
  score: number;
  issues: string[];
  issues_structured: Issue[];
}

export function runEnglishVisualQA(question: QLike): QAResult {
  const issues: Issue[] = [];
  let penalty = 0;
  penalty += _checkAnswerInChoices(question, issues);
  penalty += _checkDistractorCount(question, issues);
  penalty += _checkNoDuplicateChoices(question, issues);
  penalty += _checkAssetFields(question, issues);
  penalty += _checkDifficultyMatch(question, issues);
  penalty += _checkDistractorPlausibility(question, issues);
  const score = Math.max(0, 100 - penalty);
  const hasCritical = issues.some((i) => i.severity === "critical");
  const passed = score >= 60 && !hasCritical;
  return {
    passed,
    score,
    issues: issues.map((i) => `[${i.severity.toUpperCase()}] ${i.check}: ${i.detail}`),
    issues_structured: issues,
  };
}

/** Mutate question: gắn lifecycleStatus / errorLog / _qa_score. */
export function runEnglishValidationPipeline(question: GeneratedQuestion): GeneratedQuestion {
  // Difficulty scoring (giống vanilla khi module có mặt)
  const autoScore = getEnglishAutoDifficultyScore({
    correct_answer: question.correct_answer,
    distractor_similarity: undefined,
    phonics_complexity: undefined,
  });
  question.difficulty = autoScore;

  const qaResult = runEnglishVisualQA(question);
  question._qa_score = qaResult.score;
  if (!qaResult.passed) {
    question.lifecycleStatus = "rejected";
    question.errorLog = qaResult.issues.join("; ");
  } else {
    if (!question.lifecycleStatus || question.lifecycleStatus === "draft") {
      question.lifecycleStatus = "approved";
    }
  }
  return question;
}
