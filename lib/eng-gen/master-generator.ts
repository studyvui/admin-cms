// ============================================================
// STUDYVUI — Master Generator (TS port của master_generator_english.js)
// Orchestrator GĐ 1-12. Giữ nguyên thứ tự pipeline + seed scheme
// (seed0 + i*1000 + attempt*7) + MAX_RETRY=5 + cách tiêu thụ rng.
// ============================================================
import type { GenParams, GeneratedQuestion, GenReport, Skill, BlueprintType, DistractorStrategy } from "./types";
import { makeRng } from "./rng";
import { pickRandomTemplate } from "./templates";
import { applyEnglishDifficultyConstraints, getEnglishDifficultyDistribution } from "./difficulty";
import { getWordListForWeek, getWordMeaning, getTopicsForWeek, getDistractorPool } from "./vocab-data";
import { expandEnglishTemplate } from "./expander";
import { pickEnglishDistractors, pickLetterDistractors, type DistractorContext } from "./distractor";
import { computeQuestionDNA, isDuplicateDNA, addToDNASet, generateEnglishQuestionHash } from "./dedup";
import { runEnglishValidationPipeline } from "./qa";

const MAX_RETRY = 5;

function _makeId(grade: number, week: number, skill: Skill, blueprintType: BlueprintType, idx: number): string {
  const skillPrefix: Record<string, string> = { vocabulary: "VOC", phonics: "PHO", sentence: "SEN", listening: "LIS", review: "REV" };
  const bpSuffix: Record<string, string> = { image_choice: "IMG", audio_choice: "AUD", missing_letter: "MIS", reorder: "REO", match_word: "MAT", true_false: "TF" };
  const ts = Date.now().toString(36).slice(-4);
  const sp = skillPrefix[skill] || skill.slice(0, 3).toUpperCase();
  const bp = bpSuffix[blueprintType] || blueprintType.slice(0, 3).toUpperCase();
  return `G${grade}_W${String(week).padStart(2, "0")}_${sp}_${bp}_${String(idx).padStart(3, "0")}_${ts}`;
}

function _defaultBlueprint(skill: Skill): BlueprintType {
  const map: Record<string, BlueprintType> = { vocabulary: "image_choice", phonics: "missing_letter", sentence: "reorder", listening: "audio_choice", review: "image_choice" };
  return map[skill] || "image_choice";
}

interface GenOptions {
  useAIWording?: boolean;
  seed?: number | null;
  wordList?: string[];
}

function _fillDistractors(q: GeneratedQuestion, rng: () => number, grade: number): void {
  const strategy = q.distractor_strategy;
  const vocabWord = q.components.vocab;
  const bpType = q.blueprintType;
  let distractors: string[] = [];

  if (bpType === "missing_letter" && q.render_spec) {
    const correctLetter = q.render_spec.correct_letter || (q.correct_answer && q.correct_answer.length === 1 ? q.correct_answer : "a");
    // Port: dùng seeded rng (cải tiến reproducible — vanilla dùng Math.random ở đây)
    distractors = pickLetterDistractors(correctLetter, 3, { rng });
  } else if (bpType === "reorder") {
    distractors = [];
  } else if (bpType === "true_false") {
    distractors = ["False"];
  } else if (vocabWord) {
    const topics = getTopicsForWeek(q.week);
    const pool = getDistractorPool(topics, vocabWord);
    const ctx: DistractorContext = { grade, rng, pool };
    distractors = pickEnglishDistractors(vocabWord, 3, strategy, ctx);
  }
  q.components.distractors = distractors;
}

function _generateOne(
  grade: number,
  week: number,
  skill: Skill,
  blueprintType: BlueprintType,
  level: number,
  seed: number,
  opts: GenOptions,
): GeneratedQuestion | null {
  const rng = makeRng(seed);

  const template = pickRandomTemplate(skill, blueprintType, [level, level], rng);
  if (!template) return null;

  const constrainedTpl = applyEnglishDifficultyConstraints(template, level);

  let wordList = opts && opts.wordList && opts.wordList.length ? opts.wordList : [];
  if (!wordList.length) wordList = getWordListForWeek(grade, week);
  if (!wordList.length) wordList = constrainedTpl.vocab_pool || [];

  const spec = expandEnglishTemplate(constrainedTpl, seed, { grade, week, wordList });
  if (!spec) return null;

  const vocabWord = spec.vocab_word || (spec.vars && (spec.vars.word as string)) || "";

  const q: GeneratedQuestion = {
    id: _makeId(grade, week, skill, blueprintType, seed),
    grade,
    week,
    skill,
    blueprintType,
    blueprint_type: blueprintType,
    difficulty: level,
    lifecycleStatus: "draft",
    components: {
      stem: spec.question_text || template.question_text_pool[0] || "Choose the correct answer.",
      vocab: vocabWord,
      meaning: getWordMeaning(vocabWord),
      distractors: [],
      assets: {
        image: (spec.render_spec && spec.render_spec.image_path) || `assets/images/grade${grade}/english/${vocabWord.toLowerCase().replace(/\s+/g, "_")}_1.png`,
        audio: (spec.render_spec && spec.render_spec.audio_path) || `assets/audio/grade${grade}/english/${vocabWord.toLowerCase().replace(/\s+/g, "_")}.mp3`,
      },
    },
    correct_answer: spec.correct_answer || vocabWord,
    render_spec: spec.render_spec || null,
    variable_values: spec.vars || { word: vocabWord, grade, week },
    distractor_strategy: (spec.distractor_strategy || constrainedTpl.distractor_strategy || "same_topic") as DistractorStrategy,
    template_id: template.template_id,
    syncStatus: "pending",
    tags: [],
  };

  _fillDistractors(q, rng, grade);
  return q;
}

export function generateEnglishQuestions(params: GenParams): { questions: GeneratedQuestion[]; report: GenReport } {
  params = params || {};
  const grade = parseInt(String(params.grade)) || 1;
  const week = parseInt(String(params.week)) || 1;
  const skill = (params.skill || "vocabulary") as Skill;
  const blueprintType = (params.blueprintType || _defaultBlueprint(skill)) as BlueprintType;
  const count = Math.min(200, Math.max(1, parseInt(String(params.count)) || 10));
  const [dMin, dMax] = params.difficultyRange || [1, 3];
  const seed0 = params.options && params.options.seed ? params.options.seed : Date.now();

  const questions: GeneratedQuestion[] = [];
  const dnaSet = new Set<string>();
  const hashSet = new Set<string>();
  const report: GenReport = { generated: 0, duplicates: 0, qa_failed: 0, missing_assets: [], skill, blueprintType, week, grade };

  // Phân bổ độ khó theo phase — seed bằng seed0 để reproducible.
  let distribution = getEnglishDifficultyDistribution(week, count, makeRng(seed0 + 999983));
  distribution = distribution.map((l) => Math.min(dMax, Math.max(dMin, l)));

  for (let i = 0; i < count; i++) {
    const level = distribution[i] || dMin;
    let placed = false;
    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
      const seed = seed0 + i * 1000 + attempt * 7;
      const q = _generateOne(grade, week, skill, blueprintType, level, seed, params.options || {});
      if (!q) break;

      if (isDuplicateDNA(q, dnaSet)) {
        report.duplicates++;
        continue;
      }

      const validQ = runEnglishValidationPipeline(q);
      if (validQ.lifecycleStatus === "rejected") {
        report.qa_failed++;
        continue;
      }

      addToDNASet(validQ, dnaSet);
      hashSet.add(generateEnglishQuestionHash(validQ));

      questions.push(validQ);
      report.generated++;
      placed = true;
      break;
    }
    if (!placed) report.qa_failed++;
  }

  return { questions, report };
}

export async function generateEnglishQuestionsWithProgress(
  params: GenParams,
  onProgress?: (current: number, total: number, message: string) => void,
): Promise<{ questions: GeneratedQuestion[]; report: GenReport }> {
  params = params || {};
  const total = Math.min(200, Math.max(1, parseInt(String(params.count)) || 10));
  const step = Math.max(1, Math.floor(total / 20));
  const allQuestions: GeneratedQuestion[] = [];
  const report: GenReport = { generated: 0, duplicates: 0, qa_failed: 0, missing_assets: [] };
  const baseSeed = params.options && params.options.seed ? params.options.seed : Date.now();

  for (let i = 0; i < total; i += step) {
    const batchCount = Math.min(step, total - i);
    const batchParams: GenParams = {
      ...params,
      count: batchCount,
      options: { ...(params.options || {}), seed: baseSeed + i * 1000 },
    };
    const batchResult = generateEnglishQuestions(batchParams);
    allQuestions.push(...batchResult.questions);
    report.generated += batchResult.report.generated;
    report.duplicates += batchResult.report.duplicates;
    report.qa_failed += batchResult.report.qa_failed;
    batchResult.report.missing_assets.forEach((a) => {
      if (!report.missing_assets.includes(a)) report.missing_assets.push(a);
    });
    if (typeof onProgress === "function") {
      onProgress(Math.min(allQuestions.length, total), total, `Đã sinh ${allQuestions.length}/${total} câu`);
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  return { questions: allQuestions.slice(0, total), report };
}

export { computeQuestionDNA };
