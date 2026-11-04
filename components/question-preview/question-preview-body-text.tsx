"use client";

// Xem thử câu hỏi — điền chữ, sắp xếp, ghép cặp, kiểu còn lại. Tách từ question-preview-modal.tsx, dời nguyên văn các `case` của renderBody() (mục 93 Đợt 4b).
// Biến / component con của hàm cha đi qua đối tượng ctx (giữ danh tính component con: tạo mới mỗi lần render ở hàm cha).

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type PreviewCtx } from "./question-preview-shared";
// ---- het tieu de tach file (muc 93 Dot 4b) ----

export function TextBody({ ctx }: { ctx: PreviewCtx }): ReactNode {
  const { q, content, opts, imageKeys, prompt, selected, setSelected, checked, isCorrect, AudioButtons, ImageGrid, TextOptions } = ctx;
  switch (q.type) {
    case "missing_letter": {
      const tiles = content.tiles ?? opts;
      const pattern = content.pattern ?? "";
      const word = content.word ?? "";
      const answer = q.correctAnswer.toLowerCase();

      return (
        <>
          <p className="mb-4 text-center text-base font-semibold leading-relaxed">
            {content.prompt || "Điền chữ còn thiếu"}
          </p>
          <ImageGrid keys={imageKeys} />
          <AudioButtons />
          <div className="mb-4 flex items-center justify-center gap-1 text-2xl font-bold tracking-widest">
            {pattern.split("").map((ch, i) => (
              ch === "_" ? (
                <span
                  key={i}
                  className={cn(
                    "inline-flex min-w-[1.4em] items-center justify-center border-b-4 text-center",
                    checked ? "border-green-500 text-green-600" : "border-indigo-400 text-indigo-300",
                  )}
                >
                  {checked ? word[i] : "_"}
                </span>
              ) : (
                <span key={i} className="min-w-[1.2em] text-center">{ch}</span>
              )
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {tiles.map((ch, i) => {
              const isAnswer = answer.includes(ch);
              const isSelected = selected === ch;
              return (
                <button
                  key={i}
                  disabled={checked}
                  onClick={() => setSelected(ch)}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all",
                    !checked && isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : !checked
                        ? "border-gray-300 hover:border-blue-400"
                        : checked && isAnswer
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-400 opacity-50",
                  )}
                >
                  {ch}
                </button>
              );
            })}
          </div>
          {checked && (
            <p className={cn("mt-3 text-center text-sm font-medium", isCorrect ? "text-green-600" : "text-red-600")}>
              Đáp án đúng: {answer.split("").join(" → ")} (theo thứ tự)
            </p>
          )}
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

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
