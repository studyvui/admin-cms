import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import { COURSES, LESSONS } from "./fixtures/data";

// Lưới test cho trang Bài học. Viết TRƯỚC khi refactor (L3) để chụp hành vi hiện tại;
// giữ xanh sau refactor = bằng chứng không đổi hành vi.

async function setup(page: import("@playwright/test").Page) {
  const api = new ApiMock()
    .onGet(/^\/admin\/courses$/, COURSES)
    .onGet(/^\/admin\/lessons$/, LESSONS);
  await api.install(page);
  return api;
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("danh sách bài học render từ dữ liệu (mock)", async ({ page }) => {
  await setup(page);
  await page.goto("/lessons");
  await expect(page.getByRole("heading", { name: "Bài học" })).toBeVisible();
  await expect(page.getByText("G1_W01_1_ENG")).toBeVisible();
  await expect(page.getByText("Lời chào")).toBeVisible();
});

test("tạo bài học → mã tự sinh G1_W01_1_ENG + POST payload đúng (buildCode + toCreateInput)", async ({
  page,
}) => {
  const api = await setup(page);
  await page.goto("/lessons");
  await page.getByRole("button", { name: "Thêm bài học" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    page.getByRole("heading", { name: "Thêm bài học mới" }),
  ).toBeVisible();

  // Mã tự build từ khoá (english, grade 1) + tuần 1 + thứ tự 1 → G1_W01_1_ENG (thứ tự TRƯỚC môn).
  await expect(dialog.locator("#code")).toHaveValue("G1_W01_1_ENG");

  await dialog.locator("#name").fill("Bài kiểm thử");
  await dialog.getByRole("button", { name: "Tạo mới" }).click();

  await expect
    .poll(() => api.find("POST", /^\/admin\/lessons$/)?.body)
    .toBeTruthy();
  const body = api.find("POST", /^\/admin\/lessons$/)!.body as {
    code: string;
    name: string;
    week: number;
    orderIndex: number;
    lessonType: string;
    skills: string[];
  };
  expect(body.code).toBe("G1_W01_1_ENG");
  expect(body.name).toBe("Bài kiểm thử");
  expect(body.week).toBe(1);
  expect(body.orderIndex).toBe(1);
  expect(body.skills).toEqual(["vocab", "listening"]); // tách từ skillsCsv
});

test("sửa bài học → form nạp lại đúng (toFormValues)", async ({ page }) => {
  await setup(page);
  await page.goto("/lessons");
  const row = page.getByRole("row", { name: /G1_W01_1_ENG/ });
  await row.getByRole("button", { name: "Sửa bài học" }).click();

  const dialog = page.getByRole("dialog");
  await expect(
    page.getByRole("heading", { name: "Sửa bài học" }),
  ).toBeVisible();
  await expect(dialog.locator("#code")).toHaveValue("G1_W01_1_ENG");
  await expect(dialog.locator("#name")).toHaveValue("Lời chào");
  await expect(dialog.locator("#week")).toHaveValue("1");
  // vocabulary nạp lại: từ "hello" trong ô đầu tiên
  await expect(dialog.getByPlaceholder("apple").first()).toHaveValue("hello");
});
