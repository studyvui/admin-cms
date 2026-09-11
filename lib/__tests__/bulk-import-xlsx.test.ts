// Chot ranh gioi SheetJS.
//
// Vi sao can file nay: goi `xlsx` KHONG cai tu npm nua. SheetJS roi npm tu 2023,
// ban con duoc va chi phat hanh qua CDN rieng cua ho, nen package.json ghim thang
// vao mot URL tarball (xem muc 24 trong README/PLAN.md cua repo frontend).
// Duong cai dat phi chuan do co the hong theo kieu ma npm audit khong thay:
// tarball doi noi dung, CDN tra ve ban khac, hoac ban moi doi API.
//
// Toan bo test cu cua bulk-import chi goi ham THUAN (rowSchema/toCreateInput/
// toBulkRows) — khong co test nao cham XLSX.read/XLSX.write that. File nay lap
// kin cho trong do bang mot vong ghi-roi-doc di qua dung API san pham dang dung.
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  BULK_COLUMNS,
  BULK_HEADER_LABELS,
  buildTemplateWorkbook,
  parseWorkbook,
} from "@/lib/bulk-import";

/** Ghi workbook ra dung dinh dang .xlsx ma trinh duyet tai ve, tra lai bytes tho. */
function writeToArrayBuffer(wb: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("ranh gioi SheetJS: ghi .xlsx roi doc lai", () => {
  it("giu du 12 cot va doi nhan tieng Viet ve khoa tieng Anh", () => {
    const rows = parseWorkbook(writeToArrayBuffer(buildTemplateWorkbook()));

    // Template co 1 dong mau + 1 dong huong dan (header khong tinh la dong du lieu).
    expect(rows).toHaveLength(2);

    // Header trong file la NHAN TIENG VIET; parseWorkbook phai doi nguoc ve khoa
    // tieng Anh, neu khong thi zod o buoc sau bao thieu truong het ca 12 cot.
    expect(Object.keys(rows[0]).sort()).toEqual([...BULK_COLUMNS].sort());
  });

  it("giu nguyen gia tri o co dau tieng Viet va so", () => {
    const rows = parseWorkbook(writeToArrayBuffer(buildTemplateWorkbook()));
    const mau = rows[0];

    expect(mau.prompt).toBe("Hello có nghĩa là gì?");
    expect(mau.correct).toBe("A");
    // difficulty vao workbook la SO 1, nhung parseWorkbook doc voi raw:false nen
    // ra chuoi "1" — rowSchema o buoc sau ep kieu. Khoa lai de doi ban xlsx
    // khong am tham doi kieu trả ve.
    expect(mau.difficulty).toBe("1");
  });

  it("khong nhan nham dong huong dan lam du lieu that", () => {
    const rows = parseWorkbook(writeToArrayBuffer(buildTemplateWorkbook()));

    // Dong thu 2 la dong huong dan dang "<lessonCode>", "<code>", ...
    expect(rows[1].lessonCode).toBe("<lessonCode>");
  });

  it("nhan dien duoc nhan tieng Viet that su nam trong file", () => {
    const wb = buildTemplateWorkbook();
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false });

    expect(aoa[0]).toEqual(BULK_COLUMNS.map((c) => BULK_HEADER_LABELS[c]));
  });
});
