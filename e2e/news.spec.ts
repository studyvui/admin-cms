import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import { NEWS_LIST, NEWS_DRAFT, NEWS_PUBLISHED } from "./fixtures/data";

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

    await expect
      .poll(() => api.find("POST", /^\/admin\/news$/)?.body)
      .toBeTruthy();
    const req = api.find("POST", /^\/admin\/news$/);
    expect(req?.body).toMatchObject({
      type: "update",
      title: "Bài mới từ E2E",
      content: "<p>Nội dung bài mới đủ dài để qua validate</p>",
    });
  });

  test("bấm Tải ảnh lên trong Chọn ảnh → upload + tự chọn ảnh mới", async ({ page }) => {
    const api = await setup(page);
    api.onGet(/^\/admin\/assets$/, []).onPost(
      /^\/admin\/assets\/upload$/,
      {
        key: "news_images/anh-test.png",
        url: "https://cdn.studyvui.vn/news_images/anh-test.png",
        size: 68,
        lastModified: new Date().toISOString(),
        type: "image",
      },
    );
    await page.goto("/news");
    await page.getByRole("button", { name: "Thêm bài viết" }).click();
    await page.getByRole("button", { name: "Chọn ảnh" }).click();

    const dialog = page.getByRole("dialog", { name: "Chọn ảnh" });
    await expect(dialog).toBeVisible();

    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "Ảnh Test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      ),
    });

    await expect
      .poll(() => api.find("POST", /^\/admin\/assets\/upload$/))
      .toBeTruthy();

    // Anh Bang tin PHAI vao dung folder news_images/ trong R2, khong lan
    // sang uploads/ mac dinh hay folder cua trang khac (bai hoc, cau hoi...).
    const uploadReq = api.find("POST", /^\/admin\/assets\/upload$/);
    expect(uploadReq?.query.prefix).toBe("news_images");

    // Anh vua upload duoc tu dong chon, hien trong khu "Da chon"
    await expect(dialog.getByText("anh-test.png")).toBeVisible();
  });

  test("mở Sửa bài viết → điền sẵn dữ liệu → cập nhật gửi đúng payload (đủ 5 key)", async ({ page }) => {
    const api = await setup(page);
    await page.goto("/news");
    const row = page.getByRole("row", { name: new RegExp(NEWS_PUBLISHED.title) });
    await row.getByTitle("Sửa bài viết").click();

    await expect(
      page.getByRole("heading", { name: "Sửa bài viết" }),
    ).toBeVisible();

    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("#title")).toHaveValue(NEWS_PUBLISHED.title);
    await expect(dialog.locator("#content")).toHaveValue(NEWS_PUBLISHED.content);

    await dialog.locator("#title").fill("Bài đã đăng E2E (đã sửa)");
    await dialog.getByRole("button", { name: "Cập nhật" }).click();

    const patchPath = new RegExp(`^/admin/news/${NEWS_PUBLISHED.id}$`);
    await expect.poll(() => api.find("PATCH", patchPath)?.body).toBeTruthy();
    const req = api.find("PATCH", patchPath);
    expect(Object.keys(req?.body as object).sort()).toEqual(
      ["content", "hook", "image", "title", "type"].sort(),
    );
    expect(req?.body).toEqual({
      type: NEWS_PUBLISHED.type,
      title: "Bài đã đăng E2E (đã sửa)",
      hook: NEWS_PUBLISHED.hook,
      content: NEWS_PUBLISHED.content,
      image: NEWS_PUBLISHED.image,
    });
  });

  test("bấm Xuất bản trên bài nháp → gọi đúng PATCH status", async ({ page }) => {
    const api = await setup(page);
    await page.goto("/news");
    const row = page.getByRole("row", { name: new RegExp(NEWS_DRAFT.title) });
    await row.getByTitle("Xuất bản").click();

    const statusPath = new RegExp(`^/admin/news/${NEWS_DRAFT.id}/status$`);
    await expect.poll(() => api.find("PATCH", statusPath)?.body).toBeTruthy();
    const req = api.find("PATCH", statusPath);
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
