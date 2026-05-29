"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, X } from "lucide-react";
import { assetsApi } from "@/lib/api/assets";
import { extractError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelected?: string[];
  prefix?: string;
  multiple?: boolean;
  onConfirm: (keys: string[]) => void;
}

export function ImagePicker({
  open,
  onOpenChange,
  initialSelected = [],
  prefix,
  multiple = false,
  onConfirm,
}: ImagePickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);

  useEffect(() => {
    if (open) setSelected(initialSelected);
  }, [open, initialSelected]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["assets", "image", prefix],
    queryFn: () => assetsApi.list({ type: "image", prefix }),
    enabled: open,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((a) => a.key.toLowerCase().includes(q));
  }, [data, search]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      if (multiple) {
        return prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key];
      }
      return prev.includes(key) ? [] : [key];
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Chọn ảnh</DialogTitle>
          <DialogDescription>
            {multiple ? "Chọn 1 hoặc nhiều ảnh." : "Chọn 1 ảnh."} Tổng{" "}
            {data?.length ?? 0} ảnh trong R2.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Lọc theo tên file (apple, dog, grade1/english...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="outline">
            {filtered.length} / {data?.length ?? 0}
          </Badge>
        </div>

        <div className="max-h-[55vh] min-h-[300px] overflow-y-auto rounded-md border">
          {isLoading ? (
            <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : error ? (
            <div className="m-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {extractError(error)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search ? "Không tìm thấy ảnh khớp từ khoá." : "Kho ảnh trống."}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6">
              {filtered.map((a) => {
                const isSelected = selected.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggle(a.key)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-md border bg-muted transition",
                      isSelected
                        ? "border-primary ring-2 ring-primary"
                        : "hover:border-primary/50",
                    )}
                    title={a.key}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.key}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity =
                          "0.2";
                      }}
                    />
                    {isSelected && (
                      <div className="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                      {a.key.split("/").pop()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">
              Đã chọn ({selected.length}):
            </Label>
            <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
              {selected.map((k) => (
                <Badge key={k} variant="secondary" className="gap-1">
                  <span className="truncate max-w-[160px]">
                    {k.split("/").pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(k)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(selected);
              onOpenChange(false);
            }}
            disabled={selected.length === 0}
          >
            Chọn ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
