import { test, expect, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loginAs } from "./helpers/auth";
import { ApiMock } from "./helpers/mock-api";
import {
  COURSES,
  LESSON,
  LESSON_PLAIN,
  LESSON_MATH_G1,
  QUESTIONS,
  QUESTIONS_GOLDEN,
  Q_MC,
  Q_IMAGE,
  Q_AUDIO,
  Q_LETTER,
  Q_G_IMAGE_PER,
  Q_G_AUDIO_PLAIN,
  Q_G_LETTER,
  Q_G_REORDER,
  Q_G_MATCHING,
  Q_G_MATCHING_LEGACY,
  Q_G_FILL_BLANK,
  Q_G_COUNT,
  Q_G_NUMREC,
  Q_G_COMPARE,
  Q_G_JSON,
  Q_G_JSON_OPTS,
} from "./fixtures/data";

// Lưới an toàn "HTML golden" cho mục 93 Đợt 4b (tách question-form.ts, question-preview-modal.tsx,
// question-dialog.tsx): ghi lại HASH của HTML đã chuẩn hoá của hộp thoại Thêm/Sửa câu hỏi ở mọi
// chế độ, của modal Xem thử ở mọi kiểu / trạng thái, và của payload gửi lên khi lưu. Dựng và chạy
// XANH trên bản chưa tách; sau khi tách phải khớp 100 %.
//   UPDATE_GOLDEN=1 npx playwright test e2e/questions-dom-golden.spec.ts   → ghi lại golden
//   GOLDEN_DUMP_DIR=<thư mục> npx playwright test …                        → ghi HTML / payload để so tay
// Không chuẩn hoá được thì KHÔNG chuẩn hoá thêm: chỉ bỏ id động của Radix / React useId và khoảng trắng.

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

const GOLDEN_FILE = path.resolve("e2e/fixtures/questions-dom-golden.json");
const UPDATE = process.env.UPDATE_GOLDEN === "1";
const DUMP_DIR = process.env.GOLDEN_DUMP_DIR;

// PNG 1x1 trong suốt: mọi request ảnh trả thành công nên <img onError> không bao giờ chạy
// (kết quả không phụ thuộc mạng).
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

function readGolden(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(GOLDEN_FILE, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function check(got: Record<string, string>) {
  if (UPDATE) {
    const merged = { ...readGolden(), ...got };
    const sorted = Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]));
    fs.writeFileSync(GOLDEN_FILE, JSON.stringify(sorted, null, 2) + "\n");
    return;
  }
  const golden = readGolden();
  const want = Object.fromEntries(Object.keys(got).map((k) => [k, golden[k]]));
  expect(got).toEqual(want);
}

function normalize(html: string): string {
  return html
    .replace(/radix-[^"\s]*/g, "radix-ID")
    .replace(/«[^»]*»/g, "ID")
    .replace(/:r[0-9a-z]+:/g, "ID")
    .replace(/_r_[0-9a-z]+_/g, "ID")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function dump(key: string, ext: string, text: string) {
  if (!DUMP_DIR) return;
  fs.mkdirSync(DUMP_DIR, { recursive: true });
  fs.writeFileSync(path.join(DUMP_DIR, key.replace(/[^A-Za-z0-9_.-]/g, "_") + ext), text);
}

/** innerHTML đã chuẩn hoá, kèm giá trị hiện tại của ô nhập (thuộc tính value không tự có trong HTML). */
async function snap(key: string, target: Locator): Promise<string> {
  const page = target.page();
  // Chờ ảnh trong hộp thoại tải xong (route trả PNG) để không phụ thuộc thời điểm.
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('[role="dialog"] img')).every(
      (i) => (i as HTMLImageElement).complete,
    ),
  );
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
  const html = await target.evaluate((el) => {
    const clone = el.cloneNode(true) as HTMLElement;
    const src = el.querySelectorAll("input,textarea");
    const dst = clone.querySelectorAll("input,textarea");
    src.forEach((s, i) => {
      const d = dst[i];
      if (s instanceof HTMLTextAreaElement) d.textContent = s.value;
      else if (s instanceof HTMLInputElement) d.setAttribute("value", s.value);
    });
    return clone.innerHTML;
  });
  const norm = normalize(html);
  dump(key, ".html", norm);
  return hash(norm);
}

function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(o[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(v);
}

async function setup(page: Page, lessons: unknown[] = [LESSON], questions: unknown[] = QUESTIONS) {
  const api = new ApiMock()
    .onGet(/^\/admin\/courses$/, COURSES)
    .onGet(/^\/admin\/lessons$/, lessons)
    .onGet(/^\/admin\/questions$/, questions);
  await api.install(page);
  await page.route(/\.(png|webp|jpe?g|gif)(\?.*)?$/i, (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: PNG_1X1 }),
  );
  // Math.random tất định (xáo thẻ chữ / từ khi lưu); reset seed ngay trước khi bấm lưu.
  await page.addInitScript(() => {
    const w = window as unknown as { __seed: number };
    w.__seed = 1;
    Math.random = () => {
      w.__seed = (w.__seed * 1664525 + 1013904223) >>> 0;
      return w.__seed / 4294967296;
    };
  });
  return api;
}

async function resetSeed(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __seed: number }).__seed = 1;
  });
}

async function openAdd(page: Page): Promise<Locator> {
  await page.goto("/questions");
  await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("#code")).toHaveValue(/_\d\d\d$/);
  return dialog;
}

async function pickMode(page: Page, dialog: Locator, label: string) {
  await dialog.getByLabel("Chế độ nhập").click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

const MODE_LABEL: Record<string, string> = {
  mc: "Trắc nghiệm 4 lựa chọn (đơn giản)",
  letter: "Điền chữ còn thiếu (kéo thẻ chữ)",
  audio_choice: "Nghe rồi chọn ảnh",
  image_choice: "Ảnh rồi chọn từ",
  reorder: "Câu (sắp xếp)",
  matching: "Ghép cặp theo tranh (nối hỏi–đáp)",
  word_blank: "Điền từ vào câu",
  json: "JSON raw (nâng cao)",
};

async function closeDialog(page: Page, dialog: Locator) {
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

async function showRows(page: Page) {
  await page.goto("/questions");
  await page.getByRole("button", { name: "Hiển thị" }).click();
}

test.beforeEach(async ({ context }) => {
  await loginAs(context, "admin");
});

test("Thêm câu hỏi — bài Tiếng Anh: 7 chế độ", async ({ page }) => {
  await setup(page);
  const dialog = await openAdd(page);
  const got: Record<string, string> = {};
  got["add:eng:mc"] = await snap("add_eng_mc", dialog);
  for (const m of ["letter", "audio_choice", "image_choice", "reorder", "matching", "word_blank"]) {
    await pickMode(page, dialog, MODE_LABEL[m]);
    got[`add:eng:${m}`] = await snap(`add_eng_${m}`, dialog);
  }
  check(got);
});

test("Thêm câu hỏi — bài không phải Tiếng Anh: mc / letter / json", async ({ page }) => {
  await setup(page, [LESSON_PLAIN]);
  const dialog = await openAdd(page);
  const got: Record<string, string> = {};
  got["add:plain:mc"] = await snap("add_plain_mc", dialog);
  for (const m of ["letter", "json"]) {
    await pickMode(page, dialog, MODE_LABEL[m]);
    got[`add:plain:${m}`] = await snap(`add_plain_${m}`, dialog);
  }
  check(got);
});

test("Thêm câu hỏi — bài Toán Lớp 1 có Dạng bài", async ({ page }) => {
  await setup(page, [LESSON_MATH_G1]);
  const dialog = await openAdd(page);
  const got: Record<string, string> = {};
  got["add:math:initial"] = await snap("add_math_initial", dialog);
  const archetype = dialog
    .getByText("Loại câu hỏi (Dạng bài theo SGK)")
    .locator("xpath=following::button[@role='combobox'][1]");
  await archetype.click();
  await page.getByRole("option").first().click();
  got["add:math:archetype-first"] = await snap("add_math_arch_first", dialog);
  await archetype.click();
  await page.getByRole("option").last().click();
  got["add:math:archetype-last"] = await snap("add_math_arch_last", dialog);
  check(got);
});

test("Sửa câu hỏi — mỗi kiểu nạp lại đúng HTML", async ({ page }) => {
  await setup(page, [LESSON], QUESTIONS_GOLDEN);
  await showRows(page);
  const got: Record<string, string> = {};
  for (const q of QUESTIONS_GOLDEN) {
    const row = page.getByRole("row", { name: new RegExp(q.code) });
    await row.getByRole("button", { name: "Sửa câu hỏi" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("#code")).toHaveValue(q.code);
    got[`edit:${q.code}`] = await snap(`edit_${q.code}`, dialog);
    await closeDialog(page, dialog);
  }
  check(got);
});

// Chọn đáp án khi xem thử (bỏ trống = kiểu không tương tác / không có lựa chọn).
const PREVIEW_PICK: [(typeof QUESTIONS_GOLDEN)[number], string | null][] = [
  [Q_MC, "cat"],
  [Q_IMAGE, "apple"],
  [Q_AUDIO, "dog"],
  [Q_LETTER, "e"],
  [Q_G_IMAGE_PER, "apple"],
  [Q_G_AUDIO_PLAIN, "bird"],
  [Q_G_LETTER, "x"],
  [Q_G_REORDER, null],
  [Q_G_MATCHING, null],
  [Q_G_MATCHING_LEGACY, null],
  [Q_G_FILL_BLANK, "bag"],
  [Q_G_COUNT, "3"],
  [Q_G_NUMREC, null],
  [Q_G_COMPARE, ">"],
  [Q_G_JSON, null],
  [Q_G_JSON_OPTS, "v"],
];

test("Xem thử — mọi kiểu: ban đầu / chọn đáp án / kiểm tra", async ({ page }) => {
  await setup(page, [LESSON], QUESTIONS_GOLDEN);
  await showRows(page);
  const got: Record<string, string> = {};
  for (const [q, pick] of PREVIEW_PICK) {
    const row = page.getByRole("row", { name: new RegExp(q.code) });
    await row.getByRole("button", { name: "Xem thử câu hỏi" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Xem thử câu hỏi/)).toBeVisible();
    got[`prev:${q.code}:0`] = await snap(`prev_${q.code}_0`, dialog);
    if (pick !== null) {
      await dialog
        .locator("button", { hasText: new RegExp("^" + pick.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$") })
        .first()
        .click();
      got[`prev:${q.code}:1`] = await snap(`prev_${q.code}_1`, dialog);
      await dialog.getByRole("button", { name: "Kiểm tra đáp án" }).click();
      got[`prev:${q.code}:2`] = await snap(`prev_${q.code}_2`, dialog);
    }
    await closeDialog(page, dialog);
  }
  check(got);
});

test("Ghép cặp (matching): chọn nhanh cặp đúng, thêm / xoá cặp nhiễu", async ({ page }) => {
  await setup(page);
  const dialog = await openAdd(page);
  await pickMode(page, dialog, MODE_LABEL.matching);
  const got: Record<string, string> = {};
  got["ix:matching:init"] = await snap("ix_matching_init", dialog);

  await dialog.getByText("Chọn nhanh từ ngân hàng...").click();
  await page.getByRole("option", { name: "What is this? — It is a pen", exact: true }).click();
  await expect(dialog.locator("#pairLeft")).toHaveValue("What is this?");
  await expect(dialog.locator("#pairRight")).toHaveValue("It is a pen");
  got["ix:matching:pair-picked"] = await snap("ix_matching_pair", dialog);

  const addBtn = dialog.getByRole("button", { name: "+ Thêm nhiễu" });
  await addBtn.click();
  await addBtn.click();
  await expect(addBtn).toBeDisabled();
  got["ix:matching:three-distractors"] = await snap("ix_matching_three", dialog);

  await dialog.getByRole("button", { name: "✕" }).first().click();
  await expect(addBtn).toBeEnabled();
  got["ix:matching:one-removed"] = await snap("ix_matching_removed", dialog);
  check(got);
});

test("Lưu câu mới: payload POST đúng cho mc / letter / reorder / word_blank / json", async ({ page }) => {
  const got: Record<string, string> = {};

  async function submitAdd(
    lessons: unknown[],
    key: string,
    fillForm: (dialog: Locator) => Promise<void>,
    mode?: string,
  ) {
    const api = await setup(page, lessons);
    const dialog = await openAdd(page);
    if (mode) await pickMode(page, dialog, MODE_LABEL[mode]);
    await fillForm(dialog);
    await resetSeed(page);
    await dialog.getByRole("button", { name: "Tạo mới" }).click();
    await expect.poll(() => api.find("POST", /^\/admin\/questions$/)?.body).toBeTruthy();
    const body = api.find("POST", /^\/admin\/questions$/)!.body;
    dump(key, ".json", canonical(body));
    got[key] = hash(canonical(body));
    await page.unroute("**/api/v1/**");
  }

  await submitAdd([LESSON], "payload:add:mc", async (d) => {
    await d.locator("#prompt").fill("Chọn con vật");
    await d.locator("#optionA").fill("cat");
    await d.locator("#optionB").fill("dog");
    await d.locator("#optionC").fill("fish");
    await d.locator("#optionD").fill("bird");
  });
  await submitAdd(
    [LESSON],
    "payload:add:letter",
    async (d) => {
      await d.locator("#markedWord").fill("h[el]lo");
    },
    "letter",
  );
  await submitAdd(
    [LESSON],
    "payload:add:reorder",
    async (d) => {
      await d.locator("#sentence").fill("It is a pen");
    },
    "reorder",
  );
  await submitAdd(
    [LESSON],
    "payload:add:word_blank",
    async (d) => {
      await d.locator("#markedSentence").fill("It is a [pen]");
      await d.locator("#wordDistractors").fill("book, bag");
    },
    "word_blank",
  );
  await submitAdd(
    [LESSON_PLAIN],
    "payload:add:json",
    async (d) => {
      await d.locator("#contentJson").fill('{"prompt":"p","options":["a","b"]}');
      await d.locator("#correctAnswer").fill("a");
    },
    "json",
  );
  check(got);
});

test("Lưu câu sửa: payload PATCH đúng cho mỗi kiểu", async ({ page }) => {
  const got: Record<string, string> = {};
  const editable = QUESTIONS_GOLDEN.filter((q) => q.code !== Q_G_MATCHING_LEGACY.code);
  for (const q of editable) {
    const api = await setup(page, [LESSON], QUESTIONS_GOLDEN);
    await showRows(page);
    const row = page.getByRole("row", { name: new RegExp(q.code) });
    await row.getByRole("button", { name: "Sửa câu hỏi" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("#code")).toHaveValue(q.code);
    await resetSeed(page);
    await dialog.getByRole("button", { name: "Cập nhật" }).click();
    const re = /^\/admin\/questions\/[^/]+$/;
    // Kiểu mà form chặn lưu (schema zod không qua) cũng là hành vi cần khoá: ghi "NO_PATCH".
    const sent = await expect
      .poll(() => api.find("PATCH", re)?.body, { timeout: 4000 })
      .toBeTruthy()
      .then(
        () => true,
        () => false,
      );
    if (sent) {
      const body = api.find("PATCH", re)!.body;
      dump(`payload_edit_${q.code}`, ".json", canonical(body));
      got[`payload:edit:${q.code}`] = hash(canonical(body));
    } else {
      got[`payload:edit:${q.code}`] = "NO_PATCH";
    }
    await page.unroute("**/api/v1/**");
  }
  check(got);
});
