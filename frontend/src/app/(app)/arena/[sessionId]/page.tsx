"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/authStore";
import { useArenaSocket } from "@/hooks/useArenaSocket";

import { ReadyScreen } from "@/components/arena/ReadyScreen";
import { BriefingPanel } from "@/components/arena/BriefingPanel";
import { ChatPanel } from "@/components/arena/ChatPanel";
import { Timer } from "@/components/arena/Timer";
import { QuickActions } from "@/components/arena/QuickActions";

export default function ArenaPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [isReadyWaiting, setIsReadyWaiting] = useState(false);
  const [isBriefingCollapsed, setIsBriefingCollapsed] = useState(false);

  const {
    arenaState,
    sendReady,
    sendMessage,
    sendFinish,
    sendReport,
  } = useArenaSocket(sessionId);

  const {
    isJoined,
    isStarted,
    role,
    briefing,
    secretObjective,
    scenarioTitle,
    mode,
    durationSeconds,
    startedAt,
    messages,
    opponentLeft,
    opponentFinished,
    isTimeout,
  } = arenaState;

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

  const handleReady = () => {
    sendReady();
    setIsReadyWaiting(true);
  };

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
      {!isStarted && isJoined && (
        <ReadyScreen
          scenarioTitle={scenarioTitle}
          role={role}
          briefing={briefing}
          secretObjective={secretObjective}
          onReady={handleReady}
          isWaiting={isReadyWaiting}
        />
      )}

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
            <h1 className="text-sm font-semibold leading-tight">{scenarioTitle}</h1>
            <p className="text-[10px] text-muted-foreground capitalize">
              {mode === "duel" ? "⚔️ Duel" : "🤝 Co-op"} · {role === "role_a" ? "Peran A" : "Peran B"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

      <div className="flex flex-1 min-h-0">
        <BriefingPanel
          role={role}
          scenarioTitle={scenarioTitle}
          briefing={briefing}
          secretObjective={secretObjective}
          mode={mode}
          isCollapsed={isBriefingCollapsed}
          onToggle={() => setIsBriefingCollapsed((v) => !v)}
        />

        <ChatPanel
          messages={messages}
          myRole={role}
          myUserId={user?.id ?? ""}
          onSend={sendMessage}
          opponentLeft={opponentLeft}
          opponentFinished={opponentFinished}
        />
      </div>
    </div>
  );
}
