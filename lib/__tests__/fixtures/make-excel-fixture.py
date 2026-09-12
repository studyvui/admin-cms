# -*- coding: utf-8 -*-
"""Sinh lib/__tests__/fixtures/bulk-import-excel.xlsx.

Vi sao dung file nay thay vi de SheetJS tu ghi ra: SheetJS ghi chuoi theo kieu
NOI TUYEN (t="inlineStr"), con Excel va Google Sheets ghi theo BANG CHUOI DUNG
CHUNG (sharedStrings.xml, o co t="s" tro toi chi so trong bang). File that ma
admin tai len luon thuoc kieu thu hai. Neu chi test vong SheetJS-ghi-SheetJS-doc
thi khau doc bang chuoi dung chung KHONG he duoc kiem, du do moi la duong that.

Chay lai khi can: python lib/__tests__/fixtures/make-excel-fixture.py
"""
import os
import zipfile

HEADERS = [
    "M\u00e3 b\u00e0i h\u1ecdc", "M\u00e3 c\u00e2u h\u1ecfi", "Lo\u1ea1i c\u00e2u h\u1ecfi",
    "K\u1ef9 n\u0103ng", "\u0110\u1ed9 kh\u00f3 (1-5)", "\u0110\u1ec1 b\u00e0i",
    "L\u1ef1a ch\u1ecdn A", "L\u1ef1a ch\u1ecdn B", "L\u1ef1a ch\u1ecdn C", "L\u1ef1a ch\u1ecdn D",
    "\u0110\u00e1p \u00e1n \u0111\u00fang (A/B/C/D)",
    "Asset refs (ph\u00e2n t\u00e1ch b\u1eb1ng d\u1ea5u ph\u1ea9y)",
]
# difficulty de nguyen kieu SO — o kieu so trong xlsx khong nam trong bang chuoi.
ROWS = [
    ["G1_W02_VOCAB_FAMILY", "G1_W02_VOCAB_001", "multiple_choice", "vocab", 2,
     "Mother c\u00f3 ngh\u0129a l\u00e0 g\u00ec?", "M\u1eb9", "B\u1ed1", "Ch\u1ecb", "Em",
     "A", "grade1/english/mother_1.png"],
    ["G1_W02_VOCAB_FAMILY", "G1_W02_VOCAB_002", "multiple_choice", "vocab", 3,
     "Father c\u00f3 ngh\u0129a l\u00e0 g\u00ec?", "M\u1eb9", "B\u1ed1", "\u00d4ng", "B\u00e0",
     "B", "grade1/english/father_1.png"],
]

XML_ESC = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}


def esc(s):
    return "".join(XML_ESC.get(ch, ch) for ch in s)


def col_letter(idx):
    """0 -> A, 25 -> Z, 26 -> AA."""
    out = ""
    idx += 1
    while idx:
        idx, rem = divmod(idx - 1, 26)
        out = chr(65 + rem) + out
    return out


def build():
    # Bang chuoi dung chung: moi chuoi RIENG BIET xuat hien dung 1 lan, o tro toi
    # bang chi so. Day chinh la khau ma vong SheetJS-ghi-SheetJS-doc khong cham toi.
    sst, sst_index = [], {}

    def sid(text):
        if text not in sst_index:
            sst_index[text] = len(sst)
            sst.append(text)
        return sst_index[text]

    rows_xml = []
    for r_i, row in enumerate([HEADERS] + ROWS, start=1):
        cells = []
        for c_i, val in enumerate(row):
            ref = "%s%d" % (col_letter(c_i), r_i)
            if isinstance(val, (int, float)):
                cells.append('<c r="%s"><v>%s</v></c>' % (ref, val))
            else:
                cells.append('<c r="%s" t="s"><v>%d</v></c>' % (ref, sid(val)))
        rows_xml.append('<row r="%d">%s</row>' % (r_i, "".join(cells)))

    total_rows = len(ROWS) + 1
    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<dimension ref="A1:%s%d"/><sheetData>%s</sheetData></worksheet>'
        % (col_letter(len(HEADERS) - 1), total_rows, "".join(rows_xml))
    )
    shared = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'count="%d" uniqueCount="%d">%s</sst>'
        % (
            sum(1 for row in [HEADERS] + ROWS for v in row if not isinstance(v, (int, float))),
            len(sst),
            "".join("<si><t>%s</t></si>" % esc(s) for s in sst),
        )
    )
    parts = {
        "[Content_Types].xml":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
            "</Types>",
        "_rels/.rels":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            "</Relationships>",
        "xl/workbook.xml":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            '<sheets><sheet name="Questions" sheetId="1" r:id="rId1"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
            "</Relationships>",
        "xl/sharedStrings.xml": shared,
        "xl/worksheets/sheet1.xml": sheet,
    }

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bulk-import-excel.xlsx")
    # Moc thoi gian CO DINH: zip luu gio tao vao tung muc, neu de mac dinh thi moi
    # lan sinh lai ra mot file khac byte du noi dung y het -> diff rac. Fixture da
    # commit thi phai tai lap duoc y nguyen.
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in parts.items():
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, data.encode("utf-8"))
    return out


if __name__ == "__main__":
    p = build()
    print("da sinh:", p, os.path.getsize(p), "bytes")
