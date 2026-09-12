// Chot ranh gioi SheetJS.
//
// Vi sao can file nay: goi `xlsx` KHONG cai tu npm nua. SheetJS roi npm tu 2023,
// ban con duoc va chi phat hanh qua CDN rieng cua ho, nen tarball duoc tai ve va
// commit thang vao `vendor/`, package.json tro toi bang `file:` (xem muc "Nang
// xlsx" trong AGENTS.md, va muc 24 trong README/PLAN.md cua repo frontend).
// Duong cai dat phi chuan do co the hong theo kieu ma npm audit khong thay:
// tarball bi thay, hoac ban moi doi API.
//
// Toan bo test cu cua bulk-import chi goi ham THUAN (rowSchema/toCreateInput/
// toBulkRows) — khong co test nao cham XLSX.read/XLSX.write that. File nay lap
// kin cho trong do bang HAI nhom test, co chu y:
//   1. Vong SheetJS ghi → SheetJS doc. Bat duoc goi hong/thieu han.
//   2. Doc file do CHUONG TRINH KHAC ghi, dung bang chuoi dung chung. Nhom 1
//      mot minh KHONG du: no chi chung minh SheetJS doc duoc cai SheetJS vua
//      ghi, trong khi duong that la admin tai len file tu Excel/Google Sheets.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  BULK_COLUMNS,
  BULK_HEADER_LABELS,
  buildTemplateWorkbook,
  parseWorkbook,
  rowSchema,
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

describe("ranh gioi SheetJS: doc file do CHUONG TRINH KHAC ghi", () => {
  // Vong ghi-roi-doc o tren chi chung minh SheetJS doc duoc cai SheetJS vua ghi.
  // Duong that lai la admin tai len file tu Excel / Google Sheets, ma hai thu do
  // luu chuoi trong BANG CHUOI DUNG CHUNG (sharedStrings.xml) chu khong noi tuyen
  // nhu SheetJS. Fixture duoi day dung bang chuoi dung chung that.
  // Cach sinh lai: python lib/__tests__/fixtures/make-excel-fixture.py
  const fixture = readFileSync(
    join(__dirname, "fixtures", "bulk-import-excel.xlsx"),
  );
  const asArrayBuffer = (): ArrayBuffer =>
    fixture.buffer.slice(
      fixture.byteOffset,
      fixture.byteOffset + fixture.byteLength,
    ) as ArrayBuffer;

  it("doc duoc 2 dong du lieu, bo qua dong header", () => {
    expect(parseWorkbook(asArrayBuffer())).toHaveLength(2);
  });

  it("giai duoc chuoi tieng Viet nam trong bang chuoi dung chung", () => {
    const rows = parseWorkbook(asArrayBuffer());

    expect(rows[0].prompt).toBe("Mother có nghĩa là gì?");
    expect(rows[0].optionA).toBe("Mẹ");
    expect(rows[1].prompt).toBe("Father có nghĩa là gì?");
    expect(rows[1].correct).toBe("B");
  });

  it("doi du 12 nhan tieng Viet ve khoa tieng Anh", () => {
    const rows = parseWorkbook(asArrayBuffer());

    expect(Object.keys(rows[0]).sort()).toEqual([...BULK_COLUMNS].sort());
  });

  it("qua duoc rowSchema — tuc la du dung de nhap that", () => {
    const rows = parseWorkbook(asArrayBuffer());
    const ket = rowSchema.safeParse(rows[0]);

    expect(ket.success).toBe(true);
    // difficulty vao file la o KIEU SO (khong nam trong bang chuoi); zod ep ve number.
    expect(ket.success && ket.data.difficulty).toBe(2);
  });
});
