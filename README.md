# StudyVui Admin CMS

Next.js 14 admin interface for the StudyVui learning platform. Talks to the
NestJS backend at `https://api.studyvui.vn` (or local Docker on
`http://localhost:3001`).

> Cập nhật README: 2026-06-26 — 8 phases gốc đã xong + bổ sung AI sinh đề (Tiếng Anh & Toán).

## Stack

- Next.js 14 App Router + TypeScript strict
- Tailwind CSS + shadcn/ui (Radix primitives) + lucide-react
- TanStack Query v5 · Zustand v5 (persist) · react-hook-form + zod v4 · axios (JWT auto-refresh)
- SheetJS (`xlsx`) cho import/export Excel · recharts cho biểu đồ dashboard
- vitest cho test (parity eng-gen + unit math-gen)

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit NEXT_PUBLIC_API_URL if not using prod
npm run dev      # http://localhost:3000 — middleware redirect /login
npm test         # vitest run — hiện 335/335 PASS
```

## Demo accounts

After running backend `npx prisma db seed`:

| Email                  | Password      | Role     |
| ---------------------- | ------------- | -------- |
| `admin@studyvui.vn`    | `admin123456` | `admin`  |
| `editor@studyvui.vn`   | `demo1234`    | `editor` |

Only roles `admin`, `editor`, `qa` are allowed past the login screen.

## Folder layout

```
app/
  (auth)/login/page.tsx
  (dashboard)/
    layout.tsx                 # sidebar + topbar + auth gate
    page.tsx                   # dashboard role-aware (recharts)
    courses/page.tsx           # admin-only CRUD
    lessons/page.tsx           # CRUD bài học (editor ẩn nút) — mã G1_W01_ENG_1
    questions/page.tsx         # CRUD + dual-mode editor (MC/JSON) + mode letter/image/audio
    assets/page.tsx            # upload R2 (qua backend API)
    bulk-import/page.tsx       # import Excel 12 cột
    qa/queue/page.tsx          # QA approve/reject
    qa/audit/page.tsx          # audit log diff viewer
    my-stats/page.tsx          # năng suất editor theo ngày
    ai-generate/page.tsx       # Sinh đề Tiếng Anh (lib/eng-gen)
    ai-generate-math/page.tsx  # Sinh đề Toán (lib/math-gen)
  layout.tsx                   # root layout
components/
  ui/                          # shadcn primitives
  shared/                      # sidebar-nav, topbar, status-badge
  asset-picker/                # image-picker + audio-picker dialog
  math-template/               # template-editor-modal (ngân hàng mẫu Toán)
  question-preview/            # question-preview-modal + math-preview-edit-modal
  permission-guard.tsx
hooks/use-auth.ts              # { user, hasRole, logout, hydrated }
lib/
  api-client.ts                # axios + JWT refresh interceptor
  api/                         # auth, courses, lessons, questions, assets, qa, question-templates
  stores/auth-store.ts         # Zustand + localStorage persist (key sv-admin-auth)
  session-cookie.ts            # middleware presence flag
  bulk-import.ts               # Excel 12-col parser + zod validation
  eng-gen/                     # Bộ sinh đề Tiếng Anh (TS port, seeded, parity test)
  math-gen/                    # Bộ sinh đề Toán ("ngân hàng mẫu", template + biến + formula)
  types.ts · utils.ts · errors.ts
middleware.ts                  # cookie-based public/private routing
```

## Bộ sinh đề (AI generate — 0 token)

| Thư mục | Môn | Mô hình | Đảm bảo chất lượng |
|---------|-----|---------|--------------------|
| `lib/eng-gen/*` | Tiếng Anh | Port từ `STUDYVUI/engine/english/*` sang TS, **seeded** (mulberry32) | **Parity test 313/313** so 1:1 với engine vanilla |
| `lib/math-gen/*` | Toán | "Ngân hàng mẫu": template + biến (number/text) + formula, **không seeded** | Unit test (`evaluate.test.ts`) |

Cả hai export ra **Excel 12 cột** (khớp `lib/bulk-import.ts`) → Bulk Import → QA publish.
Chi tiết: `lib/eng-gen/README.md` và `lib/math-gen/README.md`.

## Phases (tất cả đã hoàn thành — deploy Vercel 2026-05-29)

Tracked in `PLAN/BACKEND/ke_hoach_admin_cms_nextjs.html` in the main repo:

- [x] Phase 0 — Backend `editor` role
- [x] Phase 1 — Bootstrap, auth, layout
- [x] Phase 2 — Core CRUD (Courses · Lessons · Questions)
- [x] Phase 3 — Asset Picker (R2)
- [x] Phase 4 — Bulk Excel import
- [x] Phase 5 — QA workflow + audit log
- [x] Phase 6 — Dashboard reports
- [x] Phase 7 — AI Generate UI shell → **đã nâng thành tính năng thật** (eng-gen + math-gen)
- [x] Phase 8 — Deploy Vercel + E2E
- [x] Post-Phase 8 — phân quyền editor tighten + /my-stats + AI Sinh đề Tiếng Anh & Toán (2026-06-03+)

## Deploy

- Push `main` → Vercel auto deploy https://admin.studyvui.vn (~2 phút)
- Push `dev` → Vercel preview URL
- ENV: chỉ `NEXT_PUBLIC_API_URL` (không có secret — repo public OK)
