"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ArenaMessage } from "@/hooks/useArenaSocket";

interface ChatPanelProps {
  messages: ArenaMessage[];
  myRole: string;
  myUserId: string;
  onSend: (text: string) => void;
  opponentLeft: boolean;
  opponentFinished: boolean;
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function getInitial(role: string) {
  return role === "role_a" ? "A" : "B";
}

export function ChatPanel({ messages, myRole, myUserId, onSend, opponentLeft, opponentFinished }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 border-l border-border bg-background">
      {/* Status banners */}
      {opponentLeft && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-xs font-medium">
          ⚠️ Lawan terputus, menunggu reconnect...
        </div>
      )}
      {opponentFinished && !opponentLeft && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 text-blue-500 text-xs font-medium">
          ℹ️ Lawan sudah menyelesaikan sesi.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Belum ada pesan. Mulai percakapan sesuai skenario!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.userId === myUserId;
          const initial = getInitial(msg.role);
          const roleLabel = msg.role === "role_a" ? "Peran A" : "Peran B";

          return (
            <div key={idx} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
              {/* Avatar */}
              <div
                className={cn(
                  "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                  isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {initial}
              </div>

              {/* Bubble */}
              <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {isMe ? "Kamu" : roleLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(msg.ts)}</span>
                </div>
                <div
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-secondary text-secondary-foreground rounded-tl-sm"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2 items-center bg-background/80">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Kirim pesan... (Enter untuk kirim)"
          maxLength={4000}
          className="flex-1 h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
