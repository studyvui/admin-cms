// Chuẩn hoá tên file trước khi upload lên R2 — khớp đúng FILENAME_PATTERN backend
// (chỉ chữ thường/số/`_`/`-`/`.`, xem AdminAssetsService.upload). Backend tự lowercase +
// thay khoảng trắng nhưng KHÔNG bỏ dấu tiếng Việt/ký tự đặc biệt khác, nên tên file thật
// (ảnh chụp màn hình, "Ảnh Test.png"...) vẫn bị 400 nếu không chuẩn hoá trước ở đây.

const COMBINING_DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

export function sanitizeAssetFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : "";

  const safeBase = base
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_RE, "")
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");

  return (safeBase || "file") + safeExt;
}
