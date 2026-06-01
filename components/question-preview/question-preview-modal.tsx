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

const CDN_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_CDN_URL
    ? process.env.NEXT_PUBLIC_CDN_URL
    : "https://cdn.studyvui.vn";

function assetUrl(key: string) {
  return `${CDN_BASE}/${key}`;
}

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

  const content = q.content as {
    prompt?: string;
    options?: string[];
    pairs?: [string, string][];
    items?: string[];
    numbers?: number[];
  };

  const imageKeys = q.assetRefs.filter(isImageKey);
  const audioKeys = q.assetRefs.filter(isAudioKey);
  const prompt = content.prompt ?? "";
  const opts = Array.isArray(content.options) ? content.options : [];
  const isInteractive = !NON_INTERACTIVE.has(q.type);
  const isCorrect = selected === q.correctAnswer;

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

  function renderBody() {
    switch (q.type) {
      case "multiple_choice":
      case "missing_letter":
      case "fill_blank":
        return (
          <>
            {prompt && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed">
                {prompt}
              </p>
            )}
            <ImageGrid keys={imageKeys} />
            <AudioButtons />
            <TextOptions />
          </>
        );

      case "image_choice": {
        // If #images == #options → each image is an answer option
        const perOption =
          imageKeys.length > 0 && imageKeys.length === opts.length;
        return (
          <>
            {prompt && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed">
                {prompt}
              </p>
            )}
            <AudioButtons />
            {perOption ? (
              <div className="grid grid-cols-2 gap-3">
                {opts.map((opt, i) => (
                  <button
                    key={opt}
                    disabled={checked}
                    onClick={() => setSelected(opt)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                      selected === opt && !checked
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300",
                      checked &&
                        opt === q.correctAnswer &&
                        "border-green-500 bg-green-50",
                      checked &&
                        selected === opt &&
                        opt !== q.correctAnswer &&
                        "border-red-500 bg-red-50",
                      checked && opt !== q.correctAnswer && selected !== opt
                        ? "opacity-50"
                        : "",
                    )}
                  >
                    <img
                      src={assetUrl(imageKeys[i])}
                      alt={opt}
                      className="h-20 w-20 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).alt = `[${opt}]`;
                      }}
                    />
                    <span className="text-sm font-medium">{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <ImageGrid keys={imageKeys} />
                <TextOptions />
              </>
            )}
          </>
        );
      }

      case "audio_choice":
        return (
          <>
            {prompt && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed">
                {prompt}
              </p>
            )}
            <ImageGrid keys={imageKeys} />
            {audioKeys.length > 0 && (
              <div className="mb-6 flex justify-center gap-3">
                {audioKeys.map((k) => (
                  <Button
                    key={k}
                    variant="outline"
                    size="lg"
                    onClick={() => toggleAudio(k)}
                    className="gap-2 px-6"
                  >
                    {playing === k ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                    {playing === k ? "Dừng audio" : "Phát audio"}
                  </Button>
                ))}
              </div>
            )}
            <TextOptions />
          </>
        );

      case "count_objects":
      case "number_recognition":
        return (
          <>
            <ImageGrid keys={imageKeys} size="h-40 w-40" />
            {prompt && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed">
                {prompt}
              </p>
            )}
            {opts.length > 0 ? (
              <TextOptions />
            ) : (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Đáp án:{" "}
                <strong className="text-foreground">
                  {q.correctAnswer}
                </strong>
              </p>
            )}
          </>
        );

      case "compare_numbers": {
        const nums = Array.isArray(content.numbers) ? content.numbers : [];
        const compareOpts = opts.length > 0 ? opts : ["<", "=", ">"];
        return (
          <>
            {prompt && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed">
                {prompt}
              </p>
            )}
            {nums.length >= 2 && (
              <div className="mb-6 flex items-center justify-center gap-8 rounded-xl bg-muted/40 py-6">
                <span className="text-5xl font-bold">{nums[0]}</span>
                <span className="text-3xl text-muted-foreground">?</span>
                <span className="text-5xl font-bold">{nums[1]}</span>
              </div>
            )}
            <div
              className={cn(
                "grid gap-3",
                compareOpts.length === 3 ? "grid-cols-3" : "grid-cols-2",
              )}
            >
              {compareOpts.map((sym) => (
                <OptionButton
                  key={sym}
                  label={sym}
                  selected={selected === sym}
                  correct={checked && sym === q.correctAnswer}
                  wrong={
                    checked &&
                    selected === sym &&
                    sym !== q.correctAnswer
                  }
                  disabled={checked}
                  onClick={() => setSelected(sym)}
                />
              ))}
            </div>
          </>
        );
      }

      case "reorder": {
        const items =
          Array.isArray(content.items) && content.items.length > 0
            ? content.items
            : opts;
        return (
          <>
            {prompt && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed">
                {prompt}
              </p>
            )}
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {items.map((item, i) => (
                <span
                  key={i}
                  className="rounded-lg border-2 border-dashed border-gray-300 bg-muted/30 px-4 py-2 font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Thứ tự đúng:{" "}
              <strong className="text-foreground">
                {q.correctAnswer}
              </strong>
            </p>
          </>
        );
      }

      case "matching": {
        const pairs = Array.isArray(content.pairs) ? content.pairs : [];
        return (
          <>
            {prompt && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed">
                {prompt}
              </p>
            )}
            <div className="space-y-3">
              {pairs.map(([left, right], i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 rounded-lg border bg-blue-50 px-4 py-2 text-center text-sm font-medium">
                    {left}
                  </div>
                  <span className="text-muted-foreground">↔</span>
                  <div className="flex-1 rounded-lg border bg-green-50 px-4 py-2 text-center text-sm font-medium">
                    {right}
                  </div>
                </div>
              ))}
            </div>
            {pairs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                (Chưa có cặp nối nào)
              </p>
            )}
          </>
        );
      }

      default:
        return (
          <>
            {prompt && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed">
                {prompt}
              </p>
            )}
            <ImageGrid keys={imageKeys} />
            <AudioButtons />
            {opts.length > 0 && <TextOptions />}
            {opts.length === 0 && Object.keys(content).length > 0 && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Nội dung JSON:
                </p>
                <pre className="overflow-auto text-xs">
                  {JSON.stringify(content, null, 2)}
                </pre>
              </div>
            )}
            {opts.length === 0 && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Đáp án:{" "}
                <strong className="text-foreground">
                  {q.correctAnswer}
                </strong>
              </p>
            )}
          </>
        );
    }
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

function OptionButton({
  label,
  selected,
  correct,
  wrong,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  correct: boolean;
  wrong: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all",
        // Default
        !selected && !correct && !wrong && "border-gray-200 hover:border-gray-300 hover:bg-muted/40",
        // Selected but not yet checked
        selected && !disabled && "border-blue-500 bg-blue-50",
        // Correct answer (after check)
        correct && "border-green-500 bg-green-100 text-green-800",
        // Wrong answer (after check)
        wrong && "border-red-500 bg-red-100 text-red-800",
        // Not selected & not correct after check
        disabled && !correct && !wrong && "cursor-not-allowed opacity-50",
      )}
    >
      {label}
    </button>
  );
}
