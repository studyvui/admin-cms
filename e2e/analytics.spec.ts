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
  ANALYTICS_ACTIVE_LEARNERS_DETAIL_0903,
} from "./fixtures/data";

// Lưới test cho trang Báo cáo phân tích (GĐ3): 4 thẻ DAU/WAU/MAU/độ chính xác, 4 chart (assert
// trên bảng dữ liệu trong <details>, KHÔNG assert nội dung/path bên trong SVG), bảng bài học sai
// nhiều, đổi khoảng thời gian refetch đúng endpoint phụ thuộc "days", cô lập lỗi 1 endpoint không
// làm trắng cả trang, và gate quyền chỉ-admin.
//
// Riêng biệt: có 1 nhóm assertion kiểm tra SVG của recharts thực sự render với chiều cao > 0 (chặn
// lỗi <ResponsiveContainer> co về 0 chiều cao trong headless Chromium — chart trắng trơn, không báo
// lỗi gì). Đây KHÔNG phải assert "nội dung/path bên trong SVG" (luật cấm ở trên nhắm vào việc assert
// dữ liệu vẽ ra, dễ vỡ khi đổi thư viện/style) — chỉ kiểm tra container không co về 0.

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

  // Chặn lỗi <ResponsiveContainer> co về 0 chiều cao trong headless Chromium (chart trắng trơn,
  // không báo lỗi gì) — chỉ kiểm tra container không co về 0, KHÔNG assert dữ liệu/path bên trong.
  // [role="application"]: SubjectSplitChart có <Legend/>, và mỗi mục legend cũng render 1
  // "svg.recharts-surface" mini-icon riêng (14x14, KHÔNG có role="application") — nếu chỉ lọc
  // theo class sẽ có lúc trúng nhầm icon đó thay vì SVG chính của chart. role="application" là
  // thuộc tính Recharts chỉ gắn cho surface GỐC của chart (RootSurface), không gắn cho icon legend.
  const svg = card.locator('svg.recharts-surface[role="application"]').first();
  await expect
    .poll(async () => (await svg.boundingBox())?.height ?? 0)
    .toBeGreaterThan(200);
});

test("3 chart còn lại (weekly-minutes, hour-histogram, subject-split) render SVG chiều cao > 0", async ({
  page,
}) => {
  const api = setup();
  await api.install(page);
  await page.goto("/analytics");

  const weeklyMinutesCard = page
    .getByText(/Phút làm bài \/ học viên \/ tuần/)
    .locator("../..");
  const hourHistogramCard = page
    .getByText("Khung giờ hoạt động (giờ Việt Nam)")
    .locator("../..");
  const subjectSplitCard = page.getByText("Phân bố hoạt động theo môn").locator("../..");

  for (const card of [weeklyMinutesCard, hourHistogramCard, subjectSplitCard]) {
    // [role="application"]: SubjectSplitChart có <Legend/>, và mỗi mục legend cũng render 1
  // "svg.recharts-surface" mini-icon riêng (14x14, KHÔNG có role="application") — nếu chỉ lọc
  // theo class sẽ có lúc trúng nhầm icon đó thay vì SVG chính của chart. role="application" là
  // thuộc tính Recharts chỉ gắn cho surface GỐC của chart (RootSurface), không gắn cho icon legend.
  const svg = card.locator('svg.recharts-surface[role="application"]').first();
    // expect.poll: ResponsiveContainer đo kích thước qua ResizeObserver sau 1 tick render — đọc
    // boundingBox() ngay lập tức có thể bắt trúng trạng thái trung gian (chưa resize xong). Poll
    // tới khi ổn định thay vì đọc 1 lần, tránh flaky do race condition (không liên quan tới bug
    // co-về-0 mà assertion này nhắm tới).
    await expect
      .poll(async () => (await svg.boundingBox())?.height ?? 0)
      .toBeGreaterThan(200);
  }
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

test("click vào cột biểu đồ ngày → mở chi tiết học viên hoạt động ngày đó, click lại → đóng", async ({
  page,
}) => {
  const api = setup().onGet(
    /^\/admin\/analytics\/active-learners-detail$/,
    (url: URL) =>
      url.searchParams.get("day") === "2026-09-03" ? ANALYTICS_ACTIVE_LEARNERS_DETAIL_0903 : [],
  );
  await api.install(page);
  await page.goto("/analytics");

  const card = page.getByText("Học viên hoạt động theo ngày").locator("../..");
  // Dữ liệu ANALYTICS_ACTIVE_LEARNERS_30D thứ tự [09-02, 09-03, 09-04] → cột index 1 = 09-03.
  // Dùng selector cấu trúc SVG của recharts để trigger click (không assert nội dung vẽ ra) —
  // theo đúng tiền lệ test SVG-height ở trên trong file này.
  await card.locator(".recharts-bar-rectangle").nth(1).click();

  await expect(card.getByText("Nguyễn Văn A")).toBeVisible();
  await expect(card.getByText("a@studyvui.vn")).toBeVisible();
  await expect(card.getByText("Tiếng Anh")).toBeVisible();
  await expect(card.getByText("80.0%")).toBeVisible(); // độ chính xác u1: 8/10

  // Click lại đúng cột đó → đóng bảng chi tiết (toggle).
  await card.locator(".recharts-bar-rectangle").nth(1).click();
  await expect(card.getByText("Nguyễn Văn A")).toHaveCount(0);
});

test("đổi khoảng thời gian trong lúc đang mở chi tiết 1 ngày → tự đóng (tránh hiện dữ liệu ngày mồ côi)", async ({
  page,
}) => {
  const api = setup().onGet(
    /^\/admin\/analytics\/active-learners-detail$/,
    (url: URL) =>
      url.searchParams.get("day") === "2026-09-03" ? ANALYTICS_ACTIVE_LEARNERS_DETAIL_0903 : [],
  );
  await api.install(page);
  await page.goto("/analytics");

  const card = page.getByText("Học viên hoạt động theo ngày").locator("../..");
  await card.locator(".recharts-bar-rectangle").nth(1).click();
  await expect(card.getByText("Nguyễn Văn A")).toBeVisible();

  // Đổi Select "30 ngày qua" → "7 ngày qua" — ngày 2026-09-03 vẫn còn trong ANALYTICS_ACTIVE_LEARNERS_7D
  // nhưng đây là hành vi CHUNG (đóng bất kể ngày đã chọn có còn trong khoảng mới hay không) — kiểm tra
  // bảng chi tiết biến mất ngay sau khi đổi filter, không phụ thuộc còn khớp hay không.
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "7 ngày qua" }).click();

  await expect(card.getByText("Nguyễn Văn A")).toHaveCount(0);
});

test("1 endpoint lỗi (active-learners 500) không làm trắng cả trang — chart/bảng khác vẫn hiện đúng dữ liệu", async ({
  page,
}) => {
  const api = new ApiMock()
    .onGet(/^\/admin\/analytics\/overview$/, ANALYTICS_OVERVIEW_FIXTURE)
    .onGet(/^\/admin\/analytics\/active-learners$/, { message: "Lỗi giả lập active-learners" }, 500)
    .onGet(/^\/admin\/analytics\/weekly-minutes$/, ANALYTICS_WEEKLY_MINUTES_FIXTURE)
    .onGet(/^\/admin\/analytics\/hour-histogram$/, ANALYTICS_HOUR_HISTOGRAM_FIXTURE)
    .onGet(/^\/admin\/analytics\/subject-split$/, ANALYTICS_SUBJECT_SPLIT_FIXTURE)
    .onGet(/^\/admin\/analytics\/problem-lessons$/, ANALYTICS_PROBLEM_LESSONS_FIXTURE);
  await api.install(page);
  await page.goto("/analytics");

  // Chart lỗi (active-learners): ChartSlot hiện banner lỗi đỏ với message thật từ backend — không
  // phải Skeleton mãi mãi, không crash trắng trang (heading tiêu đề "Học viên hoạt động theo ngày"
  // của ActiveLearnersChart KHÔNG render vì ChartSlot chặn trước khi gọi children()).
  await expect(page.getByText("Lỗi giả lập active-learners")).toBeVisible();
  await expect(page.getByText("Học viên hoạt động theo ngày")).toHaveCount(0);

  // Bằng chứng ChartSlot cô lập lỗi đúng, không lan ra toàn trang: chart weekly-minutes và bảng
  // problem-lessons (2 endpoint KHÁC) vẫn hiện đúng dữ liệu fixture bình thường.
  await expect(
    page.getByText(/Phút làm bài \/ học viên \/ tuần/),
  ).toBeVisible();
  await expect(page.getByText("Bài 3: Colors")).toBeVisible();
  await expect(page.getByText("60.0%")).toBeVisible();
});

test("editor không có quyền truy cập", async ({ context, page }) => {
  const api = setup();
  await api.install(page);
  await loginAs(context, "editor");
  await page.goto("/analytics");
  await expect(page.getByText(/không có quyền truy cập/i)).toBeVisible();
});
