"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { getRank, SKILL_CATEGORY_LABELS, MAX_ELO_DISPLAY } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { EloProgressChart } from "@/components/profile/EloProgressChart";

interface Badge {
  id: string;
  label: string;
  minSessions: number;
}

interface UserStats {
  totalSessions: number;
  duelSessions: number;
  coopSessions: number;
  duelWins: number;
  winRate: number | null;
  eloByCategory: Record<string, number>;
  badges: Badge[];
}

interface ProfileData {
  id: string;
  email: string;
  displayName: string;
  experienceLevel: string;
  techStacks: string[];
  hasCompletedOnboarding: boolean;
}

export default function ProfilePage() {
  const { user, accessToken, setAuth } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEloCategory, setSelectedEloCategory] = useState<string>("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get("/api/users/me"),
          api.get("/api/users/me/stats").catch(() => ({ data: { data: {} } })),
        ]);
        const raw = profileRes.data.data ?? profileRes.data.user ?? profileRes.data;
        setProfile({
          id: raw.id,
          email: raw.email,
          displayName: raw.display_name ?? raw.displayName ?? "",
          experienceLevel: raw.experience_level ?? raw.experienceLevel ?? "",
          techStacks: raw.tech_stacks ?? raw.techStacks ?? [],
          hasCompletedOnboarding: raw.has_completed_onboarding ?? raw.hasCompletedOnboarding ?? false,
        });
        const s = statsRes.data.data ?? statsRes.data;
        setStats(s);
        // Default chart to first elo category with data
        const eloKeys = Object.keys(s?.eloByCategory ?? {});
        if (eloKeys.length > 0) setSelectedEloCategory(eloKeys[0]);
      } catch {
        toast.error("Gagal memuat profil");
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSaved = (updated: Partial<ProfileData>) => {
    setProfile((prev) => prev ? { ...prev, ...updated } : prev);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const eloRatings = stats?.eloByCategory ?? {};
  const topElo = Object.values(eloRatings).length > 0 ? Math.max(...Object.values(eloRatings)) : null;
  const badges = stats?.badges ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* ── Profile Card ── */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">Profil</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => setIsEditOpen(true)}>
              ✏️ Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shrink-0 uppercase">
              {(profile?.displayName ?? user?.email ?? "U").charAt(0)}
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{profile?.displayName ?? "—"}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email ?? user?.email}</p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="capitalize">
                  👤 {profile?.experienceLevel ?? "—"}
                </Badge>
                {(profile?.techStacks ?? []).map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sesi", value: stats?.totalSessions ?? "—" },
          { label: "Win Rate", value: stats?.winRate != null ? `${stats.winRate}%` : "—", accent: "text-emerald-500" },
          { label: "Top ELO", value: topElo ?? "—", accent: "text-amber-500" },
        ].map(({ label, value, accent }) => (
          <Card key={label} className="text-center">
            <CardContent className="pt-5 pb-4">
              <p className={cn("text-3xl font-bold", accent ?? "text-foreground")}>{value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── ELO per Category ── */}
      {Object.keys(eloRatings).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">ELO Rating per Kategori</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {Object.entries(eloRatings).map(([cat, elo]) => {
              const rank = getRank(elo);
              const pct = Math.min((elo / MAX_ELO_DISPLAY) * 100, 100);
              const label = SKILL_CATEGORY_LABELS[cat] ?? cat;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedEloCategory(cat)}
                        className={cn("font-medium hover:text-primary transition-colors", selectedEloCategory === cat && "text-primary")}
                      >
                        {label}
                      </button>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border", rank.bg, rank.border, rank.text)}>
                        {rank.label}
                      </span>
                    </div>
                    <span className="tabular-nums font-bold">{elo}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: rank.color }}
                    />
                  </div>
                </div>
              );
            })}

            {/* ELO Chart — disabled until backend provides elo history data */}
            {false && selectedEloCategory && (
              <div className="pt-4 border-t border-border">
                <div className="flex gap-2 flex-wrap mb-4">
                  {Object.keys(eloRatings).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedEloCategory(cat)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        selectedEloCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {SKILL_CATEGORY_LABELS[cat] ?? cat}
                    </button>
                  ))}
                </div>
                <EloProgressChart data={[]} category={selectedEloCategory} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Badge Collection ── */}
      {badges.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">🏅 Badge Collection</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-medium capitalize"
                >
                  🏅 {badge.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        currentData={{
          displayName: profile?.displayName ?? "",
          experienceLevel: profile?.experienceLevel ?? "mid",
          techStacks: profile?.techStacks ?? [],
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
