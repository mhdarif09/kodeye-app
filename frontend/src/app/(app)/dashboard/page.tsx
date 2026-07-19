"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { formatCategory } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MatchmakingModal } from "@/components/lobby/MatchmakingModal";

interface UserStats {
  totalSessions: number;
  winRate: number;
  highestElo: number;
}

interface Scenario {
  id: string;
  title: string;
  category: string;
  mode: "duel" | "coop";
  difficulty: "beginner" | "intermediate" | "advanced";
  role_a_name?: string;
  role_b_name?: string;
}

interface CurriculumItem {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  category: string | null;
  author: string | null;
  icon?: string;
}

const PER_PAGE = 6;

const CATEGORY_GRADIENTS: Record<string, string> = {
  engineering: "from-blue-500/20 via-blue-500/5 to-transparent",
  debugging: "from-red-500/20 via-red-500/5 to-transparent",
  "system-design": "from-purple-500/20 via-purple-500/5 to-transparent",
  data: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  "interview-prep": "from-amber-500/20 via-amber-500/5 to-transparent",
  "technical-communication": "from-cyan-500/20 via-cyan-500/5 to-transparent",
  negotiation: "from-pink-500/20 via-pink-500/5 to-transparent",
  "stakeholder-management": "from-indigo-500/20 via-indigo-500/5 to-transparent",
};

const CATEGORY_ICONS: Record<string, string> = {
  engineering: "⚙️",
  debugging: "🐛",
  "system-design": "🏗️",
  data: "📊",
  "interview-prep": "💼",
  "technical-communication": "📝",
  negotiation: "🤝",
  "stakeholder-management": "👥",
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  const [stats, setStats] = useState<UserStats | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [donation, setDonation] = useState<{ enabled: boolean; settings: any } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchMode, setMatchMode] = useState<"duel" | "coop">("duel");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, scenariosRes, curriculumRes, donationRes] = await Promise.all([
          api.get("/api/users/me/stats").catch(() => ({ data: { data: { totalSessions: 0, winRate: 0, highestElo: 1200 } } })),
          api.get("/api/scenarios").catch(() => ({ data: { data: [] } })),
          api.get("/api/admin/curriculum/public").catch(() => ({ data: { data: [] } })),
          api.get("/api/admin/site-config/donation").catch(() => null),
        ]);
        setStats(statsRes.data.data ?? statsRes.data);
        setScenarios(scenariosRes.data.data ?? []);
        const apiData = curriculumRes.data?.data ?? [];
        setCurriculum(apiData);
        if (donationRes?.data?.data) setDonation(donationRes.data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPages = Math.max(1, Math.ceil(scenarios.length / PER_PAGE));
  const paginated = scenarios.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openMatchmaking = (mode: "duel" | "coop") => {
    setMatchMode(mode);
    setIsModalOpen(true);
  };

  const handleAiPractice = async () => {
    setAiLoading(true);
    try {
      const res = await api.post("/api/sessions/ai-practice");
      toast.success("AI practice session dimulai!");
      router.push(`/arena/${res.data.data.sessionId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memulai AI practice");
    } finally {
      setAiLoading(false);
    }
  };

  const handleScenarioClick = async (scenario: Scenario) => {
    try {
      const res = await api.post("/api/sessions/ai-practice", { scenarioId: scenario.id });
      toast.success(`Latihan "${scenario.title}" dimulai!`);
      router.push(`/arena/${res.data.data.sessionId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memulai latihan");
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full pb-8">
      {userRole === "admin" && (
        <div className="flex justify-end px-4 pt-4 md:pt-6 md:px-6">
          <button
            onClick={() => router.push("/admin")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-3 py-1.5 rounded-full border border-border hover:border-primary/30"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10m0 0V4m0 6h6m-6 0H6"/></svg>
            Admin Panel
          </button>
        </div>
      )}

      {/* Header Profile & Stats */}
      <div className="relative overflow-hidden mx-4 md:mx-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 rounded-2xl p-5 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg shadow-primary/20">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{user?.name || "User"}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex gap-5 md:gap-8 w-full md:w-auto justify-around md:justify-end">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold">{stats?.totalSessions ?? "-"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sesi</p>
            </div>
            <div className="w-px bg-border/50" />
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-emerald-500">{stats?.winRate ? `${stats.winRate}%` : "-"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Win Rate</p>
            </div>
            <div className="w-px bg-border/50" />
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-amber-500">{stats?.highestElo ?? "-"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Top ELO</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <button
            onClick={() => openMatchmaking("duel")}
            className="group relative overflow-hidden h-28 sm:h-36 rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-background border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 text-left p-4 md:p-5"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl translate-x-1/4 -translate-y-1/4 group-hover:translate-x-1/3 group-hover:-translate-y-1/3 transition-all duration-500" />
            <div className="relative h-full flex flex-col justify-between">
              <span className="text-2xl md:text-3xl">⚔️</span>
              <div>
                <p className="text-base md:text-lg font-bold">Cari Duel</p>
                <p className="text-[10px] md:text-xs text-muted-foreground/70 font-medium uppercase tracking-widest">Kompetitif</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleAiPractice}
            disabled={aiLoading}
            className="group relative overflow-hidden h-28 sm:h-36 rounded-2xl bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-background border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 text-left p-4 md:p-5 disabled:opacity-50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl translate-x-1/4 -translate-y-1/4 group-hover:translate-x-1/3 group-hover:-translate-y-1/3 transition-all duration-500" />
            <div className="relative h-full flex flex-col justify-between">
              <span className="text-2xl md:text-3xl">{aiLoading ? "⏳" : "🧠"}</span>
              <div>
                <p className="text-base md:text-lg font-bold">Latihan AI</p>
                <p className="text-[10px] md:text-xs text-muted-foreground/70 font-medium uppercase tracking-widest">Sendiri dulu</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => openMatchmaking("coop")}
            className="group relative overflow-hidden h-28 sm:h-36 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-background border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 text-left p-4 md:p-5"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl translate-x-1/4 -translate-y-1/4 group-hover:translate-x-1/3 group-hover:-translate-y-1/3 transition-all duration-500" />
            <div className="relative h-full flex flex-col justify-between">
              <span className="text-2xl md:text-3xl">🤝</span>
              <div>
                <p className="text-base md:text-lg font-bold">Cari Partner</p>
                <p className="text-[10px] md:text-xs text-muted-foreground/70 font-medium uppercase tracking-widest">Kolaboratif</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Scenarios Grid with Pagination */}
      <div className="px-4 md:px-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg md:text-xl font-bold tracking-tight">Skenario Populer</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario)}
                  className="text-left block w-full group"
                >
                  <div className="h-full rounded-xl border border-border/50 bg-gradient-to-b from-background to-muted/20 hover:from-muted/40 hover:to-muted/10 hover:border-primary/30 transition-all duration-300 overflow-hidden group">
                    <div className="p-4 md:p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant={scenario.difficulty === 'beginner' ? 'success' : scenario.difficulty === 'intermediate' ? 'warning' : 'destructive'} className="capitalize text-[10px] px-2.5 py-0.5 rounded-full">
                          {scenario.difficulty}
                        </Badge>
                        <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity">
                          {scenario.mode === 'duel' ? '⚔️' : '🤝'}
                        </span>
                      </div>
                      <h3 className="text-sm md:text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors mb-1">
                        {scenario.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {formatCategory(scenario.category)}
                      </p>
                      <div className="mt-auto bg-muted/40 backdrop-blur-sm rounded-lg p-3 border border-border/30">
                        <p className="text-[10px] text-muted-foreground mb-0.5 font-medium uppercase tracking-wider">Role</p>
                        <p className="text-xs font-medium text-foreground/80 line-clamp-1">
                          {scenario.role_a_name || "Role A"} <span className="text-muted-foreground/50 mx-1">vs</span> {scenario.role_b_name || "Role B"}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, scenarios.length)} / {scenarios.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-lg transition-all ${
                        p === page
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110"
                          : "border border-border hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-6 bg-gradient-to-b from-muted/20 to-background rounded-2xl border border-dashed border-border/50">
            <span className="text-3xl block mb-3">🎯</span>
            <p className="text-sm text-muted-foreground">Belum ada skenario yang tersedia saat ini.</p>
          </div>
        )}
      </div>

      {/* Curriculum Section */}
      <div className="px-4 md:px-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-emerald-500" />
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight">📖 Kurikulum Belajar</h2>
            <p className="text-xs text-muted-foreground/70">Koleksi materi untuk mengembangkan skill kamu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {curriculum.slice(0, 9).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-gradient-to-b from-background to-muted/10 hover:from-muted/30 hover:to-muted/5 hover:border-primary/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-xl shrink-0 mt-0.5 relative">
                {item.type === "video" ? "🎬" : item.type === "course" ? "🎓" : "📄"}
              </span>
              <div className="min-w-0 relative">
                <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">{item.description}</p>
                )}
                {item.author && (
                  <p className="text-[10px] text-muted-foreground/40 mt-1">— {item.author}</p>
                )}
              </div>
            </a>
          ))}
        </div>

        {curriculum.length > 9 && (
          <div className="text-center pt-1">
            <button
              onClick={() => router.push("/kurikulum")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Lihat semua {curriculum.length} sumber belajar →
            </button>
          </div>
        )}
      </div>

      {/* Donasi */}
      {donation?.enabled && donation?.settings?.methods?.length > 0 && (
        <div className="mx-4 md:mx-6 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">☕</span>
            <h2 className="text-base font-semibold">Dukung Kodeye</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Dukung pengembangan Kodeye agar tetap gratis dan terbuka untuk semua.
          </p>
          <div className="flex flex-wrap gap-2">
            {donation.settings.methods.slice(0, 3).map((m: any) => (
              <button
                key={m.name}
                onClick={() => navigator.clipboard.writeText(m.account)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border/60 hover:bg-muted/50 hover:border-amber-500/30 transition-all"
              >
                {m.icon || "💳"} {m.name}
              </button>
            ))}
            <button
              onClick={() => router.push("/donasi")}
              className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-opacity font-medium shadow-sm"
            >
              Lihat Semua
            </button>
          </div>
        </div>
      )}

      <MatchmakingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={matchMode}
      />
    </div>
  );
}
