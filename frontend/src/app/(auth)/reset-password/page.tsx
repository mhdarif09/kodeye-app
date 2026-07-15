"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/authSchemas";
import api from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Token tidak valid atau tidak ditemukan.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        token,
        password: data.password,
      });
      setIsSuccess(true);
      toast.success("Password berhasil diubah.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengatur ulang password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-destructive">
          Tautan tidak valid. Harap periksa kembali tautan yang dikirimkan ke email Anda.
        </p>
        <Link href="/forgot-password" className="text-sm text-foreground font-medium hover:underline block">
          Minta tautan baru
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Password Anda berhasil diubah. Anda akan dialihkan ke halaman Masuk...
        </p>
        <div className="mt-4">
          <Link href="/login" className="text-sm text-foreground font-medium hover:underline">
            Masuk sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Password Baru"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Konfirmasi Password Baru"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Simpan Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Suspense fallback={<div className="text-sm text-center text-muted-foreground">Memuat...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
