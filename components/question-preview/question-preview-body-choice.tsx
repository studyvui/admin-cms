"use client";

// Xem thử câu hỏi — các kiểu trắc nghiệm / chọn / so sánh. Tách từ question-preview-modal.tsx, dời nguyên văn các `case` của renderBody() (mục 93 Đợt 4b).
// Biến / component con của hàm cha đi qua đối tượng ctx (giữ danh tính component con: tạo mới mỗi lần render ở hàm cha).

import type { ReactNode } from "react";
import { Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OptionButton, assetUrl, type PreviewCtx } from "./question-preview-shared";

/** Kiểu câu hỏi do ChoiceBody xử lý (khớp các `case` bên dưới); kiểu khác rơi vào TextBody. */
export const CHOICE_TYPES = new Set(["multiple_choice", "fill_blank", "image_choice", "audio_choice", "count_objects", "number_recognition", "compare_numbers"]);
// ---- het tieu de tach file (muc 93 Dot 4b) ----

export function ChoiceBody({ ctx }: { ctx: PreviewCtx }): ReactNode {
  const { q, content, opts, imageKeys, audioKeys, prompt, selected, setSelected, checked, playing, toggleAudio, AudioButtons, ImageGrid, TextOptions } = ctx;
  switch (q.type) {
    case "multiple_choice":
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

    case "audio_choice": {
      const audioPerOption = imageKeys.length > 0 && imageKeys.length === opts.length;
      return (
        <>
          {prompt && (
            <p className="mb-4 text-center text-base font-semibold leading-relaxed">
              {prompt}
            </p>
          )}
          {!audioPerOption && <ImageGrid keys={imageKeys} />}
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
          {audioPerOption ? (
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
            <TextOptions />
          )}
        </>
      );
    }

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
    default:
      return null;
  }
}

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
