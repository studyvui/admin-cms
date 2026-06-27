import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import { COURSES, LESSONS } from "./fixtures/data";

// Lưới test cho trang AI Sinh đề Tiếng Anh. Viết TRƯỚC khi refactor (Phase 4).
// Sinh đề dùng Math.random → assert số lượng/trạng thái, không assert nội dung.

async function setup(page: import("@playwright/test").Page) {
  const api = new ApiMock()
    .onGet(/^\/admin\/courses$/, COURSES)
    .onGet(/^\/admin\/lessons$/, LESSONS)
    .onGet(/^\/admin\/assets$/, []);
  await api.install(page);
  return api;
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("render + tự chọn khóa học/bài học (english)", async ({ page }) => {
  await setup(page);
  await page.goto("/ai-generate");
  await expect(
    page.getByRole("heading", { name: "AI Sinh đề Tiếng Anh" }),
  ).toBeVisible();
  // Sau khi load: nút Generate bật (đã có course + lesson auto-chọn).
  await expect(
    page.getByRole("button", { name: /Generate — Sinh/ }),
  ).toBeEnabled();
});

test("đổi mode Điền chữ → Generate sinh câu (count=10)", async ({ page }) => {
  await setup(page);
  await page.goto("/ai-generate");

  // Đổi "Chế độ nhập" sang "Điền chữ còn thiếu" (sinh được chỉ với từ vựng, không cần distractor pool).
  await page.getByLabel("Chế độ nhập").click();
  await page.getByRole("option", { name: /Điền chữ còn thiếu/ }).click();

  await page.getByRole("button", { name: /Generate — Sinh/ }).click();

  // Sau khi sinh: tiêu đề "Xem trước (10/10 chọn)" + nút Xuất Excel bật.
  await expect(page.getByText(/Xem trước \(10\/10/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Xuất Excel/ }),
  ).toBeEnabled();
});
