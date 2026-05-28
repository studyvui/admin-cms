"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

interface PermissionGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  roles,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasRole, hydrated } = useAuth();
  if (!hydrated) return null;
  if (!hasRole(...roles)) return <>{fallback}</>;
  return <>{children}</>;
}
