"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface LevelItem {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  level_number: number;
  mode: string;
  access: string;
  url: string;
  content: string;
  is_published: number;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  engineering: { label: "Engineering", icon: "⚙️" },
  debugging: { label: "Debugging", icon: "🐛" },
  "system-design": { label: "System Design", icon: "🏗️" },
  data: { label: "Data", icon: "📊" },
  "interview-prep": { label: "Interview Prep", icon: "🎯" },
  "technical-communication": { label: "Technical Communication", icon: "📝" },
  negotiation: { label: "Negotiation", icon: "🤝" },
  "stakeholder-management": { label: "Stakeholder Management", icon: "👥" },
};

const MODE_ICONS: Record<string, { icon: string; label: string }> = {
  solo: { icon: "🧑‍💻", label: "Solo" },
  duel: { icon: "⚔️", label: "Duel" },
  peer: { icon: "👥", label: "Peer" },
  coop: { icon: "🤝", label: "Co-op" },
};

const ACCESS_BADGES: Record<string, { label: string; className: string }> = {
  giat: { label: "Giat", className: "bg-yellow-500/10 text-yellow-500" },
  premium: { label: "Premium", className: "bg-purple-500/10 text-purple-500" },
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const router = useRouter();
  const [items, setItems] = useState<LevelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribedPlans, setSubscribedPlans] = useState<string[]>([]);

  const catInfo = CATEGORY_LABELS[category] || { label: category, icon: "📁" };

  useEffect(() => {
    if (!category) return;
    Promise.all([
      api.get("/api/admin/curriculum/public").then((res) => {
        const all: LevelItem[] = res.data?.data ?? [];
        setItems(all.filter((i) => i.category === category).sort((a, b) => a.level_number - b.level_number));
      }),
      api.get("/api/payment/subscription").then((res) => {
        const sub = res.data?.data;
        if (sub?.tier_name) setSubscribedPlans([sub.tier_name.toLowerCase()]);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [category]);

  const getMaxAccess = (): string => {
    if (subscribedPlans.includes("premium")) return "premium";
    if (subscribedPlans.includes("giat")) return "giat";
    return "free";
  };

  const isLocked = (access: string): boolean => {
    const order = ["free", "giat", "premium"];
    return order.indexOf(access) > order.indexOf(getMaxAccess());
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-4">
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
      <button onClick={() => router.push("/kurikulum")} className="text-xs text-muted-foreground hover:text-foreground mb-2 block">
        &larr; Semua Kategori
      </button>

      <div className="flex items-center gap-3">
        <span className="text-3xl">{catInfo.icon}</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{catInfo.label}</h1>
          <p className="text-sm text-muted-foreground">{items.length} level tersedia</p>
        </div>
      </div>

      <div className="relative space-y-4">
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Belum ada materi untuk kategori ini.</div>
        )}

        {items.map((item, idx) => {
          const locked = isLocked(item.access);
          const modeInfo = MODE_ICONS[item.mode] || { icon: "📄", label: item.mode };
          const accessBadge = ACCESS_BADGES[item.access];

          return (
            <div key={item.id} className="relative">
              {idx < items.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-px bg-border" />
              )}
              <Link
                href={locked ? "#" : `/kurikulum/${category}/${item.level_number}`}
                onClick={(e) => {
                  if (locked) {
                    e.preventDefault();
                    toast.error("Upgrade untuk membuka level ini");
                    router.push("/langganan");
                  }
                }}
                className={`relative flex items-start gap-4 p-5 rounded-xl border transition-all ${
                  locked
                    ? "border-border/50 opacity-60 cursor-pointer hover:border-border"
                    : "border-border hover:border-primary/40 hover:bg-muted/30 group"
                }`}
              >
                {/* Level number circle */}
                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }`}>
                  {locked ? "🔒" : item.level_number}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-base font-semibold ${locked ? "text-muted-foreground" : ""}`}>
                      {item.title}
                    </h3>
                    {accessBadge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${accessBadge.className}`}>
                        {accessBadge.label}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 line-clamp-2 ${locked ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{modeInfo.icon}</span>
                      {modeInfo.label}
                    </span>
                    <span className={`text-xs ${item.access === 'free' ? 'text-emerald-500' : item.access === 'giat' ? 'text-yellow-500' : 'text-purple-500'}`}>
                      {item.access === 'free' ? 'Gratis' : item.access === 'giat' ? 'Giat' : 'Premium'}
                    </span>
                  </div>
                  {locked && (
                    <p className="text-xs text-muted-foreground/50 mt-2">
                      Upgrade ke {item.access === "premium" ? "Premium" : "Giat"} untuk mengakses level ini
                    </p>
                  )}
                </div>

                <div className={`shrink-0 self-center ${locked ? "text-muted-foreground/30" : "text-muted-foreground group-hover:text-foreground"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
