import type { BrowserContext } from "@playwright/test";

// Seed phiên đăng nhập GIẢ để bypass login mà KHÔNG gọi backend.
// Khớp: Zustand persist key "studyvui-admin-auth" (lib/stores/auth-store.ts)
//       + cookie "sv-admin-session=1" (lib/session-cookie.ts + middleware.ts).
// Gọi TRƯỚC page.goto().

export type SeedRole = "admin" | "editor" | "qa";

const USERS: Record<
  SeedRole,
  { id: string; email: string; name: string; role: SeedRole }
> = {
  admin: { id: "u-admin", email: "admin@studyvui.vn", name: "Admin E2E", role: "admin" },
  editor: { id: "u-editor", email: "editor@studyvui.vn", name: "Editor E2E", role: "editor" },
  qa: { id: "u-qa", email: "qa@studyvui.vn", name: "QA E2E", role: "qa" },
};

export async function loginAs(
  context: BrowserContext,
  role: SeedRole = "admin",
): Promise<void> {
  const persisted = JSON.stringify({
    state: {
      user: USERS[role],
      accessToken: "e2e-access",
      refreshToken: "e2e-refresh",
    },
    version: 0,
  });
  await context.addCookies([
    { name: "sv-admin-session", value: "1", domain: "localhost", path: "/" },
  ]);
  await context.addInitScript((data) => {
    window.localStorage.setItem("studyvui-admin-auth", data as string);
  }, persisted);
}
