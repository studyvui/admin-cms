import { test, expect, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import {
  COURSES,
  MATH_LESSONS_GOLDEN,
  MATH_USER_TEMPLATE,
  LESSONS_ENG_GOLDEN,
  ASSETS_ENG_GOLDEN,
  USER_STATS_FIXTURE,
  USERS_GOLDEN_FIXTURE,
  USERS_ONLY_DELETED_FIXTURE,
  USERS_PAGED_FIXTURE,
  USERS_EMPTY_FIXTURE,
} from "./fixtures/data";

// Lưới an toàn "HTML golden" cho mục 93 Đợt 4c (tách users/page.tsx, ai-generate/page.tsx,
// ai-generate-math/page.tsx): ghi lại HASH của HTML đã chuẩn hoá của vùng nội dung chính và các
// hộp thoại ở nhiều trạng thái, cộng payload / tên file khi thao tác. Dựng và chạy XANH trên bản
// chưa tách; sau khi tách phải khớp 100 %.
//   UPDATE_GOLDEN=1 npx playwright test e2e/dot4c-dom-golden.spec.ts   → ghi lại golden
//   GOLDEN_DUMP_DIR=<thư mục> npx playwright test …                    → ghi HTML / payload để so tay
// Không chuẩn hoá được thì KHÔNG chuẩn hoá thêm: chỉ bỏ id động của Radix / React useId và khoảng trắng.

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

const GOLDEN_FILE = path.resolve("e2e/fixtures/dot4c-dom-golden.json");
const UPDATE = process.env.UPDATE_GOLDEN === "1";
const DUMP_DIR = process.env.GOLDEN_DUMP_DIR;
// Đồng hồ đóng băng: cột "VIP đến ngày" ghi "(còn N ngày)" tính theo new Date().
const FIXED_NOW = new Date("2026-11-04T00:00:00Z");

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

function readGolden(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(GOLDEN_FILE, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function check(got: Record<string, string>) {
  if (UPDATE) {
    const merged = { ...readGolden(), ...got };
    const sorted = Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]));
    fs.writeFileSync(GOLDEN_FILE, JSON.stringify(sorted, null, 2) + "\n");
    return;
  }
  const golden = readGolden();
  const want = Object.fromEntries(Object.keys(got).map((k) => [k, golden[k]]));
  expect(got).toEqual(want);
}

function normalize(html: string): string {
  return html
    .replace(/radix-[^"\s]*/g, "radix-ID")
    .replace(/«[^»]*»/g, "ID")
    .replace(/:r[0-9a-z]+:/g, "ID")
    .replace(/_r_[0-9a-z]+_/g, "ID")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function dump(key: string, ext: string, text: string) {
  if (!DUMP_DIR) return;
  fs.mkdirSync(DUMP_DIR, { recursive: true });
  fs.writeFileSync(path.join(DUMP_DIR, key.replace(/[^A-Za-z0-9_.-]/g, "_") + ext), text);
}

/** innerHTML đã chuẩn hoá, kèm giá trị hiện tại của ô nhập (thuộc tính value không tự có trong HTML). */
async function snap(key: string, target: Locator): Promise<string> {
  const page = target.page();
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("img")).every((i) => (i as HTMLImageElement).complete),
  );
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
  const html = await target.evaluate((el) => {
    const clone = el.cloneNode(true) as HTMLElement;
    const src = el.querySelectorAll("input,textarea");
    const dst = clone.querySelectorAll("input,textarea");
    src.forEach((s, i) => {
      const d = dst[i];
      if (s instanceof HTMLTextAreaElement) d.textContent = s.value;
      else if (s instanceof HTMLInputElement) {
        d.setAttribute("value", s.value);
        if (s.checked) d.setAttribute("checked", "");
        else d.removeAttribute("checked");
      }
    });
    return clone.innerHTML;
  });
  const norm = normalize(html);
  dump(key, ".html", norm);
  return hash(norm);
}

function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(o[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(v);
}

function hashPayload(key: string, v: unknown): string {
  const text = canonical(v);
  dump(key, ".json", text);
  return hash(text);
}

async function seedRandom(page: Page) {
  // Math.random tất định (sinh đề, xáo nhiễu); reset seed ngay trước khi bấm Generate.
  await page.addInitScript(() => {
    const w = window as unknown as { __seed: number };
    w.__seed = 1;
    Math.random = () => {
      w.__seed = (w.__seed * 1664525 + 1013904223) >>> 0;
      return w.__seed / 4294967296;
    };
  });
}

async function resetSeed(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __seed: number }).__seed = 1;
  });
}

async function pngRoute(page: Page) {
  await page.route(/\.(png|webp|jpe?g|gif)(\?.*)?$/i, (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: PNG_1X1 }),
  );
}

/** Bấm Xuất Excel: ghi lại tên file tải về HOẶC nội dung alert (câu không xuất được). */
async function exportResult(page: Page, name: RegExp): Promise<string> {
  const alerts: string[] = [];
  const onDialog = (d: import("@playwright/test").Dialog) => {
    alerts.push(d.message());
    void d.accept();
  };
  page.on("dialog", onDialog);
  const file = page
    .waitForEvent("download", { timeout: 4000 })
    .then((d) => d.suggestedFilename())
    .catch(() => "NO_DOWNLOAD");
  await page.getByRole("button", { name }).click();
  const got = await file;
  await page.waitForTimeout(300);
  page.off("dialog", onDialog);
  return JSON.stringify({ file: got, alerts });
}

async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

/* ============================== users ============================== */

function usersMock(pagedTotal = false) {
  return new ApiMock()
    .onGet(/^\/admin\/users\/stats$/, USER_STATS_FIXTURE)
    .onGet(/^\/admin\/users$/, (url: URL) => {
      const pg = Number(url.searchParams.get("page") ?? 1);
      const role = url.searchParams.get("role");
      const status = url.searchParams.get("status");
      const q = url.searchParams.get("q");
      if (q === "zzz") return USERS_EMPTY_FIXTURE;
      if (pagedTotal) {
        return {
          ...USERS_PAGED_FIXTURE,
          page: pg,
          items: USERS_PAGED_FIXTURE.items.map((u) => ({
            ...u,
            id: `${u.id}-p${pg}`,
            email: `p${pg}-${u.email}`,
          })),
        };
      }
      if (status === "deleted") return USERS_ONLY_DELETED_FIXTURE;
      if (role) {
        const items = USERS_GOLDEN_FIXTURE.items.filter((u) => u.role === role);
        return { ...USERS_GOLDEN_FIXTURE, items, total: items.length };
      }
      return USERS_GOLDEN_FIXTURE;
    });
}

async function openUsers(page: Page, api = usersMock(), waitEmail = "student1@studyvui.vn") {
  await page.clock.setFixedTime(FIXED_NOW);
  await api.install(page);
  await page.goto("/users");
  await expect(page.getByText(waitEmail)).toBeVisible();
  return api;
}

test("users: danh sách mặc định, thẻ thống kê, VIP còn hạn / hết hạn / chưa có", async ({ page }) => {
  await openUsers(page);
  const got: Record<string, string> = {};
  got["users:list"] = await snap("users_list", page.locator("main"));
  check(got);
});

test("users: lọc vai trò, trạng thái đã xoá, tìm kiếm rỗng", async ({ page }) => {
  await openUsers(page);
  const got: Record<string, string> = {};
  await page.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: "Học sinh", exact: true }).click();
  await expect(page.getByText("parent5@studyvui.vn")).toHaveCount(0);
  got["users:filter-role-student"] = await snap("users_role", page.locator("main"));
  await page.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "Đã xoá", exact: true }).click();
  await expect(page.getByText("deleted6@studyvui.vn")).toBeVisible();
  await expect(page.getByText("student1@studyvui.vn")).toHaveCount(0);
  got["users:filter-status-deleted"] = await snap("users_deleted", page.locator("main"));
  await page.getByPlaceholder("Email hoặc tên...").fill("zzz");
  await expect(page.getByText("Không có người dùng khớp bộ lọc.")).toBeVisible();
  got["users:search-empty"] = await snap("users_empty", page.locator("main"));
  check(got);
});

test("users: trạng thái tải và lỗi", async ({ page }) => {
  const got: Record<string, string> = {};
  // Tải: GET danh sách không bao giờ trả lời.
  await new ApiMock().onGet(/^\/admin\/users\/stats$/, USER_STATS_FIXTURE).install(page);
  await page.route(/\/api\/v1\/admin\/users(\?.*)?$/, () => {});
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Người dùng" })).toBeVisible();
  await expect(page.locator(".animate-pulse").first()).toBeVisible();
  got["users:loading"] = await snap("users_loading", page.locator("main"));
  check(got);
});

test("users: lỗi tải danh sách", async ({ page }) => {
  const got: Record<string, string> = {};
  const api = new ApiMock()
    .onGet(/^\/admin\/users\/stats$/, USER_STATS_FIXTURE)
    .onGet(/^\/admin\/users$/, { message: "Lỗi giả lập" }, 500);
  await api.install(page);
  await page.goto("/users");
  await expect(page.locator(".border-destructive\\/30")).toBeVisible({ timeout: 20_000 });
  got["users:error"] = await snap("users_error", page.locator("main"));
  check(got);
});

test("users: phân trang", async ({ page }) => {
  await openUsers(page, usersMock(true), "p1-paged1@studyvui.vn");
  const got: Record<string, string> = {};
  got["users:page-1"] = await snap("users_p1", page.locator("main"));
  await page.getByRole("button", { name: "Sau" }).click();
  await expect(page.getByText("Trang 2 / 3")).toBeVisible();
  got["users:page-2"] = await snap("users_p2", page.locator("main"));
  await page.getByRole("button", { name: "Sau" }).click();
  await expect(page.getByText("Trang 3 / 3")).toBeVisible();
  got["users:page-3"] = await snap("users_p3", page.locator("main"));
  check(got);
});

test("users: các hộp thoại Thêm / Sửa / Đặt lại mật khẩu / Reset tiến độ / Kích hoạt VIP", async ({ page }) => {
  await openUsers(page);
  const got: Record<string, string> = {};
  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "Thêm người dùng" }).click();
  await expect(dialog).toBeVisible();
  got["users:dialog-create"] = await snap("users_dlg_create", dialog);
  await closeDialog(page);
  const row = page.getByRole("row", { name: /student1@studyvui\.vn/ });
  for (const [key, title] of [
    ["edit", "Sửa người dùng"],
    ["reset-password", "Đặt lại mật khẩu"],
    ["reset-progress", "Reset tiến độ học tập"],
    ["grant-vip", "Kích hoạt VIP"],
  ] as const) {
    await row.getByTitle(title).click();
    await expect(dialog).toBeVisible();
    got[`users:dialog-${key}`] = await snap(`users_dlg_${key}`, dialog);
    await closeDialog(page);
  }
  check(got);
});

test("users: thao tác hàng — khoá (confirm + PATCH), xoá (confirm + DELETE), khôi phục, banner lỗi không rò", async ({ page }) => {
  const api = await openUsers(page);
  const got: Record<string, string> = {};
  const teacher = page.getByRole("row", { name: /teacher2@studyvui\.vn/ });
  // Mở khoá không hỏi confirm (chỉ Khoá mới hỏi).
  await teacher.getByTitle("Mở khoá tài khoản").click();
  await expect.poll(() => api.find("PATCH", /^\/admin\/users\//)?.body).toBeTruthy();
  got["users:patch-unlock"] = hashPayload("users_patch_unlock", api.find("PATCH", /^\/admin\/users\//)?.body);
  const student = page.getByRole("row", { name: /student1@studyvui\.vn/ });
  page.once("dialog", (d) => d.accept());
  await student.getByTitle("Khoá tài khoản").click();
  await expect.poll(() => api.captured.filter((c) => c.method === "PATCH").length).toBe(2);
  got["users:patch-lock"] = hashPayload("users_patch_lock", api.captured.filter((c) => c.method === "PATCH")[1].body);
  page.once("dialog", (d) => d.accept());
  await student.getByTitle("Xoá người dùng").click();
  await expect.poll(() => api.find("DELETE", /^\/admin\/users\//)?.path).toBeTruthy();
  got["users:delete-path"] = api.find("DELETE", /^\/admin\/users\//)!.path;
  await page.getByRole("row", { name: /deleted6@studyvui\.vn/ }).getByTitle("Khôi phục").click();
  await expect.poll(() => api.captured.some((c) => /restore/.test(c.path))).toBe(true);
  got["users:restore-path"] = api.captured.find((c) => /restore/.test(c.path))!.path;
  check(got);
});

/* ============================ ai-generate ============================ */

async function openAiGenerate(page: Page, courses: unknown[] = COURSES) {
  await seedRandom(page);
  await pngRoute(page);
  const api = new ApiMock()
    .onGet(/^\/admin\/courses$/, courses)
    .onGet(/^\/admin\/lessons$/, LESSONS_ENG_GOLDEN)
    .onGet(/^\/admin\/assets$/, ASSETS_ENG_GOLDEN);
  await api.install(page);
  await page.goto("/ai-generate");
  await expect(page.getByRole("heading", { name: "AI Sinh đề Tiếng Anh" })).toBeVisible();
  return api;
}

async function pickCombo(page: Page, index: number, optionName: RegExp | string) {
  await page.getByRole("combobox").nth(index).click();
  await page.getByRole("option", { name: optionName }).click();
}

test("ai-generate: trạng thái ban đầu, không có khoá học, lọc kỹ năng theo bài học", async ({ page }) => {
  const got: Record<string, string> = {};
  await openAiGenerate(page);
  await expect(page.getByRole("button", { name: /Generate — Sinh/ })).toBeEnabled();
  got["ai-gen:initial"] = await snap("aigen_initial", page.locator("main"));
  await pickCombo(page, 1, /Tuần 2/);
  await expect(page.getByRole("combobox").nth(2)).toContainText("Phonics");
  got["ai-gen:lesson-phonics"] = await snap("aigen_phonics", page.locator("main"));
  await pickCombo(page, 1, /Tuần 3/);
  got["ai-gen:lesson-unmapped"] = await snap("aigen_unmapped", page.locator("main"));
  check(got);
});

test("ai-generate: chưa có khoá học", async ({ page }) => {
  const got: Record<string, string> = {};
  await openAiGenerate(page, []);
  await expect(page.getByText("Chưa có khóa học")).toBeVisible();
  got["ai-gen:no-courses"] = await snap("aigen_nocourse", page.locator("main"));
  check(got);
});

test("ai-generate: sinh 3 chế độ, bỏ chọn, Xem thử, Tạo câu hỏi, Xuất Excel", async ({ page }) => {
  const api = await openAiGenerate(page);
  const got: Record<string, string> = {};
  const modes: [string, RegExp][] = [
    ["image_choice", /Ảnh rồi chọn từ/],
    ["audio_choice", /Nghe rồi chọn ảnh/],
    ["letter", /Điền chữ còn thiếu/],
  ];
  for (const [key, label] of modes) {
    await pickCombo(page, 3, label);
    await resetSeed(page);
    await page.getByRole("button", { name: /Generate — Sinh/ }).click();
    await expect(page.getByText(/Xem trước \(10\/10/)).toBeVisible();
    got[`ai-gen:generated-${key}`] = await snap(`aigen_${key}`, page.locator("main"));
    got[`ai-gen:export-${key}`] = await exportResult(page, /Xuất Excel/);
  }
  // Còn ở chế độ letter: bỏ chọn 2 câu đầu.
  const boxes = page.locator('input[type="checkbox"]');
  await boxes.nth(0).uncheck();
  await boxes.nth(1).uncheck();
  await expect(page.getByText(/Xem trước \(8\/10/)).toBeVisible();
  got["ai-gen:unchecked"] = await snap("aigen_unchecked", page.locator("main"));
  await page.getByRole("button", { name: "Xem thử" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  got["ai-gen:preview-dialog"] = await snap("aigen_preview", dialog);
  await closeDialog(page);
  // Tạo câu hỏi trực tiếp: alert + POST bulk-upload.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /^Tạo 8 câu hỏi/ }).click();
  await expect.poll(() => api.find("POST", /bulk-upload$/)?.body).toBeTruthy();
  got["ai-gen:bulk-upload-payload"] = hashPayload("aigen_bulk", api.find("POST", /bulk-upload$/)?.body);
  check(got);
});

/* ========================== ai-generate-math ========================== */

async function openMath(page: Page) {
  await seedRandom(page);
  await pngRoute(page);
  const api = new ApiMock()
    .onGet(/^\/admin\/lessons$/, MATH_LESSONS_GOLDEN)
    .onGet(/^\/admin\/question-templates$/, (url: URL) =>
      url.searchParams.get("lessonType") === "calculation" && url.searchParams.get("grade") === "1"
        ? [MATH_USER_TEMPLATE]
        : [],
    );
  await api.install(page);
  await page.goto("/ai-generate-math");
  await expect(page.getByRole("heading", { name: "AI Sinh đề Toán" })).toBeVisible();
  await expect(page.getByText("⚙️ Built-in").first()).toBeVisible();
  return api;
}

test("ai-generate-math: tuần 1 lớp 1 (built-in + mẫu tự tạo), lớp 2..5, tuần chưa có bài", async ({ page }) => {
  await openMath(page);
  const got: Record<string, string> = {};
  await expect(page.getByText("✏️ Custom").first()).toBeVisible();
  got["math:g1-w1"] = await snap("math_g1w1", page.locator("main"));
  for (const g of [2, 3, 4, 5]) {
    await pickCombo(page, 0, `Lớp ${g}`);
    await expect(page.getByText(`G${g}_W01_MATH`, { exact: true })).toBeVisible();
    got[`math:g${g}-w1`] = await snap(`math_g${g}w1`, page.locator("main"));
  }
  await pickCombo(page, 0, "Lớp 1");
  await page.locator('input[type="number"]').first().fill("30");
  await expect(page.getByText("chưa có bài học Toán")).toBeVisible();
  got["math:g1-w30-no-lesson"] = await snap("math_g1w30", page.locator("main"));
  check(got);
});

test("ai-generate-math: chọn mẫu, sinh, bỏ chọn, Xem trước, Xuất Excel", async ({ page }) => {
  await openMath(page);
  const got: Record<string, string> = {};
  await page.getByText("⚙️ Built-in").first().click();
  got["math:template-selected"] = await snap("math_tplsel", page.locator("main"));
  await resetSeed(page);
  await page.getByRole("button", { name: /Generate — Sinh/ }).click();
  await expect(page.getByText(/Xem trước \(10\/10/)).toBeVisible();
  got["math:generated"] = await snap("math_generated", page.locator("main"));
  const boxes = page.locator('input[type="checkbox"]');
  await boxes.nth(0).uncheck();
  await boxes.nth(1).uncheck();
  await expect(page.getByText(/Xem trước \(8\/10/)).toBeVisible();
  got["math:unchecked"] = await snap("math_unchecked", page.locator("main"));
  await page.getByRole("button", { name: "Xem trước", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  got["math:preview-dialog"] = await snap("math_preview_dlg", dialog);
  await closeDialog(page);
  got["math:export-result"] = await exportResult(page, /Xuất Excel 12 cột/);
  check(got);
});

test("ai-generate-math: mẫu tự tạo (Sửa / Xoá), Thêm mẫu, bản sao built-in, Sửa range", async ({ page }) => {
  const api = await openMath(page);
  const got: Record<string, string> = {};
  const dialog = page.getByRole("dialog");
  await page.getByText("✏️ Custom").first().click();
  got["math:custom-selected"] = await snap("math_custom_sel", page.locator("main"));
  await page.getByTitle("Sửa", { exact: true }).first().click();
  await expect(dialog).toBeVisible();
  got["math:dialog-edit-user"] = await snap("math_dlg_edit_user", dialog);
  await closeDialog(page);
  await page.getByRole("button", { name: "Thêm mẫu" }).click();
  await expect(dialog).toBeVisible();
  got["math:dialog-add"] = await snap("math_dlg_add", dialog);
  await closeDialog(page);
  const clones = page.getByTitle("Sửa (tạo bản sao)");
  got["math:clone-count"] = String(await clones.count());
  if ((await clones.count()) > 0) {
    await clones.first().click();
    await expect(dialog).toBeVisible();
    got["math:dialog-clone"] = await snap("math_dlg_clone", dialog);
    await closeDialog(page);
  }
  page.once("dialog", (d) => d.accept());
  await page.getByTitle("Xoá", { exact: true }).first().click();
  await expect.poll(() => api.find("DELETE", /question-templates\//)?.path).toBeTruthy();
  got["math:delete-path"] = api.find("DELETE", /question-templates\//)!.path;
  // Tuần 2 lớp 1 = "sequence" → mẫu TPL_SEQ_01 có nút Sửa range.
  await page.locator('input[type="number"]').first().fill("2");
  await expect(page.getByText("G1_W02_MATH", { exact: true })).toBeVisible();
  got["math:g1-w2-sequence"] = await snap("math_g1w2", page.locator("main"));
  await page.getByTitle("Sửa range (start/step)").click();
  await expect(dialog).toBeVisible();
  got["math:dialog-sequence-range"] = await snap("math_dlg_seq", dialog);
  await closeDialog(page);
  check(got);
});
