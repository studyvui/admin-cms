// ============================================================
// Sinh cau hoi that Toan Lop 4 tu GRADE4_BUILTIN_TEMPLATES (Phase 3, 2026-08-11).
// Round-robin qua cac template cua moi tuan, gan difficulty theo 3-Phase rule
// (README/CLAUDE.md "Do kho cau hoi Toan"). Xuat JSON { "1": [...], ..., "35": [...] }
// cho script Python ghi len production (POST /admin/questions).
//
// Chay: npx tsx scripts/gen-grade4-questions.ts > /path/to/phase3_g4_rows.json
// ============================================================
import { GRADE4_BUILTIN_TEMPLATES } from "../lib/math-gen/builtins-grade4";

const TARGET_PER_WEEK = 12;
const MAX_ATTEMPTS_PER_Q = 20;

function pickDifficulty(week: number): number {
  // Bang % theo README/CLAUDE.md "Do kho cau hoi Toan - 3 Phase theo tuan"
  let table: number[]; // [L1,L2,L3,L4,L5] % tich luy
  if (week <= 9) table = [50, 90, 100, 100, 100]; // Mo dau
  else if (week <= 18) table = [20, 70, 90, 100, 100]; // Co ban
  else table = [0, 30, 70, 90, 100]; // Nang cao
  const r = Math.random() * 100;
  for (let i = 0; i < table.length; i++) if (r < table[i]) return i + 1;
  return 5;
}

function main() {
  const out: Record<string, unknown[]> = {};
  const coverage: string[] = [];

  for (let week = 1; week <= 35; week++) {
    const wk = String(week).padStart(2, "0");
    const templates = GRADE4_BUILTIN_TEMPLATES.filter((t) => t.id.startsWith(`TPL_G4_W${wk}_`));
    if (templates.length === 0) {
      coverage.push(`Tuần ${week}: 0 template — BỎ QUA`);
      continue;
    }
    const rows: unknown[] = [];
    const seenPrompts = new Set<string>();
    let ti = 0;
    let guard = 0;
    while (rows.length < TARGET_PER_WEEK && guard < TARGET_PER_WEEK * MAX_ATTEMPTS_PER_Q) {
      guard++;
      const tpl = templates[ti % templates.length];
      ti++;
      const r = tpl.builtinGenerator!(4, 1);
      const key = r.text;
      // Cho phep trung nhau sau khi da thu du MAX_ATTEMPTS_PER_Q lan lien tiep
      // (mot so archetype pham vi output rat hep).
      const forceAccept = guard > TARGET_PER_WEEK * (MAX_ATTEMPTS_PER_Q - 2);
      if (!forceAccept && seenPrompts.has(key)) continue;
      seenPrompts.add(key);
      rows.push({
        prompt: r.text,
        options: r.options,
        correctAnswer: r.correct_answer,
        skill: tpl.skill,
        difficulty: pickDifficulty(week),
      });
    }
    out[String(week)] = rows;
    coverage.push(`Tuần ${week}: ${templates.length} template → ${rows.length} câu (unique prompt: ${seenPrompts.size})`);
  }

  process.stderr.write(coverage.join("\n") + "\n");
  process.stderr.write(`\nTổng: ${Object.values(out).reduce((a, v) => a + v.length, 0)} câu qua ${Object.keys(out).length} tuần\n`);
  process.stdout.write(JSON.stringify(out, null, 2));
}

main();
