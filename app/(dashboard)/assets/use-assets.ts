"use client";

// Data layer cho trang Kho asset — tách từ page.tsx. List + delete + upload (hàng đợi pending).
// Mutation/upload chỉ lo invalidate. handleFiles nhận prefix từ component (truyền tay).

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api/assets";
import { extractError } from "@/lib/errors";
import type { AssetItem } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface PendingFile {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  message?: string;
  result?: AssetItem;
}

export function useAssets(enabled: boolean) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["assets", "all"],
    queryFn: () => assetsApi.list({}),
    enabled,
  });

  const deleteMut = useMutation({
    mutationFn: (key: string) => assetsApi.delete(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });

  const [pending, setPending] = useState<PendingFile[]>([]);

  const handleFiles = useCallback(
    (files: FileList | File[], prefix: string) => {
      const arr = Array.from(files);
      const next: PendingFile[] = arr.map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        status:
          f.size > MAX_FILE_SIZE
            ? "error"
            : ("queued" as PendingFile["status"]),
        message:
          f.size > MAX_FILE_SIZE
            ? `File quá lớn (${(f.size / 1024 / 1024).toFixed(1)} MB > 10 MB)`
            : undefined,
      }));
      setPending((prev) => [...prev, ...next]);

      next
        .filter((p) => p.status === "queued")
        .forEach((p) => {
          setPending((prev) =>
            prev.map((x) =>
              x.id === p.id ? { ...x, status: "uploading" } : x,
            ),
          );
          assetsApi
            .upload(p.file, prefix)
            .then((result) => {
              setPending((prev) =>
                prev.map((x) =>
                  x.id === p.id ? { ...x, status: "done", result } : x,
                ),
              );
              queryClient.invalidateQueries({ queryKey: ["assets"] });
            })
            .catch((err) => {
              setPending((prev) =>
                prev.map((x) =>
                  x.id === p.id
                    ? { ...x, status: "error", message: extractError(err) }
                    : x,
                ),
              );
            });
        });
    },
    [queryClient],
  );

  return { data, isLoading, error, deleteMut, pending, setPending, handleFiles };
}
