"use client";

// Panel "Cấu hình hệ thống" — nhận data/mutation qua props từ page.tsx (không tự gọi hook riêng).
// Nhóm setting theo category, mỗi nhóm 1 Card. Boolean auto-save khi toggle; number/string/json
// có nút "Lưu" riêng từng dòng (không auto-save vì gõ dở dang không nên gửi liên tục).

import { useMemo, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { AppSetting, SettingValue } from "@/lib/types";
import {
  coerceSettingValue,
  toSettingPayload,
} from "@/lib/settings/settings-form";
import { SETTING_CATEGORY_LABELS } from "@/lib/settings/labels";
import { extractError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type UpdateSettingMutation = UseMutationResult<
  AppSetting,
  unknown,
  { key: string; value: SettingValue }
>;

export function SystemPanel({
  settings,
  isLoadingSettings,
  settingsError,
  updateSettingMut,
}: {
  settings: AppSetting[] | undefined;
  isLoadingSettings: boolean;
  settingsError: unknown;
  updateSettingMut: UpdateSettingMutation;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, AppSetting[]>();
    for (const s of settings ?? []) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return Array.from(map.entries());
  }, [settings]);

  if (isLoadingSettings) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {extractError(settingsError)}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Chưa có cấu hình hệ thống nào.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">
              {SETTING_CATEGORY_LABELS[category] ?? category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((setting) => (
              <SettingRow
                key={setting.id}
                setting={setting}
                updateSettingMut={updateSettingMut}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function valueToInputString(value: SettingValue): string {
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function SettingRow({
  setting,
  updateSettingMut,
}: {
  setting: AppSetting;
  updateSettingMut: UpdateSettingMutation;
}) {
  const [draft, setDraft] = useState(() => valueToInputString(setting.value));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const save = (coerced: SettingValue) => {
    updateSettingMut.mutate(
      { key: setting.key, value: toSettingPayload(coerced).value },
      {
        onSuccess: showSaved,
        onError: (err) => alert(extractError(err)),
      },
    );
  };

  if (setting.valueType === "boolean") {
    const checked = Boolean(setting.value);
    return (
      <div className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
        <div>
          <p className="text-sm font-medium">{setting.label}</p>
          {setting.description && (
            <p className="text-xs text-muted-foreground">{setting.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-emerald-600">Đã lưu</span>}
          <Switch
            aria-label={setting.label}
            checked={checked}
            onCheckedChange={(v) => save(coerceSettingValue("boolean", v))}
          />
        </div>
      </div>
    );
  }

  const handleSave = () => {
    try {
      const coerced = coerceSettingValue(setting.valueType, draft);
      setError(null);
      save(coerced);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giá trị không hợp lệ");
    }
  };

  return (
    <div className="space-y-2 border-b pb-4 last:border-0 last:pb-0">
      <Label htmlFor={`setting-${setting.key}`}>{setting.label}</Label>
      {setting.description && (
        <p className="text-xs text-muted-foreground">{setting.description}</p>
      )}
      {setting.valueType === "json" ? (
        <Textarea
          id={`setting-${setting.key}`}
          rows={4}
          className="font-mono text-xs"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <Input
          id={`setting-${setting.key}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={updateSettingMut.isPending}
          onClick={handleSave}
        >
          {updateSettingMut.isPending ? "Đang lưu..." : "Lưu"}
        </Button>
        {saved && <span className="text-xs text-emerald-600">Đã lưu</span>}
      </div>
    </div>
  );
}
