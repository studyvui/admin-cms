"use client";

// Field chọn 1 asset (ảnh hoặc audio) từ kho R2 — gộp OptionImageField + OptionAudioField cũ
// của trang Câu hỏi. Tự chứa state `open`. Hành vi giữ NGUYÊN VẸN (icon/nhãn/độ rộng badge
// theo từng `kind`).

import { useState } from "react";
import { ImageIcon, Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePicker } from "@/components/asset-picker/image-picker";
import { AudioPicker } from "@/components/asset-picker/audio-picker";

export function AssetField({
  kind,
  value,
  onChange,
}: {
  kind: "image" | "audio";
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isImage = kind === "image";
  const Icon = isImage ? ImageIcon : Music;
  const label = value
    ? isImage
      ? "Đổi ảnh"
      : "Đổi audio"
    : isImage
      ? "Chọn ảnh"
      : "Chọn audio";

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Icon className="mr-1.5 h-4 w-4" />
        {label}
      </Button>
      {value ? (
        <Badge variant="secondary" className="gap-1 font-mono">
          <span className={isImage ? "truncate max-w-[110px]" : "truncate max-w-[160px]"}>
            {value.split("/").pop()}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="hover:text-destructive"
            aria-label={isImage ? "Bỏ ảnh" : "Bỏ audio"}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ) : null}
      {isImage ? (
        <ImagePicker
          open={open}
          onOpenChange={setOpen}
          initialSelected={value ? [value] : []}
          onConfirm={(picked) => onChange(picked[0] ?? "")}
        />
      ) : (
        <AudioPicker
          open={open}
          onOpenChange={setOpen}
          initialSelected={value ? [value] : []}
          onConfirm={(picked) => onChange(picked[0] ?? "")}
        />
      )}
    </div>
  );
}
