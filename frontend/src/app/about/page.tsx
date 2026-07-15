"use client";

import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const VALUES = [
  {
    icon: "🎯",
    title: "Misi Kami",
    text: "Kodeye ada buat ngisi celah yang nggak pernah disentuh pendidikan formal maupun bootcamp: soft skill teknis. Banyak developer jago coding tapi struggle pas harus explain design decision, negotiate scope, atau handle conflict sama stakeholder.",
  },
  {
    icon: "🧠",
    title: "Pendekatan",
    text: "Kita percaya soft skill teknis itu skill yang bisa dilatih — kayak ngoding. Makanya kita bikin platform yang gamified, terukur pake ELO, dan pake skenario real-case yang bikin kamu latihan dalam situasi nyata tanpa risiko.",
  },
  {
    icon: "👥",
    title: "Untuk Siapa?",
    text: "Junior yang pengin naik level, senior yang pengin jadi tech lead, atau siapapun di dunia tech yang sadar bahwa komunikasi teknis itu sama pentingnya dengan technical skill.",
  },
];

const FEATURES = [
  {
    title: "Roleplay Real-Time",
    desc: "Latihan 1v1 atau co-op dengan developer beneran. Bukan chatbot — kamu berargumen, negosiasi, dan kolaborasi dengan manusia sungguhan dalam skenario kerja yang realistis.",
  },
  {
    title: "AI Scoring & Feedback",
    desc: "Setiap sesi dinilai oleh AI berdasarkan rubrik teknis: clarity, empathy, problem-solving, technical accuracy, dan stakeholder management. Dapet breakdown skor per kategori, plus saran improvement yang spesifik.",
  },
  {
    title: "ELO Rating per Skill",
    desc: "Progress kamu di-track pake sistem ELO di setiap kategori skill. Bisa liat strength dan weakness kamu secara objektif — bukan cuman feeling doang.",
  },
  {
    title: "Peer Rating",
    desc: "Lawan main kamu kasih rating dan feedback langsung. Dua sudut pandang — AI dan manusia — buat evaluasi yang lebih komprehensif.",
  },
  {
    title: "Skenario Nyata",
    desc: "Semua skenario diadaptasi dari kejadian nyata di dunia tech: incident response jam 2 pagi, code review confrontation, negosiasi gaji, debate arsitektur, sampe handling stakeholder yg micromanage.",
  },
  {
    title: "Learning Resources",
    desc: "Setiap sesi debrief dilengkapi rekomendasi learning resources yang relevan — dari artikel sampe video — biar kamu bisa lanjut belajar dari kekurangan yang terdeteksi.",
  },
  {
    title: "Gratis & Aksesibel",
    desc: "Nggak perlu invite code. Daftar langsung bisa latihan. Beberapa fitur advanced tersedia di tier berbayar, tapi basic training udah bisa dinikmati gratis.",
  },
  {
    title: "Privasi & Keamanan",
    desc: "Chat transcript sesi bersifat rahasia antar peserta. Data kamu dilindungi dengan enkripsi SSL/TLS dan password di-hash pake bcrypt.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto space-y-20">
          {/* Hero */}
          <section className="text-center space-y-5 pt-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Tentang <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-muted-foreground">Kodeye</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              Kodeye adalah platform latihan soft skill teknis pertama di Indonesia yang pake roleplay real-time, AI scoring, dan ELO rating.
              Dibuat oleh developer, buat developer.
            </p>
          </section>

          {/* Values */}
          <div className="grid md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-background p-6">
                <span className="text-3xl block mb-4">{v.icon}</span>
                <h2 className="text-lg font-semibold mb-2">{v.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>

          {/* Story */}
          <section className="rounded-xl border border-border bg-secondary/10 p-8 md:p-12 space-y-4 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-center">Kenapa Kodeye Dibuat?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Waktu kerja di startup, founder Kodeye sadar: banyak developer jago nulis kode tapi struggle waktu harus explain arsitektur ke CTO,
              negotiate deadline sama product manager, atau handle incident call jam 2 pagi. Masalahnya bukan di IQ atau technical skill —
              tapi di kemampuan komunikasi teknis yang jarang dilatih.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bootcamp dan kuliah ilmu komputer ngajarin cara nulis kode yang efisien, tapi hampir nggak pernah ngajarin gimana cara explain
              complex technical decisions ke non-teknis, gimana handle conflict sama stakeholder, atau gimana present arsitektur dengan confident
              di depan C-level. Padahal di dunia kerja nyata, soft skill teknis ini yang sering jadi pembeda antara senior engineer dan tech lead.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kodeye hadir sebagai solusi — platform latihan yang aman, terukur, dan realistis. Kita gamifikasi proses belajar soft skill
              teknis biar latihannya nggak terasa kaya latihan, dan feedback-nya actionable.
            </p>
          </section>

          {/* Features Grid */}
          <section className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">Apa yang Ada di Kodeye?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Bukan sekadar chatbot AI. Platform yang dibangun dari bawah untuk latihan soft skill teknis.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-border bg-background p-5">
                  <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
