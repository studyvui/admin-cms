# StudyVui Admin CMS

Next.js 14 admin interface for the StudyVui learning platform. Talks to the
NestJS backend at `https://api.studyvui.vn` (or local Docker on
`http://localhost:3001`).

## Stack

- Next.js 14 App Router + TypeScript strict
- Tailwind CSS + shadcn/ui (Radix primitives)
- TanStack Query · Zustand · react-hook-form + zod · axios

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit NEXT_PUBLIC_API_URL if not using prod
npm run dev
```

Open http://localhost:3000 — the middleware redirects to `/login`.

## Demo accounts

After running backend `npx prisma db seed`:

| Email                  | Password      | Role     |
| ---------------------- | ------------- | -------- |
| `admin@studyvui.vn`    | `admin123456` | `admin`  |
| `editor@studyvui.vn`   | `demo1234`    | `editor` |

Only roles `admin`, `editor`, `qa` are allowed past the login screen.

## Folder layout (Phase 1)

```
app/
  (auth)/login/page.tsx
  (dashboard)/
    layout.tsx
    page.tsx
  layout.tsx
  providers.tsx
  globals.css
components/
  ui/                          # shadcn primitives
  shared/sidebar-nav.tsx
  shared/topbar.tsx
  permission-guard.tsx
hooks/
  use-auth.ts
lib/
  api-client.ts                # axios + JWT refresh interceptor
  api/auth.ts
  stores/auth-store.ts         # Zustand + localStorage persist
  session-cookie.ts            # middleware presence flag
  types.ts                     # TS types aligned with Prisma
  utils.ts
middleware.ts                  # cookie-based public/private routing
```

## Phases

Tracked in `PLAN/BACKEND/ke_hoach_admin_cms_nextjs.html` in the main repo:

- [x] Phase 0 — Backend `editor` role
- [x] Phase 1 — Bootstrap, auth, layout
- [ ] Phase 2 — Core CRUD (Courses · Lessons · Questions)
- [ ] Phase 3 — Asset Picker (R2)
- [ ] Phase 4 — Bulk Excel import
- [ ] Phase 5 — QA workflow + audit log
- [ ] Phase 6 — Dashboard reports
- [ ] Phase 7 — AI Generate UI shell (disabled)
- [ ] Phase 8 — Deploy Vercel + E2E
