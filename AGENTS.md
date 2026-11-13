# StudyVui Admin CMS — hướng dẫn cho AI agent

> ⚠️ Repo này **CÔNG KHAI**. KHÔNG BAO GIỜ ghi mật khẩu, secret, token, khoá API, tài khoản thật vào bất kỳ file
> nào ở đây (code, README, tài liệu, comment). Lịch sử git công khai giữ mãi mãi.

## Luật + kiến thức ở đâu

Luật bắt buộc và kiến thức của dự án nằm ở repo **STUDYVUI** (riêng tư), thư mục `.claude/`:
`rules/admin-cms/` (CMS-*), `rules/chung.md` (deploy, git, secret), `learnings/codebase/admin-cms-*.md`.
Làm việc với Claude Code từ workspace STUDYVUI (admin-cms là thư mục bổ sung) — skill `xu_ly_cong_viec` tự nạp
đúng luật cho việc đụng repo này.

## Deploy (tóm tắt)

- `dev` → Vercel preview. Merge `main` → Vercel deploy production `admin.studyvui.vn`.
- CHỈ merge `main` khi chủ dự án đã test OK và ra lệnh rõ ràng. Mọi thao tác production phải hỏi xác nhận trước.

## Tối thiểu khi sửa code ở đây

- Cổng trước commit: `npm test` · `npx tsc --noEmit` · `npm run build` · `npx eslint .` (không tăng so với `main`) ·
  `npm run test:e2e`.
**Quy tắc rút gọn:** (1) logic tính toán/validate/transform → `lib/` + test (JSX chỉ render data);
(2) file ≤ ~500 dòng, 1 file = 1 concern; (3) hook/field khác bản chất **KHÔNG gộp** (tránh trừu tượng sai);
(4) icon-button phải có `title`/`aria-label` (testable = accessible).

## Nâng xlsx (SheetJS) — PHẢI LÀM TAY

`package.json` trỏ `xlsx` vào **tarball nằm ngay trong repo**, không phải dải version npm:

```
"xlsx": "file:vendor/xlsx-0.20.3.tgz"
```

**Lý do:** SheetJS rời npm từ 2023. Bản npm cao nhất là 0.18.5 và dính 2 lỗ hổng
(GHSA-4r6h-8v6p-xvw6 prototype pollution, GHSA-5pgg-2g8v-p4x9 ReDoS) mà **vĩnh viễn
không có bản vá trên npm**. Bản sạch chỉ phát hành qua CDN riêng của họ, nên ta tải
về một lần rồi commit thẳng vào `vendor/`.

**Tại sao vendor chứ không trỏ thẳng URL CDN:** trỏ URL thì mọi lần `npm ci` trên
Vercel đều phải tải được `cdn.sheetjs.com`. CDN sập đúng lúc cache miss là **kẹt
toàn bộ deploy**, kể cả hotfix không liên quan gì tới Excel. Vendor thì build
không chạm mạng ngoài nữa — đã kiểm chứng bằng `npm ci --offline` trên một bản
chép sạch: 537 gói, thành công, 0 lỗ hổng.

**Cách nâng lên bản mới:**

```bash
curl -o vendor/xlsx-<ver>.tgz https://cdn.sheetjs.com/xlsx-<ver>/xlsx-<ver>.tgz
npm install --save file:vendor/xlsx-<ver>.tgz
git rm vendor/xlsx-<ban-cu>.tgz      # dọn bản cũ, tarball ~2.4MB
```

**Hệ quả phải nhớ:**

1. **Dependabot không tự nâng được** dependency dạng `file:` — phải làm tay theo trên.
2. **`npm audit` thì VẪN bắt được** — nó đối chiếu theo tên + version trong cây phụ
   thuộc, không quan tâm tải từ đâu. Advisory mới của xlsx vẫn hiện ra.
3. **`package-lock.json` vẫn giữ hash `integrity`** của tarball, nên `npm ci` vẫn
   phát hiện được nếu file bị sửa.
4. **Test chốt ranh giới:** `lib/__tests__/bulk-import-xlsx.test.ts`. Đừng xóa.
   Nó đọc cả file do chính SheetJS ghi lẫn file dùng **bảng chuỗi dùng chung**
   (`sharedStrings.xml`) — kiểu mà Excel và Google Sheets ghi ra, tức kiểu file thật
   mà admin tải lên. Fixture sinh lại bằng
   `python lib/__tests__/fixtures/make-excel-fixture.py` (tái lập được từng byte).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
