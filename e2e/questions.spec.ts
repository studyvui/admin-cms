import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import {
  COURSES,
  LESSONS,
  QUESTIONS,
  Q_MC,
  Q_IMAGE,
  Q_AUDIO,
  Q_LETTER,
} from "./fixtures/data";

// Lưới test cho trang Câu hỏi (đã refactor) — vừa chứng minh harness chạy, vừa làm TEMPLATE
// cho các trang khác. Xác minh hành vi qua trình duyệt thật + giả lập backend (không ghi prod).

async function setup(page: import("@playwright/test").Page) {
  const api = new ApiMock()
    .onGet(/^\/admin\/courses$/, COURSES)
    .onGet(/^\/admin\/lessons$/, LESSONS)
    .onGet(/^\/admin\/questions$/, QUESTIONS);
  await api.install(page);
  return api;
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("danh sách câu hỏi render từ dữ liệu (mock)", async ({ page }) => {
  await setup(page);
  await page.goto("/questions");
  await expect(page.getByRole("heading", { name: "Câu hỏi" })).toBeVisible();
  await expect(page.getByText("G1_W01_1_ENG_001")).toBeVisible();
  await expect(page.getByText("G1_W01_1_ENG_005")).toBeVisible();
});

test("mở Thêm câu hỏi → đổi mode → field tương ứng hiện ra (bài ENG: 5 mode)", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/questions");
  await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  await expect(
    page.getByRole("heading", { name: "Thêm câu hỏi mới" }),
  ).toBeVisible();

  const dialog = page.getByRole("dialog");
  const modeSelect = dialog.getByLabel("Chế độ nhập");

  // mode mc (mặc định): có ô đề bài + 4 lựa chọn text
  await expect(dialog.locator("#prompt")).toBeVisible();
  await expect(dialog.locator("#optionA")).toBeVisible();

  // letter: có ô "Từ có đánh dấu chỗ ẩn"
  await modeSelect.click();
  await page.getByRole("option", { name: /Điền chữ còn thiếu/ }).click();
  await expect(dialog.locator("#markedWord")).toBeVisible();

  // audio_choice (bài ENG): help text có marker 🔊
  await modeSelect.click();
  await page.getByRole("option", { name: /Nghe rồi chọn ảnh/ }).click();
  await expect(dialog.getByText(/🔊/)).toBeVisible();

  // image_choice (bài ENG): help text có marker 🖼️
  await modeSelect.click();
  await page.getByRole("option", { name: /Ảnh rồi chọn từ/ }).click();
  await expect(dialog.getByText(/🖼️/)).toBeVisible();

  // reorder (bài ENG): có ô nhập cả câu đúng
  await modeSelect.click();
  await page.getByRole("option", { name: /Câu \(sắp xếp\)/ }).click();
  await expect(dialog.locator("#sentence")).toBeVisible();
});

test("tạo câu mc → POST /admin/questions với payload đúng (verify toPayload)", async ({
  page,
}) => {
  const api = await setup(page);
  await page.goto("/questions");
  await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  const dialog = page.getByRole("dialog");

  // Mã tự sinh sau khi lessonQuestions load (mock trả QUESTIONS → seq kế tiếp _006).
  await expect(dialog.locator("#code")).toHaveValue(/G1_W01_1_ENG_0\d\d/);

  await dialog.locator("#prompt").fill("Chọn con vật");
  await dialog.locator("#optionA").fill("cat");
  await dialog.locator("#optionB").fill("dog");
  await dialog.locator("#optionC").fill("fish");
  await dialog.locator("#optionD").fill("bird");
  // correctOption mặc định "A" → đáp án đúng = "cat"
  await dialog.getByRole("button", { name: "Tạo mới" }).click();

  await expect
    .poll(() => api.find("POST", /^\/admin\/questions$/)?.body)
    .toBeTruthy();
  const body = api.find("POST", /^\/admin\/questions$/)!.body as {
    type: string;
    content: { options: string[] };
    correctAnswer: string;
  };
  expect(body.type).toBe("multiple_choice");
  expect(body.content.options).toEqual(["cat", "dog", "fish", "bird"]);
  expect(body.correctAnswer).toBe("cat");
});

test.describe("Sửa câu → form nạp lại đúng (round-trip UI)", () => {
  for (const q of [Q_MC, Q_IMAGE, Q_AUDIO, Q_LETTER]) {
    test(`mode ${q.type}`, async ({ page }) => {
      await setup(page);
      await page.goto("/questions");
      // Bấm nút Sửa (icon) trên đúng hàng câu hỏi.
      const row = page.getByRole("row", { name: new RegExp(q.code as string) });
      await row.getByRole("button", { name: "Sửa câu hỏi" }).click();

      const dialog = page.getByRole("dialog");
      await expect(
        page.getByRole("heading", { name: "Sửa câu hỏi" }),
      ).toBeVisible();
      // Mã giữ nguyên, không lệch.
      await expect(dialog.locator("#code")).toHaveValue(q.code as string);

      if (q.type === "missing_letter") {
        await expect(dialog.locator("#markedWord")).toHaveValue("h[el]lo");
      } else if (q.type === "multiple_choice") {
        await expect(dialog.locator("#optionA")).toHaveValue("cat");
        await expect(dialog.locator("#optionB")).toHaveValue("dog");
      } else if (q.type === "image_choice") {
        await expect(dialog.locator("#optionA")).toHaveValue("apple");
      }
    });
  }
});

test("nút Khôi phục ở câu deprecated → chạy chuỗi changeStatus", async ({
  page,
}) => {
  const api = await setup(page);
  await page.goto("/questions");
  const row = page.getByRole("row", { name: /G1_W01_1_ENG_005/ });
  await row.getByRole("button", { name: "Khôi phục" }).click();

  await expect
    .poll(() => api.all("PATCH", /\/admin\/questions\/.+\/status$/).length)
    .toBeGreaterThanOrEqual(4); // draft → review → approved → published
});
