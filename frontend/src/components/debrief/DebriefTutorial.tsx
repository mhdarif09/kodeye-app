"use client";

import { useState } from "react";

interface DebriefTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: "🎉",
    title: "Selamat! Sesi Pertamamu Selesai",
    description:
      "Halaman ini adalah ringkasan hasil sesi latihan kamu. AI Kodeye akan menilai komunikasi teknis kamu dan memberikan feedback yang detail. Yuk, kita lihat satu per satu!",
  },
  {
    icon: "🤖",
    title: "Skor & Penilaian AI",
    description:
      'Lingkaran besar menunjukkan skor akhir kamu (0-100). Makin hijau, makin bagus! Di bawahnya ada breakdown kriteria seperti Clarity, Empathy, Problem Solving — ini menunjukkan kekuatan dan kelemahan kamu di setiap aspek.',
  },
  {
    icon: "📈",
    title: "Skill Terdeteksi & Area Peningkatan",
    description:
      "AI akan mendeteksi skill teknis yang kamu tunjukkan selama sesi, dan memberikan saran area yang perlu ditingkatkan. Gunakan ini sebagai panduan belajar selanjutnya.",
  },
  {
    icon: "⭐",
    title: "Rating untuk Partner",
    description:
      "Setelah sesi duel, kamu bisa memberi rating untuk lawan mainmu. Jujur dan adil ya — feedback ini membantu mereka tumbuh! Rating akan dikirim setelah kedua pihak selesai menilai.",
  },
  {
    icon: "🚀",
    title: "Langkah Selanjutnya",
    description:
      "Kembali ke Dashboard untuk memulai sesi baru dan lihat perkembanganmu. Kamu juga bisa share hasil sesi ke LinkedIn untuk portofolio! Terus latihan dan pantau progress skill kamu.",
  },
];

export function DebriefTutorial({ isOpen, onClose }: DebriefTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-border bg-background p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Tutup tutorial"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === currentStep ? "bg-primary" : i < currentStep ? "bg-primary/40" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="text-5xl">{step.icon}</span>
          <h2 className="text-xl font-bold tracking-tight">{step.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Sebelumnya
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === currentStep
                    ? "bg-primary scale-125"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {isLast ? "Mulai!" : "Selanjutnya →"}
          </button>
        </div>
      </div>
    </div>
  );
}
