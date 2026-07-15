"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { formatDuration, formatCategory } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CircularScore, CriteriaBar } from "@/components/debrief/ScoreDisplay";
import { PeerRatingForm } from "@/components/debrief/PeerRatingForm";
import { DebriefTutorial } from "@/components/debrief/DebriefTutorial";
import { LearningResources } from "@/components/debrief/LearningResources";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiFeedback {
  score: number;
  criteria?: Record<string, number>;  // { "Clarity": 85, "Empathy": 72 }
  detectedSkills?: string[];
  improvements?: string[];
  secretObjectiveMet?: boolean;
  summary?: string;
}

interface ResourceLink {
  title: string;
  url: string;
}

interface PeerRating {
  rating: number;
  positive_feedback?: string;
  improvement_feedback?: string;
  created_at: string;
}

interface DebriefData {
  sessionId: string;
  scenarioTitle: string;
  mode: string;
  category: string;
  difficulty: string;
  startedAt: string;
  endedAt: string;
  myRole: string;
  myScore: number | null;
  myFeedback: AiFeedback | null;
  aiCriteria: Record<string, any> | null;
  resourceLinks: ResourceLink[] | null;
  peerRatings: PeerRating[];
  // Populated separately for peer rating form
  opponentUserId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// formatDuration and formatCategory imported from @/lib/utils

function buildLinkedInUrl(scenarioTitle: string, score: number, sessionId: string) {
  const text = encodeURIComponent(
    `Saya baru saja menyelesaikan sesi "${scenarioTitle}" di Kodeye dengan skor ${score}/100! Platform latihan soft skill teknis terbaik. #Kodeye #SoftSkills #TechCareer`
  );
  const url = encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://kodeye.app"}/debrief/${sessionId}`);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`;
}

// ─── AI Score Section ─────────────────────────────────────────────────────────

function AIScoreSection({ feedback, score }: { feedback: AiFeedback; score: number }) {
  const criteriaEntries = Object.entries(feedback.criteria ?? {});

  return (
    <div className="space-y-8">
      {/* Main score */}
      <div className="flex flex-col items-center gap-4">
        <CircularScore score={score} />
        {feedback.summary && (
          <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed italic">
            "{feedback.summary}"
          </p>
        )}
        {feedback.secretObjectiveMet && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold">
            🏆 Secret Objective Tercapai! <span className="text-xs opacity-70">+10</span>
          </div>
        )}
      </div>

      {/* Criteria breakdown */}
      {criteriaEntries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Breakdown Kriteria</h3>
          <div className="space-y-3">
            {criteriaEntries.map(([name, val]) => (
              <CriteriaBar key={name} name={name} score={typeof val === "number" ? val : Number(val)} />
            ))}
          </div>
        </div>
      )}

      {/* Detected skills */}
      {feedback.detectedSkills && feedback.detectedSkills.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skill Terdeteksi</h3>
          <div className="flex flex-wrap gap-2">
            {feedback.detectedSkills.map((skill) => (
              <Badge key={skill} variant="success" className="text-xs">
                ✓ {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {feedback.improvements && feedback.improvements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Area Peningkatan</h3>
          <ul className="space-y-2">
            {feedback.improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Loading / Pending State ───────────────────────────────────────────────────

function ScoringPendingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">AI sedang menilai sesi kamu...</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Kami menganalisis percakapan kamu secara mendalam. Ini biasanya memakan waktu 15-30 detik.
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebriefPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { socket } = useSocket();

  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPeerRatingSubmitted, setIsPeerRatingSubmitted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);

  const confettiFired = useRef(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDebrief = async () => {
    try {
      const res = await api.get(`/api/sessions/${sessionId}/debrief`);
      const data: DebriefData = res.data.data;
      setDebrief(data);

      // Check if peer rating already submitted (backend returns what was received)
      if (data.peerRatings && data.peerRatings.length > 0) {
        setIsPeerRatingSubmitted(true);
      }

      return data;
    } catch (error: any) {
      if (error.response?.status !== 400) {
        // 400 = session not completed yet, don't toast for that
        toast.error("Gagal memuat hasil sesi");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebrief();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confetti ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!debrief?.myScore || confettiFired.current) return;
    if (debrief.myScore >= 80) {
      confettiFired.current = true;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#10b981", "#f59e0b", "#3b82f6", "#a855f7"],
      });
    }
  }, [debrief?.myScore]);

  // ── Socket listener for arena:scored ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onScored = async () => {
      // Give backend a brief moment to commit before fetching
      await new Promise((r) => setTimeout(r, 500));
      fetchDebrief();
    };

    socket.on("arena:scored", onScored);
    return () => { socket.off("arena:scored", onScored); };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling fallback (every 3s while score is null) ────────────────────────
  useEffect(() => {
    if (debrief?.myScore !== null && debrief?.myScore !== undefined) return;
    if (!debrief && !isLoading) return; // no data at all, don't poll

    const canPoll = debrief !== null && debrief.myScore === null;
    if (!canPoll) return;

    pollRef.current = setInterval(async () => {
      const data = await fetchDebrief();
      if (data?.myScore !== null && data?.myScore !== undefined) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [debrief]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── First-time tutorial ─────────────────────────────────────────────────
  useEffect(() => {
    if (!debrief || !user) return;
    if (typeof window === "undefined") return;

    const seen = localStorage.getItem("kodeye_debrief_tutorial_seen");
    if (seen === "true") return;

    api.get("/api/users/me/stats").then((res) => {
      const s = res.data.data?.totalSessions ?? 0;
      setTotalSessions(s);
      if (s === 1) {
        setShowTutorial(true);
      }
    }).catch(() => {
      // Silently fail — tutorial is not critical
    });
  }, [debrief, user]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    try { localStorage.setItem("kodeye_debrief_tutorial_seen", "true"); } catch {}
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!debrief) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Data debrief tidak ditemukan.</p>
        <button onClick={() => router.push("/dashboard")} className="text-sm font-medium underline">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const isScored = debrief.myScore !== null && debrief.myScore !== undefined;
  const score = debrief.myScore ?? 0;
  const resourceLinks: ResourceLink[] = Array.isArray(debrief.resourceLinks) ? debrief.resourceLinks : [];

  return (
    <div className="min-h-screen">
      <DebriefTutorial isOpen={showTutorial} onClose={handleCloseTutorial} />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Hasil Sesi</p>
        <h1 className="text-3xl font-bold tracking-tight">{debrief.scenarioTitle}</h1>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Badge variant="secondary" className="capitalize">{debrief.mode === "duel" ? "⚔️ Duel" : "🤝 Co-op"}</Badge>
          <Badge variant="outline" className="capitalize">{formatCategory(debrief.category)}</Badge>
          <Badge variant={debrief.difficulty === "beginner" ? "success" : debrief.difficulty === "intermediate" ? "warning" : "destructive"} className="capitalize">
            {debrief.difficulty}
          </Badge>
          {debrief.startedAt && debrief.endedAt && (
            <Badge variant="secondary">⏱ {formatDuration(debrief.startedAt, debrief.endedAt)}</Badge>
          )}
        </div>
      </div>

      {/* ── AI Score ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Penilaian AI</CardTitle>
        </CardHeader>
        <CardContent>
          {!isScored ? (
            <ScoringPendingState />
          ) : (
            <AIScoreSection feedback={debrief.myFeedback ?? { score }} score={score} />
          )}
        </CardContent>
      </Card>

      {/* ── Resource Links ── */}
      {resourceLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📚 Materi Terkait</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resourceLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-md border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-foreground">{link.title}</span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    >
                      <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Learning Resources for New Users ── */}
      {isScored && totalSessions !== null && totalSessions <= 3 && (
        <LearningResources category={debrief.category} difficulty={debrief.difficulty} />
      )}

      {/* ── Peer Rating ── */}
      {debrief.opponentUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⭐ Rating untuk Partner</CardTitle>
          </CardHeader>
          <CardContent>
            {isPeerRatingSubmitted || debrief.peerRatings.length > 0 ? (
              <div className="flex items-center gap-3 py-4 text-emerald-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="font-medium">Rating sudah terkirim. Terima kasih!</span>
              </div>
            ) : (
              <PeerRatingForm
                sessionId={sessionId}
                toUserId={debrief.opponentUserId}
                onSubmitted={() => setIsPeerRatingSubmitted(true)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* ── CTA Buttons ── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex-1 h-11 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          ← Kembali ke Dashboard
        </button>

        {isScored && (
          <button
            onClick={() =>
              window.open(buildLinkedInUrl(debrief.scenarioTitle, score, sessionId), "_blank", "noopener noreferrer")
            }
            className="flex-1 h-11 rounded-md bg-[#0077B5] text-white text-sm font-medium hover:bg-[#006097] transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
            </svg>
            Share ke LinkedIn
          </button>
        )}
      </div>
    </div>
    </div>
  );
}
