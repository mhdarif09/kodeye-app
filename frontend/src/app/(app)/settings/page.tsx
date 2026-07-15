"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const TECH_SUGGESTIONS = ["Frontend", "Backend", "Mobile", "DevOps", "Data", "Fullstack"];

const EXPERIENCE_OPTIONS = [
  {
    value: "junior",
    title: "Junior",
    description: "Fokus belajar dasar-dasar, masih butuh bimbingan dalam eksekusi fitur kompleks.",
  },
  {
    value: "mid",
    title: "Mid-Level",
    description: "Mandiri mengeksekusi task, mulai memperhatikan arsitektur dan best practices.",
  },
  {
    value: "senior",
    title: "Senior",
    description: "Memimpin technical direction, fokus pada system design, mentoring, dan business impact.",
  },
];

const LANGUAGE_OPTIONS = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, accessToken, refreshToken, setAuth, logout } = useAuthStore();

  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [language, setLanguage] = useState("id");

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Delete account
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/users/me");
        const p = res.data.data ?? res.data.user ?? res.data;
        setTechStacks(p.tech_stacks ?? p.techStacks ?? []);
        setExperienceLevel(p.experience_level ?? p.experienceLevel ?? "");
        setLanguage(p.language ?? "id");
      } catch {
        toast.error("Gagal memuat profil");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const addTechStack = (tech: string) => {
    const t = tech.trim();
    if (!t) return;
    if (techStacks.length >= 10) {
      toast.error("Maksimal 10 tech stack");
      return;
    }
    if (!techStacks.some((s) => s.toLowerCase() === t.toLowerCase())) {
      setTechStacks([...techStacks, t]);
    }
    setTechInput("");
  };

  const removeTechStack = (tech: string) => {
    setTechStacks(techStacks.filter((t) => t !== tech));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.patch("/api/users/me", {
        techStacks,
        experienceLevel,
        language,
      });
      const updated = res.data.data ?? res.data.user ?? res.data;
      if (user && accessToken) setAuth({ ...user, ...updated }, accessToken, refreshToken);
      toast.success("Preferensi berhasil disimpan");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message || "Gagal menyimpan preferensi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete("/api/users/me");
      toast.success("Akun berhasil dihapus");
      logout();
      router.push("/");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.message;
      if (msg?.toLowerCase?.().includes("session")) {
        toast.error("Tidak bisa menghapus akun: kamu masih memiliki sesi yang aktif. Selesaikan sesi terlebih dahulu.");
      } else {
        toast.error(msg || "Gagal menghapus akun");
      }
      setIsDeleting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola preferensi akun kamu</p>
      </div>

      {/* ── Preferensi ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferensi</CardTitle>
          <CardDescription>Tech stack, level pengalaman, dan bahasa antarmuka</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tech Stacks */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Tech Stack</label>
            <div className="flex flex-wrap gap-2">
              {techStacks.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {t}
                  <button
                    onClick={() => removeTechStack(t)}
                    className="text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ketik lalu tekan Enter (maks 10)"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTechStack(techInput); } }}
                className="max-w-xs"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {TECH_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  onClick={() => addTechStack(sug)}
                  disabled={techStacks.some((t) => t.toLowerCase() === sug.toLowerCase())}
                  className="px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Experience Level</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = experienceLevel === opt.value;
                return (
                  <Card
                    key={opt.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:border-primary/50",
                      isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-background"
                    )}
                    onClick={() => setExperienceLevel(opt.value)}
                  >
                    <CardHeader className="p-3">
                      <CardTitle className="flex justify-between items-center text-sm">
                        {opt.title}
                        {isSelected && (
                          <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1 leading-relaxed">
                        {opt.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="language-select">Bahasa Antarmuka</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full max-w-xs h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-background">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} isLoading={isSaving}>
              Simpan Perubahan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Zona Bahaya ── */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Zona Bahaya</CardTitle>
          <CardDescription>Tindakan ini bersifat permanen dan tidak dapat dibatalkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-md border border-destructive/20 bg-destructive/5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Hapus Akun</p>
              <p className="text-xs text-muted-foreground">
                Hapus akun dan seluruh data kamu secara permanen dari Kodeye.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
              Hapus Akun
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Delete Confirmation Modal ── */}
      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setDeleteConfirm(""); }} className="max-w-md">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-destructive">Hapus Akun</h2>
            <p className="text-sm text-muted-foreground">
              Tindakan ini akan menghapus akun kamu secara permanen, termasuk seluruh riwayat sesi, rating, dan data profil. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="delete-confirm">
              Ketik <span className="font-bold text-destructive">DELETE</span> untuk konfirmasi
            </label>
            <Input
              id="delete-confirm"
              placeholder="DELETE"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className={cn(
                "text-center text-lg font-bold tracking-widest uppercase",
                deleteConfirm === "DELETE" && "border-destructive focus-visible:ring-destructive"
              )}
            />
          </div>

          {isDeleting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              Menghapus akun...
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => { setIsDeleteOpen(false); setDeleteConfirm(""); }}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirm !== "DELETE" || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
