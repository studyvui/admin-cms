"use client";

// Field chọn NHIỀU asset (ảnh + audio) đính kèm câu hỏi — tách từ trang Câu hỏi (AssetRefsField cũ).
// Lưu dạng CSV. Dùng helper phân loại đuôi chung (isImageKey/isAudioKey). Hành vi NGUYÊN VẸN.

import { useMemo, useState } from "react";
import { ImageIcon, Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImagePicker } from "@/components/asset-picker/image-picker";
import { AudioPicker } from "@/components/asset-picker/audio-picker";
import { isImageKey, isAudioKey } from "@/lib/assets/asset-kind";

export function AssetRefsField({
  value,
  onChange,
}: {
  value: string;
  onChange: (csv: string) => void;
}) {
  const [imageOpen, setImageOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);

  const refs = useMemo(
    () =>
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [value],
  );

  const setRefs = (next: string[]) => {
    const unique = Array.from(new Set(next));
    onChange(unique.join(", "));
  };

  const remove = (key: string) => {
    setRefs(refs.filter((r) => r !== key));
  };

  return (
    <div className="space-y-2">
      <Label>Asset đính kèm (ảnh / audio)</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setImageOpen(true)}
        >
          <ImageIcon className="mr-1.5 h-4 w-4" />
          Chọn ảnh
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAudioOpen(true)}
        >
          <Music className="mr-1.5 h-4 w-4" />
          Chọn audio
        </Button>
      </div>

      {refs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/30 p-2">
          {refs.map((k) => (
            <Badge key={k} variant="secondary" className="gap-1 font-mono">
              <span className="truncate max-w-[240px]">{k}</span>
              <button
                type="button"
                onClick={() => remove(k)}
                className="hover:text-destructive"
                aria-label={`Bỏ ${k}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Chưa chọn asset nào — bấm nút phía trên để chọn từ kho R2.
        </p>
      )}

      <ImagePicker
        open={imageOpen}
        onOpenChange={setImageOpen}
        initialSelected={refs.filter(isImageKey)}
        multiple
        onConfirm={(picked) => {
          const audioOnly = refs.filter((r) => !isImageKey(r));
          setRefs([...audioOnly, ...picked]);
        }}
      />

      <AudioPicker
        open={audioOpen}
        onOpenChange={setAudioOpen}
        initialSelected={refs.filter(isAudioKey)}
        multiple
        onConfirm={(picked) => {
          const imageOnly = refs.filter((r) => !isAudioKey(r));
          setRefs([...imageOnly, ...picked]);
        }}
      />
    </div>
  );
}
