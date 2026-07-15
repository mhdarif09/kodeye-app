"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const EXPERIENCE_LEVELS = ["junior", "mid", "senior"] as const;

const editProfileSchema = z.object({
  displayName: z.string().min(3, "Display name minimal 3 karakter"),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
});
type EditProfileInput = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: {
    displayName: string;
    experienceLevel: string;
    techStacks: string[];
  };
  onSaved: (updated: any) => void;
}

export function EditProfileModal({ isOpen, onClose, currentData, onSaved }: EditProfileModalProps) {
  const { user, accessToken, refreshToken, setAuth } = useAuthStore();
  const [techStacks, setTechStacks] = useState<string[]>(currentData.techStacks);
  const [techInput, setTechInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setTechStacks(currentData.techStacks);
  }, [isOpen, currentData.techStacks]);

  const { register, handleSubmit, formState: { errors } } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: currentData.displayName,
      experienceLevel: (currentData.experienceLevel as any) ?? "mid",
    },
  });

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || techStacks.length >= 10) return;
    if (!techStacks.some((s) => s.toLowerCase() === t.toLowerCase())) {
      setTechStacks((prev) => [...prev, t]);
    }
    setTechInput("");
  };

  const removeTag = (tag: string) => setTechStacks((prev) => prev.filter((s) => s !== tag));

  const onSubmit = async (data: EditProfileInput) => {
    setIsLoading(true);
    try {
      const res = await api.patch("/api/users/me", {
        displayName: data.displayName,
        experienceLevel: data.experienceLevel,
        techStacks,
      });
      const updated = res.data.user ?? res.data;
      if (user && accessToken) setAuth({ ...user, ...updated }, accessToken, refreshToken);
      toast.success("Profil berhasil diperbarui");
      onSaved(updated);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <h2 className="text-xl font-bold tracking-tight mb-5">Edit Profil</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Display Name"
          error={errors.displayName?.message}
          {...register("displayName")}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Experience Level</label>
          <div className="flex gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <label
                key={level}
                className={cn(
                  "flex-1 cursor-pointer rounded-md border px-3 py-2 text-sm font-medium text-center transition-colors capitalize",
                  "has-[:checked]:border-primary has-[:checked]:bg-primary/10 border-border hover:border-primary/40"
                )}
              >
                <input type="radio" className="sr-only" value={level} {...register("experienceLevel")} />
                {level}
              </label>
            ))}
          </div>
          {errors.experienceLevel && (
            <p className="text-xs text-destructive">{errors.experienceLevel.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tech Stacks (maks 10)</label>
          <div className="flex flex-wrap gap-2 min-h-[36px]">
            {techStacks.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="text-muted-foreground hover:text-foreground ml-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <Input
            placeholder="Ketik + Enter untuk menambah"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(techInput); } }}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit" isLoading={isLoading}>Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}
