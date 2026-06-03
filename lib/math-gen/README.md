# lib/math-gen — AI Sinh đề Toán (mô hình "Ngân hàng mẫu")

Port từ `STUDYVUI/engine/math/math_templates.js` + logic `evaluateFormula`/`generateDistractors`
trong `admin_math.html`. Khác với `lib/eng-gen` (registry/expander, seeded): bản Toán dựa trên
**template + biến (min–max hoặc danh sách chữ)** và **không seeded** (dùng `Math.random` như vanilla).

## Mô hình
- **Template**: `{ text {a}{b}.., formula, vars[number|text], distractorCount }`.
  - biến `number` → random int trong `[min,max]`, có thể dùng trong `formula`.
  - biến `text` → random 1 phần tử trong `choices` (UI nhập cách nhau bằng `/`), **không** vào formula.
- **formula**: biểu thức số học an toàn (`a + b`, `b - c`...) hoặc literal `comparison` (sinh dấu `>`/`<`/`=`).
- **Sinh đề**: random biến → thế text → `evaluateFormula` → `generateDistractors`.
- **Ảnh/audio**: KHÔNG auto-map. Admin gắn ở modal "Xem trước & Chỉnh sửa" (Asset Picker) → vào `assetRefs`.

## Files
| File | Vai trò |
|---|---|
| `types.ts` | TemplateVar, MathTemplate, GeneratedMathQuestion, ServerTemplate, TemplateInput |
| `evaluate.ts` | resolveVars / renderText / evaluateFormula / generateDistractors |
| `builtins.ts` | 5 mẫu built-in (port math_templates.js) + BUILTIN_LT_MAP + getBuiltinsForLessonType |
| `generate.ts` | generateOne / generateBatch (built-in dùng generator; user dùng evaluate) |
| `export-xlsx.ts` | toBulkRows → 12 cột `multiple_choice`, lessonCode `G{g}_W{ww}_MATH`, assetRefs đã gắn |
| `to-question.ts` | GeneratedMathQuestion → Question (cho modal xem trước) |
| `__tests__/evaluate.test.ts` | unit test (formula, distractor, biến text, export) |

## Nguồn template
- **Built-in** (read-only): nhúng trong `builtins.ts`.
- **Custom**: lưu backend Supabase qua `admin/question-templates` (model `QuestionTemplate`).
  API client: `lib/api/question-templates.ts`. UI: `app/(dashboard)/ai-generate-math/page.tsx`.

## Loại xuất Excel 12 cột (đợt 1)
Chỉ câu **numeric** (4 đáp án) → `multiple_choice`. Bỏ `comparison` (chỉ 3 dấu).
