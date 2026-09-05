import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import {
  USERS_LIST_FIXTURE,
  USER_STATS_FIXTURE,
  USER_ADMIN_SELF,
  USER_STUDENT,
  USER_TEACHER_INACTIVE,
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

test("khoá tài khoản → 4 thẻ thống kê refetch số liệu mới ngay, không cần remount (fix wave)", async ({
  page,
}) => {
  const patchPath = new RegExp(`/admin/users/${USER_STUDENT.id}$`);
  // stats "động": trả số liệu MỚI ngay khi phát hiện đã có 1 PATCH khoá thành công — mô phỏng
  // backend thật, để chứng minh statsQuery bị invalidate CÙNG usersQuery (key con của
  // "admin-users") thay vì đứng riêng ["admin-users-stats"] như bug cũ.
  const LOCKED_STATS = {
    ...USER_STATS_FIXTURE,
    active: USER_STATS_FIXTURE.active - 1,
    inactive: USER_STATS_FIXTURE.inactive + 1,
  };
  const api = new ApiMock()
    .onGet(/^\/admin\/users$/, USERS_LIST_FIXTURE)
    .onGet(/^\/admin\/users\/stats$/, () =>
      api.find("PATCH", patchPath) ? LOCKED_STATS : USER_STATS_FIXTURE,
    );
  await api.install(page);
  page.on("dialog", (d) => d.accept());
  await page.goto("/users");

  const activeCard = page
    .getByRole("heading", { name: "Đang hoạt động" })
    .locator("..")
    .locator("..");
  const lockedCard = page
    .getByRole("heading", { name: "Đã khoá" })
    .locator("..")
    .locator("..");

  await expect(
    activeCard.getByText(String(USER_STATS_FIXTURE.active), { exact: true }),
  ).toBeVisible();
  await expect(
    lockedCard.getByText(String(USER_STATS_FIXTURE.inactive), { exact: true }),
  ).toBeVisible();

  const row = page.getByRole("row", { name: new RegExp(USER_STUDENT.email) });
  await row.getByTitle("Khoá tài khoản").click();
  await expect.poll(() => api.find("PATCH", patchPath)?.body).toBeTruthy();

  await expect(
    activeCard.getByText(String(LOCKED_STATS.active), { exact: true }),
  ).toBeVisible();
  await expect(
    lockedCard.getByText(String(LOCKED_STATS.inactive), { exact: true }),
  ).toBeVisible();
});

test("lỗi Khoá 1 dòng KHÔNG rò banner sang dialog Sửa của dòng khác (fix wave)", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);

  // updateMut dùng chung cho cả nút Khoá/Mở khoá ở bảng lẫn form Sửa — giả lập PATCH khoá
  // USER_STUDENT fail 403 (route riêng, chạy TRƯỚC route rộng của ApiMock vì đăng ký sau).
  await page.route(
    `**/api/v1/admin/users/${USER_STUDENT.id}`,
    async (route) => {
      if (route.request().method() === "PATCH") {
        return route.fulfill({
          status: 403,
          json: { statusCode: 403, message: "Không đủ quyền khoá tài khoản này" },
        });
      }
      return route.fallback();
    },
  );

  page.on("dialog", (d) => d.accept());
  await page.goto("/users");

  const studentRow = page.getByRole("row", {
    name: new RegExp(USER_STUDENT.email),
  });
  await studentRow.getByTitle("Khoá tài khoản").click();
  // Đợi mutation settle (thất bại) — nút hết pending trở lại bấm được.
  await expect(studentRow.getByTitle("Khoá tài khoản")).toBeEnabled();

  // Mở dialog Sửa cho MỘT DÒNG KHÁC — banner lỗi 403 cũ (updateMut.error) KHÔNG được rò sang.
  const teacherRow = page.getByRole("row", {
    name: new RegExp(USER_TEACHER_INACTIVE.email),
  });
  await teacherRow.getByTitle("Sửa người dùng").click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Sửa người dùng" }),
  ).toBeVisible();
  await expect(dialog.getByText(/Không đủ quyền/)).not.toBeVisible();
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
