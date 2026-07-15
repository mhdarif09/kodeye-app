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
  { label: "System Design", value: "SYSTEM_DESIGN" },
  { label: "Technical Communication", value: "TECHNICAL_COMMUNICATION" },
  { label: "Debugging", value: "DEBUGGING" },
  { label: "Negotiation", value: "NEGOTIATION" },
  { label: "Stakeholder Management", value: "STAKEHOLDER_MANAGEMENT" },
  { label: "Mentoring", value: "MENTORING" },
  { label: "Interview Prep", value: "INTERVIEW_PREP" },
];

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

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Form State
  const [step, setStep] = useState(1);
  const [skillCategories, setSkillCategories] = useState<string[]>([]);
  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [techInput, setTechInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guard: Redirect if already completed
  useEffect(() => {
    const checkUser = async () => {
      try {
        if (isOnboardingComplete(user)) {
          router.push("/dashboard");
          return;
        }
        
        // Fetch fresh to be sure
        const res = await api.get("/api/users/me");
        if (isOnboardingComplete(res.data.data)) {
          if (accessToken) {
            setAuth(res.data.user, accessToken, refreshToken); // update store
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
    <div className="flex flex-1 flex-col items-center pt-24 pb-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 w-16 rounded-full transition-all duration-300",
                  step >= idx ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Langkah {step} dari 3
          </p>
        </div>

        {/* Form Container */}
        <div className="relative overflow-hidden min-h-[400px]">
          {/* Step 1: Skills */}
          <div
            className={cn(
              "absolute inset-0 w-full transition-all duration-500",
              step === 1 ? "translate-x-0 opacity-100 z-10" : "-translate-x-full opacity-0 z-0 pointer-events-none"
            )}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight">Kategori Skill</h2>
              <p className="text-muted-foreground mt-2">Pilih area spesifik yang ingin Anda latih atau tingkatkan.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {SKILL_OPTIONS.map((opt) => {
                const isSelected = skillCategories.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleSkill(opt.value)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Tech Stacks */}
          <div
            className={cn(
              "absolute inset-0 w-full transition-all duration-500",
              step === 2 ? "translate-x-0 opacity-100 z-10" : step < 2 ? "translate-x-full opacity-0 z-0 pointer-events-none" : "-translate-x-full opacity-0 z-0 pointer-events-none"
            )}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight">Tech Stack</h2>
              <p className="text-muted-foreground mt-2">Teknologi apa saja yang paling sering Anda gunakan?</p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {techStacks.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                  >
                    {tech}
                    <button
                      onClick={() => removeTechStack(tech)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </span>
                ))}
              </div>

              <div>
                <Input
                  placeholder="Ketik lalu tekan Enter (maks 10)"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleTechInputKeyDown}
                  className="max-w-md"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Saran:</p>
                <div className="flex flex-wrap gap-2">
                  {TECH_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => addTechStack(sug)}
                      disabled={techStacks.some(t => t.toLowerCase() === sug.toLowerCase())}
                      className="px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Experience Level */}
          <div
            className={cn(
              "absolute inset-0 w-full transition-all duration-500",
              step === 3 ? "translate-x-0 opacity-100 z-10" : "translate-x-full opacity-0 z-0 pointer-events-none"
            )}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight">Tingkat Pengalaman</h2>
              <p className="text-muted-foreground mt-2">Pilih level yang paling sesuai dengan profil karir Anda saat ini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <CardHeader className="p-4">
                      <CardTitle className="flex justify-between items-center text-lg">
                        {opt.title}
                        {isSelected && (
                          <svg className="text-primary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-2">
                        {opt.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex justify-between items-center border-t border-border pt-6">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={cn(step === 1 ? "opacity-0 pointer-events-none" : "opacity-100")}
          >
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Kembali
          </Button>

          {step < 3 ? (
            <Button onClick={nextStep}>
              Lanjut
              <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              Selesai
              {!isSubmitting && <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
