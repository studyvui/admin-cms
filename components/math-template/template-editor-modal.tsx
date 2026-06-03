"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Eye, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { generateOne } from "@/lib/math-gen/generate";
import { SKILL_LABELS, skillLabel, lessonTypeLabel } from "@/lib/math-gen/labels";
import type { MathTemplate, ServerTemplate, TemplateInput, TemplateVar, VarType } from "@/lib/math-gen/types";

const VAR_NAMES = ["a", "b", "c", "d"];

interface VarRow {
  name: string;
  type: VarType;
  min: string;
  max: string;
  choices: string; // "/"-separated
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonType: string;
  editing: ServerTemplate | null;
  /** Prefill khi sao chép built-in thành mẫu mới (không có id → tạo mới). */
  initial?: TemplateInput | null;
  /** Kỹ năng cho phép (lấy từ bài học của tuần). Rỗng → cho mọi kỹ năng. */
  allowedSkills?: string[];
  saving: boolean;
  onSubmit: (input: TemplateInput, id?: string) => void;
}

function toVarRows(vars: TemplateVar[]): VarRow[] {
  if (!vars || vars.length === 0) {
    return [
      { name: "a", type: "number", min: "1", max: "10", choices: "" },
      { name: "b", type: "number", min: "1", max: "10", choices: "" },
    ];
  }
  return vars.slice(0, 4).map((v, i) => ({
    name: v.name || VAR_NAMES[i],
    type: v.type,
    min: v.min != null ? String(v.min) : "1",
    max: v.max != null ? String(v.max) : "10",
    choices: (v.choices || []).join("/"),
  }));
}

function rowsToVars(rows: VarRow[]): TemplateVar[] {
  return rows.map((r) =>
    r.type === "text"
      ? { name: r.name, type: "text" as const, choices: r.choices.split("/").map((s) => s.trim()).filter(Boolean) }
      : { name: r.name, type: "number" as const, min: parseInt(r.min || "1", 10), max: parseInt(r.max || "10", 10) },
  );
}

export function TemplateEditorModal({ open, onOpenChange, lessonType, editing, initial, allowedSkills, saving, onSubmit }: Props) {
  const skillOptions = useMemo(
    () => (allowedSkills && allowedSkills.length > 0 ? allowedSkills : Object.keys(SKILL_LABELS)),
    [allowedSkills],
  );

  const [text, setText] = useState("");
  const [formula, setFormula] = useState("");
  const [condition, setCondition] = useState("");
  const [skill, setSkill] = useState(skillOptions[0]);
  const [distractorCount, setDistractorCount] = useState(3);
  const [rows, setRows] = useState<VarRow[]>(toVarRows([]));
  const [preview, setPreview] = useState<{ text: string; options: string[]; answer: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const seed = editing ?? initial;
    const fallbackSkill = skillOptions[0];
    if (seed) {
      setText(seed.text);
      setFormula(seed.formula);
      setCondition((editing?.condition ?? initial?.condition ?? "") || "");
      // chỉ giữ skill nếu nằm trong danh sách cho phép của bài học
      setSkill(skillOptions.includes(seed.skill) ? seed.skill : fallbackSkill);
      setDistractorCount(seed.distractorCount || 3);
      setRows(toVarRows(seed.vars));
    } else {
      setText("");
      setFormula("");
      setCondition("");
      setSkill(fallbackSkill);
      setDistractorCount(3);
      setRows(toVarRows([]));
    }
    setPreview(null);
    setError(null);
  }, [open, editing, initial, skillOptions]);

  const addRow = () => {
    if (rows.length >= 4) return;
    setRows([...rows, { name: VAR_NAMES[rows.length], type: "number", min: "1", max: "10", choices: "" }]);
  };
  const removeRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, name: VAR_NAMES[idx] }));
    setRows(next);
  };
  const updateRow = (i: number, patch: Partial<VarRow>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const buildInput = (): TemplateInput => ({
    lessonType,
    skill,
    grade: 1,
    text: text.trim(),
    formula: formula.trim(),
    condition: condition.trim() || undefined,
    vars: rowsToVars(rows),
    distractorCount,
  });

  const runPreview = () => {
    if (!text.trim() || !formula.trim()) {
      setError("Cần nhập nội dung câu hỏi và công thức.");
      return;
    }
    setError(null);
    const t: MathTemplate = { id: "PREVIEW", source: "user", ...buildInput() };
    const q = generateOne(t, 1, 1, 2);
    setPreview({ text: q.text, options: q.options, answer: q.correct_answer });
  };

  const submit = () => {
    if (!text.trim() || !formula.trim()) {
      setError("Cần nhập nội dung câu hỏi và công thức.");
      return;
    }
    onSubmit(buildInput(), editing?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa template" : initial ? "Sao chép mẫu (tạo bản mới)" : "Thêm template"}</DialogTitle>
          <DialogDescription>
            Loại bài học: <strong>{lessonTypeLabel(lessonType)}</strong> · dùng {"{a}{b}{c}{d}"} cho biến.
            {!editing && initial ? " · Đang sao chép từ mẫu built-in — lưu sẽ tạo bản custom mới." : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div>
            <Label className="text-xs">Nội dung câu hỏi</Label>
            <Input className="mt-1" placeholder="Tính: {a} + {b} = ?" value={text} onChange={(e) => setText(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Công thức đáp án</Label>
              <Input className="mt-1 font-mono" placeholder="a + b  hoặc  comparison" value={formula} onChange={(e) => setFormula(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Kỹ năng</Label>
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {skillOptions.map((s) => (
                    <SelectItem key={s} value={s}>{skillLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Nhập <code className="rounded bg-muted px-1">comparison</code> làm công thức để tự sinh dấu &gt; &lt; = (3 lựa chọn).
          </p>

          <div>
            <Label className="text-xs">Điều kiện ràng buộc (tùy chọn)</Label>
            <Input
              className="mt-1 font-mono"
              placeholder="vd: a >= b  (để phép trừ không ra số âm)"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Hệ thống random lại biến đến khi thỏa điều kiện. Chỉ dùng biến số, vd <code className="rounded bg-muted px-1">c &gt; b</code>, <code className="rounded bg-muted px-1">a &gt;= b &amp;&amp; a &lt;= 10</code>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Biến số</Label>
              <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={rows.length >= 4}>
                <Plus className="mr-1 h-3 w-3" /> Biến
              </Button>
            </div>
            {rows.map((r, i) => (
              <div key={r.name} className="flex items-end gap-2 rounded-md border p-2">
                <div className="w-10">
                  <Label className="text-[10px]">Biến</Label>
                  <div className="mt-1 rounded bg-muted px-2 py-1.5 text-center font-mono text-sm font-bold">{r.name}</div>
                </div>
                <div className="w-28">
                  <Label className="text-[10px]">Kiểu</Label>
                  <Select value={r.type} onValueChange={(v) => updateRow(i, { type: v as VarType })}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Số (min–max)</SelectItem>
                      <SelectItem value="text">Chữ (a/b/c)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {r.type === "number" ? (
                  <>
                    <div className="w-20">
                      <Label className="text-[10px]">Min</Label>
                      <Input type="number" className="mt-1 h-9" value={r.min} onChange={(e) => updateRow(i, { min: e.target.value })} />
                    </div>
                    <div className="w-20">
                      <Label className="text-[10px]">Max</Label>
                      <Input type="number" className="mt-1 h-9" value={r.max} onChange={(e) => updateRow(i, { max: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <div className="flex-1">
                    <Label className="text-[10px]">Lựa chọn (cách nhau bằng /)</Label>
                    <Input className="mt-1 h-9" placeholder="Lan/Mai/Tuấn/Việt" value={r.choices} onChange={(e) => updateRow(i, { choices: e.target.value })} />
                  </div>
                )}
                <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => removeRow(i)} disabled={rows.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div>
            <Label className="text-xs">Số đáp án nhiễu</Label>
            <Select value={String(distractorCount)} onValueChange={(v) => setDistractorCount(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 nhiễu (3 đáp án)</SelectItem>
                <SelectItem value="3">3 nhiễu (4 đáp án)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preview && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="mb-2 font-medium">{preview.text}</div>
              <div className="flex flex-wrap gap-2">
                {preview.options.map((o) => (
                  <span
                    key={o}
                    className={
                      o === preview.answer
                        ? "rounded border border-green-500 bg-green-100 px-2 py-1 text-xs text-green-800"
                        : "rounded border px-2 py-1 text-xs"
                    }
                  >
                    {o}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Đáp án: <strong>{preview.answer}</strong></div>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={runPreview}>
            <Eye className="mr-1 h-4 w-4" /> Preview
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            {editing ? "Lưu thay đổi" : "Lưu template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
