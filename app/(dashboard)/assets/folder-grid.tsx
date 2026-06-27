"use client";

// Lưới folder (chế độ xem theo thư mục) — tách từ assets/page.tsx. Giữ NGUYÊN VẸN.

import { Image as ImageIcon, Music, FolderOpen } from "lucide-react";
import type { AssetItem } from "@/lib/types";

export function FolderGrid({
  folderMap,
  onSelectFolder,
}: {
  folderMap: Map<string, AssetItem[]>;
  onSelectFolder: (folder: string) => void;
}) {
  if (folderMap.size === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Không có folder nào khớp bộ lọc.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from(folderMap.entries()).map(([folder, items]) => {
        const imageCount = items.filter((a: AssetItem) => a.type === "image").length;
        const audioCount = items.filter((a: AssetItem) => a.type === "audio").length;
        const previewImage = items.find((a: AssetItem) => a.type === "image");

        return (
          <button
            key={folder}
            type="button"
            onClick={() => onSelectFolder(folder)}
            className="group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition hover:border-primary/60 hover:shadow-sm"
          >
            {/* Thumbnail strip */}
            <div className="relative flex h-24 items-center justify-center overflow-hidden bg-muted">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImage.url}
                  alt={folder}
                  className="h-full w-full object-cover opacity-60 transition group-hover:opacity-80"
                />
              ) : (
                <Music className="h-10 w-10 text-muted-foreground/50" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <FolderOpen className="h-10 w-10 text-primary/70 drop-shadow" />
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 p-3">
              <p
                className="truncate font-mono text-xs font-medium"
                title={folder}
              >
                {folder}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{items.length} file</span>
                {imageCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <ImageIcon className="h-3 w-3" />
                    {imageCount}
                  </span>
                )}
                {audioCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Music className="h-3 w-3" />
                    {audioCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
