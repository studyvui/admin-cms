// ============================================================
// STUDYVUI — Test seed template Toán Lớp 1 (GD14 Phase 2, 2026-07-24).
// Chạy MỖI template qua đúng pipeline thật (resolveVarsWithCondition → renderText
// → evaluateFormula → generateDistractors) nhiều lần, đảm bảo:
//  - text render xong không còn "{" sót lại (thế biến đủ).
//  - formula luôn cho đáp án hợp lệ (không phải "?" — dấu hiệu formula lỗi/SAFE_EXPR
//    reject, hoặc condition không bao giờ thoả khiến vars rác).
//  - distractor sinh đủ, không trùng đáp án đúng, không âm.
// ============================================================
import { describe, it, expect } from "vitest";
import { resolveVarsWithCondition, renderText, evaluateFormula, generateDistractors } from "../evaluate";
import GRADE1_TEMPLATES from "../seed-grade1-templates";

describe("seed-grade1-templates: 65 template Lớp 1 (GD14 Phase 2)", () => {
  it("có ít nhất 45 template (đủ 10 chủ đề — phần còn lại thuộc nhóm 🖼️/⛔/🛠️, không qua declarative)", () => {
    expect(GRADE1_TEMPLATES.length).toBeGreaterThanOrEqual(45);
  });

  GRADE1_TEMPLATES.forEach((tpl, idx) => {
    it(`#${idx} [${tpl.lessonType}/${tpl.skill}] "${tpl.text}" — sinh 40 lần hợp lệ`, () => {
      let okCount = 0;
      for (let i = 0; i < 40; i++) {
        const vars = resolveVarsWithCondition(tpl.vars, tpl.condition, 200);
        const text = renderText(tpl.text, vars);
        // Không còn placeholder {x} sót lại sau khi thế biến.
        expect(text).not.toMatch(/\{[a-zA-Z_]+\}/);
        const r = evaluateFormula(tpl.formula, vars);
        // Formula phải cho ra đáp án hợp lệ (không phải "?" — dấu hiệu lỗi).
        expect(r.answer).not.toBe("?");
        const distractors = generateDistractors(r.answer, tpl.distractorCount || 3, r.optionsType);
        expect(distractors.length).toBeGreaterThanOrEqual(2);
        expect(distractors).toContain(String(r.answer));
        expect(new Set(distractors).size).toBe(distractors.length);
        if (r.optionsType === "numeric") {
          for (const d of distractors) expect(Number(d)).toBeGreaterThanOrEqual(0);
        }
        okCount++;
      }
      expect(okCount).toBe(40);
    });
  });

  // [PLAN.md muc 41] Bài này quét mọi template có condition x 60 lần x tối đa 200 lần thử mỗi lần: chạy riêng ~2 giây nhưng
  // cả bộ (23 file song song) vượt timeout mặc định 5000ms (đo 5128ms) -> đỏ chập chờn. Timeout rộng hơn, không đổi phép kiểm.
  it("condition (nếu có) phải thoả được trong đa số lần thử (không phải reject-sampling vô ích)", () => {
    const withCond = GRADE1_TEMPLATES.filter((t) => t.condition);
    expect(withCond.length).toBeGreaterThan(0);
    for (const tpl of withCond) {
      const runs = 60;
      // Gọi với maxAttempts=200 (giống production) phải LUÔN ra vars hợp lệ
      // (không bị "hết attempts vẫn trả vars cuối không thoả điều kiện" quá thường xuyên).
      let anyFail = 0;
      for (let i = 0; i < runs; i++) {
        const vars = resolveVarsWithCondition(tpl.vars, tpl.condition, 200);
        const text = renderText(tpl.text, vars);
        const r = evaluateFormula(tpl.formula, vars);
        if (r.answer === "?" || /\{[a-zA-Z_]+\}/.test(text)) anyFail++;
      }
      expect(anyFail).toBe(0);
    }
  }, 30_000);
});
