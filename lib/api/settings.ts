import { apiGet, apiPatch } from "@/lib/api-client";
import type { AppSetting, SettingValue } from "@/lib/types";

export const settingsApi = {
  list: () => apiGet<AppSetting[]>("/admin/settings"),
  update: (key: string, value: SettingValue) =>
    apiPatch<AppSetting>(`/admin/settings/${key}`, { value }),
  updateMany: (items: { key: string; value: SettingValue }[]) =>
    apiPatch<AppSetting[]>("/admin/settings", { items }),
};
