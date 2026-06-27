import { describe, it, expect } from "vitest";
import type { AssetItem } from "@/lib/types";
import {
  getFolderFromKey,
  filterAssets,
  groupByFolder,
} from "@/lib/assets/asset-list";

function a(key: string, type: "image" | "audio" = "image"): AssetItem {
  return { key, url: `https://cdn/${key}`, size: 100, lastModified: "", type };
}

describe("getFolderFromKey", () => {
  it("lấy phần trước dấu / cuối (kèm /)", () => {
    expect(getFolderFromKey("grade1/english/cat.png")).toBe("grade1/english/");
  });
  it("không có / → (gốc)", () => {
    expect(getFolderFromKey("cat.png")).toBe("(gốc)");
  });
});

describe("filterAssets", () => {
  const items = [
    a("grade1/english/cat.png", "image"),
    a("grade1/english/dog.png", "image"),
    a("audio/cat.mp3", "audio"),
  ];
  it("all + rỗng → giữ nguyên", () => {
    expect(filterAssets(items, { type: "all", search: "" })).toHaveLength(3);
  });
  it("lọc theo loại", () => {
    expect(filterAssets(items, { type: "audio", search: "" })).toHaveLength(1);
  });
  it("tìm theo tên (không phân biệt hoa thường)", () => {
    const r = filterAssets(items, { type: "all", search: "DOG" });
    expect(r).toHaveLength(1);
    expect(r[0].key).toContain("dog");
  });
});

describe("groupByFolder", () => {
  it("nhóm theo folder + sắp xếp tên folder", () => {
    const m = groupByFolder([
      a("z/2.png"),
      a("a/1.png"),
      a("a/2.png"),
    ]);
    expect(Array.from(m.keys())).toEqual(["a/", "z/"]); // sorted
    expect(m.get("a/")).toHaveLength(2);
  });
});
