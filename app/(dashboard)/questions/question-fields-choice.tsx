"use client";

// Dialog Thêm/Sửa câu hỏi — khối chế độ trắc nghiệm (mc, image_choice, audio_choice). Tách từ question-dialog.tsx, dời nguyên văn (mục 93 Đợt 4b).
// Nhận `form` (kết quả useForm của QuestionDialog) + vài biến phụ; bóc register / setValue / watch / errors ở dòng đầu để JSX giữ nguyên.

import type { UseFormReturn } from "react-hook-form";
import type { QuestionFormValues } from "@/lib/questions/question-form";
import type { MathArchetype } from "@/lib/questions/math-archetypes-grade1";
import { AssetField } from "@/components/form-fields/asset-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// ---- het tieu de tach file (muc 93 Dot 4b) ----

export function renderMcFields({ form, selectedArchetype }: {
  form: UseFormReturn<QuestionFormValues>;
  selectedArchetype: MathArchetype | undefined;
}) {
  const { register, setValue, watch } = form;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prompt">Đề bài</Label>
        <Textarea
          id="prompt"
          rows={2}
          placeholder={selectedArchetype?.promptHint || "Which is apple?"}
          {...register("prompt" as const)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B", "C", "D"] as const).map((k, idx) => (
          <div key={k} className="space-y-2">
            <Label htmlFor={`option${k}`}>Lựa chọn {k}</Label>
            <Input
              id={`option${k}`}
              placeholder={selectedArchetype?.optionHints?.[idx]}
              {...register(`option${k}` as const)}
            />
            <AssetField
              kind="image"
              value={(watch(`option${k}Img` as const) as string) ?? ""}
              onChange={(v) =>
                setValue(`option${k}Img` as const, v, {
                  shouldValidate: true,
                })
              }
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        💡 Để tạo câu <b>&quot;chọn hình đúng từ âm thanh&quot;</b>: chọn
        đủ <b>4 ảnh</b> cho A→D (ảnh sẽ là đáp án), điền chữ vào ô lựa
        chọn làm nhãn, chọn audio đề bài ở mục{" "}
        <b>&quot;Asset đính kèm&quot;</b> phía dưới, và đặt Loại câu hỏi
        là <b>Chọn hình</b>.
      </p>
      <div className="space-y-2">
        <Label>Đáp án đúng</Label>
        <Select
          value={watch("correctOption" as const)}
          onValueChange={(v) =>
            setValue(
              "correctOption" as const,
              v as "A" | "B" | "C" | "D",
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function renderImageChoiceFields({ form }: {
  form: UseFormReturn<QuestionFormValues>;
}) {
  const { register, setValue, watch, formState: { errors } } = form;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prompt">
          Đề bài <span className="text-muted-foreground">(tuỳ chọn)</span>
        </Label>
        <Textarea
          id="prompt"
          rows={2}
          placeholder="VD: Đây là gì? (có thể bỏ trống)"
          {...register("prompt" as const)}
        />
      </div>
      <div className="space-y-2">
        <Label>
          Hình ảnh đề bài <span className="text-destructive">*</span>
        </Label>
        <AssetField
          kind="image"
          value={(watch("promptImage" as const) as string) ?? ""}
          onChange={(v) =>
            setValue("promptImage" as const, v, {
              shouldValidate: true,
            })
          }
        />
        {"promptImage" in errors && (
          <p className="text-xs text-destructive">
            {
              (errors as Record<string, { message?: string }>)
                .promptImage?.message
            }
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        🖼️ <b>Ảnh rồi chọn từ</b>: học sinh nhìn ảnh đề bài rồi chọn{" "}
        <b>1 trong 4 từ</b>. Ảnh đề bài bắt buộc; mỗi lựa chọn nhập{" "}
        <b>1 từ</b> (không cần ảnh).
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B", "C", "D"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <Label htmlFor={`option${k}`}>
              Lựa chọn {k} <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`option${k}`}
              {...register(`option${k}` as const)}
            />
            {`option${k}` in errors && (
              <p className="text-xs text-destructive">
                {
                  (errors as Record<string, { message?: string }>)[
                    `option${k}`
                  ]?.message
                }
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label>Đáp án đúng (từ)</Label>
        <Select
          value={watch("correctOption" as const)}
          onValueChange={(v) =>
            setValue(
              "correctOption" as const,
              v as "A" | "B" | "C" | "D",
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function renderAudioChoiceFields({ form }: {
  form: UseFormReturn<QuestionFormValues>;
}) {
  const { register, setValue, watch, formState: { errors } } = form;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prompt">
          Đề bài <span className="text-muted-foreground">(tuỳ chọn)</span>
        </Label>
        <Textarea
          id="prompt"
          rows={2}
          placeholder="VD: Nghe và chọn hình đúng (có thể bỏ trống)"
          {...register("prompt" as const)}
        />
      </div>
      <div className="space-y-2">
        <Label>
          Âm thanh đề bài <span className="text-destructive">*</span>
        </Label>
        <AssetField
          kind="audio"
          value={(watch("promptAudio" as const) as string) ?? ""}
          onChange={(v) =>
            setValue("promptAudio" as const, v, {
              shouldValidate: true,
            })
          }
        />
        {"promptAudio" in errors && (
          <p className="text-xs text-destructive">
            {
              (errors as Record<string, { message?: string }>)
                .promptAudio?.message
            }
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        🔊 <b>Nghe rồi chọn ảnh</b>: học sinh nghe âm thanh đề bài rồi
        chọn <b>1 trong 4 ảnh</b>. Mỗi lựa chọn chỉ cần <b>ảnh</b> (bắt
        buộc), không cần nhập chữ.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B", "C", "D"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <Label>
              Lựa chọn {k}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <AssetField
              kind="image"
              value={(watch(`option${k}Img` as const) as string) ?? ""}
              onChange={(v) =>
                setValue(`option${k}Img` as const, v, {
                  shouldValidate: true,
                })
              }
            />
            {`option${k}Img` in errors && (
              <p className="text-xs text-destructive">
                {
                  (errors as Record<string, { message?: string }>)[
                    `option${k}Img`
                  ]?.message
                }
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label>Đáp án đúng (ảnh)</Label>
        <Select
          value={watch("correctOption" as const)}
          onValueChange={(v) =>
            setValue(
              "correctOption" as const,
              v as "A" | "B" | "C" | "D",
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Ảnh A</SelectItem>
            <SelectItem value="B">Ảnh B</SelectItem>
            <SelectItem value="C">Ảnh C</SelectItem>
            <SelectItem value="D">Ảnh D</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
