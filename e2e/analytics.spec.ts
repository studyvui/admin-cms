import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import {
  ANALYTICS_OVERVIEW_FIXTURE,
  ANALYTICS_ACTIVE_LEARNERS_30D,
  ANALYTICS_ACTIVE_LEARNERS_7D,
  ANALYTICS_WEEKLY_MINUTES_FIXTURE,
  ANALYTICS_HOUR_HISTOGRAM_FIXTURE,
  ANALYTICS_SUBJECT_SPLIT_FIXTURE,
  ANALYTICS_PROBLEM_LESSONS_FIXTURE,
} from "./fixtures/data";

// Lưới test cho trang Báo cáo phân tích (GĐ3): 4 thẻ DAU/WAU/MAU/độ chính xác, 4 chart (assert
// trên bảng dữ liệu trong <details>, KHÔNG BAO GIỜ trên SVG), bảng bài học sai nhiều, đổi khoảng
// thời gian refetch đúng endpoint phụ thuộc "days", và gate quyền chỉ-admin.

function setup() {
  return new ApiMock()
    .onGet(/^\/admin\/analytics\/overview$/, ANALYTICS_OVERVIEW_FIXTURE)
    .onGet(/^\/admin\/analytics\/active-learners$/, (url: URL) =>
      url.searchParams.get("days") === "7"
        ? ANALYTICS_ACTIVE_LEARNERS_7D
        : ANALYTICS_ACTIVE_LEARNERS_30D,
    )
    .onGet(/^\/admin\/analytics\/weekly-minutes$/, ANALYTICS_WEEKLY_MINUTES_FIXTURE)
    .onGet(/^\/admin\/analytics\/hour-histogram$/, ANALYTICS_HOUR_HISTOGRAM_FIXTURE)
    .onGet(/^\/admin\/analytics\/subject-split$/, ANALYTICS_SUBJECT_SPLIT_FIXTURE)
    .onGet(/^\/admin\/analytics\/problem-lessons$/, ANALYTICS_PROBLEM_LESSONS_FIXTURE);
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("hiện 4 thẻ DAU/WAU/MAU/độ chính xác từ overview (mock)", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  await expect(page.getByRole("heading", { name: "Báo cáo phân tích" })).toBeVisible();
  // .first(): "12" cũng trùng nhãn trục Y của chart bên dưới (SVG tick), nên khớp nhiều phần tử —
  // 4 thẻ tóm tắt luôn render TRƯỚC các chart trong DOM nên .first() luôn trỏ đúng thẻ tóm tắt.
  await expect(page.getByText("12", { exact: true }).first()).toBeVisible(); // dau
  await expect(page.getByText("45", { exact: true }).first()).toBeVisible(); // wau
  await expect(page.getByText("120", { exact: true }).first()).toBeVisible(); // mau
  await expect(page.getByText("78.2%").first()).toBeVisible(); // accuracyLast30Days
});

test("chart học viên hoạt động: bảng dữ liệu trong <details> khớp fixture", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  const card = page.getByText("Học viên hoạt động theo ngày").locator("../..");
  await card.getByText("Xem số liệu").click();
  await expect(card.getByRole("cell", { name: "22", exact: true })).toBeVisible();
});

test("bảng bài học sai nhiều nhất hiện đúng dữ liệu mock", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  await expect(page.getByText("Bài 3: Colors")).toBeVisible();
  await expect(page.getByText("60.0%")).toBeVisible(); // wrongRate
});

test("nhãn phút/học viên/tuần hiển thị chú thích trung thực (không phải 'thời gian dùng app')", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  await expect(
    page.getByText(/Phút làm bài \/ học viên \/ tuần \(ước tính từ thời gian trả lời/),
  ).toBeVisible();
  // Nhãn ĐÚNG (MINUTES_DISCLAIMER) chủ đích nhắc tới cụm "thời gian dùng app" để PHỦ ĐỊNH nó
  // ("... không phải tổng thời gian dùng app") — nên không thể assert cụm này có count 0 trên
  // toàn trang. Thay vào đó assert KHÔNG có nhãn rút gọn sai đứng ĐỘC LẬP (exact match) là "Thời
  // gian dùng app" — đúng tinh thần "không được rút gọn thành..." trong lib/analytics/labels.ts.
  await expect(page.getByText("Thời gian dùng app", { exact: true })).toHaveCount(0);
});

test("đổi khoảng thời gian sang 7 ngày → active-learners hiện dữ liệu 7 ngày", async ({ page }) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  const card = page.getByText("Học viên hoạt động theo ngày").locator("../..");
  await card.getByText("Xem số liệu").click();
  await expect(card.getByRole("row")).toHaveCount(4); // header + 3 ngày (30 ngày qua)

  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "7 ngày qua" }).click();

  // Khi "days" đổi, ChartSlot tạm hiện Skeleton trong lúc refetch rồi mount lại ActiveLearnersChart
  // mới → <details> (state DOM gốc, không phải React state) bị reset về đóng. Phải mở lại trước khi
  // đếm hàng — đây là hành vi thật của app khi refetch theo query key mới, không phải lỗi test.
  await card.getByText("Xem số liệu").click();
  await expect(card.getByRole("row")).toHaveCount(3); // header + 2 ngày (7 ngày qua)
});

test("editor không có quyền truy cập", async ({ context, page }) => {
  const api = setup();
  await api.install(page);
  await loginAs(context, "editor");
  await page.goto("/analytics");
  await expect(page.getByText(/không có quyền truy cập/i)).toBeVisible();
});
