"use client";

// Dialog Thêm/Sửa câu hỏi — khối chế độ ghép cặp (matching). Tách từ question-dialog.tsx, dời nguyên văn (mục 93 Đợt 4b).
// Nhận `form` (kết quả useForm của QuestionDialog) + vài biến phụ; bóc register / setValue / watch / errors ở dòng đầu để JSX giữ nguyên.

import type { UseFormReturn } from "react-hook-form";
import type { QuestionFormValues } from "@/lib/questions/question-form";
import { type SentencePair, G1_SENTENCE_PAIRS, pairKey, pairFromKey } from "@/lib/questions/sentence-bank";
import { AssetField } from "@/components/form-fields/asset-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// ---- het tieu de tach file (muc 93 Dot 4b) ----

export function MatchingFields({ form, watchedDistractors, normSide, pairConflicts, firstFreePair }: {
  form: UseFormReturn<QuestionFormValues>;
  watchedDistractors: { left: string; right: string }[] | undefined;
  normSide: (s: string) => string;
  pairConflicts: (p: { left: string; right: string }, exceptIdx: number) => boolean;
  firstFreePair: () => SentencePair;
}) {
  const { register, setValue, watch, formState: { errors } } = form;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prompt">Đề bài (tuỳ chọn)</Label>
        <Input
          id="prompt"
          placeholder="Nhìn tranh — nối câu hỏi với câu trả lời đúng"
          {...register("prompt" as const)}
        />
      </div>
      <div className="space-y-2">
        <Label>
          Ảnh minh hoạ <span className="text-destructive">*</span>{" "}
          <span className="text-xs text-muted-foreground">
            (1 ảnh chung gợi cặp đúng — vd g1_sent_name_nam.webp)
          </span>
        </Label>
        <AssetField
          kind="image"
          value={(watch("promptImage" as const) as string) ?? ""}
          onChange={(v) =>
            setValue("promptImage" as const, v, { shouldValidate: true })
          }
        />
        {"promptImage" in errors && (
          <p className="text-xs text-destructive">
            {(errors as Record<string, { message?: string }>).promptImage?.message}
          </p>
        )}
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
      <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
        <div className="flex items-center justify-between">
          <Label>✅ Cặp ĐÚNG (khớp với ảnh)</Label>
          <Select
            value=""
            onValueChange={(v) => {
              const p = pairFromKey(v);
              if (!p) return;
              setValue("pairLeft" as const, p.left, { shouldValidate: true });
              setValue("pairRight" as const, p.right, { shouldValidate: true });
            }}
          >
            <SelectTrigger className="h-7 w-56 text-xs">
              <SelectValue placeholder="Chọn nhanh từ ngân hàng..." />
            </SelectTrigger>
            <SelectContent>
              {G1_SENTENCE_PAIRS.map((p) => (
                <SelectItem key={pairKey(p)} value={pairKey(p)}>
                  {p.left} — {p.right}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="pairLeft" className="text-xs">Câu hỏi</Label>
            <Input
              id="pairLeft"
              placeholder="What is your name?"
              {...register("pairLeft" as const)}
            />
            {"pairLeft" in errors && (
              <p className="text-xs text-destructive">
                {(errors as Record<string, { message?: string }>).pairLeft?.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="pairRight" className="text-xs">Câu trả lời</Label>
            <Input
              id="pairRight"
              placeholder="I am Nam"
              {...register("pairRight" as const)}
            />
            {"pairRight" in errors && (
              <p className="text-xs text-destructive">
                {(errors as Record<string, { message?: string }>).pairRight?.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            Cặp NHIỄU (1–3 · chọn từ ngân hàng mẫu câu Lớp 1)
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={(watchedDistractors?.length ?? 0) >= 3}
            onClick={() =>
              setValue(
                "distractors" as const,
                [...(watchedDistractors ?? []), { ...firstFreePair() }],
                { shouldValidate: true },
              )
            }
          >
            + Thêm nhiễu
          </Button>
        </div>
        {(watchedDistractors ?? []).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <Select
              value={d.left && d.right ? `${d.left}|${d.right}` : ""}
              onValueChange={(v) => {
                const p = pairFromKey(v);
                if (!p) return;
                const next = (watchedDistractors ?? []).slice();
                next[i] = { ...p };
                setValue("distractors" as const, next, { shouldValidate: true });
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Chọn cặp nhiễu từ ngân hàng..." />
              </SelectTrigger>
              <SelectContent>
                {G1_SENTENCE_PAIRS.map((p) => {
                  const isCurrent =
                    normSide(p.left) === normSide(d.left) &&
                    normSide(p.right) === normSide(d.right);
                  return (
                    <SelectItem
                      key={pairKey(p)}
                      value={pairKey(p)}
                      disabled={!isCurrent && pairConflicts(p, i)}
                    >
                      {p.left} — {p.right}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              disabled={(watchedDistractors?.length ?? 0) <= 1}
              onClick={() =>
                setValue(
                  "distractors" as const,
                  (watchedDistractors ?? []).filter((_, k) => k !== i),
                  { shouldValidate: true },
                )
              }
            >
              ✕
            </Button>
          </div>
        ))}
        {"distractors" in errors && (
          <p className="text-xs text-destructive">
            {(errors as Record<string, { message?: string }>).distractors?.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          🔗 <b>Ghép cặp theo tranh</b>: học sinh nhìn ảnh → chạm 1 câu hỏi
          → chạm 1 câu trả lời. Chỉ cặp ĐÚNG khớp ảnh được tính; cặp nhiễu
          trộn vào 2 cột.
        </p>
        <MatchingPreview
          left={(watch("pairLeft" as const) as string) ?? ""}
          right={(watch("pairRight" as const) as string) ?? ""}
          distractors={watchedDistractors ?? []}
        />
      </div>
    </>
  );
}

// ---- cac ham xem truoc chuyen nguyen van (muc 93 Dot 4b) ----

// Xem trước câu "Ghép cặp theo tranh" — cặp đúng ✓ + cặp nhiễu.
function MatchingPreview({
  left,
  right,
  distractors,
}: {
  left: string;
  right: string;
  distractors: { left: string; right: string }[];
}) {
  if (!left || !right) return null;
  const chip = (t: string, ok?: boolean) => (
    <span
      className={
        "rounded-full border px-2.5 py-0.5 text-xs " +
        (ok ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-muted/40")
      }
    >
      {t}
    </span>
  );
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-sm">
      <span className="text-xs text-muted-foreground">
        Xem trước (2 cột sẽ xáo khi học sinh làm):
      </span>
      <div className="mt-1 space-y-1">
        <div className="flex items-center gap-1.5">
          {chip(left, true)} ↔ {chip(right, true)}
          <span className="text-xs text-emerald-600">✓ đúng</span>
        </div>
        {distractors
          .filter((d) => d.left && d.right)
          .map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {chip(d.left)} ↔ {chip(d.right)}
              <span className="text-xs text-muted-foreground">(nhiễu)</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
