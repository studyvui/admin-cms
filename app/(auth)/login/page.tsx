"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { setSessionCookie } from "@/lib/session-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      const res = await authApi.login(values.email, values.password);
      const allowed = ["admin", "editor", "qa"];
      if (!allowed.includes(res.user.role)) {
        setSubmitError(
          `Tài khoản role "${res.user.role}" không có quyền truy cập Admin CMS.`,
        );
        return;
      }
      setSession({
        user: res.user,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      setSessionCookie();
      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setSubmitError(
            "Không kết nối được tới backend (lỗi mạng hoặc CORS). " +
              "Kiểm tra NEXT_PUBLIC_API_URL và CORS_ORIGINS của backend.",
          );
        } else {
          const msg = err.response.data?.message;
          setSubmitError(
            Array.isArray(msg)
              ? msg.join(", ")
              : (msg ?? `Lỗi ${err.response.status}: Đăng nhập thất bại`),
          );
        }
      } else {
        setSubmitError("Lỗi không xác định");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl">StudyVui Admin</CardTitle>
          <CardDescription>
            Đăng nhập vào hệ thống quản trị nội dung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="editor@studyvui.vn"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {submitError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Chỉ tài khoản role <code>admin</code>, <code>editor</code>,{" "}
            <code>qa</code> được phép truy cập.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
