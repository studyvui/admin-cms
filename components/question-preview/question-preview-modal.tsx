"use client";

import { useState, useRef, useEffect } from "react";
import {
  Pause,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import type { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { assetUrl, OptionButton, type PreviewContent, type PreviewCtx } from "./question-preview-shared";
import { ChoiceBody, CHOICE_TYPES } from "./question-preview-body-choice";
import { TextBody } from "./question-preview-body-text";

const IMAGE_EXTS = [".png", ".webp", ".jpg", ".jpeg", ".gif", ".svg"];
const AUDIO_EXTS = [".mp3", ".ogg", ".wav", ".m4a"];

function isImageKey(key: string) {
  const lower = key.toLowerCase();
  return IMAGE_EXTS.some((ext) => lower.endsWith(ext));
}
function isAudioKey(key: string) {
  const lower = key.toLowerCase();
  return AUDIO_EXTS.some((ext) => lower.endsWith(ext));
}

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "Rất dễ",
  2: "Dễ",
  3: "Trung bình",
  4: "Khó",
  5: "Rất khó",
};

// Types that don't have interactive answer checking
const NON_INTERACTIVE = new Set(["reorder", "matching"]);

interface QuestionPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
}

export function QuestionPreviewModal({
  open,
  onOpenChange,
  question,
}: QuestionPreviewModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
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
  // Capture narrowed (non-nullable) reference so inner functions don't need assertions
  const q = question;

  const content = q.content as PreviewContent;

  const imageKeys = q.assetRefs.filter(isImageKey);
  const audioKeys = q.assetRefs.filter(isAudioKey);
  const prompt = content.prompt ?? "";
  const opts = Array.isArray(content.options) ? content.options : [];
  const isInteractive = !NON_INTERACTIVE.has(q.type);
  const isCorrect = q.type === "missing_letter"
    ? q.correctAnswer.toLowerCase().includes(selected?.toLowerCase() ?? "")
    : selected === q.correctAnswer;

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

  const handleReset = () => {
    setSelected(null);
    setChecked(false);
  };

  // --- Sub-renderers ---

  function AudioButtons() {
    if (audioKeys.length === 0) return null;
    return (
      <div className="mb-4 flex justify-center gap-2">
        {audioKeys.map((k) => (
          <Button
            key={k}
            variant="outline"
            size="sm"
            onClick={() => toggleAudio(k)}
            className="gap-2"
          >
            {playing === k ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            {playing === k ? "Dừng" : "Nghe audio"}
          </Button>
        ))}
      </div>
    );
  }

  function ImageGrid({ keys, size = "h-32 w-32" }: { keys: string[]; size?: string }) {
    if (keys.length === 0) return null;
    return (
      <div className="mb-4 flex flex-wrap justify-center gap-3">
        {keys.map((k) => (
          <img
            key={k}
            src={assetUrl(k)}
            alt={k.split("/").pop() ?? k}
            className={cn(size, "rounded-lg border object-contain")}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.src = "";
              el.alt = `[ảnh không tải được: ${k}]`;
              el.className = cn(size, "rounded-lg border flex items-center justify-center bg-muted text-xs p-2");
            }}
          />
        ))}
      </div>
    );
  }

  function TextOptions() {
    return (
      <div className="grid grid-cols-2 gap-3">
        {opts.map((opt) => (
          <OptionButton
            key={opt}
            label={opt}
            selected={selected === opt}
            correct={checked && opt === q.correctAnswer}
            wrong={checked && selected === opt && opt !== q.correctAnswer}
            disabled={checked}
            onClick={() => setSelected(opt)}
          />
        ))}
      </div>
    );
  }

  // --- Main question renderer ---

// ---- keo: dung ctx cho cac ham render (muc 93 Dot 4b) ----
  function renderBody() {
    const ctx: PreviewCtx = {
      q, content, opts, imageKeys, audioKeys, prompt, selected, setSelected, checked, playing, toggleAudio, isCorrect, AudioButtons, ImageGrid, TextOptions,
    };
    return CHOICE_TYPES.has(q.type) ? <ChoiceBody ctx={ctx} /> : <TextBody ctx={ctx} />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Xem thử câu hỏi
            <Badge variant="outline" className="font-mono text-xs">
              {q.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {DIFFICULTY_LABEL[q.difficulty] ??
                `Lv${q.difficulty}`}
            </Badge>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {q.code} · kỹ năng: {q.skill}
          </DialogDescription>
        </DialogHeader>

        {/* Question body */}
        <div className="min-h-[120px] py-2">{renderBody()}</div>

        {/* Result feedback */}
        {checked && isInteractive && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium",
              isCorrect
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800",
            )}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Đúng rồi! Chính xác!
              </>
            ) : (
              <>
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Sai rồi. Đáp án đúng là:{" "}
                <strong className="ml-1">{q.correctAnswer}</strong>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isInteractive && (
          <div className="flex justify-end gap-2 pt-1">
            {checked ? (
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Làm lại
              </Button>
            ) : (
              <Button
                onClick={() => setChecked(true)}
                disabled={selected === null}
              >
                Kiểm tra đáp án
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
