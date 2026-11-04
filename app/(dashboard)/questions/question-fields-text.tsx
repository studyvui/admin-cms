"use client";

// Dialog Thêm/Sửa câu hỏi — khối chế độ nhập chữ (letter, reorder, word_blank, json). Tách từ question-dialog.tsx, dời nguyên văn (mục 93 Đợt 4b).
// Nhận `form` (kết quả useForm của QuestionDialog) + vài biến phụ; bóc register / setValue / watch / errors ở dòng đầu để JSX giữ nguyên.

import type { UseFormReturn } from "react-hook-form";
import type { QuestionFormValues } from "@/lib/questions/question-form";
import { parseMarkedWord, parseMarkedSentence } from "@/lib/questions/question-utils";
import { AssetField } from "@/components/form-fields/asset-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// ---- het tieu de tach file (muc 93 Dot 4b) ----

export function renderLetterFields({ form }: {
  form: UseFormReturn<QuestionFormValues>;
}) {
  const { register, watch, formState: { errors } } = form;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prompt">Đề bài (tuỳ chọn)</Label>
        <Input
          id="prompt"
          placeholder="Điền chữ còn thiếu"
          {...register("prompt" as const)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="markedWord">Từ có đánh dấu chỗ ẩn</Label>
        <Input
          id="markedWord"
          placeholder="h[el]lo"
          className="font-mono"
          {...register("markedWord" as const)}
        />
        <p className="text-xs text-muted-foreground">
          Gõ từ, bao các chữ bị ẩn trong <b>[ ]</b>. Vd{" "}
          <code>h[el]lo</code> → hiện <b>h _ _ l o</b>, đáp án <b>el</b>.
          Chữ gây nhiễu hệ thống tự sinh. Audio (nếu có) chọn ở{" "}
          <b>&quot;Asset đính kèm&quot;</b>.
        </p>
        {"markedWord" in errors && (
          <p className="text-xs text-destructive">
            {
              (errors as Record<string, { message?: string }>)
                .markedWord?.message
            }
          </p>
        )}
        <LetterFillPreview
          marked={(watch("markedWord" as const) as string) ?? ""}
        />
      </div>
    </>
  );
}

export function renderReorderFields({ form }: {
  form: UseFormReturn<QuestionFormValues>;
}) {
  const { register, setValue, watch, formState: { errors } } = form;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prompt">Đề bài (tuỳ chọn)</Label>
        <Input
          id="prompt"
          placeholder="Sắp xếp các từ thành câu đúng"
          {...register("prompt" as const)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sentence">Câu đúng (mỗi từ cách nhau bằng dấu cách)</Label>
        <Input
          id="sentence"
          placeholder="It is a pen"
          {...register("sentence" as const)}
        />
        <p className="text-xs text-muted-foreground">
          🔤 <b>Câu (sắp xếp)</b>: học sinh kéo/bấm các từ (đã xáo trộn) để xếp lại
          đúng câu này. Câu cần ít nhất <b>2 từ</b>.
        </p>
        {"sentence" in errors && (
          <p className="text-xs text-destructive">
            {(errors as Record<string, { message?: string }>).sentence?.message}
          </p>
        )}
        <ReorderPreview
          sentence={(watch("sentence" as const) as string) ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Audio đọc câu (tuỳ chọn)</Label>
        <AssetField
          kind="audio"
          value={(watch("promptAudio" as const) as string) ?? ""}
          onChange={(v) =>
            setValue("promptAudio" as const, v, { shouldValidate: true })
          }
        />
        <p className="text-xs text-muted-foreground">
          🔊 Học sinh nghe câu đọc lên rồi xếp từ theo — chọn file
          <code className="mx-1">g1_sent_*.mp3</code> từ Kho asset.
        </p>
      </div>
    </>
  );
}

export function renderWordBlankFields({ form }: {
  form: UseFormReturn<QuestionFormValues>;
}) {
  const { register, setValue, watch, formState: { errors } } = form;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prompt">Đề bài (tuỳ chọn)</Label>
        <Input
          id="prompt"
          placeholder="Chọn từ đúng điền vào chỗ trống"
          {...register("prompt" as const)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="markedSentence">
          Câu có chỗ trống — bọc <b>từ ẩn</b> trong [ ]
        </Label>
        <Input
          id="markedSentence"
          placeholder="It is a [pen]"
          className="font-mono"
          {...register("markedSentence" as const)}
        />
        {"markedSentence" in errors && (
          <p className="text-xs text-destructive">
            {(errors as Record<string, { message?: string }>).markedSentence?.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="wordDistractors">Từ nhiễu (cách nhau dấu phẩy)</Label>
        <Input
          id="wordDistractors"
          placeholder="book, bag"
          className="font-mono"
          {...register("wordDistractors" as const)}
        />
        {"wordDistractors" in errors && (
          <p className="text-xs text-destructive">
            {(errors as Record<string, { message?: string }>).wordDistractors?.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Ảnh gợi ý (tuỳ chọn)</Label>
          <AssetField
            kind="image"
            value={(watch("promptImage" as const) as string) ?? ""}
            onChange={(v) =>
              setValue("promptImage" as const, v, { shouldValidate: true })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Audio đọc câu (tuỳ chọn)</Label>
          <AssetField
            kind="audio"
            value={(watch("promptAudio" as const) as string) ?? ""}
            onChange={(v) =>
              setValue("promptAudio" as const, v, { shouldValidate: true })
            }
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        ✏️ <b>Điền từ vào câu</b>: học sinh thấy câu khuyết 1 từ + ngân
        hàng từ (đáp án + từ nhiễu, xáo trộn) → chạm từ đúng để điền.
      </p>
      <WordBlankPreview
        marked={(watch("markedSentence" as const) as string) ?? ""}
        distractorsCsv={(watch("wordDistractors" as const) as string) ?? ""}
      />
    </>
  );
}

export function renderJsonFields({ form }: {
  form: UseFormReturn<QuestionFormValues>;
}) {
  const { register, formState: { errors } } = form;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="contentJson">Content JSON</Label>
        <Textarea
          id="contentJson"
          rows={8}
          className="font-mono text-xs"
          placeholder='{ "prompt": "...", "options": [...] }'
          {...register("contentJson" as const)}
        />
        {"contentJson" in errors && (
          <p className="text-xs text-destructive">
            {(errors as Record<string, { message?: string }>)
              .contentJson?.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="correctAnswer">Đáp án đúng (string)</Label>
        <Input
          id="correctAnswer"
          {...register("correctAnswer" as const)}
        />
      </div>
    </>
  );
}

// ---- cac ham xem truoc chuyen nguyen van (muc 93 Dot 4b) ----

// Xem trước câu "Sắp xếp" — hiện các thẻ từ (xáo cố định để không nhảy loạn khi gõ).
function ReorderPreview({ sentence }: { sentence: string }) {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  // Xáo hiển thị theo hash ổn định (chỉ để xem trước; lúc lưu mới xáo thật).
  const shuffled = [...words].sort((a, b) => (a + a.length).localeCompare(b + b.length));
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <span className="text-xs text-muted-foreground">Xem trước (thẻ từ xáo trộn): </span>
      <div className="mt-1 flex flex-wrap gap-2">
        {shuffled.map((w, i) => (
          <span key={i} className="rounded-md border-2 border-dashed border-gray-300 bg-background px-3 py-1 text-sm font-medium">
            {w}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Đáp án đúng: <b className="text-foreground">{words.join(" ")}</b>
      </p>
    </div>
  );
}

// Xem trước câu "Điền từ vào câu" — câu khuyết + ngân hàng từ.
function WordBlankPreview({
  marked,
  distractorsCsv,
}: {
  marked: string;
  distractorsCsv: string;
}) {
  const parsed = parseMarkedSentence(marked);
  if (!parsed) return null;
  const ds = distractorsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-sm">
      <span className="text-xs text-muted-foreground">Xem trước: </span>
      <span className="font-mono font-semibold">
        {[parsed.prefix, "___", parsed.suffix].filter(Boolean).join(" ")}
      </span>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Từ cho học sinh chọn:</span>
        {[parsed.answer, ...ds].map((w, i) => (
          <span
            key={i}
            className="rounded-md border-2 border-dashed border-gray-300 bg-background px-2.5 py-0.5 text-xs font-medium"
          >
            {w}
          </span>
        ))}
        <span className="text-xs text-muted-foreground">
          · đáp án: <b className="text-foreground">{parsed.answer}</b>
        </span>
      </div>
    </div>
  );
}

// Xem trước câu "Điền chữ còn thiếu" ngay trong form.
function LetterFillPreview({ marked }: { marked: string }) {
  const parsed = parseMarkedWord(marked);
  if (!parsed) return null;
  const sp = (s: string) => s.split("").join(" ");
  const slots = parsed.hidden
    .split("")
    .map(() => "_")
    .join(" ");
  const display = [sp(parsed.prefix), slots, sp(parsed.suffix)]
    .filter(Boolean)
    .join("   ");
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-sm">
      <span className="text-muted-foreground">Xem trước: </span>
      <span className="font-mono font-semibold tracking-wide">{display}</span>
      <span className="text-muted-foreground"> · đáp án: </span>
      <span className="font-mono font-semibold">
        {parsed.hidden.toLowerCase()}
      </span>
    </div>
  );
}

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
