// ============================================================
// STUDYVUI — Sinh đề Toán từ template (built-in hoặc user).
// ============================================================
import type { GeneratedMathQuestion, MathTemplate, MathGenReport, OptionsType } from "./types";
import { resolveVarsWithCondition, renderText, evaluateFormula, generateDistractors } from "./evaluate";

const SIGNS = new Set([">", "<", "="]);
let _seq = 0;

function newId(templateId: string): string {
  _seq += 1;
  return `${templateId}_${Date.now().toString(36)}_${_seq}`;
}

export interface GenerateOpts {
  grade: number;
  week: number;
  count: number;
  /** ghi đè lessonType (vd built-in dùng dưới lesson type khác). */
  lessonType?: string;
}

/** Sinh 1 câu hỏi từ template. */
export function generateOne(
  template: MathTemplate,
  grade: number,
  week: number,
  difficulty: number,
  lessonType?: string,
): GeneratedMathQuestion {
  let text: string;
  let options: string[];
  let correct: string;
  let optionsType: OptionsType;
  let vars: Record<string, string | number> = {};

  if (template.source === "builtin" && template.builtinGenerator) {
    const raw = template.builtinGenerator(grade, difficulty);
    text = raw.text;
    options = raw.options;
    correct = raw.correct_answer;
    optionsType = SIGNS.has(correct) ? "comparison" : "numeric";
  } else {
    vars = resolveVarsWithCondition(template.vars, template.condition);
    text = renderText(template.text, vars);
    const r = evaluateFormula(template.formula, vars);
    optionsType = r.optionsType;
    correct = String(r.answer);
    options = generateDistractors(r.answer, template.distractorCount || 3, optionsType);
  }

  return {
    id: newId(template.id),
    templateId: template.id,
    lessonType: lessonType || template.lessonType,
    skill: template.skill,
    grade,
    week,
    difficulty,
    text,
    options,
    correct_answer: correct,
    optionsType,
    vars,
    assetRefs: [],
  };
}

function signature(q: GeneratedMathQuestion): string {
  return `${q.text}::${q.options.slice().sort().join("|")}`;
}

/** Sinh N câu, chống trùng trong batch. difficulty xoay vòng 1→3. */
export function generateBatch(
  template: MathTemplate,
  opts: GenerateOpts,
): { questions: GeneratedMathQuestion[]; report: MathGenReport } {
  const count = Math.min(100, Math.max(1, opts.count || 10));
  const questions: GeneratedMathQuestion[] = [];
  const seen = new Set<string>();
  const report: MathGenReport = { generated: 0, skipped_dup: 0 };

  for (let i = 0; i < count; i++) {
    const difficulty = (i % 3) + 1;
    let placed = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const q = generateOne(template, opts.grade, opts.week, difficulty, opts.lessonType);
      const sig = signature(q);
      if (seen.has(sig)) {
        report.skipped_dup++;
        continue;
      }
      seen.add(sig);
      questions.push(q);
      report.generated++;
      placed = true;
      break;
    }
    // nếu không tránh được trùng (miền giá trị quá nhỏ) → vẫn nhận câu cuối
    if (!placed) {
      const q = generateOne(template, opts.grade, opts.week, difficulty, opts.lessonType);
      questions.push(q);
      report.generated++;
    }
  }

  return { questions, report };
}
