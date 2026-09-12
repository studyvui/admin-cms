import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import {
  USERS_LIST_FIXTURE,
  USER_STATS_FIXTURE,
  USER_STUDENT,
  USER_TEACHER_INACTIVE,
} from "./fixtures/data";

// [PLAN.md muc 25] Lưới test cho nút "Kích hoạt VIP" (icon Star) ở trang Quản lý người dùng:
// chỉ hiện với role student, bấm mở GrantVipDialog, nhập số ngày hợp lệ → POST đúng endpoint
// + payload {days}, hiện kết quả ngày hết hạn.

function setup() {
  return new ApiMock()
    .onGet(/^\/admin\/users\/stats$/, USER_STATS_FIXTURE)
    .onGet(/^\/admin\/users$/, USERS_LIST_FIXTURE);
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("nhập số ngày hợp lệ → POST đúng endpoint + payload {days}, hiện ngày hết hạn", async ({
  page,
}) => {
  const grantVipPath = new RegExp(`/admin/users/${USER_STUDENT.id}/grant-vip$`);
  const api = setup().onPost(grantVipPath, {
    id: USER_STUDENT.id,
    endsAt: "2026-10-12T00:00:00.000Z",
  });
  await api.install(page);
  await page.goto("/users");

  const row = page.getByRole("row", { name: new RegExp(USER_STUDENT.email) });
  await row.getByTitle("Kích hoạt VIP").click();

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Kích hoạt VIP" }),
  ).toBeVisible();

  await dialog.getByLabel(/Số ngày/).fill("30");
  await dialog.getByRole("button", { name: "Kích hoạt VIP" }).click();

  await expect
    .poll(() => api.find("POST", grantVipPath)?.body)
    .toBeTruthy();
  const body = api.find("POST", grantVipPath)!.body;
  expect(body).toEqual({ days: 30 });

  await expect(dialog.getByText(/Đã kích hoạt VIP thành công/)).toBeVisible();
  await expect(dialog.getByText(/Hết hạn/)).toBeVisible();
});

test("dòng không phải student (giáo viên) không có nút Kích hoạt VIP", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/users");

  const teacherRow = page.getByRole("row", {
    name: new RegExp(USER_TEACHER_INACTIVE.email),
  });
  await expect(teacherRow.getByTitle("Kích hoạt VIP")).toHaveCount(0);

  const studentRow = page.getByRole("row", {
    name: new RegExp(USER_STUDENT.email),
  });
  await expect(studentRow.getByTitle("Kích hoạt VIP")).toBeVisible();
});

test("số ngày không hợp lệ (0, > 3650, rỗng, không nguyên) → nút Kích hoạt VIP bị vô hiệu hoá", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/users");

  const row = page.getByRole("row", { name: new RegExp(USER_STUDENT.email) });
  await row.getByTitle("Kích hoạt VIP").click();

  const dialog = page.getByRole("dialog");
  const oNgay = dialog.getByLabel(/Số ngày/);
  const nutKichHoat = dialog.getByRole("button", { name: "Kích hoạt VIP" });

  // Giá trị mặc định "30" hợp lệ → nút phải đang bật, để chắc chắn các assertion bên dưới
  // thật sự do giá trị nhập gây ra chứ không phải nút vốn đã disable sẵn.
  await expect(nutKichHoat).toBeEnabled();

  for (const giaTri of ["0", "4000", "", "1.5"]) {
    await oNgay.fill(giaTri);
    await expect(nutKichHoat).toBeDisabled();
  }
});

test("backend trả lỗi khi kích hoạt VIP → hiện thông báo lỗi trong dialog", async ({
  page,
}) => {
  const grantVipPath = new RegExp(`/admin/users/${USER_STUDENT.id}/grant-vip$`);
  // status 400 để giả lập mutation.error (vd tài khoản đã bị khoá) — assert extractError()
  // đọc đúng field `message` từ response lỗi và hiện ra cho admin thấy.
  const api = setup().onPost(
    grantVipPath,
    { statusCode: 400, message: "Không thể kích hoạt VIP: tài khoản đã bị khoá" },
    400,
  );
  await api.install(page);
  await page.goto("/users");

  const row = page.getByRole("row", { name: new RegExp(USER_STUDENT.email) });
  await row.getByTitle("Kích hoạt VIP").click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Số ngày/).fill("30");
  await dialog.getByRole("button", { name: "Kích hoạt VIP" }).click();

  await expect(
    dialog.getByText("Không thể kích hoạt VIP: tài khoản đã bị khoá"),
  ).toBeVisible();
});
