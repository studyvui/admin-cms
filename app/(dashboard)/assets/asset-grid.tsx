"use client";

// Lưới asset (chế độ phẳng / trong folder) — tách từ assets/page.tsx. Giữ NGUYÊN VẸN.

import { Image as ImageIcon, Music, Trash2 } from "lucide-react";
import type { AssetItem } from "@/lib/types";

export function AssetGrid({
  items,
  canDelete,
  onDelete,
  deleting,
}: {
  items: AssetItem[];
  canDelete: boolean;
  onDelete: (key: string) => void;
  deleting: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((a) => (
        <div
          key={a.key}
          className="group relative overflow-hidden rounded-md border"
        >
          {a.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.url}
              alt={a.key}
              loading="lazy"
              className="aspect-square w-full object-cover bg-muted"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-muted">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div className="border-t bg-background p-2 text-xs">
            <p className="truncate font-mono" title={a.key}>
              {a.key.split("/").pop()}
            </p>
            <p className="mt-0.5 flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                {a.type === "image" ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <Music className="h-3 w-3" />
                )}
                {(a.size / 1024).toFixed(0)} KB
              </span>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(a.key)}
                  disabled={deleting}
                  className="text-destructive hover:underline disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
