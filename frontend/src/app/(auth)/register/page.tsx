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
import { registerSchema, type RegisterInput } from "@/lib/validation/authSchemas";
import { useAuthStore, isOnboardingComplete } from "@/store/authStore";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const handleSuccess = (user: any, accessToken: string, refreshToken: string) => {
    setAuth(user, accessToken, refreshToken);
    
    if (isOnboardingComplete(user)) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      // Register
      await api.post("/api/auth/register", data);
      // Auto-login after register (register endpoint doesn't return accessToken)
      const loginRes = await api.post("/api/auth/login", {
        email: data.email,
        password: data.password,
      });
      const { user, accessToken, refreshToken } = loginRes.data;
      toast.success("Akun berhasil dibuat!");
      handleSuccess(user, accessToken, refreshToken);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || "Gagal membuat akun. Silakan coba lagi.");
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
      toast.error(error.response?.data?.message || "Gagal mendaftar dengan Google.");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Display Name"
            placeholder="John Doe"
            error={errors.displayName?.message}
            {...register("displayName")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          
          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Daftar
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Atau daftar dengan</span>
          </div>
        </div>

        <div className="flex justify-center [&>div]:w-full">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => toast.error("Terjadi kesalahan saat otentikasi Google")}
            theme="filled_black"
            shape="rectangular"
            text="signup_with"
          />
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Masuk
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
