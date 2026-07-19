"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthStore, isOnboardingComplete } from "@/store/authStore";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const SKILL_OPTIONS = [
  { label: "System Design", value: "SYSTEM_DESIGN", icon: "🏗️" },
  { label: "Technical Communication", value: "TECHNICAL_COMMUNICATION", icon: "📝" },
  { label: "Debugging", value: "DEBUGGING", icon: "🐛" },
  { label: "Negotiation", value: "NEGOTIATION", icon: "🤝" },
  { label: "Stakeholder Management", value: "STAKEHOLDER_MANAGEMENT", icon: "👥" },
  { label: "Mentoring", value: "MENTORING", icon: "🧑‍🏫" },
  { label: "Interview Prep", value: "INTERVIEW_PREP", icon: "🎯" },
];

const TECH_SUGGESTIONS = ["Frontend", "Backend", "Mobile", "DevOps", "Data", "Fullstack"];

const EXPERIENCE_OPTIONS = [
  {
    value: "junior",
    title: "Junior",
    icon: "🌱",
    description: "Fokus belajar dasar-dasar, masih butuh bimbingan dalam eksekusi fitur kompleks.",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    border: "border-emerald-500/20",
  },
  {
    value: "mid",
    title: "Mid-Level",
    icon: "⚡",
    description: "Mandiri mengeksekusi task, mulai memperhatikan arsitektur dan best practices.",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    border: "border-blue-500/20",
  },
  {
    value: "senior",
    title: "Senior",
    icon: "👑",
    description: "Memimpin technical direction, fokus pada system design, mentoring, dan business impact.",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    border: "border-purple-500/20",
  },
];

const STEP_HEADERS = [
  { icon: "🎯", title: "Kategori Skill", desc: "Pilih area spesifik yang ingin kamu latih atau tingkatkan." },
  { icon: "🛠️", title: "Tech Stack", desc: "Teknologi apa saja yang paling sering kamu gunakan?" },
  { icon: "📈", title: "Tingkat Pengalaman", desc: "Pilih level yang paling sesuai dengan profil karirmu saat ini." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  const [step, setStep] = useState(1);
  const [skillCategories, setSkillCategories] = useState<string[]>([]);
  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [techInput, setTechInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (isOnboardingComplete(user)) {
          router.push("/dashboard");
          return;
        }
        const res = await api.get("/api/users/me");
        if (isOnboardingComplete(res.data.data)) {
          if (accessToken) {
            setAuth(res.data.user, accessToken, refreshToken);
          }
          router.push("/dashboard");
        } else {
          setIsInitializing(false);
        }
      } catch (error) {
        setIsInitializing(false);
      }
    };
    checkUser();
  }, [user, router, setAuth, accessToken]);

  const toggleSkill = (val: string) => {
    setSkillCategories((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  const addTechStack = (tech: string) => {
    const normalized = tech.trim();
    if (!normalized) return;
    if (techStacks.length >= 10) {
      toast.error("Maksimal 10 tech stack");
      return;
    }
    if (!techStacks.some(t => t.toLowerCase() === normalized.toLowerCase())) {
      setTechStacks([...techStacks, normalized]);
    }
    setTechInput("");
  };

  const removeTechStack = (tech: string) => {
    setTechStacks(techStacks.filter((t) => t !== tech));
  };

  const handleTechInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTechStack(techInput);
    }
  };

  const handleSubmit = async () => {
    if (!experienceLevel) {
      toast.error("Pilih experience level terlebih dahulu");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/users/me/onboarding", {
        skillCategories,
        techStacks,
        experienceLevel,
      });
      const updatedUser = res.data.data ?? res.data.user;
      if (accessToken) {
        setAuth(updatedUser, accessToken, refreshToken);
      }
      toast.success("Profil berhasil diperbarui!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan saat menyimpan profil");
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center min-h-screen bg-gradient-to-b from-background via-background to-muted/10 pb-12">
      <div className="w-full max-w-2xl px-4 pt-12 md:pt-20">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500",
                  step > idx
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : step === idx
                    ? "bg-primary/10 text-primary border-2 border-primary/30 scale-110"
                    : "bg-muted/30 text-muted-foreground border border-border/30"
                )}>
                  {step > idx ? "✓" : idx + 1}
                </div>
                {idx < 2 && (
                  <div className={cn(
                    "h-1 w-12 md:w-20 rounded-full transition-all duration-500",
                    step > idx + 1 ? "bg-primary" : "bg-muted/30"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="relative min-h-[400px]">
          {/* Step 1: Skills */}
          <div className={cn(
            "w-full transition-all duration-500",
            step === 1 ? "block" : "hidden"
          )}>
            <div className="text-center mb-8">
              <span className="text-4xl block mb-3">🎯</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Kategori Skill</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Pilih area spesifik yang ingin kamu latih atau tingkatkan.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {SKILL_OPTIONS.map((opt) => {
                const isSelected = skillCategories.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleSkill(opt.value)}
                    className={cn(
                      "group relative overflow-hidden px-5 py-3 rounded-2xl border text-sm font-medium transition-all duration-300 flex items-center gap-2",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                        : "bg-background text-foreground border-border/50 hover:border-primary/30 hover:bg-muted/30 hover:scale-[1.02]"
                    )}
                  >
                    <span className={isSelected ? "" : "opacity-70"}>{opt.icon}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Tech Stacks */}
          <div className={cn(
            "w-full transition-all duration-500",
            step === 2 ? "block" : "hidden"
          )}>
            <div className="text-center mb-8">
              <span className="text-4xl block mb-3">🛠️</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tech Stack</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Teknologi apa saja yang paling sering kamu gunakan?</p>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl border border-border/30 bg-muted/10">
                {techStacks.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 w-full text-center py-2">Belum ada tech stack ditambahkan</p>
                ) : (
                  techStacks.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground group"
                    >
                      {tech}
                      <button
                        onClick={() => removeTechStack(tech)}
                        className="text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div>
                <Input
                  placeholder="Ketik lalu tekan Enter (maks 10)"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleTechInputKeyDown}
                  className="max-w-md mx-auto"
                />
              </div>

              <div className="pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Saran:</p>
                <div className="flex flex-wrap gap-2">
                  {TECH_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => addTechStack(sug)}
                      disabled={techStacks.some(t => t.toLowerCase() === sug.toLowerCase())}
                      className="px-4 py-2 text-xs rounded-xl border border-border/50 bg-background hover:bg-muted/30 hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Experience Level */}
          <div className={cn(
            "w-full transition-all duration-500",
            step === 3 ? "block" : "hidden"
          )}>
            <div className="text-center mb-8">
              <span className="text-4xl block mb-3">📈</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tingkat Pengalaman</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Pilih level yang paling sesuai dengan profil karirmu saat ini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto md:max-w-none">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = experienceLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setExperienceLevel(opt.value)}
                    className={cn(
                      "group relative overflow-hidden text-left p-5 rounded-2xl border-2 transition-all duration-300",
                      isSelected
                        ? `${opt.border} bg-gradient-to-br ${opt.gradient} shadow-lg scale-[1.02]`
                        : "border-border/30 bg-background hover:border-border/60 hover:bg-muted/10"
                    )}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity" />
                    <div className="relative">
                      <span className="text-2xl block mb-2">{opt.icon}</span>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold">{opt.title}</h3>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M20 6 9 17l-5-5"/></svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-10 flex justify-between items-center border-t border-border/50 pt-6 max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={cn(
              "transition-all",
              step === 1 ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          >
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Kembali
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/50 font-medium">Step {step}/3</span>
          </div>

          {step < 3 ? (
            <Button onClick={nextStep} className="shadow-md shadow-primary/10">
              Lanjut
              <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={isSubmitting} className="bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/20">
              Selesai
              {!isSubmitting && <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
