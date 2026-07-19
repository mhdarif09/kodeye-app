"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/authStore";
import { useArenaSocket } from "@/hooks/useArenaSocket";

import { ChatPanel } from "@/components/arena/ChatPanel";
import { Timer } from "@/components/arena/Timer";
import { QuickActions } from "@/components/arena/QuickActions";

export default function ArenaPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    arenaState,
    sendMessage,
    sendFinish,
    sendReport,
  } = useArenaSocket(sessionId);

  const {
    isJoined,
    isStarted,
    role,
    scenarioTitle,
    mode,
    durationSeconds,
    startedAt,
    messages,
    opponentLeft,
    opponentFinished,
    isTimeout,
    problem,
    problemTemplate,
    templateLanguage,
    scenarioTitleEn,
  } = arenaState;
  const [locale, setLocale] = useState<"id" | "en">("id");

  useEffect(() => {
    if (isTimeout) {
      toast.success("Sesi selesai! Mengalihkan ke halaman debrief...");
      const t = setTimeout(() => {
        router.push(`/debrief/${sessionId}`);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [isTimeout, sessionId, router]);

  useEffect(() => {
    if (!opponentLeft) return;
    const t = setTimeout(() => {
      window.location.href = "/dashboard";
    }, 30000);
    return () => clearTimeout(t);
  }, [opponentLeft]);

  if (!isJoined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background flex-col gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Menghubungkan ke arena...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Kembali ke Dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-semibold leading-tight">{locale === "id" ? scenarioTitle : scenarioTitleEn}</h1>
            <p className="text-[10px] text-muted-foreground capitalize">
              {mode === "duel" ? "⚔️ Duel" : "🤝 Co-op"} · {role === "role_a" ? "Peran A" : "Peran B"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale((l) => (l === "id" ? "en" : "id"))}
            className="text-xs px-2 py-1 rounded border border-border hover:bg-secondary/50 transition"
          >
            {locale === "id" ? "EN" : "ID"}
          </button>
          {isStarted && (
            <Timer startedAt={startedAt} durationSeconds={durationSeconds} />
          )}
          <QuickActions
            onFinish={sendFinish}
            onReport={sendReport}
            isSessionStarted={isStarted}
          />
        </div>
      </header>

      {problem && (
        <div className="px-4 py-3 border-b border-border bg-muted/20 shrink-0">
          <div className="max-w-3xl mx-auto">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Soal</span>
            <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{problem}</p>
            {problemTemplate && (
              <pre className="mt-2 text-xs bg-background/80 rounded p-3 overflow-x-auto border border-border">
                <code>{problemTemplate}</code>
              </pre>
            )}
          </div>
        </div>
      )}

      <ChatPanel
        messages={messages}
        myRole={role}
        myUserId={user?.id ?? ""}
        onSend={sendMessage}
        opponentLeft={opponentLeft}
        opponentFinished={opponentFinished}
      />
    </div>
  );
}
