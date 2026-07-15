"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { formatCategory } from "@/lib/utils";
import { FALLBACK_CURRICULUM } from "@/lib/constants";
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

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  const [stats, setStats] = useState<UserStats | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>(FALLBACK_CURRICULUM);
  const [isLoading, setIsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchMode, setMatchMode] = useState<"duel" | "coop">("duel");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, scenariosRes, curriculumRes] = await Promise.all([
          api.get("/api/users/me/stats").catch(() => ({ data: { data: { totalSessions: 0, winRate: 0, highestElo: 1200 } } })),
          api.get("/api/scenarios").catch(() => ({ data: { data: [] } })),
          api.get("/api/admin/curriculum/public").catch(() => ({ data: { data: [] } })),
        ]);
        setStats(statsRes.data.data ?? statsRes.data);
        setScenarios(scenariosRes.data.data ?? []);
        const apiData = curriculumRes.data?.data ?? [];
        if (apiData.length > 0) setCurriculum(apiData);
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
    <div className="flex-1 p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {userRole === "admin" && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/admin")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10m0 0V4m0 6h6m-6 0H6"/></svg>
            Admin Panel
          </button>
        </div>
      )}

      {/* Top nav links */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push("/langganan")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Langganan
        </button>
      </div>

      {/* Header Profile & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-secondary/30 p-6 rounded-xl border border-border">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold uppercase">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user?.name || "User"}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-4 md:gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats?.totalSessions ?? "-"}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sesi</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">{stats?.winRate ? `${stats.winRate}%` : "-"}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{stats?.highestElo ?? "-"}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Top ELO</p>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          variant="primary"
          className="h-24 sm:h-32 text-xl sm:text-2xl font-bold shadow-sm hover:shadow-md transition-all flex flex-col gap-2"
          onClick={() => openMatchmaking("duel")}
        >
          <span>⚔️ Cari Duel</span>
          <span className="text-xs font-normal opacity-80 uppercase tracking-widest">Kompetitif</span>
        </Button>
        <Button
          variant="secondary"
          className="h-24 sm:h-32 text-xl sm:text-2xl font-bold shadow-sm hover:shadow-md transition-all flex flex-col gap-2"
          onClick={handleAiPractice}
          disabled={aiLoading}
        >
          <span>{aiLoading ? "⏳" : "🧠"} Latihan dengan AI</span>
          <span className="text-xs font-normal opacity-60 uppercase tracking-widest">Sendiri dulu</span>
        </Button>
        <Button
          variant="secondary"
          className="h-24 sm:h-32 text-xl sm:text-2xl font-bold shadow-sm hover:shadow-md transition-all flex flex-col gap-2"
          onClick={() => openMatchmaking("coop")}
        >
          <span>🤝 Cari Partner</span>
          <span className="text-xs font-normal opacity-60 uppercase tracking-widest">Kolaboratif</span>
        </Button>
      </div>

      {/* Scenarios Grid with Pagination */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Skenario Populer</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario)}
                  className="text-left block w-full"
                >
                  <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col h-full">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={scenario.difficulty === 'beginner' ? 'success' : scenario.difficulty === 'intermediate' ? 'warning' : 'destructive'} className="capitalize text-[10px] px-2 py-0">
                          {scenario.difficulty}
                        </Badge>
                        <span className="text-lg" title={scenario.mode === 'duel' ? 'Duel Mode' : 'Co-op Mode'}>
                          {scenario.mode === 'duel' ? '⚔️' : '🤝'}
                        </span>
                      </div>
                      <CardTitle className="text-base line-clamp-1">{scenario.title}</CardTitle>
                      <CardDescription className="text-xs">
                        Kategori: {formatCategory(scenario.category)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 mt-auto">
                      <div className="bg-muted/50 p-3 rounded-md text-xs">
                        <p className="text-muted-foreground mb-1">Kamu bisa jadi:</p>
                        <p className="font-medium text-foreground line-clamp-2">
                          {scenario.role_a_name || "Role A"} <span className="text-muted-foreground mx-1">atau</span> {scenario.role_b_name || "Role B"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, scenarios.length)} dari {scenarios.length} skenario
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 text-xs rounded-md transition-colors ${
                          p === page
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-8 bg-secondary/20 rounded-xl border border-dashed border-border text-muted-foreground">
            Belum ada skenario yang tersedia saat ini.
          </div>
        )}
      </div>

      {/* Curriculum Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">📖 Kurikulum Belajar</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Koleksi video & artikel open source untuk mengembangkan skill kamu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {curriculum.slice(0, 9).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
            >
              <span className="text-xl shrink-0 mt-0.5">
                {item.type === "video" ? "🎬" : item.type === "course" ? "🎓" : "📄"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium group-hover:text-foreground truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                )}
                {item.author && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1">— {item.author}</p>
                )}
              </div>
            </a>
          ))}
        </div>

        {curriculum.length > 9 && (
          <div className="text-center pt-1">
            <button
              onClick={() => router.push("/curriculum")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Lihat semua {curriculum.length} sumber belajar →
            </button>
          </div>
        )}
      </div>

      <MatchmakingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={matchMode}
      />
    </div>
  );
}
