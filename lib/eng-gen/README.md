# lib/eng-gen — Bộ sinh đề Tiếng Anh (TypeScript)

Viết mới (port) từ `STUDYVUI/engine/english/*` (vanilla JS, hệ GD14) sang TypeScript thuần.
Đây là **nơi DUY NHẤT** sinh đề Tiếng Anh sau khi `admin_english.html` bị khai tử (2026-06-03).

## Module

| File | Nguồn vanilla | Vai trò |
|------|---------------|---------|
| `rng.ts` | mulberry32 | Seeded RNG (chìa khoá parity) |
| `types.ts` | — | Kiểu dữ liệu |
| `vocab-data.ts` | `data/vocab_provider.js` | VOCAB + WEEK_TOPICS + word list theo tuần |
| `templates.ts` | `templates/_index.js` + 7 file template | Registry + 9 template (data) |
| `difficulty.ts` | `difficulty/difficulty_engine.js` | Constraints + phân bổ độ khó theo phase |
| `distractor.ts` | `generator/distractor_engine_v2.js` | 5 chiến thuật nhiễu |
| `expander.ts` | `utils/template_expander.js` | Template + seed → QuestionSpec |
| `dedup.ts` | `observability/duplicate_detector_english_v2.js` | Question DNA (djb2) |
| `qa.ts` | `qa/visual_qa_english.js` | 6 checks + pipeline |
| `master-generator.ts` | `generator/master_generator_english.js` | Orchestrator GĐ 1-12 |
| `export-xlsx.ts` | (mới) | Map câu đã sinh → Excel 12 cột (khớp `lib/bulk-import.ts`) |

Không port: render/layout, audio playback (audio_core/web/mobile), variation_engine (không dùng
trong pipeline), claude_wording (toggle off mặc định — 0 token).

## Parity (đảm bảo chất lượng = bản vanilla)

`lib/eng-gen/__tests__/parity.test.ts` nạp engine vanilla gốc (qua `node:vm` window-shim trong
`load-vanilla.ts`) và so khớp 1:1 với bản TS ở các building-block xác định (cùng seed):
`expandEnglishTemplate`, `applyEnglishDifficultyConstraints`, `pickEnglishDistractors`,
`generateEnglishQuestionHash`, `computeQuestionDNA`, `runEnglishVisualQA`.

```bash
npm test          # vitest run — phải PASS toàn bộ (hiện 313/313)
```

> Test cần truy cập repo `STUDYVUI` cạnh `admin-cms` (mặc định `../STUDYVUI`). Đổi qua env
> `STUDYVUI_ENGINE_DIR` nếu đặt nơi khác.

## Dùng trong UI

`app/(dashboard)/ai-generate/page.tsx`:
```ts
const { questions, report } = await generateEnglishQuestionsWithProgress(
  { grade, week, skill, blueprintType, count, difficultyRange, options: { seed: Date.now() } },
  (cur, total) => setProgress(...)
);
// chọn câu → toBulkRows(selected, { grade, week, startSeq }) → downloadBulkXlsx(rows, name)
```

## Lưu ý
- Loại xuất Excel 12 cột: `image_choice`, `audio_choice`, `missing_letter` (4 đáp án, 1 đúng).
  `reorder/match_word/true_false` chưa khớp định dạng bulk → bỏ qua khi export.
- Asset (ảnh/audio) chỉ là **đường dẫn quy ước** — file phải tồn tại thật trong R2/CDN.
- Khi sửa thuật toán: cập nhật cả bản vanilla (nếu còn dùng) lẫn bản TS, rồi chạy lại parity test.
