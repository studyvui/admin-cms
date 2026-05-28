"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { clearSessionCookie } from "@/lib/session-cookie";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const hasRole = useAuthStore((s) => s.hasRole);
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const logout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // ignore — clear local session anyway
      }
    }
    clear();
    clearSessionCookie();
    router.push("/login");
  };

  return { user, hasRole, logout, hydrated };
}
