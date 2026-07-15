"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Testimonials } from "@/components/landing/Testimonials";

// ─── Reusable Section Wrapper ─────────────────────────────────────────────────

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

// ─── Arena Mockup ─────────────────────────────────────────────────────────────

function ArenaMockup() {
  const messages = [
    { role: "system", text: "Sesi dimulai. Role kamu: Engineering Lead. Lawan: CTO." },
    { role: "opponent", text: "Kita perlu cut scope fitur X biar rilis bulan ini. Gimana menurut kamu?" },
    { role: "user", text: "Saya paham urgensi deadlinenya. Tapi kalo kita drop fitur X, impact-nya ke 3 klien enterprise." },
    { role: "opponent", text: "CTO minta kompromi. Opsi: deliver 80% fitur X, sisanya next sprint." },
  ];

  return (
    <div className="relative w-full max-w-[580px] mx-auto">
      {/* Browser chrome */}
      <div className="rounded-t-lg border border-border bg-muted/60 px-4 h-9 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <div className="ml-3 flex-1 max-w-[200px] h-5 rounded bg-muted-foreground/10 flex items-center justify-center text-[10px] text-muted-foreground/50">
          app.kodeye.dev/arena/...
        </div>
      </div>

      {/* Arena content */}
      <div className="border-x border-b border-border rounded-b-lg overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-500 tracking-wider uppercase">LIVE</span>
            <span className="text-sm font-medium ml-1">The Salary Negotiation</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 tabular-nums">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="text-sm font-bold">8:32</span>
          </div>
        </div>

        {/* Body: chat + code */}
        <div className="flex flex-col sm:flex-row">
          {/* Chat panel */}
          <div className="flex-1 p-3 space-y-2.5 min-h-[260px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs leading-relaxed max-w-[85%] rounded-lg px-3 py-2",
                  m.role === "system" && "mx-auto text-center text-muted-foreground italic bg-muted/30 max-w-full",
                  m.role === "opponent" && "bg-secondary text-secondary-foreground rounded-bl-sm mr-auto",
                  m.role === "user" && "bg-primary/10 text-foreground rounded-br-sm ml-auto border border-primary/20"
                )}
              >
                {m.role !== "system" && (
                  <span className="block text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                    {m.role === "opponent" ? "CTO" : "Kamu"}
                  </span>
                )}
                {m.text}
              </div>
            ))}
            {/* Typing indicator */}
            <div className="flex items-center gap-1 text-muted-foreground/50 text-xs italic ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>

          {/* Code panel */}
          <div className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-border bg-[#0d0d0f] p-3 font-mono text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-2 uppercase tracking-wider font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              solution.ts
            </div>
            <pre className="text-muted-foreground/70">
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

// ─── Value Prop Card ──────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: "🎭",
    title: "Real-Time Roleplay",
    description: "Bukan kuis statis atau chatbot. Kamu roleplay 1v1 atau co-op dengan developer beneran, dalam skenario dunia kerja yang bikin kamu mikir.",
  },
  {
    icon: "🤖",
    title: "AI Scoring + Peer Feedback",
    description: "Dapet penilaian objektif dari AI berdasarkan rubrik teknis, plus rating dari lawan main kamu. Dua sudut pandang buat evaluasi diri.",
  },
  {
    icon: "💼",
    title: "Skenario Nyata",
    description: "Dari incident response jam 2 pagi, code review confrontation, sampe negosiasi gaji. Semua skenario berasal dari situasi yang beneran terjadi di dunia tech.",
  },
  {
    icon: "📈",
    title: "ELO Rating",
    description: "Progress kamu di-track pake sistem ELO per kategori skill. Bukan cuma tau 'bagus atau enggak', tapi liat grafik naik-turun kemampuan kamu.",
  },
];

function ValueCard({ icon, title, description, index }: { icon: string; title: string; description: string; index: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-background p-6 transition-all duration-700 ease-out hover:border-primary/30 hover:shadow-sm",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <span className="text-3xl block mb-3">{icon}</span>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Scenario Preview Cards ───────────────────────────────────────────────────

const SCENARIOS = [
  {
    title: "The 2AM Incident",
    category: "Debugging",
    difficulty: "Advanced",
    snippet: "Production down. Root cause nggak kelihatan. Tim lagi pada offline. Kamu harus diagnosis dan koordinasi fix lewat chat doang.",
  },
  {
    title: "The Whiteboard Gauntlet",
    category: "System Design",
    difficulty: "Intermediate",
    snippet: "Arsitekturin sistem yang handle 10M request/hari. Di depan whiteboard virtual. Lawan kamu jadi Senior Engineer yang ngepush tiap keputusan lo.",
  },
  {
    title: "The Salary Negotiation",
    category: "Negotiation",
    difficulty: "Beginner",
    snippet: "Offer masuk. Angkanya... kurang. Kamu punya 10 menit buat negotiate package sama HR, tanpa merusak hubungan profesional.",
  },
  {
    title: "The Refactor Ultimatum",
    category: "Technical Communication",
    difficulty: "Intermediate",
    snippet: "Tech lead lo nyuruh refactor 20K lines code dalam seminggu. Kamu yakin itu ide jelek. Argumen kamu harus berbobot, bukan cuma 'too risky'.",
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
        "rounded-xl border border-border bg-background p-5 transition-all duration-700 ease-out hover:border-primary/30 hover:-translate-y-0.5",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold border", DIFFICULTY_COLORS[difficulty])}>
          {difficulty}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{category}</span>
      </div>
      <h3 className="font-semibold text-base mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{snippet}</p>
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  { number: "1", title: "Pilih Skenario", desc: "Pilih dari berbagai skenario dunia kerja nyata, sesuai role dan level kamu." },
  { number: "2", title: "Matchmaking", desc: "Kamu dicocokkan dengan developer lain yang roleplay sebagai lawan bicara di skenario yang sama." },
  { number: "3", title: "Roleplay 10 Menit", desc: "Live chat duel atau co-op selama 10 menit. Timing, argumen, dan teknik komunikasi kamu dinilai." },
  { number: "4", title: "Skor AI + Feedback", desc: "Dapet skor dari AI, breakdown kriteria, skill terdeteksi, plus rating dari lawan main kamu." },
];

function StepCard({ number, title, desc, index }: { number: string; title: string; desc: string; index: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-4 items-start transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-base mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Closing CTA ──────────────────────────────────────────────────────────────

function ClosingCTA() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "text-center space-y-5 py-16 transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
    >
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
        Siap latihan?
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Gratis. Nggak perlu invite code. Mulai aja langsung.
      </p>
      <Link
        href="/register"
        className="inline-flex items-center h-12 px-8 rounded-md bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors"
      >
        Mulai Gratis
      </Link>
    </div>
  );
}

// ─── Footer (imported) ─────────────────────────────────────


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main>
        {/* ── Hero ── */}
        <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Soft skill training untuk developer
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                  Kode keras aja{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-muted-foreground">
                    nggak cukup.
                  </span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Latih soft skill teknis lewat roleplay real-time 1v1 — dari negosiasi deadline sampe debug production incident jam 2 AM. Dinilai AI, di-track pake ELO.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/register"
                    className="inline-flex items-center h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Mulai Gratis
                  </Link>
                  <a
                    href="#scenarios"
                    className="inline-flex items-center h-11 px-6 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    Lihat Skenario
                  </a>
                </div>
              </div>

              {/* Arena mockup */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 rounded-3xl blur-2xl" />
                <ArenaMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── Kenapa Kodeye ── */}
        <Section className="py-16 md:py-24 px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Kenapa Kodeye?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Karena soft skill engineer itu bukan bakat bawaan — itu skill yang bisa dilatih. Kayak coding, tapi pengan lawan beneran.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {VALUE_PROPS.map((vp, i) => (
                <ValueCard key={vp.title} {...vp} index={i} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Contoh Skenario ── */}
        <Section className="py-16 md:py-24 px-6" id="scenarios">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Contoh Skenario</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Bukan pertanyaan wawancara generic. Situasi yang bikin kamu berpikir, berargumentasi, dan berkompromi.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {SCENARIOS.map((s, i) => (
                <ScenarioCard key={s.title} {...s} index={i} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Cara Kerja ── */}
        <Section className="py-16 md:py-24 px-6">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Cara Kerja</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Dari buka app sampe dapet feedback, dalam 15 menit.
              </p>
            </div>
            <div className="space-y-8">
              {STEPS.map((step, i) => (
                <StepCard key={step.title} {...step} index={i} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Testimonials ── */}
        <Section className="py-16 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <Testimonials />
          </div>
        </Section>

        {/* ── Closing CTA ── */}
        <ClosingCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
