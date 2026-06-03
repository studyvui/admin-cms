"use client";

import { useState, useRef, useEffect } from "react";
import { Pause, Volume2, CheckCircle2, XCircle, RotateCcw, Image as ImageIcon, Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ImagePicker } from "@/components/asset-picker/image-picker";
import { AudioPicker } from "@/components/asset-picker/audio-picker";
import type { GeneratedMathQuestion } from "@/lib/math-gen/types";

const CDN_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_CDN_URL
    ? process.env.NEXT_PUBLIC_CDN_URL
    : "https://cdn.studyvui.vn";

const IMG_RE = /\.(png|webp|jpe?g|gif|svg)$/i;
const AUD_RE = /\.(mp3|ogg|wav|m4a)$/i;
const stripAssets = (k: string) => k.replace(/^\/?assets\//, "").trim();
const assetUrl = (k: string) => `${CDN_BASE}/${stripAssets(k)}`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: GeneratedMathQuestion | null;
  /** Lưu assetRefs đã gắn về câu hỏi trong bộ nhớ. */
  onSave: (assetRefs: string[]) => void;
}

export function MathPreviewEditModal({ open, onOpenChange, question, onSave }: Props) {
  const [refs, setRefs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setRefs(question?.assetRefs ?? []);
    setSelected(null);
    setChecked(false);
  }, [question?.id, open]);

  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      setPlaying(null);
    }
  }, [open]);

  if (!question) return null;
  const q = question;

  const imageKeys = refs.filter((r) => IMG_RE.test(r));
  const audioKeys = refs.filter((r) => AUD_RE.test(r));
  const isCorrect = selected === q.correct_answer;

  const toggleAudio = (key: string) => {
    if (!audioRef.current) audioRef.current = new Audio();
    if (playing === key) {
      audioRef.current.pause();
      setPlaying(null);
      return;
    }
    audioRef.current.src = assetUrl(key);
    audioRef.current.onended = () => setPlaying(null);
    audioRef.current.play().catch(() => setPlaying(null));
    setPlaying(key);
  };

  const setUnique = (next: string[]) => setRefs(Array.from(new Set(next)));
  const removeRef = (k: string) => setRefs(refs.filter((r) => r !== k));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Xem trước &amp; Chỉnh sửa
            <Badge variant="outline" className="text-xs">{q.lessonType}</Badge>
            <Badge variant="secondary" className="text-xs">L{q.difficulty}</Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Gắn ảnh/audio tại đây — sẽ đi kèm khi Xuất Excel.
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="min-h-[100px] py-1">
          <p className="mb-3 text-center text-base font-semibold leading-relaxed">{q.text}</p>

          {imageKeys.length > 0 && (
            <div className="mb-3 flex flex-wrap justify-center gap-3">
              {imageKeys.map((k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={k}
                  src={assetUrl(k)}
                  alt={k}
                  className="h-28 w-28 rounded-lg border object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                  }}
                />
              ))}
            </div>
          )}

          {audioKeys.length > 0 && (
            <div className="mb-3 flex justify-center gap-2">
              {audioKeys.map((k) => (
                <Button key={k} variant="outline" size="sm" onClick={() => toggleAudio(k)} className="gap-2">
                  {playing === k ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {playing === k ? "Dừng" : "Nghe"}
                </Button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(opt)}
                className={cn(
                  "w-full rounded-xl border-2 px-4 py-3 text-center text-sm font-medium transition-all",
                  !selected && !checked && "border-gray-200 hover:border-gray-300",
                  selected === opt && !checked && "border-blue-500 bg-blue-50",
                  checked && opt === q.correct_answer && "border-green-500 bg-green-100 text-green-800",
                  checked && selected === opt && opt !== q.correct_answer && "border-red-500 bg-red-100 text-red-800",
                  checked && opt !== q.correct_answer && selected !== opt && "opacity-50",
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          {checked && (
            <div
              className={cn(
                "mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
              )}
            >
              {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {isCorrect ? "Đúng rồi!" : `Đáp án đúng: ${q.correct_answer}`}
            </div>
          )}

          <div className="mt-2 flex justify-end">
            {checked ? (
              <Button variant="ghost" size="sm" onClick={() => { setChecked(false); setSelected(null); }}>
                <RotateCcw className="mr-1 h-4 w-4" /> Làm lại
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setChecked(true)} disabled={selected === null}>
                Kiểm tra đáp án
              </Button>
            )}
          </div>
        </div>

        {/* Asset editor */}
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <Label className="text-xs">Asset đính kèm (ảnh / audio)</Label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setImageOpen(true)}>
              <ImageIcon className="mr-1.5 h-4 w-4" /> Chọn ảnh
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setAudioOpen(true)}>
              <Music className="mr-1.5 h-4 w-4" /> Chọn audio
            </Button>
          </div>
          {refs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {refs.map((k) => (
                <Badge key={k} variant="secondary" className="gap-1 font-mono">
                  <span className="max-w-[220px] truncate">{k}</span>
                  <button type="button" onClick={() => removeRef(k)} className="hover:text-destructive" aria-label={`Bỏ ${k}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Chưa gắn asset nào.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button
            onClick={() => {
              onSave(refs);
              onOpenChange(false);
            }}
          >
            Lưu asset
          </Button>
        </DialogFooter>

        <ImagePicker
          open={imageOpen}
          onOpenChange={setImageOpen}
          initialSelected={imageKeys}
          multiple
          onConfirm={(picked) => setUnique([...audioKeys, ...picked])}
        />
        <AudioPicker
          open={audioOpen}
          onOpenChange={setAudioOpen}
          initialSelected={audioKeys}
          multiple
          onConfirm={(picked) => setUnique([...imageKeys, ...picked])}
        />
      </DialogContent>
    </Dialog>
  );
}
