import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import { MATH_LESSONS } from "./fixtures/data";

// Lưới test cho trang AI Sinh đề Toán. Viết TRƯỚC khi refactor (Phase 2) để chụp hành vi hiện tại.
// Sinh đề dùng Math.random (không seeded) → KHÔNG assert nội dung; assert số lượng/trạng thái.

async function setup(page: import("@playwright/test").Page) {
  const api = new ApiMock()
    .onGet(/^\/admin\/lessons$/, MATH_LESSONS)
    .onGet(/^\/admin\/question-templates$/, []); // chỉ built-in
  await api.install(page);
  return api;
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("render + tuần 1 bám bài học Toán + có mẫu built-in", async ({ page }) => {
  await setup(page);
  await page.goto("/ai-generate-math");
  await expect(
    page.getByRole("heading", { name: "AI Sinh đề Toán" }),
  ).toBeVisible();
  // Tuần 1 (mặc định) → hiện bài học Toán của tuần.
  await expect(page.getByText("G1_W01_MATH", { exact: true })).toBeVisible();
  await expect(page.getByText("Phép cộng trong 10")).toBeVisible();
  // Ngân hàng mẫu có ít nhất 1 built-in.
  await expect(page.getByText("⚙️ Built-in").first()).toBeVisible();
});

test("chọn mẫu → Generate sinh câu → bật nút Xuất Excel", async ({ page }) => {
  await setup(page);
  await page.goto("/ai-generate-math");

  const generateBtn = page.getByRole("button", { name: /Generate — Sinh/ });
  await expect(generateBtn).toBeDisabled(); // chưa chọn mẫu

  // Chọn mẫu built-in đầu tiên (click badge → bubble lên card chọn mẫu).
  await page.getByText("⚙️ Built-in").first().click();
  await expect(generateBtn).toBeEnabled();

  await generateBtn.click();

  // Sau khi sinh: nút "Xuất Excel" bật (câu calculation xuất được 12 cột).
  await expect(
    page.getByRole("button", { name: /Xuất Excel/ }),
  ).toBeEnabled();
  // Placeholder rỗng biến mất → có ít nhất 1 câu (hiện đáp án ✓).
  await expect(page.getByText("Chọn mẫu → bấm Generate")).toHaveCount(0);
  await expect(page.getByText(/^✓/).first()).toBeVisible();
});
