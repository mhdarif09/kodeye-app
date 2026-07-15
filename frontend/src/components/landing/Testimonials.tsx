"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    name: "Rizky F.",
    role: "Backend Engineer, 3 tahun",
    avatar: "RF",
    text: "Gue kira bakal canggung chat sama stranger, tapi skenario-nya relatable banget. Sesi negotiation gaji bikin gue sadar betapa jeleknya gue pas negosiasi. Now I know what to fix.",
    rating: 5,
  },
  {
    name: "Sari W.",
    role: "Frontend Lead, 5 tahun",
    avatar: "SW",
    text: "The 2AM Incident scenario exactly like what happened at my previous company. Scary how accurate it is. The AI feedback on my 'stakeholder management' score was eye-opening.",
    rating: 5,
  },
  {
    name: "Adit P.",
    role: "Fresh Graduate",
    avatar: "AP",
    text: "Baru lulus kuliah dan kaget pas interview teknis ditanya soal design decision. Di Kodeye gue belajar gimana argue with senior engineer tanpa kelihatan incompetent. Recommended.",
    rating: 4,
  },
  {
    name: "Maya D.",
    role: "Engineering Manager",
    avatar: "MD",
    text: "Saya pake Kodeye buat training tim. Cocok banget buat expose junior ke situasi sulit tanpa risiko beneran. Peer rating feature-nya jadi bahan retro yang bagus.",
    rating: 5,
  },
  {
    name: "Dimas A.",
    role: "Fullstack Developer, 2 tahun",
    avatar: "DA",
    text: "ELO ranking per kategori bikin gue addicted. Jadi pengen naikin score terus. Lumayan buat track progress selain lewat performance review tahunan.",
    rating: 4,
  },
  {
    name: "Putri N.",
    role: "Tech Lead",
    avatar: "PN",
    text: "Awalnya skeptis 'ah chat doang', tapi ternyata beda. Lo beneran harus mikir, nyusun argumen, dan timing respons. It's like a chess game for communication skills.",
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className={i < count ? "text-amber-400" : "text-muted-foreground/20"}
          fill="currentColor"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Yang Kata Mereka</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Dari junior sampe tech lead, semua dapet value-nya masing-masing.
        </p>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background p-5 hover:border-primary/20 transition-colors"
          >
            <Stars count={t.rating} />
            <p className="text-sm text-muted-foreground leading-relaxed mt-3 mb-4">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile carousel */}
      <div className="md:hidden">
        <div className="overflow-hidden rounded-xl border border-border bg-background p-5">
          <Stars count={TESTIMONIALS[active].rating} />
          <p className="text-sm text-muted-foreground leading-relaxed mt-3 mb-4">
            &ldquo;{TESTIMONIALS[active].text}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
              {TESTIMONIALS[active].avatar}
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">{TESTIMONIALS[active].name}</p>
              <p className="text-xs text-muted-foreground">{TESTIMONIALS[active].role}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === active ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
