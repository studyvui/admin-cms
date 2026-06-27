import type { Page, Route } from "@playwright/test";

// Giả lập backend cho E2E: chặn mọi request tới **/api/v1/** → trả fixture cho GET,
// trả success + GHI LẠI body cho POST/PATCH/DELETE (để assert payload). KHÔNG gọi backend thật.
//
// Cách dùng:
//   const api = new ApiMock().onGet(/^\/admin\/courses$/, courses);
//   await api.install(page);
//   ... thao tác ...
//   const req = api.find("POST", /^\/admin\/questions$/); expect(req?.body).toMatchObject({...});

export interface CapturedRequest {
  method: string;
  path: string; // pathname sau "/api/v1"
  body: unknown;
  query: Record<string, string>;
}

type GetResponder = (url: URL) => unknown;

export class ApiMock {
  readonly captured: CapturedRequest[] = [];
  private gets: { match: RegExp; res: unknown | GetResponder }[] = [];

  onGet(match: RegExp, res: unknown | GetResponder): this {
    this.gets.push({ match, res });
    return this;
  }

  async install(page: Page): Promise<void> {
    await page.route("**/api/v1/**", async (route: Route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname.replace(/^.*\/api\/v1/, "");
      const method = req.method();

      if (method === "GET") {
        if (path.startsWith("/auth")) return route.fulfill({ json: {} });
        for (const g of this.gets) {
          if (g.match.test(path)) {
            const body =
              typeof g.res === "function" ? (g.res as GetResponder)(url) : g.res;
            return route.fulfill({ json: body });
          }
        }
        return route.fulfill({ json: [] }); // mặc định rỗng, tránh treo UI
      }

      if (path === "/auth/refresh") {
        return route.fulfill({
          json: { accessToken: "e2e-access2", refreshToken: "e2e-refresh2" },
        });
      }

      // Ghi (POST/PATCH/DELETE): capture body để assert + trả success.
      let body: unknown;
      try {
        body = req.postDataJSON();
      } catch {
        body = undefined;
      }
      const query: Record<string, string> = {};
      url.searchParams.forEach((v, k) => (query[k] = v));
      this.captured.push({ method, path, body, query });

      const base = body && typeof body === "object" ? (body as object) : {};
      return route.fulfill({ json: { id: "e2e-new-id", success: true, ...base } });
    });
  }

  find(method: string, pathMatch: RegExp): CapturedRequest | undefined {
    return this.captured.find(
      (c) => c.method === method && pathMatch.test(c.path),
    );
  }

  all(method: string, pathMatch: RegExp): CapturedRequest[] {
    return this.captured.filter(
      (c) => c.method === method && pathMatch.test(c.path),
    );
  }
}
