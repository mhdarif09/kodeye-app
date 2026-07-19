"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<{ sessionId: string; mode: string; scenarioTitle: string; creatorName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    api.get(`/api/sessions/invite-info/${code}`)
      .then((res) => setInfo(res.data.data))
      .catch((err) => setError(err.response?.data?.error?.message || "Undangan tidak valid atau sudah kedaluwarsa"))
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await api.post(`/api/sessions/join-invite/${code}`);
      toast.success("Bergabung ke sesi!");
      router.push(`/arena/${res.data.data.sessionId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Gagal bergabung");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat undangan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <span className="text-5xl block">😕</span>
          <h1 className="text-xl font-bold">Undangan Tidak Ditemukan</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
          >
            Ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/10">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-3">
          <span className="text-5xl block">{info?.mode === "coop" ? "🤝" : "⚔️"}</span>
          <h1 className="text-2xl font-bold">Undangan {info?.mode === "coop" ? "Co-op" : "Duel"}</h1>
        </div>

        <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-background to-muted/5 p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Skenario</p>
            <p className="font-semibold">{info?.scenarioTitle || "Acak"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Dibuat oleh</p>
            <p className="font-medium text-muted-foreground">{info?.creatorName || "Pengguna"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mode</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/50 text-sm font-medium">
              {info?.mode === "coop" ? "🤝" : "⚔️"} {info?.mode === "coop" ? "Co-op" : "Duel"}
            </span>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {joining ? "Bergabung..." : "Gabung Sekarang"}
        </button>

        <p className="text-xs text-muted-foreground/50 text-center">
          Undangan ini berlaku 10 menit
        </p>
      </div>
    </div>
  );
}
