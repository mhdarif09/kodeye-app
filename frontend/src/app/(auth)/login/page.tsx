"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { loginSchema, type LoginInput } from "@/lib/validation/authSchemas";
import { useAuthStore, isOnboardingComplete } from "@/store/authStore";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const handleSuccess = (user: any, accessToken: string, refreshToken: string) => {
    setAuth(user, accessToken, refreshToken);
    
    if (isOnboardingComplete(user)) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/login", data);
      const { user, accessToken, refreshToken } = res.data;
      toast.success("Berhasil masuk!");
      handleSuccess(user, accessToken, refreshToken);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal masuk. Silakan periksa kembali email dan password Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    
    try {
      const res = await api.post("/api/auth/google", {
        id_token: credentialResponse.credential,
      });
      const { user, accessToken, refreshToken } = res.data;
      toast.success("Berhasil masuk dengan Google!");
      handleSuccess(user, accessToken, refreshToken);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal masuk dengan Google.");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Lupa password?
              </Link>
            </div>
          </div>
          
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Masuk
          </Button>
        </form>

        {/* Google login — hidden for now */}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/register" className="text-foreground font-medium hover:underline">
            Daftar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
