"use client";

// Xem thử câu hỏi — phần dùng chung (URL asset, kiểu ctx, nút đáp án). Tách từ question-preview-modal.tsx (mục 93 Đợt 4b).

import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
// ---- het tieu de tach file (muc 93 Dot 4b) ----

const CDN_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_CDN_URL
    ? process.env.NEXT_PUBLIC_CDN_URL
    : "https://cdn.studyvui.vn";

export function assetUrl(key: string) {
  return `${CDN_BASE}/${key}`;
}

/** Kiểu của `q.content` khi xem thử (khai báo gốc nằm inline ở hàm cha). */
export type PreviewContent = {
  prompt?: string;
  options?: string[];
  pairs?: [string, string][];
  items?: string[];
  numbers?: number[];
  prefix?: string;
  suffix?: string;
  blanks?: number;
  tiles?: string[];
  word?: string;
  pattern?: string;
};

/** Mọi thứ mà các `case` của renderBody() dùng từ hàm cha. */
export interface PreviewCtx {
  q: Question;
  content: PreviewContent;
  opts: string[];
  imageKeys: string[];
  audioKeys: string[];
  prompt: string;
  selected: string | null;
  setSelected: Dispatch<SetStateAction<string | null>>;
  checked: boolean;
  playing: string | null;
  toggleAudio: (key: string) => void;
  isCorrect: boolean;
  AudioButtons: () => ReactNode;
  ImageGrid: (props: { keys: string[]; size?: string }) => ReactNode;
  TextOptions: () => ReactNode;
}

export function OptionButton({
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

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
