import { apiClient, apiDelete, apiGet } from "@/lib/api-client";
import type { AssetItem, AssetType } from "@/lib/types";

interface ListAssetsParams {
  prefix?: string;
  type?: AssetType;
}

export const assetsApi = {
  list: (params: ListAssetsParams = {}) =>
    apiGet<AssetItem[]>("/admin/assets", { params }),

  upload: async (file: File, prefix?: string): Promise<AssetItem> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post<AssetItem>("/admin/assets/upload", form, {
      params: prefix ? { prefix } : undefined,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  delete: (key: string) =>
    apiDelete<{ success: boolean; key: string }>("/admin/assets", {
      params: { key },
    }),
};
