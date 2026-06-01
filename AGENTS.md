# StudyVui Admin CMS — Agent Context

> File này dành cho AI agent (Antigravity Gemini / Claude / Cursor) tự đọc khi mở repo.
> Copy vào root repo `studyvui/admin-cms` để agent load tự động.

## Stack

**Next.js 14 App Router** + **TypeScript strict** + **Tailwind CSS** + **shadcn/ui** (manual config, KHÔNG dùng CLI).

| Layer | Library |
|-------|---------|
| Data fetching | TanStack Query v5 |
| State client | Zustand (persisted localStorage) |
| Forms | react-hook-form + zod v4 |
| HTTP | axios với JWT auto-refresh single-flight interceptor |
| Excel | SheetJS (xlsx) |
| Asset upload | @aws-sdk/client-s3 (R2 backend) |
| Tables | Plain HTML table (chưa dùng TanStack Table) |

## Production

- URL chính: https://admin.studyvui.vn (Vercel + Cloudflare DNS CNAME)
- URL phụ: https://admin-cms-cyan.vercel.app
- Backend API: https://api.studyvui.vn/api/v1
- Repo: **PUBLIC** trên GitHub (`studyvui/admin-cms`)

## Cấu trúc

```
app/
├── (auth)/login/page.tsx       # Public login
├── (dashboard)/
│   ├── layout.tsx              # Sidebar + topbar + auth gate
│   ├── page.tsx                # Dashboard role-aware
│   ├── courses/page.tsx        # admin-only CRUD
│   ├── lessons/page.tsx        # admin-only CRUD (editor ẩn nút)
│   ├── questions/page.tsx      # CRUD + dual-mode editor (MC + JSON raw)
│   ├── assets/page.tsx         # Drag-drop R2 upload
│   ├── bulk-import/page.tsx    # Excel 12-col bulk import
│   ├── qa/queue/page.tsx       # QA approve/reject
│   ├── qa/audit/page.tsx       # Audit log diff viewer
│   ├── my-stats/page.tsx       # Editor productivity report
│   └── ai-generate/page.tsx    # Disabled UI shell (chờ GD10)
├── not-found.tsx               # 404 custom
└── layout.tsx                  # Root layout
components/
├── ui/                          # shadcn primitives (button, input, dialog, ...)
├── asset-picker/                # ImagePicker + AudioPicker dialog
└── shared/                      # sidebar-nav, topbar, status-badge
lib/
├── api-client.ts                # axios + JWT auto-refresh
├── api/                         # Typed API clients (courses, lessons, questions, assets, qa)
├── stores/auth-store.ts         # Zustand persisted
├── bulk-import.ts               # Excel parser + zod validation
├── types.ts                     # Match Prisma DTOs
└── errors.ts                    # extractError() helper
middleware.ts                    # Cookie-based route protection
hooks/use-auth.ts                # { user, hasRole, logout, hydrated }
```

## Auth flow

1. Login form → POST `/auth/login` → nhận `{ accessToken, refreshToken, user }`
2. Lưu vào Zustand store (auto-persist localStorage key `sv-admin-auth`)
3. Set cookie `sv-admin-session=1` để middleware biết user đã login
4. axios interceptor auto gắn `Authorization: Bearer <accessToken>`
5. Token expire → interceptor tự gọi `/auth/refresh`, single-flight (chỉ 1 refresh dù 10 request fail cùng lúc)
6. Refresh fail → logout + redirect `/login`

## Permission pattern (dùng nhất quán)

```tsx
const { hasRole, hydrated } = useAuth();
const canWrite = hasRole("admin", "editor");
const canChangeStatus = hasRole("admin", "qa", "editor");
const canDelete = hasRole("admin");
const isEditor = hasRole("editor") && !hasRole("admin");

// Status-based gating cho Question (editor chỉ sửa khi draft/review)
const canEditQuestion = (q: Question) =>
  canWrite && (!isEditor || q.status === "draft" || q.status === "review");

// Render conditionally
{canWrite && <Button>Sửa</Button>}
{canDelete && <Button variant="destructive">Xoá</Button>}
```

**Defense-in-depth**: UI ẩn nút + backend cũng enforce `@Roles()`. KHÔNG dựa duy nhất vào UI hide.

## Status workflow gating

| Status | Editor sửa? | Editor change status? |
|--------|------------|----------------------|
| `draft` | ✅ | → `review` |
| `review` | ✅ | → `draft` (pull back) |
| `approved` | ❌ 403 | ❌ |
| `published` | ❌ 403 | ❌ |
| `deprecated` | ❌ 403 | ❌ |

Backend service-level check, frontend dùng `canEditQuestion(q)` helper.

## Common patterns

### TanStack Query

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["lessons", { courseId, status }],
  queryFn: () => lessonsApi.list({ courseId, status }),
  enabled: !!courseId,  // Conditional fetching
});

const mutation = useMutation({
  mutationFn: (input) => lessonsApi.create(input),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lessons"] }),
  onError: (err) => alert(extractError(err)),
});
```

### Form với react-hook-form + zod

```typescript
const schema = z.object({
  code: z.string().min(3).regex(/^[A-Z0-9_]+$/),
  difficulty: z.number().int().min(1).max(5),
});
const form = useForm({ resolver: zodResolver(schema) });
// Lưu ý: input number register với { valueAsNumber: true }
<Input {...form.register("difficulty", { valueAsNumber: true })} type="number" />
```

### Select với sentinel (Radix không cho value="")

```typescript
const ALL = "__all__";
<Select value={filter} onValueChange={setFilter}>
  <SelectItem value={ALL}>Tất cả</SelectItem>
  <SelectItem value="published">Xuất bản</SelectItem>
</Select>
// Khi query: pass filter !== ALL ? filter : undefined
```

## Pattern KHÔNG được dùng (đã gặp bug)

| ❌ | ✅ |
|----|----|
| `value=""` trong Radix Select | Dùng sentinel `__all__` |
| `searchParams.get("x")` không có optional chaining | `searchParams?.get("x") ?? ""` |
| `usePathname()` thẳng tay | `usePathname() ?? "/"` |
| Editor được tạo/sửa Lesson | Chỉ admin (đã tighten 2026-05-29) |
| `Question.authorId` field | KHÔNG có trong schema, dùng `audit_logs.action='create'` JOIN |
| Cast UUID = TEXT thẳng PostgreSQL | Cast `q.id::text` trong SQL raw query |

## TypeScript strict notes

- Next.js types coi `searchParams` nullable trong server context — phải optional chaining
- Strict null check pass local nhưng có thể fail trên Vercel/CF build → optional chaining luôn
- Avoid `as any` trừ khi thật cần (vd workaround Prisma XOR type)

## Deploy

- Push `main` → Vercel auto deploy https://admin.studyvui.vn (~2 phút)
- Push `dev` → Vercel preview URL
- Build command: `npm run build` (Next.js)
- Output: `.next/`
- Region: Vercel Edge Network (Singapore PoP gần nhất)

## ENV vars

| Var | Required | Mô tả |
|-----|---------|-------|
| `NEXT_PUBLIC_API_URL` | ✅ | `https://api.studyvui.vn/api/v1` (prod) hoặc `http://localhost:3001/api/v1` (local) |

KHÔNG có secret nào trong env (JWT secret ở backend, repo public OK).

## CORS

Backend phải cho phép origin của admin CMS. Hiện trong `CORS_ORIGINS` Railway:
```
https://admin.studyvui.vn
https://admin-cms-cyan.vercel.app
https://admin-cms-hoangnguyenngockhanh-s-projects.vercel.app
http://localhost:3000
```

Khi thêm preview URL mới → phải update env Railway.

## Tài liệu chi tiết

Trong repo gốc `studyvui/frontend`:
- `PLAN/BACKEND/ke_hoach_admin_cms_nextjs.html` — kế hoạch 8 phases + post-Phase 8 enhancements + bảng lỗi đã gặp
- `PLAN/setup_may_moi.html` — setup máy mới + workflow git đa máy
- `README/PLAN.md` — Buoc 9 GD6 (source-of-truth)

## Tài khoản demo production

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@studyvui.vn` | `admin123456` |
| Editor | `editor@studyvui.vn` | `demo1234` |

⚠️ Đổi password `demo1234` trước khi giao tài khoản editor cho nhân viên thật.
