"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { cn, relativeDate } from "@/lib/utils";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { DebriefContent, type DebriefContentData } from "@/components/debrief/DebriefContent";

interface HistorySession {
  id: string;
  scenarioTitle: string;
  mode: "duel" | "coop";
  category?: string;
  difficulty?: string;
  startedAt: string;
  endedAt?: string;
  score: number | null;
  status: "completed" | "cancelled" | "pending" | "in_progress";
  myRole?: string;
}

interface HistoryResponse {
  sessions: HistorySession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 20;

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  completed: { label: "Selesai", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  pending: { label: "Menunggu", variant: "warning" },
  in_progress: { label: "Berlangsung", variant: "secondary" },
};

const MODE_ICONS: Record<string, string> = {
  duel: "⚔️",
  coop: "🤝",
};

// relativeDate imported from @/lib/utils

function formatScore(score: number | null) {
  if (score === null || score === undefined) return "—";
  return `${score}/100`;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Detail modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<DebriefContentData | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchHistory = async (p: number) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/users/me/history?page=${p}&limit=${LIMIT}`);
      const d = res.data.data;
      setSessions(d.history ?? []);
      setTotal(d.pagination?.total ?? 0);
      setTotalPages(d.pagination?.totalPages ?? 1);
      setPage(d.pagination?.page ?? 1);
    } catch {
      toast.error("Gagal memuat riwayat sesi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handlePrev = () => {
    if (page > 1) fetchHistory(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) fetchHistory(page + 1);
  };

  const openDetail = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsDetailLoading(true);
    setDetailData(null);
    try {
      const res = await api.get(`/api/sessions/${sessionId}/debrief`);
      setDetailData(res.data.data);
    } catch {
      toast.error("Gagal memuat detail sesi");
      setSelectedSessionId(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Sesi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total} sesi total` : "Belum ada sesi"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-3">🕒</p>
          <p className="text-muted-foreground">Belum ada sesi yang terselesaikan.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Mulai sesi duel atau co-op untuk melihat riwayat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const statusCfg = STATUS_LABELS[s.status] ?? STATUS_LABELS.completed;
            return (
              <button
                key={s.id}
                onClick={() => openDetail(s.id)}
                className="w-full text-left p-4 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xl shrink-0">{MODE_ICONS[s.mode] ?? "⚔️"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {s.scenarioTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {relativeDate(s.startedAt)}
                        {s.category && (
                          <span className="ml-1.5 opacity-60">
                            · {s.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      "text-sm font-bold tabular-nums min-w-[48px] text-right",
                      s.score !== null && s.score >= 80 && "text-emerald-500",
                      s.score !== null && s.score >= 60 && s.score < 80 && "text-amber-500",
                      s.score !== null && s.score < 60 && "text-red-500",
                    )}>
                      {formatScore(s.score)}
                    </span>
                    <Badge variant={statusCfg.variant} className="capitalize shrink-0">
                      {statusCfg.label}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={handlePrev}>
              ← Sebelumnya
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={handleNext}>
              Selanjutnya →
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={selectedSessionId !== null} onClose={() => setSelectedSessionId(null)} className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {isDetailLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : detailData ? (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedSessionId(null)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Kembali
            </button>
            <DebriefContent data={detailData} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
