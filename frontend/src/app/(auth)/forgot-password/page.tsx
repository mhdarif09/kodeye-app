"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/authSchemas";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      await api.post("/api/auth/forgot-password", data);
      setIsSuccess(true);
      toast.success("Tautan reset password telah dikirim ke email Anda.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengirim permintaan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {isSuccess ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Kami telah mengirimkan tautan untuk mengatur ulang password Anda. Silakan periksa kotak masuk atau folder spam email Anda.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsSuccess(false)}
            >
              Kirim ulang
            </Button>
            <div className="mt-4">
              <Link href="/login" className="text-sm text-foreground font-medium hover:underline">
                Kembali ke halaman Masuk
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang password Anda.
            </p>
            <Input
              label="Email"
              type="email"
              placeholder="nama@email.com"
              error={errors.email?.message}
              {...register("email")}
            />
            
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Kirim Tautan
            </Button>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Ingat password Anda?{" "}
              <Link href="/login" className="text-foreground font-medium hover:underline">
                Masuk
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
