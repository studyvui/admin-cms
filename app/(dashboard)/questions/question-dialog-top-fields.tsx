"use client";

// Dialog Thêm/Sửa câu hỏi — ô phía trên (khoá học, bài học, code, loại, skill, độ khó). Tách từ question-dialog.tsx, dời nguyên văn (mục 93 Đợt 4b).
// Nhận `form` (kết quả useForm của QuestionDialog) + vài biến phụ; bóc register / setValue / watch / errors ở dòng đầu để JSX giữ nguyên.

import type { Dispatch, SetStateAction } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { QuestionFormValues } from "@/lib/questions/question-form";
import type { Question } from "@/lib/types";
import type { MathArchetype } from "@/lib/questions/math-archetypes-grade1";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, SKILL_LABELS } from "@/lib/questions/labels";
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

export function QuestionTopFields({ form, dialogCourseId, setDialogCourseId, lessonsInCourse, lessonSkills, mathArchetypes, useMathArchetypes, archetypeIdx, setArchetypeIdx, selectedArchetype, archetypeIcon, mathSkillOptions, lessons, editing, courses }: {
  form: UseFormReturn<QuestionFormValues>;
  dialogCourseId: string;
  setDialogCourseId: Dispatch<SetStateAction<string>>;
  lessonsInCourse: { id: string; courseId: string; code: string; name: string; skills: string[] }[];
  lessonSkills: string[];
  mathArchetypes: MathArchetype[];
  useMathArchetypes: boolean;
  archetypeIdx: string;
  setArchetypeIdx: Dispatch<SetStateAction<string>>;
  selectedArchetype: MathArchetype | undefined;
  archetypeIcon: (feas: string) => string;
  mathSkillOptions: string[];
  lessons: { id: string; courseId: string; code: string; name: string; skills: string[] }[];
  editing: Question | null;
  courses: { id: string; code: string; name: string }[];
}) {
  const { register, setValue, watch, formState: { errors } } = form;
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Khóa học</Label>
          <Select
            value={dialogCourseId}
            onValueChange={(v) => {
              setDialogCourseId(v);
              // Tự chọn bài học đầu tiên của khóa mới
              const firstLesson = lessons.find((l) => l.courseId === v);
              setValue("lessonId", firstLesson?.id ?? "", { shouldValidate: true });
            }}
            disabled={!!editing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn khóa học" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Bài học</Label>
          <Select
            value={watch("lessonId")}
            onValueChange={(v) =>
              setValue("lessonId", v, { shouldValidate: true })
            }
            disabled={!!editing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn bài học" />
            </SelectTrigger>
            <SelectContent>
              {lessonsInCourse.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.code} — {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.lessonId && (
            <p className="text-xs text-destructive">
              {errors.lessonId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code câu hỏi</Label>
          <Input
            id="code"
            readOnly
            disabled={!!editing}
            className="cursor-not-allowed bg-muted font-mono text-sm text-muted-foreground"
            {...register("code")}
          />
          {errors.code && (
            <p className="text-xs text-destructive">
              {errors.code.message}
            </p>
          )}
          {!editing && (
            <p className="text-xs text-muted-foreground">
              Tự động sinh từ bài học đã chọn.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>
            {useMathArchetypes ? "Loại câu hỏi (Dạng bài theo SGK)" : "Loại câu hỏi"}
          </Label>
          <Select
            value={useMathArchetypes ? archetypeIdx : watch("type")}
            onValueChange={(v) => {
              if (useMathArchetypes) {
                setArchetypeIdx(v);
                const a = mathArchetypes[Number(v)];
                if (a) {
                  setValue("type", a.label, { shouldValidate: true });
                  setValue("skill", a.skill, { shouldValidate: true });
                }
              } else {
                setValue("type", v, { shouldValidate: true });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={useMathArchetypes ? "Chọn dạng bài..." : undefined}
              />
            </SelectTrigger>
            <SelectContent>
              {useMathArchetypes
                ? mathArchetypes.map((a, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {archetypeIcon(a.feas)}
                      {a.label}
                    </SelectItem>
                  ))
                : QUESTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t] ?? t}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          {useMathArchetypes && selectedArchetype && (
            <p className="text-xs text-muted-foreground">
              Skill đã tự điền: <b>{selectedArchetype.skill}</b> · gợi ý đề
              bài/đáp án đã điền vào ô placeholder bên dưới.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="skill">Skill</Label>
          {useMathArchetypes ? (
            <Select
              value={watch("skill")}
              onValueChange={(v) =>
                setValue("skill", v, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn Loại câu hỏi (Dạng bài) trước" />
              </SelectTrigger>
              <SelectContent>
                {mathSkillOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : !editing && lessonSkills.length > 0 ? (
            <Select
              value={watch("skill")}
              onValueChange={(v) =>
                setValue("skill", v, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn skill" />
              </SelectTrigger>
              <SelectContent>
                {lessonSkills.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SKILL_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input id="skill" {...register("skill")} />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Độ khó (1-5)</Label>
          <Input
            id="difficulty"
            type="number"
            min={1}
            max={5}
            {...register("difficulty", { valueAsNumber: true })}
          />
        </div>
      </div>
    </>
  );
}

// ---- het phan chuyen nguyen van (muc 93 Dot 4b) ----
