import { defineConfig, devices } from "@playwright/test";

// Lưới test UI (E2E) chạy LOCAL bằng trình duyệt thật + giả lập network (xem e2e/helpers/mock-api.ts).
// KHÔNG gọi backend thật → không ghi production. webServer tự khởi động Next dev server.
export default defineConfig({
  testDir: "./e2e",
  // workers:1 cho deterministic (agent ưu tiên tin cậy hơn tốc độ). Mỗi test vẫn có context riêng.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
