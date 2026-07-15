"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  startedAt?: string;
  durationSeconds: number;
}

export function Timer({ startedAt, durationSeconds }: TimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (!startedAt || durationSeconds <= 0) return;

    const startMs = new Date(startedAt).getTime();
    const durationMs = durationSeconds * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startMs;
      const rem = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
      setRemaining(rem);
    };

    updateTimer(); // initial call
    const interval = setInterval(updateTimer, 500); // 500ms for responsiveness

    return () => clearInterval(interval);
  }, [startedAt, durationSeconds]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  
  const isWarning = remaining > 0 && remaining <= 60; // 1 minute left warning
  const isCritical = remaining > 0 && remaining <= 10; // 10 seconds left critical

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xl font-bold transition-colors",
      isCritical ? "text-destructive bg-destructive/10 animate-pulse" : 
      isWarning ? "text-warning bg-warning/10" : "bg-secondary text-foreground"
    )}>
      <span>⏱️</span>
      <span>
        {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
