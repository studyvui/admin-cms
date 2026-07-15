# lib/eng-gen — Bộ sinh đề Tiếng Anh

Đây là **nơi DUY NHẤT** sinh đề Tiếng Anh sau khi `admin_english.html` bị khai tử (2026-06-03).

Đề được sinh từ **từ vựng của chính bài học** (`lesson.vocabulary` lấy qua API: `word` + `meaning` +
`imageUrl` + `audioUrl`), nhiễu lấy từ từ vựng các bài khác trong cùng khoá.

> **Lịch sử (2026-07-15):** bộ sinh đề theo **registry template** (port từ `STUDYVUI/engine/english/*`
> vanilla, hệ GD14 — `master-generator` / `templates` / `expander` / `difficulty` / `distractor` /
> `dedup` / `qa` / `vocab-data`) đã bị **XOÁ** vì không dùng tới, gây nhầm lẫn với đường sinh đề thật.
> Parity test đối chiếu với vanilla cũng xoá theo (không còn gì để đối chiếu). Bản vanilla
> `STUDYVUI/engine/english/*` vẫn giữ nguyên — student `index.html` có thể còn dùng.

## Module

| File | Vai trò |
|------|---------|
| `types.ts` | Kiểu dữ liệu (`GeneratedQuestion`, `GenReport`, `Skill`, `BlueprintType`…) |
| `page-generators.ts` | **Sinh đề** từ từ vựng bài học — 3 dạng: `image_choice`, `audio_choice`, `missing_letter` |
| `to-question.ts` | `GeneratedQuestion` → `Question` (để tái dùng `QuestionPreviewModal`) |
| `export-xlsx.ts` | Map câu đã sinh → Excel 12 cột (khớp `lib/bulk-import.ts`) |
| `rng.ts` | Seeded RNG (dùng để xáo trộn đáp án ổn định theo mã câu khi xuất Excel) |

## 3 dạng bài (khớp `INPUT_MODES` của `/ai-generate`)

| Chế độ UI | `blueprintType` | Đề bài | 4 lựa chọn | Nhiễu lấy từ |
|---|---|---|---|---|
| Ảnh rồi chọn từ | `image_choice` | "Nhìn hình và chọn nghĩa đúng" | nghĩa tiếng Việt | nghĩa của từ khác |
| Nghe rồi chọn ảnh | `audio_choice` | "Nghe và chọn hình đúng" | ảnh (label = tên file) | ảnh của từ khác |
| Điền chữ còn thiếu | `missing_letter` | "Điền chữ còn thiếu" + pattern (vd `c_t`) | thẻ chữ cái | 26 chữ cái trừ đáp án |

- `missing_letter`: che **1 chữ nếu từ ≤ 2 ký tự, ngược lại che 2 chữ liền nhau** tại vị trí ngẫu nhiên;
  `correct_answer` là chuỗi các chữ bị che. Số thẻ nhiễu = `max(2, 4 - hideCount)` → tổng luôn 4 thẻ.
- Ảnh ghép theo **quy ước tên file**: `pickRandomImage` khớp asset bắt đầu bằng `{word}_` hoặc `{word}.`,
  fallback về `imageUrl` của từ vựng. Không đủ 3 nhiễu có ảnh → bỏ câu, cộng `report.qa_failed`.
- Dùng `Math.random` (KHÔNG seeded) → test assert số lượng/cấu trúc, không assert nội dung.

> Quy ước vận hành (`README/CLAUDE.md`): mỗi bài từ vựng thường = 12 câu, chia đều **4-4-4** cho ba dạng.
> Đây là quy ước **con người tự chạy 3 lần** — code KHÔNG ép ràng buộc này.

## Xuất Excel 12 cột

`toBulkRows()` chỉ nhận `image_choice`, `audio_choice`, `missing_letter`, `multiple_choice`, `reorder`;
loại khác bị bỏ và ghi lý do vào `skipped`.

- Loại 4 đáp án: xáo trộn **ổn định** theo seed `djb2(lessonCode_seq)` để đáp án đúng không luôn ở A.
- `reorder`: quy ước riêng — `optionA` = cả câu đúng, B/C/D rỗng, `correct = "A"` (khớp `refine` trong
  `lib/bulk-import.ts`). **Lưu ý:** hiện KHÔNG có bộ sinh nào tạo ra câu `reorder` — nhánh này giữ cho
  câu nhập tay / dùng sau.

## Dùng trong UI

`app/(dashboard)/ai-generate/page.tsx`:
```ts
const { questions, report } = generateImageChoiceFromVocab(imgAssets, {
  selectedLesson, allLessons: lessons, count, startSeq, grade, week, skill, dMin,
});
// chọn câu → toBulkRows(selected, { grade, week, startSeq }) → downloadBulkXlsx(rows, name)
```

## Test

```bash
npm test          # vitest run
```
Không cần truy cập repo `STUDYVUI` nữa (parity test đã xoá).

## Lưu ý
- Asset (ảnh/audio) chỉ là **key CDN** — file phải tồn tại thật trong R2/CDN.
