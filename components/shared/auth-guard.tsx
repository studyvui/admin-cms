"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { clearSessionCookie } from "@/lib/session-cookie";

/**
 * Bao ve route dashboard o phia client.
 *
 * Middleware chi kiem tra COOKIE sv-admin-session, con user/token nam o
 * localStorage (zustand persist). Khi 2 nguon lech nhau (cookie con nhung
 * localStorage da bi xoa / het han), trang render nua voi: topbar/sidebar
 * trong, "Xin chao, — vai tro". Guard nay phat hien tinh trang do, don dep
 * cookie va dua nguoi dung ve /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Cho zustand persist rehydrate xong (localStorage chi co o client) truoc khi
  // quyet dinh — tranh SSR mismatch va redirect nham luc chua doc localStorage.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !user) {
      clearSessionCookie();
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;
  return <>{children}</>;
}
