import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import { ASSETS } from "./fixtures/data";

// Lưới test cho trang Kho asset. Viết TRƯỚC khi refactor (Phase 3) để chụp hành vi hiện tại.

async function setup(page: import("@playwright/test").Page) {
  const api = new ApiMock().onGet(/^\/admin\/assets$/, ASSETS);
  await api.install(page);
  return api;
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("render danh sách asset (flat) từ dữ liệu (mock)", async ({ page }) => {
  await setup(page);
  await page.goto("/assets");
  await expect(page.getByRole("heading", { name: "Kho asset" })).toBeVisible();
  await expect(page.getByText("cat.png")).toBeVisible();
  await expect(page.getByText("dog.png")).toBeVisible();
  await expect(page.getByText("cat.mp3")).toBeVisible();
});

test("tìm kiếm lọc theo tên", async ({ page }) => {
  await setup(page);
  await page.goto("/assets");
  await page.getByPlaceholder("Lọc theo tên...").fill("dog");
  await expect(page.getByText("dog.png")).toBeVisible();
  await expect(page.getByText("cat.png")).toHaveCount(0);
  await expect(page.getByText("cat.mp3")).toHaveCount(0);
});
