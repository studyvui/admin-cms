import { apiGet } from "@/lib/api-client";
import type { AuditAction, AuditLog, ReviewQueue } from "@/lib/types";

interface RecentAuditParams {
  action?: AuditAction;
  entityType?: string;
  limit?: number;
}

export const qaApi = {
  getReviewQueue: () => apiGet<ReviewQueue>("/admin/dashboard/review-queue"),
  getRecentAudit: (params: RecentAuditParams = {}) =>
    apiGet<AuditLog[]>("/admin/audit/recent", { params }),
  getEntityAudit: (entityType: string, entityId: string, limit = 50) =>
    apiGet<AuditLog[]>(`/admin/audit/entity/${entityType}/${entityId}`, {
      params: { limit },
    }),
};
