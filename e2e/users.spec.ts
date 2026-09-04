import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import {
  USERS_LIST_FIXTURE,
  USER_STATS_FIXTURE,
  USER_ADMIN_SELF,
  USER_STUDENT,
} from "./fixtures/data";

// Lưới test cho trang Quản lý người dùng (GĐ2): danh sách + 4 thẻ thống kê, tạo user (payload
// đúng key theo role — có/không "grade"), khoá tài khoản (confirm() + payload), tự bảo vệ (ẩn
// nút Khoá/Xoá ở chính dòng admin đang đăng nhập), và gate quyền chỉ-admin.

function setup() {
  return new ApiMock()
    .onGet(/^\/admin\/users\/stats$/, USER_STATS_FIXTURE)
    .onGet(/^\/admin\/users$/, USERS_LIST_FIXTURE);
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("hiện danh sách + 4 thẻ thống kê từ dữ liệu (mock)", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/users");

  await expect(page.getByRole("heading", { name: "Người dùng" })).toBeVisible();
  await expect(page.getByText(USER_STUDENT.email)).toBeVisible();
  await expect(page.getByText(USER_ADMIN_SELF.email)).toBeVisible();

  // 4 thẻ tóm tắt từ usersApi.stats() — dùng role heading vì "Đang hoạt động" còn xuất hiện ở
  // Select trạng thái (mặc định "active") và Badge trạng thái trong bảng.
  await expect(page.getByRole("heading", { name: "Tổng số" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Đang hoạt động" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đã khoá" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Mới trong 30 ngày" }),
  ).toBeVisible();
});

test("tạo user role student + grade → POST đúng 5 key {email,name,password,role,grade}", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/users");

  await page.getByRole("button", { name: "Thêm người dùng" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Thêm người dùng mới" }),
  ).toBeVisible();

  // Vai trò mặc định là "student" → ô Lớp hiện sẵn.
  await expect(dialog.locator("#create-grade")).toBeVisible();

  await dialog.locator("#create-email").fill("hs.moi@studyvui.vn");
  await dialog.locator("#create-name").fill("Học sinh Mới");
  await dialog.locator("#create-password").fill("mat-khau-1");
  await dialog.locator("#create-grade").fill("3");
  await dialog.getByRole("button", { name: "Tạo mới" }).click();

  await expect
    .poll(() => api.find("POST", /^\/admin\/users$/)?.body)
    .toBeTruthy();
  const body = api.find("POST", /^\/admin\/users$/)!.body;
  expect(body).toEqual({
    email: "hs.moi@studyvui.vn",
    name: "Học sinh Mới",
    password: "mat-khau-1",
    role: "student",
    grade: 3,
  });

  // Dialog tự đóng sau khi tạo thành công.
  await expect(dialog).not.toBeVisible();
});

test("tạo user role khác student → POST đúng 4 key, KHÔNG có key grade", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/users");

  await page.getByRole("button", { name: "Thêm người dùng" }).click();
  const dialog = page.getByRole("dialog");

  await dialog.getByLabel("Vai trò").click();
  await page.getByRole("option", { name: "Giáo viên" }).click();
  // Đổi sang role khác student → ô Lớp phải ẩn đi.
  await expect(dialog.locator("#create-grade")).toHaveCount(0);

  await dialog.locator("#create-email").fill("gv.moi@studyvui.vn");
  await dialog.locator("#create-name").fill("Giáo viên Mới");
  await dialog.locator("#create-password").fill("mat-khau-1");
  await dialog.getByRole("button", { name: "Tạo mới" }).click();

  await expect
    .poll(() => api.find("POST", /^\/admin\/users$/)?.body)
    .toBeTruthy();
  const body = api.find("POST", /^\/admin\/users$/)!.body as Record<
    string,
    unknown
  >;
  expect(Object.keys(body).sort()).toEqual(
    ["email", "name", "password", "role"].sort(),
  );
  expect(body.role).toBe("teacher");
});

test("khoá tài khoản (không phải chính mình) → confirm() rồi PATCH {isActive:false}", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/users");

  page.on("dialog", (d) => d.accept());

  const row = page.getByRole("row", { name: new RegExp(USER_STUDENT.email) });
  await row.getByTitle("Khoá tài khoản").click();

  await expect
    .poll(() => api.find("PATCH", new RegExp(`/admin/users/${USER_STUDENT.id}$`))?.body)
    .toBeTruthy();
  const body = api.find(
    "PATCH",
    new RegExp(`/admin/users/${USER_STUDENT.id}$`),
  )!.body;
  expect(body).toEqual({ isActive: false });
});

test("tự bảo vệ: dòng của chính admin đang đăng nhập ẩn nút Khoá và Xoá", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/users");

  const selfRow = page.getByRole("row", {
    name: new RegExp(USER_ADMIN_SELF.email),
  });
  await expect(selfRow).toBeVisible();
  await expect(selfRow.getByTitle("Khoá tài khoản")).toHaveCount(0);
  await expect(selfRow.getByTitle("Xoá người dùng")).toHaveCount(0);
  // Sửa + Đặt lại mật khẩu vẫn cho phép trên chính dòng của mình.
  await expect(selfRow.getByTitle("Sửa người dùng")).toBeVisible();

  // Dòng KHÔNG phải chính mình vẫn thấy đủ nút Khoá + Xoá.
  const otherRow = page.getByRole("row", {
    name: new RegExp(USER_STUDENT.email),
  });
  await expect(otherRow.getByTitle("Khoá tài khoản")).toBeVisible();
  await expect(otherRow.getByTitle("Xoá người dùng")).toBeVisible();
});

test("editor không có quyền truy cập", async ({ context, page }) => {
  const api = setup();
  await api.install(page);
  await loginAs(context, "editor");
  await page.goto("/users");
  await expect(page.getByText(/không có quyền truy cập/i)).toBeVisible();
});
