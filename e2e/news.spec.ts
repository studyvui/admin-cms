import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import { NEWS_LIST, NEWS_DRAFT } from "./fixtures/data";

async function setup(page: import("@playwright/test").Page) {
  const api = new ApiMock().onGet(/^\/admin\/news$/, NEWS_LIST);
  await api.install(page);
  return api;
}

test.describe("Bảng tin (admin)", () => {
  test.beforeEach(async ({ context }) => {
    await loginAs(context, "admin");
  });

  test("danh sách bảng tin render từ dữ liệu (mock)", async ({ page }) => {
    await setup(page);
    await page.goto("/news");
    await expect(
      page.getByRole("heading", { name: "Bảng tin", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Bài đã đăng E2E")).toBeVisible();
    await expect(page.getByText("Bài nháp E2E")).toBeVisible();
  });

  test("mở Thêm bài viết → điền form → gửi đúng payload", async ({ page }) => {
    const api = await setup(page);
    await page.goto("/news");
    await page.getByRole("button", { name: "Thêm bài viết" }).click();
    await expect(
      page.getByRole("heading", { name: "Thêm bài viết mới" }),
    ).toBeVisible();

    const dialog = page.getByRole("dialog");
    await dialog.locator("#title").fill("Bài mới từ E2E");
    await dialog
      .locator("#content")
      .fill("<p>Nội dung bài mới đủ dài để qua validate</p>");
    await dialog.getByRole("button", { name: "Tạo mới" }).click();

    const req = api.find("POST", /^\/admin\/news$/);
    expect(req?.body).toMatchObject({
      type: "update",
      title: "Bài mới từ E2E",
      content: "<p>Nội dung bài mới đủ dài để qua validate</p>",
    });
  });

  test("bấm Xuất bản trên bài nháp → gọi đúng PATCH status", async ({ page }) => {
    const api = await setup(page);
    await page.goto("/news");
    const row = page.getByRole("row", { name: new RegExp(NEWS_DRAFT.title) });
    await row.getByTitle("Xuất bản").click();

    const req = api.find(
      "PATCH",
      new RegExp(`^/admin/news/${NEWS_DRAFT.id}/status$`),
    );
    expect(req?.body).toEqual({ status: "published" });
  });
});

test.describe("Bảng tin (editor)", () => {
  test.beforeEach(async ({ context }) => {
    await loginAs(context, "editor");
  });

  test("editor không thấy nút Xoá bài viết", async ({ page }) => {
    await setup(page);
    await page.goto("/news");
    await expect(page.getByText("Bài đã đăng E2E")).toBeVisible();
    await expect(page.getByTitle("Xoá bài viết")).toHaveCount(0);
  });
});
