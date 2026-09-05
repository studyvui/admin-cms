# Giai đoạn 3 admin-cms — Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm trang `/analytics` (admin-only) hiển thị DAU/WAU/MAU, biểu đồ học viên hoạt động theo
ngày, phút làm bài ước tính/học viên/tuần, phân bố giờ hoạt động, phân bố theo môn, và bảng bài học
sai nhiều nhất — đọc từ 6 endpoint `GET /admin/analytics/*` đã có ở backend Giai đoạn 3.

**Architecture:** 1 trang Next.js theo đúng khuôn `app/(dashboard)/users/*` (page.tsx mỏng +
use-analytics.ts data layer + component con), dùng `recharts` (đã cài, chưa dùng ở đâu — lần dùng
thật đầu tiên) cho 4 biểu đồ, mỗi biểu đồ có `<details>` chứa `<table>` cùng dữ liệu để Playwright
assert (không bao giờ assert trên SVG) và làm khả năng tiếp cận.

**Tech Stack:** Next.js 16, TanStack Query, recharts ^3.8.1, react-hook-form không cần (trang chỉ
đọc, không có form), Vitest, Playwright.

**Spec:** `C:\Users\FPT\.claude\plans\h-y-l-n-ke-hoach-lively-lollipop.md` (mục "GIAI ĐOẠN 3 — Báo cáo
phân tích khách hàng"), đã người dùng duyệt qua ExitPlanMode. Backend tương ứng:
`STUDYVUI/backend/docs/superpowers/plans/2026-09-04-cms-stage3-analytics-backend.md`.

## Global Constraints

- Trang `/analytics` **admin-only** (`hasRole("admin")`) — dù backend cho phép `qa` gọi
  `problem-lessons`/`problem-questions`, trang tổng hợp này đọc cả các endpoint admin-only khác
  (`overview`, `active-learners`, ...) nên gate cả trang theo class-level role của backend (`admin`),
  giống hệt cách `/users` đang làm. `problem-questions` KHÔNG hiển thị ở trang này (không có trong
  danh sách file được duyệt) — chỉ `problem-lessons`.
- **Mỗi wrapper chart phải có chiều cao cố định `h-[280px]`** — `<ResponsiveContainer>` đo cha, cha
  không có chiều cao cố định sẽ co về 0 trong headless Chromium và chart không render gì.
- **Mỗi chart kèm 1 `<table>` cùng dữ liệu** trong `<details>` "Xem số liệu" — selector ổn định duy
  nhất cho Playwright, KHÔNG BAO GIỜ assert trên path SVG.
- **Nhãn phải trung thực**: `weekly-minutes-chart.tsx` phải hiển thị nguyên văn dòng chú thích
  "Phút làm bài / học viên / tuần (ước tính từ thời gian trả lời)" — KHÔNG gọi là "thời gian dùng
  app" (client tự báo cáo, không tính thời gian đọc lý thuyết/menu/audio, có thể bị giả mạo).
- Nếu `npm run build` vướng lỗi SSR do recharts, bọc bằng `next/dynamic(..., { ssr: false })` — kiểm
  tra ở Task 5 sau khi viết xong component đầu tiên, trước khi nhân bản sang 3 component còn lại.
- Field response từ backend đã là camelCase sẵn (NestJS trả thẳng object JS, không qua
  class-transformer) — KHÔNG cần map lại tên field giữa BE/FE.
- `ApiMock.onGet` trong e2e không thấy được query string khi match path (chỉ match `pathname`) —
  dùng dạng `GetResponder = (url: URL) => unknown` (đọc `url.searchParams`) khi test cần fixture khác
  nhau theo tham số `days`, theo đúng tiền lệ `users.spec.ts` (test "khoá tài khoản → 4 thẻ thống kê
  refetch").

---

### Task 1: `lib/types.ts` — kiểu response cho 6 endpoint analytics

**Files:**
- Modify: `lib/types.ts` (thêm vào cuối file)

**Interfaces:**
- Produces: `AnalyticsOverview, ActiveLearnerPoint, WeeklyMinutesPoint, HourHistogramPoint,
  SubjectSplitItem, ProblemLessonItem` — dùng bởi Task 2 (api), Task 4 (hooks), Task 5/6 (component).
- Consumes: `Subject` (đã có sẵn trong file, dòng 105: `export type Subject = "english" | "math";`).

- [ ] **Step 1: Thêm vào cuối `lib/types.ts`**

```typescript
// Báo cáo phân tích khách hàng (GĐ3) — đọc từ GET /admin/analytics/*. Field camelCase khớp thẳng
// với response backend (AdminAnalyticsService trả object JS thường, không qua class-transformer).

export interface AnalyticsOverview {
  dau: number;
  wau: number;
  mau: number;
  answersLast30Days: number;
  accuracyLast30Days: number;
}

export interface ActiveLearnerPoint {
  day: string;
  learners: number;
}

export interface WeeklyMinutesPoint {
  weekStart: string;
  label: string;
  learners: number;
  avgMinutesPerLearner: number;
}

export interface HourHistogramPoint {
  hour: number;
  answers: number;
}

export interface SubjectSplitItem {
  subject: Subject;
  answers: number;
  correct: number;
  accuracy: number;
  learners: number;
}

export interface ProblemLessonItem {
  id: string;
  code: string;
  name: string;
  subject: Subject;
  grade: number;
  attempts: number;
  wrong: number;
  learners: number;
  wrongRate: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat(analytics): them kieu response cho 6 endpoint /admin/analytics"
```

---

### Task 2: `lib/api/analytics.ts`

**Files:**
- Create: `lib/api/analytics.ts`

**Interfaces:**
- Consumes: `apiGet` (`lib/api-client.ts`); 6 interface từ Task 1.
- Produces: `analyticsApi.{overview, activeLearners, weeklyMinutes, hourHistogram, subjectSplit,
  problemLessons}` — Task 4 (use-analytics.ts) gọi thẳng các hàm này.

- [ ] **Step 1: Viết file**

```typescript
import { apiGet } from "@/lib/api-client";
import type {
  AnalyticsOverview,
  ActiveLearnerPoint,
  WeeklyMinutesPoint,
  HourHistogramPoint,
  SubjectSplitItem,
  ProblemLessonItem,
} from "@/lib/types";

// API báo cáo phân tích khách hàng (GĐ3) — 6 endpoint đọc từ /admin/analytics/*, tất cả admin-only
// (backend @Roles(admin) ở class level admin-analytics.controller.ts).
export const analyticsApi = {
  overview: () => apiGet<AnalyticsOverview>("/admin/analytics/overview"),
  activeLearners: (days: number) =>
    apiGet<ActiveLearnerPoint[]>("/admin/analytics/active-learners", {
      params: { days },
    }),
  weeklyMinutes: (weeks: number) =>
    apiGet<WeeklyMinutesPoint[]>("/admin/analytics/weekly-minutes", {
      params: { weeks },
    }),
  hourHistogram: (days: number) =>
    apiGet<HourHistogramPoint[]>("/admin/analytics/hour-histogram", {
      params: { days },
    }),
  subjectSplit: (days: number) =>
    apiGet<SubjectSplitItem[]>("/admin/analytics/subject-split", {
      params: { days },
    }),
  problemLessons: () =>
    apiGet<ProblemLessonItem[]>("/admin/analytics/problem-lessons"),
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/api/analytics.ts
git commit -m "feat(analytics): them analyticsApi cho 6 endpoint /admin/analytics"
```

---

### Task 3: `lib/analytics/{analytics-format.ts,labels.ts}` — hàm thuần format + nhãn

**Files:**
- Create: `lib/analytics/analytics-format.ts`
- Create: `lib/analytics/labels.ts`
- Test: `lib/analytics/__tests__/analytics-format.test.ts`

**Interfaces:**
- Consumes: `Subject` (`lib/types.ts`).
- Produces: `formatPercent(ratio): string`, `formatHourLabel(hour): string`,
  `formatNumberVn(n): string`; `SUBJECT_LABELS: Record<Subject,string>`,
  `MINUTES_DISCLAIMER: string` — dùng bởi Task 5/6 (component chart/table).

- [ ] **Step 1: Viết test trước**

```typescript
import { describe, it, expect } from "vitest";
import { formatPercent, formatHourLabel, formatNumberVn } from "@/lib/analytics/analytics-format";

describe("formatPercent", () => {
  it("0.756 -> '75.6%'", () => {
    expect(formatPercent(0.756)).toBe("75.6%");
  });

  it("0 -> '0.0%'", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("1 -> '100.0%'", () => {
    expect(formatPercent(1)).toBe("100.0%");
  });
});

describe("formatHourLabel", () => {
  it("8 -> '08:00'", () => {
    expect(formatHourLabel(8)).toBe("08:00");
  });

  it("0 -> '00:00'", () => {
    expect(formatHourLabel(0)).toBe("00:00");
  });

  it("23 -> '23:00'", () => {
    expect(formatHourLabel(23)).toBe("23:00");
  });
});

describe("formatNumberVn", () => {
  it("định dạng số nguyên với dấu phân cách nghìn kiểu Việt Nam", () => {
    expect(formatNumberVn(12345)).toBe("12.345");
  });

  it("số nhỏ hơn 1000 giữ nguyên", () => {
    expect(formatNumberVn(42)).toBe("42");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npm test -- analytics-format.test.ts`
Expected: FAIL — module chưa tồn tại

- [ ] **Step 3: Viết `lib/analytics/analytics-format.ts`**

```typescript
// Hàm thuần format số liệu cho trang Báo cáo phân tích (GĐ3). Không phụ thuộc React, test độc lập.

/** Tỉ lệ 0-1 -> chuỗi phần trăm 1 chữ số thập phân, vd 0.756 -> "75.6%". */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** Giờ trong ngày (0-23) -> nhãn 2 chữ số, vd 8 -> "08:00". */
export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** Số nguyên -> chuỗi có dấu phân cách nghìn kiểu Việt Nam (dấu chấm), vd 12345 -> "12.345". */
export function formatNumberVn(n: number): string {
  return n.toLocaleString("vi-VN");
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npm test -- analytics-format.test.ts`
Expected: PASS, 8 test

- [ ] **Step 5: Viết `lib/analytics/labels.ts` (không cần TDD — nhãn tĩnh)**

```typescript
import type { Subject } from "@/lib/types";

export const SUBJECT_LABELS: Record<Subject, string> = {
  english: "Tiếng Anh",
  math: "Toán",
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  english: "#2563eb",
  math: "#16a34a",
};

// Nhãn BẮT BUỘC nguyên văn cho weekly-minutes-chart.tsx (xem Global Constraints của kế hoạch) —
// time_spent_ms là thời gian TRONG câu hỏi do client tự báo cáo, không tính thời gian đọc lý
// thuyết/menu/audio và có thể bị giả mạo. KHÔNG được rút gọn thành "thời gian dùng app".
export const MINUTES_DISCLAIMER =
  "Phút làm bài / học viên / tuần (ước tính từ thời gian trả lời, không phải tổng thời gian dùng app)";

export const TIME_RANGE_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: "7 ngày qua" },
  { value: 30, label: "30 ngày qua" },
  { value: 90, label: "90 ngày qua" },
];
```

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/analytics-format.ts lib/analytics/labels.ts lib/analytics/__tests__/analytics-format.test.ts
git commit -m "feat(analytics): them ham thuan format + nhan cho trang Bao cao phan tich"
```

---

### Task 4: `app/(dashboard)/analytics/use-analytics.ts`

**Files:**
- Create: `app/(dashboard)/analytics/use-analytics.ts`

**Interfaces:**
- Consumes: `analyticsApi` (Task 2).
- Produces: `useAnalyticsOverview()`, `useActiveLearners(days)`, `useWeeklyMinutes(weeks)`,
  `useHourHistogram(days)`, `useSubjectSplit(days)`, `useProblemLessons()` — mỗi hàm trả
  `{data, isLoading, error}` (nguyên object `useQuery` trả về, component tự destructure) — Task 6
  (page.tsx) gọi các hook này.

- [ ] **Step 1: Viết file**

```typescript
"use client";

// Data layer cho trang Báo cáo phân tích (GĐ3) — 6 hook, mỗi hook 1 useQuery ứng với 1 endpoint
// /admin/analytics/*. Không có mutation (trang chỉ đọc). staleTime khớp TTL cache phía backend
// (cache.service.ts) — tránh gọi lại API khi dữ liệu backend chắc chắn chưa đổi.

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["admin-analytics", "overview"],
    queryFn: analyticsApi.overview,
    staleTime: 5 * 60 * 1000, // 300s, khớp TTL cache overview ở backend
  });
}

export function useActiveLearners(days: number) {
  return useQuery({
    queryKey: ["admin-analytics", "active-learners", days],
    queryFn: () => analyticsApi.activeLearners(days),
    staleTime: 15 * 60 * 1000, // 900s
  });
}

export function useWeeklyMinutes(weeks: number) {
  return useQuery({
    queryKey: ["admin-analytics", "weekly-minutes", weeks],
    queryFn: () => analyticsApi.weeklyMinutes(weeks),
    staleTime: 60 * 60 * 1000, // 3600s
  });
}

export function useHourHistogram(days: number) {
  return useQuery({
    queryKey: ["admin-analytics", "hour-histogram", days],
    queryFn: () => analyticsApi.hourHistogram(days),
    staleTime: 60 * 60 * 1000, // 3600s
  });
}

export function useSubjectSplit(days: number) {
  return useQuery({
    queryKey: ["admin-analytics", "subject-split", days],
    queryFn: () => analyticsApi.subjectSplit(days),
    staleTime: 15 * 60 * 1000, // 900s
  });
}

export function useProblemLessons() {
  return useQuery({
    queryKey: ["admin-analytics", "problem-lessons"],
    queryFn: analyticsApi.problemLessons,
    staleTime: 30 * 60 * 1000, // 1800s
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/analytics/use-analytics.ts"
git commit -m "feat(analytics): them 6 hook du lieu cho trang Bao cao phan tich"
```

---

### Task 5: 4 chart component (recharts, wrapper `h-[280px]`, bảng dữ liệu kèm theo)

**Files:**
- Create: `app/(dashboard)/analytics/active-learners-chart.tsx`
- Create: `app/(dashboard)/analytics/weekly-minutes-chart.tsx`
- Create: `app/(dashboard)/analytics/hour-histogram-chart.tsx`
- Create: `app/(dashboard)/analytics/subject-split-chart.tsx`

**Interfaces:**
- Consumes: `ActiveLearnerPoint, WeeklyMinutesPoint, HourHistogramPoint, SubjectSplitItem`
  (`lib/types.ts`); `formatPercent, formatHourLabel, formatNumberVn` (`lib/analytics/analytics-format.ts`);
  `SUBJECT_LABELS, SUBJECT_COLORS, MINUTES_DISCLAIMER` (`lib/analytics/labels.ts`); `Card,
  CardHeader, CardTitle, CardContent` (`components/ui/card`).
- Produces: 4 component `<ActiveLearnersChart data={...} />`, `<WeeklyMinutesChart data={...} />`,
  `<HourHistogramChart data={...} />`, `<SubjectSplitChart data={...} />` — mỗi component nhận thẳng
  mảng dữ liệu đã fetch (không tự gọi hook), Task 6 (page.tsx) truyền `data` từ Task 4.

- [ ] **Step 1: Viết `active-learners-chart.tsx`**

```typescript
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ActiveLearnerPoint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumberVn } from "@/lib/analytics/analytics-format";

function formatDayLabel(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function ActiveLearnersChart({ data }: { data: ActiveLearnerPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Học viên hoạt động theo ngày</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={formatDayLabel} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip labelFormatter={formatDayLabel} formatter={(v: number) => [v, "Học viên"]} />
              <Bar dataKey="learners" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Xem số liệu
          </summary>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Ngày</th>
                <th className="py-1 text-right">Học viên hoạt động</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.day} className="border-t">
                  <td className="py-1">{formatDayLabel(row.day)}</td>
                  <td className="py-1 text-right">{formatNumberVn(row.learners)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Viết `weekly-minutes-chart.tsx`**

```typescript
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { WeeklyMinutesPoint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MINUTES_DISCLAIMER } from "@/lib/analytics/labels";

export function WeeklyMinutesChart({ data }: { data: WeeklyMinutesPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{MINUTES_DISCLAIMER}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis allowDecimals fontSize={12} />
              <Tooltip formatter={(v: number) => [`${v} phút`, "TB/học viên"]} />
              <Bar dataKey="avgMinutesPerLearner" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Xem số liệu
          </summary>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Tuần</th>
                <th className="py-1 text-right">Học viên</th>
                <th className="py-1 text-right">TB phút/học viên</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.weekStart} className="border-t">
                  <td className="py-1">{row.label}</td>
                  <td className="py-1 text-right">{row.learners}</td>
                  <td className="py-1 text-right">{row.avgMinutesPerLearner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Viết `hour-histogram-chart.tsx`**

```typescript
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { HourHistogramPoint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatHourLabel, formatNumberVn } from "@/lib/analytics/analytics-format";

export function HourHistogramChart({ data }: { data: HourHistogramPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Khung giờ hoạt động (giờ Việt Nam)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={formatHourLabel} fontSize={11} interval={1} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip
                labelFormatter={(h: number) => formatHourLabel(h)}
                formatter={(v: number) => [v, "Lượt trả lời"]}
              />
              <Bar dataKey="answers" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Xem số liệu
          </summary>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Giờ</th>
                <th className="py-1 text-right">Lượt trả lời</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.hour} className="border-t">
                  <td className="py-1">{formatHourLabel(row.hour)}</td>
                  <td className="py-1 text-right">{formatNumberVn(row.answers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Viết `subject-split-chart.tsx`**

```typescript
"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { SubjectSplitItem } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SUBJECT_LABELS, SUBJECT_COLORS } from "@/lib/analytics/labels";
import { formatPercent, formatNumberVn } from "@/lib/analytics/analytics-format";

export function SubjectSplitChart({ data }: { data: SubjectSplitItem[] }) {
  const chartData = data.map((row) => ({
    ...row,
    name: SUBJECT_LABELS[row.subject] ?? row.subject,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Phân bố hoạt động theo môn</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="answers"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry: { name: string; answers: number }) =>
                  `${entry.name}: ${entry.answers}`
                }
              >
                {chartData.map((row) => (
                  <Cell key={row.subject} fill={SUBJECT_COLORS[row.subject] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [formatNumberVn(v), "Lượt trả lời"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Xem số liệu
          </summary>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Môn</th>
                <th className="py-1 text-right">Lượt trả lời</th>
                <th className="py-1 text-right">Độ chính xác</th>
                <th className="py-1 text-right">Học viên</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.subject} className="border-t">
                  <td className="py-1">{SUBJECT_LABELS[row.subject] ?? row.subject}</td>
                  <td className="py-1 text-right">{formatNumberVn(row.answers)}</td>
                  <td className="py-1 text-right">{formatPercent(row.accuracy)}</td>
                  <td className="py-1 text-right">{formatNumberVn(row.learners)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Kiểm tra `npm run build` không vướng lỗi SSR do recharts**

Run: `npm run build`

Nếu build lỗi liên quan `ResponsiveContainer`/`recharts` khi render phía server (thường là lỗi
`ReferenceError: window is not defined` hoặc tương tự trong quá trình prerender trang), sửa CẢ 4 file
vừa tạo: đổi export chính thành lazy-load qua `next/dynamic` với `{ ssr: false }`. Ví dụ áp dụng cho
`active-learners-chart.tsx` — đổi tên hàm gốc thành `ActiveLearnersChartInner`, thêm ở cuối file:

```typescript
import dynamic from "next/dynamic";

export const ActiveLearnersChart = dynamic(
  () => Promise.resolve(ActiveLearnersChartInner),
  { ssr: false },
);
```

và export `ActiveLearnersChartInner` (bỏ `export` ở khai báo hàm gốc, đổi tên). Lặp lại tương tự cho
3 file còn lại NẾU build thật sự lỗi — nếu `npm run build` PASS ngay từ đầu (nhiều khả năng, vì
`recharts` v3 tự guard `typeof window` nội bộ), bỏ qua bước sửa này hoàn toàn, không sửa gì thêm.

Expected: `npm run build` thoát mã 0.

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/analytics/active-learners-chart.tsx" "app/(dashboard)/analytics/weekly-minutes-chart.tsx" "app/(dashboard)/analytics/hour-histogram-chart.tsx" "app/(dashboard)/analytics/subject-split-chart.tsx"
git commit -m "feat(analytics): 4 chart component recharts (active-learners/weekly-minutes/hour-histogram/subject-split)"
```

---

### Task 6: `problem-lessons-table.tsx` + `page.tsx` + cập nhật `sidebar-nav.tsx`

**Files:**
- Create: `app/(dashboard)/analytics/problem-lessons-table.tsx`
- Create: `app/(dashboard)/analytics/page.tsx`
- Modify: `components/shared/sidebar-nav.tsx`

**Interfaces:**
- Consumes: tất cả hook Task 4, tất cả component Task 5, `ProblemLessonItem` (Task 1),
  `SUBJECT_LABELS`, `TIME_RANGE_OPTIONS` (Task 3), `useAuth` (`hooks/use-auth.ts`), `extractError`
  (`lib/errors.ts`), `Card/CardHeader/CardTitle/CardContent`, `Table/TableBody/TableCell/TableHead/
  TableHeader/TableRow`, `Select/SelectContent/SelectItem/SelectTrigger/SelectValue`, `Skeleton`,
  `Badge` (đều đã có sẵn trong `components/ui/`).
- Produces: route `/analytics` hoàn chỉnh — không có task nào phụ thuộc.

- [ ] **Step 1: Viết `problem-lessons-table.tsx`**

```typescript
"use client";

import type { ProblemLessonItem } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SUBJECT_LABELS } from "@/lib/analytics/labels";
import { formatPercent, formatNumberVn } from "@/lib/analytics/analytics-format";

export function ProblemLessonsTable({ data }: { data: ProblemLessonItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bài học có tỉ lệ sai cao nhất</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa đủ dữ liệu để xếp hạng (cần đủ số lượt làm bài tối thiểu theo cấu hình hệ thống).
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài học</TableHead>
                <TableHead>Môn</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead className="text-right">Lượt làm</TableHead>
                <TableHead className="text-right">Học viên</TableHead>
                <TableHead className="text-right">Tỉ lệ sai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.name}
                    <span className="ml-1 text-xs text-muted-foreground">({row.code})</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {SUBJECT_LABELS[row.subject] ?? row.subject}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.grade}</TableCell>
                  <TableCell className="text-right">{formatNumberVn(row.attempts)}</TableCell>
                  <TableCell className="text-right">{formatNumberVn(row.learners)}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatPercent(row.wrongRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Viết `page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Users as UsersIcon, TrendingUp, Percent } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { extractError } from "@/lib/errors";
import { TIME_RANGE_OPTIONS } from "@/lib/analytics/labels";
import { formatPercent, formatNumberVn } from "@/lib/analytics/analytics-format";
import {
  useAnalyticsOverview,
  useActiveLearners,
  useWeeklyMinutes,
  useHourHistogram,
  useSubjectSplit,
  useProblemLessons,
} from "./use-analytics";
import { ActiveLearnersChart } from "./active-learners-chart";
import { WeeklyMinutesChart } from "./weekly-minutes-chart";
import { HourHistogramChart } from "./hour-histogram-chart";
import { SubjectSplitChart } from "./subject-split-chart";
import { ProblemLessonsTable } from "./problem-lessons-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const WEEKLY_MINUTES_WEEKS = 8;

export default function AnalyticsPage() {
  const { hasRole, hydrated } = useAuth();
  const [days, setDays] = useState(30);

  const overviewQuery = useAnalyticsOverview();
  const activeLearnersQuery = useActiveLearners(days);
  const weeklyMinutesQuery = useWeeklyMinutes(WEEKLY_MINUTES_WEEKS);
  const hourHistogramQuery = useHourHistogram(days);
  const subjectSplitQuery = useSubjectSplit(days);
  const problemLessonsQuery = useProblemLessons();

  if (!hydrated) return null;
  if (!hasRole("admin")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const overview = overviewQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo phân tích</h1>
          <p className="text-muted-foreground">
            Thống kê học viên, thời lượng học và nội dung cần chú ý
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4 thẻ tóm tắt: DAU/WAU/MAU + độ chính xác 30 ngày */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={UsersIcon}
          label="Hoạt động hôm nay (DAU)"
          value={overview ? formatNumberVn(overview.dau) : undefined}
          color="text-blue-600"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Hoạt động 7 ngày (WAU)"
          value={overview ? formatNumberVn(overview.wau) : undefined}
          color="text-green-600"
        />
        <SummaryCard
          icon={UsersIcon}
          label="Hoạt động 30 ngày (MAU)"
          value={overview ? formatNumberVn(overview.mau) : undefined}
          color="text-purple-600"
        />
        <SummaryCard
          icon={Percent}
          label="Độ chính xác (30 ngày)"
          value={overview ? formatPercent(overview.accuracyLast30Days) : undefined}
          color="text-amber-600"
        />
      </div>
      {overviewQuery.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {extractError(overviewQuery.error)}
        </div>
      )}

      <ChartSlot query={activeLearnersQuery}>
        {(data) => <ActiveLearnersChart data={data} />}
      </ChartSlot>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSlot query={hourHistogramQuery}>
          {(data) => <HourHistogramChart data={data} />}
        </ChartSlot>
        <ChartSlot query={subjectSplitQuery}>
          {(data) => <SubjectSplitChart data={data} />}
        </ChartSlot>
      </div>

      <ChartSlot query={weeklyMinutesQuery}>
        {(data) => <WeeklyMinutesChart data={data} />}
      </ChartSlot>

      <ChartSlot query={problemLessonsQuery}>
        {(data) => <ProblemLessonsTable data={data} />}
      </ChartSlot>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: string | undefined;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {value === undefined ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={`text-3xl font-bold ${color}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Bọc chung loading/error cho mọi chart — mỗi endpoint có thể lỗi/đang tải độc lập với các endpoint
// khác, nên KHÔNG gộp isLoading/error của cả trang vào 1 biến duy nhất (1 endpoint lỗi không được
// làm trắng toàn bộ các chart khác đã tải xong).
function ChartSlot<T>({
  query,
  children,
}: {
  query: { data?: T; isLoading: boolean; error: unknown };
  children: (data: T) => React.ReactNode;
}) {
  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }
  if (query.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {extractError(query.error)}
      </div>
    );
  }
  return <>{children(query.data as T)}</>;
}
```

- [ ] **Step 3: Cập nhật `components/shared/sidebar-nav.tsx`**

Thêm `LineChart` vào import icon (dòng import từ `lucide-react`):

```typescript
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  ListChecks,
  Upload,
  ShieldCheck,
  History,
  Sparkles,
  Calculator,
  Settings,
  FolderOpen,
  BarChart3,
  Users,
  LineChart,
} from "lucide-react";
```

Thêm section "Phân tích" vào `NAV_SECTIONS`, chèn giữa section "Kiểm duyệt" và "Quản trị":

```typescript
  {
    title: "Kiểm duyệt",
    items: [
      { href: "/qa/queue", label: "QA Queue", icon: ShieldCheck, roles: ["admin", "qa"] },
      { href: "/qa/audit", label: "Audit Log", icon: History, roles: ["admin", "qa"] },
    ],
  },
  {
    title: "Phân tích",
    items: [
      { href: "/analytics", label: "Báo cáo phân tích", icon: LineChart, roles: ["admin"] },
    ],
  },
  {
    title: "Quản trị",
    items: [
      { href: "/users", label: "Người dùng", icon: Users, roles: ["admin"] },
      { href: "/settings", label: "Cài đặt", icon: Settings, roles: ["admin"] },
    ],
  },
```

- [ ] **Step 4: Chạy kiểm tra tĩnh**

Run: `npx tsc --noEmit`
Expected: không lỗi

Run: `npx eslint app/\(dashboard\)/analytics components/shared/sidebar-nav.tsx`
Expected: không lỗi

- [ ] **Step 5: Chạy dev server, tự kiểm tra bằng mắt trước khi viết e2e**

Run: `npm run dev` (nền), mở `http://localhost:3000/analytics`, đăng nhập admin, xác nhận:
- 4 thẻ DAU/WAU/MAU/Độ chính xác hiện số thật (không phải mãi Skeleton)
- 4 chart render hình (không trắng trơn) + mở được `<details>` "Xem số liệu"
- Bảng "Bài học có tỉ lệ sai cao nhất" hiện đúng dữ liệu hoặc thông báo rỗng hợp lý
- Đổi Select "7 ngày qua" → active-learners/hour-histogram/subject-split đổi dữ liệu

Dừng `npm run dev` trước khi sang Task 7 (chạy e2e).

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/analytics/problem-lessons-table.tsx" "app/(dashboard)/analytics/page.tsx" components/shared/sidebar-nav.tsx
git commit -m "feat(analytics): trang /analytics hoan chinh + muc dieu huong Phan tich"
```

---

### Task 7: `e2e/analytics.spec.ts` + fixtures

**Files:**
- Modify: `e2e/fixtures/data.ts` (thêm vào cuối file)
- Create: `e2e/analytics.spec.ts`

**Interfaces:**
- Consumes: `ApiMock`, `loginAs` (helper có sẵn); toàn bộ route Task 6.

- [ ] **Step 1: Thêm fixture vào cuối `e2e/fixtures/data.ts`**

```typescript
// Báo cáo phân tích (GĐ3) — fixture cho e2e/analytics.spec.ts.

export const ANALYTICS_OVERVIEW_FIXTURE = {
  dau: 12,
  wau: 45,
  mau: 120,
  answersLast30Days: 3200,
  accuracyLast30Days: 0.782,
};

export const ANALYTICS_ACTIVE_LEARNERS_30D = [
  { day: "2026-09-02", learners: 18 },
  { day: "2026-09-03", learners: 22 },
  { day: "2026-09-04", learners: 15 },
];

export const ANALYTICS_ACTIVE_LEARNERS_7D = [
  { day: "2026-09-03", learners: 22 },
  { day: "2026-09-04", learners: 15 },
];

export const ANALYTICS_WEEKLY_MINUTES_FIXTURE = [
  { weekStart: "2026-08-24", label: "24/08 - 30/08", learners: 40, avgMinutesPerLearner: 22.5 },
  { weekStart: "2026-08-31", label: "31/08 - 06/09", learners: 45, avgMinutesPerLearner: 25.1 },
];

export const ANALYTICS_HOUR_HISTOGRAM_FIXTURE = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  answers: hour >= 18 && hour <= 21 ? 200 : 10,
}));

export const ANALYTICS_SUBJECT_SPLIT_FIXTURE = [
  { subject: "english", answers: 2000, correct: 1600, accuracy: 0.8, learners: 90 },
  { subject: "math", answers: 1200, correct: 900, accuracy: 0.75, learners: 60 },
];

export const ANALYTICS_PROBLEM_LESSONS_FIXTURE = [
  {
    id: "lesson-1",
    code: "ENG-G1-W3",
    name: "Bài 3: Colors",
    subject: "english",
    grade: 1,
    attempts: 150,
    wrong: 90,
    learners: 40,
    wrongRate: 0.6,
  },
];
```

- [ ] **Step 2: Viết `e2e/analytics.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import {
  ANALYTICS_OVERVIEW_FIXTURE,
  ANALYTICS_ACTIVE_LEARNERS_30D,
  ANALYTICS_ACTIVE_LEARNERS_7D,
  ANALYTICS_WEEKLY_MINUTES_FIXTURE,
  ANALYTICS_HOUR_HISTOGRAM_FIXTURE,
  ANALYTICS_SUBJECT_SPLIT_FIXTURE,
  ANALYTICS_PROBLEM_LESSONS_FIXTURE,
} from "./fixtures/data";

// Lưới test cho trang Báo cáo phân tích (GĐ3): 4 thẻ DAU/WAU/MAU/độ chính xác, 4 chart (assert
// trên bảng dữ liệu trong <details>, KHÔNG BAO GIỜ trên SVG), bảng bài học sai nhiều, đổi khoảng
// thời gian refetch đúng endpoint phụ thuộc "days", và gate quyền chỉ-admin.

function setup() {
  return new ApiMock()
    .onGet(/^\/admin\/analytics\/overview$/, ANALYTICS_OVERVIEW_FIXTURE)
    .onGet(/^\/admin\/analytics\/active-learners$/, (url) =>
      url.searchParams.get("days") === "7"
        ? ANALYTICS_ACTIVE_LEARNERS_7D
        : ANALYTICS_ACTIVE_LEARNERS_30D,
    )
    .onGet(/^\/admin\/analytics\/weekly-minutes$/, ANALYTICS_WEEKLY_MINUTES_FIXTURE)
    .onGet(/^\/admin\/analytics\/hour-histogram$/, ANALYTICS_HOUR_HISTOGRAM_FIXTURE)
    .onGet(/^\/admin\/analytics\/subject-split$/, ANALYTICS_SUBJECT_SPLIT_FIXTURE)
    .onGet(/^\/admin\/analytics\/problem-lessons$/, ANALYTICS_PROBLEM_LESSONS_FIXTURE);
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("hiện 4 thẻ DAU/WAU/MAU/độ chính xác từ overview (mock)", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  await expect(page.getByRole("heading", { name: "Báo cáo phân tích" })).toBeVisible();
  await expect(page.getByText("12", { exact: true })).toBeVisible(); // dau
  await expect(page.getByText("45", { exact: true })).toBeVisible(); // wau
  await expect(page.getByText("120", { exact: true })).toBeVisible(); // mau
  await expect(page.getByText("78.2%")).toBeVisible(); // accuracyLast30Days
});

test("chart học viên hoạt động: bảng dữ liệu trong <details> khớp fixture", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  const card = page.getByText("Học viên hoạt động theo ngày").locator("../..");
  await card.getByText("Xem số liệu").click();
  await expect(card.getByRole("cell", { name: "22", exact: true })).toBeVisible();
});

test("bảng bài học sai nhiều nhất hiện đúng dữ liệu mock", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  await expect(page.getByText("Bài 3: Colors")).toBeVisible();
  await expect(page.getByText("60.0%")).toBeVisible(); // wrongRate
});

test("nhãn phút/học viên/tuần hiển thị chú thích trung thực (không phải 'thời gian dùng app')", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  await expect(
    page.getByText(/Phút làm bài \/ học viên \/ tuần \(ước tính từ thời gian trả lời/),
  ).toBeVisible();
  await expect(page.getByText(/thời gian dùng app/)).toHaveCount(0);
});

test("đổi khoảng thời gian sang 7 ngày → active-learners hiện dữ liệu 7 ngày", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  const card = page.getByText("Học viên hoạt động theo ngày").locator("../..");
  await card.getByText("Xem số liệu").click();
  await expect(card.getByRole("row")).toHaveCount(4); // header + 3 ngày (30 ngày qua)

  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "7 ngày qua" }).click();

  await expect(card.getByRole("row")).toHaveCount(3); // header + 2 ngày (7 ngày qua)
});

test("editor không có quyền truy cập", async ({ context, page }) => {
  const api = setup();
  await api.install(page);
  await loginAs(context, "editor");
  await page.goto("/analytics");
  await expect(page.getByText(/không có quyền truy cập/i)).toBeVisible();
});
```

- [ ] **Step 3: Chạy e2e**

Run: `npm run test:e2e -- analytics.spec.ts`
Expected: PASS toàn bộ 6 test. Nếu selector `card.getByText(...).locator("../..")` không trúng đúng
Card wrapper (cấu trúc `CardHeader > CardTitle` khác 2 cấp cha so với giả định), điều chỉnh số lần
`..` cho khớp cấu trúc DOM thật của `components/ui/card.tsx` — đây là kiểu lỗi thường gặp, không phải
lỗi logic ứng dụng.

- [ ] **Step 4: Chạy toàn bộ lưới kiểm chứng bắt buộc trước khi báo hoàn tất**

Run: `npm test` (vitest, toàn repo)
Run: `npx tsc --noEmit`
Run: `npm run build`
Run: `npx eslint .`
Run: `npm run test:e2e` (toàn bộ, không chỉ file mới — xác nhận không phá test cũ)

Dán output thật của cả 5 lệnh khi báo cáo hoàn tất (theo superpowers:verification-before-completion).

- [ ] **Step 5: Commit**

```bash
git add e2e/fixtures/data.ts e2e/analytics.spec.ts
git commit -m "test(analytics): e2e cho trang Bao cao phan tich"
```
