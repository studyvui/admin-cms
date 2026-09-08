import { describe, it, expect } from "vitest";
import { sanitizeAssetFilename } from "@/lib/assets/asset-filename";

describe("sanitizeAssetFilename", () => {
  it("bỏ dấu tiếng Việt và viết thường", () => {
    expect(sanitizeAssetFilename("Ảnh Test.png")).toBe("anh-test.png");
  });

  it("thay khoảng trắng và ký tự đặc biệt bằng gạch ngang", () => {
    expect(sanitizeAssetFilename("IMG_1234 (1).JPG")).toBe("img_1234-1.jpg");
  });

  it("tên đã hợp lệ sẵn -> giữ nguyên", () => {
    expect(sanitizeAssetFilename("cat.png")).toBe("cat.png");
  });

  it("không có phần mở rộng -> không thêm đuôi lạ", () => {
    expect(sanitizeAssetFilename("README")).toBe("readme");
  });

  it("nhiều dấu chấm trong tên -> giữ dấu chấm ở phần tên (backend cho phép)", () => {
    expect(sanitizeAssetFilename("photo.final.png")).toBe("photo.final.png");
  });

  it("chữ Đ/đ chuyển đúng thành d, không lẫn ký tự lạ", () => {
    expect(sanitizeAssetFilename("Đề bài.webp")).toBe("de-bai.webp");
  });
});
