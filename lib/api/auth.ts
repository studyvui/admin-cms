import { apiPost } from "@/lib/api-client";
import type { LoginResponse } from "@/lib/types";

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<LoginResponse>("/auth/login", { email, password }),
  logout: (refreshToken: string) =>
    apiPost<{ success: boolean }>("/auth/logout", { refreshToken }),
};
