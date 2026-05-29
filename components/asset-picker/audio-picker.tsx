"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, X, Play, Pause } from "lucide-react";
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

interface AudioPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelected?: string[];
  prefix?: string;
  multiple?: boolean;
  onConfirm: (keys: string[]) => void;
}

export function AudioPicker({
  open,
  onOpenChange,
  initialSelected = [],
  prefix,
  multiple = false,
  onConfirm,
}: AudioPickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open) setSelected(initialSelected);
  }, [open, initialSelected]);

  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      setPlaying(null);
    }
  }, [open]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["assets", "audio", prefix],
    queryFn: () => assetsApi.list({ type: "audio", prefix }),
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

  const togglePlay = (url: string, key: string) => {
    if (!audioRef.current) audioRef.current = new Audio();
    if (playing === key) {
      audioRef.current.pause();
      setPlaying(null);
      return;
    }
    audioRef.current.src = url;
    audioRef.current.onended = () => setPlaying(null);
    audioRef.current.play().catch(() => setPlaying(null));
    setPlaying(key);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chọn audio</DialogTitle>
          <DialogDescription>
            {multiple ? "Chọn 1 hoặc nhiều file audio." : "Chọn 1 audio."} Tổng{" "}
            {data?.length ?? 0} file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Lọc theo tên file (apple, hello...)"
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
            <div className="space-y-1 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="m-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {extractError(error)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search ? "Không tìm thấy audio khớp." : "Kho audio trống."}
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((a) => {
                const isSelected = selected.includes(a.key);
                const isPlaying = playing === a.key;
                return (
                  <li
                    key={a.key}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePlay(a.url, a.key)}
                      title={isPlaying ? "Dừng" : "Phát"}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => toggle(a.key)}
                      className="flex-1 truncate text-left font-mono text-xs hover:underline"
                      title={a.key}
                    >
                      {a.key}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(a.size / 1024)} KB
                    </span>
                    {isSelected && (
                      <div className="rounded-full bg-primary p-1 text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">Đã chọn ({selected.length}):</Label>
            <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
              {selected.map((k) => (
                <Badge key={k} variant="secondary" className="gap-1">
                  <span className="truncate max-w-[200px]">
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
