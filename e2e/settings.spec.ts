import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import { SETTINGS_FIXTURE, PROFILE_FIXTURE } from "./fixtures/data";

// Lưới test cho trang Cài đặt (GĐ1 Settings): 2 tab (Tài khoản / Cấu hình hệ thống),
// auto-save switch boolean, đổi mật khẩu (kèm bẫy setTokens sau khi đổi), gate quyền admin.

function setup() {
  return new ApiMock()
    .onGet(/^\/admin\/settings$/, SETTINGS_FIXTURE)
    .onGet(/^\/users\/me\/profile$/, PROFILE_FIXTURE);
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("hiện 2 tab và dữ liệu cài đặt", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Tài khoản/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Cấu hình/ })).toBeVisible();

  // Tab "Tài khoản của tôi" active mặc định — form đã nạp tên từ profile.
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue(PROFILE_FIXTURE.name);

  // Chuyển sang tab hệ thống — thấy setting đã nạp, gom theo nhóm category.
  await page.getByRole("tab", { name: /Cấu hình/ }).click();
  await expect(page.getByText("Chế độ bảo trì")).toBeVisible();
  await expect(page.getByText("Giới hạn upload (MB)")).toBeVisible();
});

test("bật/tắt switch gửi đúng payload", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/settings");
  await page.getByRole("tab", { name: /Cấu hình/ }).click();

  const toggle = page.getByRole("switch", { name: "Chế độ bảo trì" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();

  await expect
    .poll(
      () =>
        api.find("PATCH", /^\/admin\/settings\/system\.maintenance_mode$/)
          ?.body,
    )
    .toBeTruthy();
  const req = api.find(
    "PATCH",
    /^\/admin\/settings\/system\.maintenance_mode$/,
  );
  // Hợp đồng quan trọng nhất: PATCH chỉ gửi { value }, không field thừa.
  expect(req?.body).toEqual({ value: true });
});

test("đổi mật khẩu gửi đúng payload và không bị đăng xuất", async ({
  page,
}) => {
  const api = setup().onPost(/^\/auth\/change-password$/, {
    accessToken: "new-a",
    refreshToken: "new-r",
  });
  await api.install(page);
  await page.goto("/settings");

  await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Đổi mật khẩu" }),
  ).toBeVisible();

  await dialog.getByLabel("Mật khẩu hiện tại").fill("old-secret");
  await dialog.getByLabel("Mật khẩu mới", { exact: true }).fill("new-secret1");
  await dialog.getByLabel("Xác nhận mật khẩu mới").fill("new-secret1");
  await dialog.getByRole("button", { name: "Đổi mật khẩu" }).click();

  await expect
    .poll(() => api.find("POST", /^\/auth\/change-password$/)?.body)
    .toBeTruthy();
  const body = api.find("POST", /^\/auth\/change-password$/)!.body;
  // Chỉ {oldPassword, newPassword} — KHÔNG có confirmPassword.
  expect(body).toEqual({
    oldPassword: "old-secret",
    newPassword: "new-secret1",
  });

  // Dialog tự đóng sau khi thành công.
  await expect(dialog).not.toBeVisible();
  // KHÔNG bị điều hướng về /login — bằng chứng setTokens() đã chạy trong onSuccess trước khi
  // bất kỳ request nào khác dùng access token cũ (đã bị thu hồi) và bị 401 → redirect.
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible();
});

test("editor không có quyền truy cập", async ({ context, page }) => {
  const api = setup();
  await api.install(page);
  await loginAs(context, "editor");
  await page.goto("/settings");
  await expect(page.getByText(/không có quyền truy cập/i)).toBeVisible();
});
