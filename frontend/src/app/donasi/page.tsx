"use client";

import { useEffect, useState } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

type DonationSettings = {
  enabled: boolean;
  methods: { name: string; account: string; icon: string }[];
};

export default function DonasiPage() {
  const [settings, setSettings] = useState<DonationSettings | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-config/donation")
      .then((r) => r.json())
      .then((res) => setSettings(res.data))
      .catch(() => {});
  }, []);

  const methods = settings?.methods?.length
    ? settings.methods
    : [
        { name: "Dana", account: "085157570716", icon: "📱" },
        { name: "QRIS", account: "085157570716", icon: "📷" },
        { name: "Saweria", account: "kodeye", icon: "☕" },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <LandingNav />
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">☕</div>
          <h1 className="text-3xl font-bold tracking-tight">Dukung Kodeye</h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Bantu kami terus mengembangkan platform pembelajaran berbasis AI untuk
            generasi developer Indonesia.
          </p>
        </div>

        <div className="grid gap-4">
          {methods.map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-between p-5 rounded-xl border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.account}</p>
                </div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(m.account)}
                className="text-xs h-8 px-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Salin
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Terima kasih atas dukungan Anda! Setiap donasi membantu kami menghadirkan
          fitur dan konten pembelajaran yang lebih baik.
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}
