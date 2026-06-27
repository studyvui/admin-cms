// Logic THUẦN cho trang Kho asset (lọc + nhóm theo folder) — tách từ page.tsx để test được.
// Giữ NGUYÊN VẸN.

import type { AssetItem, AssetType } from "@/lib/types";

/** Folder của 1 key (phần trước dấu "/" cuối). Không có "/" → "(gốc)". */
export function getFolderFromKey(key: string): string {
  const lastSlash = key.lastIndexOf("/");
  if (lastSlash === -1) return "(gốc)";
  return key.slice(0, lastSlash + 1);
}

/** Lọc asset theo loại (image/audio/all) + chuỗi tìm trong key (không phân biệt hoa thường). */
export function filterAssets(
  items: AssetItem[],
  opts: { type: AssetType | "all"; search: string },
): AssetItem[] {
  let out = items;
  if (opts.type !== "all") out = out.filter((a) => a.type === opts.type);
  const q = opts.search.trim().toLowerCase();
  if (q) out = out.filter((a) => a.key.toLowerCase().includes(q));
  return out;
}

/** Nhóm asset theo folder → Map đã sắp xếp theo tên folder. */
export function groupByFolder(items: AssetItem[]): Map<string, AssetItem[]> {
  const map = new Map<string, AssetItem[]>();
  for (const item of items) {
    const folder = getFolderFromKey(item.key);
    if (!map.has(folder)) map.set(folder, []);
    map.get(folder)!.push(item);
  }
  const sorted = Array.from(map.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return new Map<string, AssetItem[]>(sorted);
}
