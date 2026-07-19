"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSocket } from "@/hooks/useSocket";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "Debugging", value: "debugging" },
  { label: "System Design", value: "architecture" },
  { label: "Technical Communication", value: "technical-communication" },
  { label: "Negotiation", value: "negotiation" },
  { label: "Stakeholder Management", value: "stakeholder-management" },
  { label: "Career Growth", value: "career-growth" },
  { label: "Interview Prep", value: "interview-prep" },
];

const DIFFICULTIES = [
  { label: "Pemula", value: "beginner" },
  { label: "Menengah", value: "intermediate" },
  { label: "Lanjutan", value: "advanced" },
];

interface MatchBriefingData {
  sessionId: string;
  role: string;
  roleName: string;
  briefing: string;
  scenarioTitle: string;
  category: string;
  difficulty: string;
  mode: string;
  durationSeconds: number;
  problem: string | null;
  template: string | null;
  templateLanguage: string | null;
}

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "duel" | "coop";
  initialCategory?: string;
}

export function MatchmakingModal({ isOpen, onClose, initialMode = "duel", initialCategory }: MatchmakingModalProps) {
  const router = useRouter();
  const { socket } = useSocket();
  
  const [mode, setMode] = useState<"duel" | "coop">(initialMode);
  const [category, setCategory] = useState<string>(initialCategory || "debugging");
  const [difficulty, setDifficulty] = useState<string>("intermediate");
  const [status, setStatus] = useState<"idle" | "searching" | "timeout" | "briefing" | "waiting_partner">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [briefing, setBriefing] = useState<MatchBriefingData | null>(null);

  // Sync mode/category if props change while reopening
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialCategory) setCategory(initialCategory);
      setStatus("idle");
      setElapsed(0);
      setBriefing(null);
    }
  }, [isOpen, initialMode, initialCategory]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "searching") {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Socket listener effect (always listen for match_briefing and session_started)
  useEffect(() => {
    if (!socket) return;

    const onBriefing = (data: MatchBriefingData) => {
      toast.success("Match ditemukan!");
      setBriefing(data);
      setStatus("briefing");
    };

    const onTimeout = () => {
      setStatus("timeout");
    };

    const onSessionStarted = (payload: { sessionId: string; startedAt: string; durationSeconds: number }) => {
      router.push(`/arena/${payload.sessionId}`);
    };

    socket.on("match_briefing", onBriefing);
    socket.on("match:timeout", onTimeout);
    socket.on("session_started", onSessionStarted);

    return () => {
      socket.off("match_briefing", onBriefing);
      socket.off("match:timeout", onTimeout);
      socket.off("session_started", onSessionStarted);
    };
  }, [socket, router]);

  const handleStartSearch = async () => {
    try {
      await api.post("/api/matchmaking/queue", { mode, category, difficulty });
      setStatus("searching");
    } catch (error: any) {
      if (error.response?.status === 409) {
        await api.delete("/api/matchmaking/queue").catch(() => {});
        try {
          await api.post("/api/matchmaking/queue", { mode, category, difficulty });
          setStatus("searching");
          return;
        } catch {}
      }
      toast.error(error.response?.data?.message || "Gagal masuk antrean");
    }
  };

  const handleCancelSearch = async () => {
    if (status === "searching") {
      try {
        await api.delete("/api/matchmaking/queue");
      } catch (error) {
        // ignore errors on cancel
      }
    }
    setStatus("idle");
    setBriefing(null);
    onClose();
  };

  const handleStartSession = () => {
    if (!socket || !briefing) return;
    socket.emit("player_ready", { sessionId: briefing.sessionId });
    setStatus("waiting_partner");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={status === "searching" || status === "briefing" || status === "waiting_partner" ? () => {} : handleCancelSearch}
      className={cn(status === "briefing" || status === "waiting_partner" ? "sm:max-w-2xl" : "sm:max-w-md")}
    >
      {status === "idle" && (
        <div className="flex flex-col space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">Cari Lawan</h2>
            <p className="text-sm text-muted-foreground mt-1">Uji kemampuan komunikasimu secara real-time</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Mode Matchmaking</label>
              <div className="flex gap-2">
                <Button variant={mode === "duel" ? "primary" : "secondary"} className="flex-1" onClick={() => setMode("duel")}>
                  ⚔️ Duel
                </Button>
                <Button variant={mode === "coop" ? "primary" : "secondary"} className="flex-1" onClick={() => setMode("coop")}>
                  🤝 Co-op
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-background">{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Level Kesulitan</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value} className="bg-background">{d.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button variant="ghost" onClick={handleCancelSearch}>Batal</Button>
              <Button onClick={handleStartSearch}>Mulai Cari</Button>
            </div>
          </div>
        </div>
      )}

      {status === "searching" && (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">{formatTime(elapsed)}</div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold animate-pulse">Mencari {mode === "duel" ? "lawan" : "partner"}...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {CATEGORIES.find(c => c.value === category)?.label} · {DIFFICULTIES.find(d => d.value === difficulty)?.label}
            </p>
          </div>
          <Button variant="secondary" onClick={handleCancelSearch} className="w-full max-w-[200px]">Batal Cari</Button>
        </div>
      )}

      {status === "briefing" && briefing && (
        <div className="flex flex-col space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">MATCH DITEMUKAN</h2>
            <p className="text-sm text-muted-foreground mt-1">Baca briefing sebelum memulai sesi</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/30 rounded-md p-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Kategori</span>
                <p className="font-medium capitalize">{briefing.category}</p>
              </div>
              <div className="bg-secondary/30 rounded-md p-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Level</span>
                <p className="font-medium capitalize">{DIFFICULTIES.find(d => d.value === briefing.difficulty)?.label || briefing.difficulty}</p>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-md p-3">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Skenario</span>
              <p className="font-medium">{briefing.scenarioTitle}</p>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">Peran Kamu</span>
              <p className="font-semibold text-base">{briefing.roleName}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Briefing</span>
              <div className="mt-1 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-secondary/30 rounded-md p-3 border border-border">
                {briefing.briefing}
              </div>
            </div>

            {briefing.problem && (
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Soal</span>
                <div className="mt-1 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-secondary/30 rounded-md p-3 border border-border">
                  <p className="mb-2">{briefing.problem}</p>
                  {briefing.template && (
                    <pre className="text-xs bg-background/80 rounded p-3 overflow-x-auto border border-border">
                      <code>{briefing.template}</code>
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button variant="ghost" onClick={handleCancelSearch}>Batal</Button>
            <Button onClick={handleStartSession}>Mulai Sesi</Button>
          </div>
        </div>
      )}

      {status === "waiting_partner" && (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Menunggu Partner...</h3>
            <p className="text-sm text-muted-foreground mt-1">Kamu akan masuk ke chat setelah partner siap</p>
          </div>
        </div>
      )}

      {status === "timeout" && (
        <div className="flex flex-col items-center py-6 space-y-6">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl">🕒</div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Pencarian Waktu Habis</h3>
            <p className="text-sm text-muted-foreground mt-1">Tidak ada {mode === "duel" ? "lawan" : "partner"} yang tersedia saat ini.</p>
          </div>
          <div className="w-full space-y-3">
            <Button variant="ghost" onClick={handleCancelSearch} className="w-full">Tutup</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
