"use client";

// Chọn kỹ năng cho bài học (toggle badge known + thêm custom). Lưu dạng CSV.
// Tách từ lessons/page.tsx — giữ NGUYÊN VẸN.

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { skillLabelsForSubject } from "@/lib/lessons/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SkillPicker({
  value,
  onChange,
  subject,
}: {
  value: string;
  onChange: (csv: string) => void;
  subject?: string;
}) {
  const [customInput, setCustomInput] = useState("");

  const skillLabels = useMemo(() => skillLabelsForSubject(subject), [subject]);

  const selected = useMemo(
    () => new Set(value.split(",").map((s) => s.trim()).filter(Boolean)),
    [value],
  );

  const knownKeys = useMemo(() => new Set(Object.keys(skillLabels)), [skillLabels]);

  const customSkills = useMemo(
    () => Array.from(selected).filter((s) => !knownKeys.has(s)),
    [selected, knownKeys],
  );

  const update = (next: Set<string>) => onChange(Array.from(next).join(", "));

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    update(next);
  };

  const removeCustom = (key: string) => {
    const next = new Set(selected);
    next.delete(key);
    update(next);
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const next = new Set(selected);
    next.add(trimmed);
    update(next);
    setCustomInput("");
  };

  return (
    <div className="space-y-2">
      {/* Known skills — toggle badges */}
      <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/20 p-2.5">
        {Object.entries(skillLabels).map(([key, label]) => (
          <button
            type="button"
            key={key}
            onClick={() => toggle(key)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              selected.has(key)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom skills not in SKILL_LABELS */}
      {customSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {customSkills.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
            >
              {s}
              <button type="button" onClick={() => removeCustom(s)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add custom skill */}
      <div className="flex gap-2">
        <Input
          placeholder="Thêm kỹ năng tùy chỉnh..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          className="h-8 text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={addCustom}>
          Thêm
        </Button>
      </div>
    </div>
  );
}
