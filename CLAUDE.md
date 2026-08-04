# StudyVui Admin CMS — Hướng dẫn cho Claude Code

> Next.js 14 App Router · TS strict · Tailwind/shadcn(Radix) · TanStack Query · Zustand · RHF+zod · axios(JWT).
> Backend NestJS `https://api.studyvui.vn/api/v1`. Deploy Vercel (`admin.studyvui.vn`) khi push `main`.

## ⚠️ ĐỌC TRƯỚC KHI VIẾT CODE

**`AGENTS.md`** là nguồn chân lý đầy đủ (cấu trúc chuẩn, quy ước test, auth flow, phân quyền, anti-pattern).
Trang **`app/(dashboard)/questions/`** là **KHUÔN MẪU** — copy cấu trúc, không phát minh lại.

## Cấu trúc chuẩn MỌI trang phức tạp (BẮT BUỘC)

```
app/(dashboard)/<page>/
  page.tsx            # CHỈ orchestration (list/filter/state mở dialog/render data). KHÔNG logic nghiệp vụ.
  use-<page>.ts       # data hook (query + mutation), per-entity, KHÔNG generic. Mutation chỉ invalidate;
                      #   side-effect UI (đóng dialog) ở per-call `.mutate(x, { onSuccess })`.
  <thing>.tsx         # dialog/modal/sub-component lớn tách riêng.
lib/<page>/
  *.ts + __tests__/   # logic THUẦN (schema/transform/validate/helper) — JSX chỉ render data. CÓ test (vitest).
components/           # field/component DÙNG CHUNG nhiều trang.
```

**Quy tắc:** (1) logic tính toán/transform/validate → `lib/` + test; (2) file ≤ ~500 dòng, 1 file = 1 việc;
(3) hook/field khác bản chất KHÔNG gộp (tránh trừu tượng sai); (4) icon-button phải có `title`/`aria-label`.

## Test — 2 tầng (BẮT BUỘC giữ xanh)

- **Logic thuần** → `vitest` (env node, `lib/**/*.test.ts`) — `npm test`.
- **Luồng UI** → **Playwright** (`e2e/`, trình duyệt thật + giả lập network) — `npm run test:e2e`.
  Helper: `e2e/helpers/auth.ts` (`loginAs` bypass login) + `e2e/helpers/mock-api.ts` (`ApiMock`: mock
  `**/api/v1/**`, capture payload). **KHÔNG gọi backend thật / ghi prod.** Mẫu: `e2e/questions.spec.ts`.
- Mỗi lần sửa 1 trang: viết/giữ `e2e/<page>.spec.ts` **xanh trước & sau** = bằng chứng không đổi hành vi.
- **KHÔNG dùng jsdom** (flaky với Radix portal) — UI test = Playwright.

## Cổng đầy đủ TRƯỚC KHI COMMIT

`npm test` · `npx tsc --noEmit` · `npm run build` · `npx eslint .` · `npm run test:e2e` — TẤT CẢ phải xanh.
(Next 16 đã gỡ `next lint`, dùng ESLint flat config `eslint.config.mjs`; build không còn kèm lint.)
> Chạy e2e: tắt `npm run dev` đang chạy (nếu có) để Playwright tự khởi động server.

## Deploy

- `dev` = nhánh làm việc (commit/push thoải mái → Vercel preview).
- `main` = production: merge `dev`→`main` → push → Vercel deploy `admin.studyvui.vn`.
- **CHỈ deploy `main` khi người dùng test OK + ra lệnh rõ ràng.** Mọi thao tác production cần xác nhận trước.

## Tài liệu

`AGENTS.md` (chi tiết) · `lib/eng-gen/README.md` + `lib/math-gen/README.md` (bộ sinh đề) ·
`STUDYVUI/README/CAU_TRUC_ADMIN_CMS.md` (bàn giao tổng quan).
