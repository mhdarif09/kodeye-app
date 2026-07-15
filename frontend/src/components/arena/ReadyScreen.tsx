"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ReadyScreenProps {
  scenarioTitle: string;
  role: string;
  briefing: string;
  secretObjective?: string;
  onReady: () => void;
  isWaiting: boolean; // true after user clicked Ready, waiting for opponent
}

const ROLE_LABELS: Record<string, string> = {
  role_a: "Peran A",
  role_b: "Peran B",
};

export function ReadyScreen({
  scenarioTitle,
  role,
  briefing,
  secretObjective,
  onReady,
  isWaiting,
}: ReadyScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />

      <div className="relative z-10 w-full max-w-xl mx-auto px-6 py-10 flex flex-col items-center gap-8 text-center">
        {/* Scenario header */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Skenario Dimulai
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{scenarioTitle}</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-sm font-medium mt-1">
            <span>👤</span>
            <span>Kamu bermain sebagai: <strong>{ROLE_LABELS[role] ?? role}</strong></span>
          </div>
        </div>

        {/* Briefing card */}
        <div className="w-full rounded-xl border border-border bg-secondary/30 p-5 text-left space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
              Briefing Peran
            </p>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{briefing}</p>
          </div>

          {secretObjective && (
            <>
              <div className="border-t border-border" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-500 mb-1.5">
                  🔐 Objective Rahasia (HANYA Kamu yang tahu)
                </p>
                <p className="text-sm leading-relaxed text-amber-500/90 whitespace-pre-wrap">
                  {secretObjective}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Ready / Waiting state */}
        {!isWaiting ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <Button
              onClick={onReady}
              className="w-full max-w-xs h-14 text-lg font-bold"
              variant="primary"
            >
              ✅ Saya Siap
            </Button>
            <p className="text-xs text-muted-foreground">
              Pastikan kamu sudah memahami peranmu sebelum memulai.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-base font-semibold">Menunggu lawan siap...</p>
            <p className="text-xs text-muted-foreground">Arena akan terbuka otomatis saat keduanya siap.</p>
          </div>
        )}
      </div>
    </div>
  );
}
