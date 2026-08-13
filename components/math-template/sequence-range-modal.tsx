"use client";

// ============================================================
// Form nhỏ cho phép admin chỉnh range (start/step) của mẫu built-in "Dãy số"
// (TPL_SEQ_01, generator imperative — không đi qua engine khai báo text/formula/vars
// nên không dùng chung TemplateEditorModal). Chỉ session-only, KHÔNG lưu backend —
// áp dụng ngay vào lần Generate tiếp theo trên trang /ai-generate-math.
// ============================================================
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface SequenceRangeValue {
  startMin: number;
  startMax: number;
  stepMin: number;
  stepMax: number;
  [key: string]: number;
}

export const DEFAULT_SEQUENCE_RANGE: SequenceRangeValue = {
  startMin: 0,
  startMax: 19,
  stepMin: 1,
  stepMax: 5,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: SequenceRangeValue;
  onApply: (value: SequenceRangeValue) => void;
}

export function SequenceRangeModal({ open, onOpenChange, initial, onApply }: Props) {
  const [value, setValue] = useState<SequenceRangeValue>(initial);

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  function setField(field: keyof SequenceRangeValue, raw: string) {
    const n = parseInt(raw, 10);
    setValue((prev) => ({ ...prev, [field]: Number.isFinite(n) ? n : prev[field] }));
  }

  function handleApply() {
    const startMin = Math.min(value.startMin, value.startMax);
    const startMax = Math.max(value.startMin, value.startMax);
    const stepMin = Math.max(1, Math.min(value.stepMin, value.stepMax));
    const stepMax = Math.max(1, Math.max(value.stepMin, value.stepMax));
    onApply({ startMin, startMax, stepMin, stepMax });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh range mẫu "Dãy số"</DialogTitle>
          <DialogDescription>
            Mẫu built-in dạng generator, không sửa được text/formula — chỉ chỉnh khoảng random
            của số bắt đầu và bước nhảy. Áp dụng ngay cho lần Generate tiếp theo (không lưu lại).
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Số bắt đầu — Min</Label>
            <Input
              type="number" min={0} value={value.startMin}
              onChange={(e) => setField("startMin", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Số bắt đầu — Max</Label>
            <Input
              type="number" min={0} value={value.startMax}
              onChange={(e) => setField("startMax", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Bước nhảy — Min</Label>
            <Input
              type="number" min={1} value={value.stepMin}
              onChange={(e) => setField("stepMin", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Bước nhảy — Max</Label>
            <Input
              type="number" min={1} value={value.stepMax}
              onChange={(e) => setField("stepMax", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={handleApply}>Áp dụng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
