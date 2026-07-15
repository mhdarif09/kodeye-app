"use client";

import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const CONTACT_CHANNELS = [
  { label: "Email", value: "hello@kodeye.dev", href: "mailto:hello@kodeye.dev", icon: "✉️" },
  { label: "Twitter / X", value: "@kodeye", href: "https://x.com/kodeye", icon: "🐦" },
  { label: "GitHub", value: "github.com/kodeye", href: "https://github.com/kodeye", icon: "🐙" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Header */}
          <section className="text-center space-y-4 pt-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Kontak</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Punya pertanyaan, saran, atau pengin collab? Kami dengerin.
            </p>
          </section>

          {/* Contact Channels */}
          <div className="grid sm:grid-cols-3 gap-4">
            {CONTACT_CHANNELS.map((ch) => (
              <a
                key={ch.label}
                href={ch.href}
                target={ch.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={ch.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className="rounded-xl border border-border bg-background p-6 text-center hover:border-primary/30 transition-colors group"
              >
                <span className="text-3xl block mb-3">{ch.icon}</span>
                <p className="font-semibold text-sm mb-1">{ch.label}</p>
                <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{ch.value}</p>
              </a>
            ))}
          </div>

          {/* Support */}
          <section className="rounded-xl border border-border bg-secondary/10 p-8 text-center space-y-3">
            <h2 className="text-xl font-bold tracking-tight">Butuh Bantuan?</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Kalau kamu nemu bug, punya saran fitur, atau butuh bantuan teknis, jangan ragu reach out.
            </p>
            <p className="text-xs text-muted-foreground">
              Respon dalam 1×24 jam, Senin — Jumat.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
