"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useSocket } from "./useSocket";

export interface ArenaMessage {
  userId: string;
  role: string;
  text: string;
  ts: string;
}

export interface ArenaState {
  isConnected: boolean;
  isJoined: boolean;
  isStarted: boolean;
  status: string;
  role: string;
  briefing: string;
  briefingEn: string;
  scenarioTitle: string;
  scenarioTitleEn: string;
  mode: string;
  durationSeconds: number;
  startedAt?: string;
  messages: ArenaMessage[];
  opponentFinished: boolean;
  opponentLeft: boolean;
  isTimeout: boolean;
  problem: string | null;
  problemTemplate: string | null;
  templateLanguage: string | null;
}

export const useArenaSocket = (sessionId: string) => {
  const { socket, isConnected } = useSocket();
  const [arenaState, setArenaState] = useState<ArenaState>({
    isConnected: false,
    isJoined: false,
    isStarted: false,
    status: "waiting",
    role: "",
    briefing: "",
    briefingEn: "",
    scenarioTitle: "",
    scenarioTitleEn: "",
    mode: "",
    durationSeconds: 0,
    messages: [],
    opponentFinished: false,
    opponentLeft: false,
    isTimeout: false,
    problem: null,
    problemTemplate: null,
    templateLanguage: null,
  });

  useEffect(() => {
    setArenaState(prev => ({ ...prev, isConnected }));
  }, [isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("arena:joined", (data: any) => {
      setArenaState(prev => ({
        ...prev,
        isJoined: true,
        role: data.role,
        briefing: data.briefing,
        briefingEn: data.briefingEn || data.briefing,
        scenarioTitle: data.scenarioTitle,
        scenarioTitleEn: data.scenarioTitleEn || data.scenarioTitle,
        mode: data.mode,
        durationSeconds: data.durationSeconds,
        status: data.status,
        startedAt: data.startedAt,
        isStarted: data.status === "in_progress",
        problem: data.problem || null,
        problemTemplate: data.problemTemplate || null,
        templateLanguage: data.templateLanguage || null,
      }));
    });

    socket.on("arena:started", (data: any) => {
      setArenaState(prev => ({
        ...prev,
        isStarted: true,
        status: "in_progress",
        startedAt: data.startedAt,
        durationSeconds: data.durationSeconds,
      }));
    });

    socket.on("arena:message", (msg: ArenaMessage) => {
      setArenaState(prev => ({
        ...prev,
        messages: [...prev.messages, msg],
      }));
    });

    socket.on("arena:opponent-left", () => {
      setArenaState(prev => ({ ...prev, opponentLeft: true }));
    });

    socket.on("arena:opponent-finished", () => {
      setArenaState(prev => ({ ...prev, opponentFinished: true }));
    });

    socket.on("arena:timeout", () => {
      setArenaState(prev => ({ ...prev, isTimeout: true, status: "completed" }));
    });

    socket.on("arena:error", (err: any) => {
      console.error("Arena error:", err);
      toast.error(err?.message || "Terjadi kesalahan di arena");
    });

    socket.emit("arena:join", { sessionId });

    return () => {
      socket.off("arena:joined");
      socket.off("arena:started");
      socket.off("arena:message");
      socket.off("arena:opponent-left");
      socket.off("arena:opponent-finished");
      socket.off("arena:timeout");
      socket.off("arena:error");
    };
  }, [socket, isConnected, sessionId]);

  const sendMessage = useCallback((text: string) => {
    socket?.emit("arena:message", { text });
  }, [socket]);

  const sendFinish = useCallback(() => {
    socket?.emit("arena:finish");
  }, [socket]);

  const sendReport = useCallback((reason: string) => {
    socket?.emit("arena:report", { reason });
  }, [socket]);

  return {
    arenaState,
    sendMessage,
    sendFinish,
    sendReport,
  };
};
