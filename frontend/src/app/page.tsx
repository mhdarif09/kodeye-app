"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Testimonials } from "@/components/landing/Testimonials";
import api from "@/lib/api";

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className
      )}
    >
      {children}
    </section>
  );
}

function ArenaMockup() {
  const messages = [
    { role: "system", text: "Sesi dimulai. Role kamu: Engineering Lead. Lawan: CTO." },
    { role: "opponent", text: "Kita perlu cut scope fitur X biar rilis bulan ini. Gimana menurut kamu?" },
    { role: "user", text: "Saya paham urgensi deadlinenya. Tapi kalo kita drop fitur X, impact-nya ke 3 klien enterprise." },
  ];

  return (
    <div className="relative w-full max-w-[580px] mx-auto">
      <div className="absolute -inset-3 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 rounded-3xl blur-2xl" />
      <div className="rounded-t-lg border border-border bg-muted/60 px-4 h-8 md:h-9 flex items-center gap-2 relative">
        <div className="flex gap-1.5">
          <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-destructive/70" />
          <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-amber-500/70" />
          <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <div className="ml-3 flex-1 max-w-[180px] h-4 md:h-5 rounded bg-muted-foreground/10 flex items-center justify-center text-[8px] md:text-[10px] text-muted-foreground/50">
          app.kodeye.dev/arena/...
        </div>
      </div>
      <div className="border-x border-b border-border rounded-b-lg overflow-hidden bg-background relative">
        <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-semibold text-emerald-500 tracking-wider uppercase">LIVE</span>
            <span className="text-xs md:text-sm font-medium ml-0.5">The Salary Negotiation</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400 tabular-nums">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="text-xs md:text-sm font-bold">8:32</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 p-2.5 md:p-3 space-y-2 min-h-[220px] md:min-h-[260px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "text-[11px] md:text-xs leading-relaxed max-w-[88%] md:max-w-[85%] rounded-lg px-2.5 md:px-3 py-1.5 md:py-2",
                  m.role === "system" && "mx-auto text-center text-muted-foreground italic bg-muted/30 max-w-full",
                  m.role === "opponent" && "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground rounded-bl-sm mr-auto",
                  m.role === "user" && "bg-gradient-to-r from-primary/10 to-primary/5 text-foreground rounded-br-sm ml-auto border border-primary/20"
                )}
              >
                {m.role !== "system" && (
                  <span className="block text-[9px] md:text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                    {m.role === "opponent" ? "CTO" : "Kamu"}
                  </span>
                )}
                {m.text}
              </div>
            ))}
            <div className="flex items-center gap-1 text-muted-foreground/50 text-[11px] italic ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
          <div className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-border bg-[#0d0d0f] p-2.5 md:p-3 font-mono text-[10px] md:text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[9px] md:text-[10px] mb-1.5 uppercase tracking-wider font-semibold">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              solution.ts
            </div>
            <pre className="text-muted-foreground/70 leading-relaxed">
              <span className="text-blue-400/60">function</span> <span className="text-emerald-400/60">negotiateScope</span>({"\n"}
              {"  "}<span className="text-blue-400/60">constraints</span>: <span className="text-amber-400/60">Scope[]</span>,{"\n"}
              {"  "}<span className="text-blue-400/60">deadline</span>: <span className="text-amber-400/60">Date</span>,{"\n"}
              ): <span className="text-amber-400/60">Proposal</span> {"{"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const VALUE_PROPS = [
  {
    icon: "🎭",
    title: "Real-Time Roleplay",
    description: "Bukan kuis statis atau chatbot. Kamu roleplay 1v1 atau co-op dengan developer beneran, dalam skenario dunia kerja yang bikin kamu mikir.",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
  },
  {
    icon: "🤖",
    title: "AI Scoring + Peer Feedback",
    description: "Dapet penilaian objektif dari AI berdasarkan rubrik teknis, plus rating dari lawan main kamu. Dua sudut pandang buat evaluasi diri.",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
  },
  {
    icon: "💼",
    title: "Skenario Nyata",
    description: "Dari incident response jam 2 pagi, code review confrontation, sampe negosiasi gaji. Semua skenario berasal dari situasi yang beneran terjadi di dunia tech.",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  {
    icon: "📈",
    title: "ELO Rating",
    description: "Progress kamu di-track pake sistem ELO per kategori skill. Bukan cuma tau 'bagus atau enggak', tapi liat grafik naik-turun kemampuan kamu.",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
  },
];

function ValueCard({ icon, title, description, gradient, index }: { icon: string; title: string; description: string; gradient: string; index: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-background to-muted/5 p-5 md:p-6 transition-all duration-700 ease-out hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <span className="text-2xl md:text-3xl block mb-3">{icon}</span>
        <h3 className="text-base md:text-lg font-bold mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

const SCENARIOS = [
  {
    title: "The 2AM Incident",
    category: "Debugging",
    difficulty: "Advanced",
    snippet: "Production down. Root cause nggak kelihatan. Tim pada offline. Diagnosis dan koordinasi fix lewat chat doang.",
  },
  {
    title: "The Whiteboard Gauntlet",
    category: "System Design",
    difficulty: "Intermediate",
    snippet: "Arsitekturin sistem yang handle 10M request/hari. Di depan whiteboard virtual, lawan push tiap keputusan lo.",
  },
  {
    title: "The Salary Negotiation",
    category: "Negotiation",
    difficulty: "Beginner",
    snippet: "Offer masuk. Angkanya kurang. 10 menit buat negotiate package sama HR, tanpa merusak hubungan profesional.",
  },
  {
    title: "The Refactor Ultimatum",
    category: "Technical Comm.",
    difficulty: "Intermediate",
    snippet: "Tech lead nyuruh refactor 20K lines code dalam seminggu. Argumen kamu harus berbobot, bukan cuma 'too risky'.",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  Intermediate: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Advanced: "text-red-500 bg-red-500/10 border-red-500/20",
};

function ScenarioCard({ title, category, difficulty, snippet, index }: { title: string; category: string; difficulty: string; snippet: string; index: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-background to-muted/5 p-4 md:p-5 transition-all duration-700 ease-out hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", DIFFICULTY_COLORS[difficulty])}>
            {difficulty}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{category}</span>
        </div>
        <h3 className="font-bold text-sm md:text-base mb-1.5 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-muted-foreground/70 leading-relaxed">{snippet}</p>
      </div>
    </div>
  );
}

const STEPS = [
  { number: "1", title: "Pilih Skenario", desc: "Pilih dari berbagai skenario dunia kerja nyata, sesuai role dan level kamu." },
  { number: "2", title: "Matchmaking", desc: "Dicocokkan dengan developer lain yang roleplay sebagai lawan bicara di skenario yang sama." },
  { number: "3", title: "Roleplay 10 Menit", desc: "Live chat duel atau co-op selama 10 menit. Timing dan argumen kamu dinilai." },
  { number: "4", title: "Skor AI + Feedback", desc: "Dapet skor dari AI, breakdown kriteria, skill terdeteksi, plus rating dari lawan." },
];

function StepCard({ number, title, desc, index }: { number: string; title: string; desc: string; index: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "group flex gap-4 items-start transition-all duration-700 ease-out p-4 rounded-2xl hover:bg-muted/10",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="h-11 w-11 md:h-12 md:w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-sm md:text-base font-bold shrink-0 mt-0.5 shadow-md shadow-primary/20 group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div className="pt-1">
        <h3 className="font-bold text-sm md:text-base mb-1.5 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ClosingCTA() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "relative text-center space-y-5 py-16 md:py-20 px-6 transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
        Siap latihan?
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
        Gratis. Nggak perlu invite code. Mulai aja langsung.
      </p>
      <Link
        href="/register"
        className="inline-flex items-center h-12 md:h-14 px-8 md:px-10 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-sm md:text-base font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30"
      >
        Mulai Gratis
      </Link>
    </div>
  );
}

export default function LandingPage() {
  const [donation, setDonation] = useState<{ enabled: boolean; settings: any } | null>(null);

  useEffect(() => {
    api.get("/api/admin/site-config/donation")
      .then((res) => setDonation(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main>
        {/* ── Hero ── */}
        <section className="relative pt-24 pb-12 md:pt-36 md:pb-24 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl pointer-events-none" />
          <div className="max-w-6xl mx-auto relative">
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
              <div className="space-y-5 md:space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] md:text-xs font-medium text-muted-foreground mx-auto md:mx-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Soft skill training untuk developer
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                  Kode keras aja{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-muted-foreground">
                    nggak cukup.
                  </span>
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0">
                  Latih soft skill teknis lewat roleplay real-time 1v1 — dari negosiasi deadline sampe debug production incident jam 2 AM. Dinilai AI, di-track pake ELO.
                </p>
                <div className="flex flex-wrap gap-2.5 md:gap-3 pt-1 justify-center md:justify-start">
                  <Link
                    href="/register"
                    className="inline-flex items-center h-11 md:h-12 px-6 md:px-7 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-sm md:text-base font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    Mulai Gratis
                  </Link>
                  <a
                    href="#scenarios"
                    className="inline-flex items-center h-11 md:h-12 px-6 md:px-7 rounded-xl border border-border text-sm md:text-base font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                  >
                    Lihat Skenario
                  </a>
                </div>
              </div>
              <div className="relative mt-4 md:mt-0">
                <ArenaMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── Kenapa Kodeye ── */}
        <Section className="py-12 md:py-24 px-6">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Kenapa Kodeye?</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Karena soft skill engineer itu bukan bakat bawaan — itu skill yang bisa dilatih. Kayak coding, tapi pengan lawan beneran.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
              {VALUE_PROPS.map((vp, i) => (
                <ValueCard key={vp.title} {...vp} index={i} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Contoh Skenario ── */}
        <Section className="py-12 md:py-24 px-6" id="scenarios">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Contoh Skenario</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Bukan pertanyaan wawancara generic. Situasi yang bikin kamu berpikir, berargumentasi, dan berkompromi.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
              {SCENARIOS.map((s, i) => (
                <ScenarioCard key={s.title} {...s} index={i} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Cara Kerja ── */}
        <Section className="py-12 md:py-24 px-6">
          <div className="max-w-3xl mx-auto space-y-8 md:space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Cara Kerja</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Dari buka app sampe dapet feedback, dalam 15 menit.
              </p>
            </div>
            <div className="space-y-1 md:space-y-2">
              {STEPS.map((step, i) => (
                <StepCard key={step.title} {...step} index={i} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Testimonials ── */}
        <Section className="py-12 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <Testimonials />
          </div>
        </Section>

        {/* ── Donasi ── */}
        {donation?.enabled && (
          <Section className="py-12 md:py-24 px-6">
            <div className="max-w-6xl mx-auto text-center space-y-5 md:space-y-6">
              <span className="text-3xl md:text-4xl block">☕</span>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight">Dukung Kodeye</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Dukung pengembangan Kodeye agar tetap gratis dan terbuka untuk semua developer.
              </p>
              {donation?.settings?.methods?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2.5 md:gap-3 pt-1">
                  {donation.settings.methods.slice(0, 3).map((m: any) => (
                    <button
                      key={m.name}
                      onClick={() => navigator.clipboard.writeText(m.account)}
                      className="h-10 px-4 md:px-5 rounded-xl border border-border/50 text-xs md:text-sm font-medium hover:bg-muted/30 hover:border-amber-500/30 transition-all flex items-center gap-2"
                    >
                      <span>{m.icon || "💳"}</span>
                      {m.name}
                    </button>
                  ))}
                  <Link
                    href="/donasi"
                    className="h-10 px-4 md:px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs md:text-sm font-bold hover:opacity-90 transition-all inline-flex items-center shadow-md"
                  >
                    Lihat Semua
                  </Link>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Closing CTA ── */}
        <ClosingCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
