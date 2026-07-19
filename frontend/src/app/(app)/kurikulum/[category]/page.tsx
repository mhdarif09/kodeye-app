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

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; gradient: string }> = {
  engineering: { label: "Engineering", icon: "⚙️", color: "border-blue-500/20", gradient: "from-blue-500/20 via-blue-500/5 to-transparent" },
  debugging: { label: "Debugging", icon: "🐛", color: "border-red-500/20", gradient: "from-red-500/20 via-red-500/5 to-transparent" },
  "system-design": { label: "System Design", icon: "🏗️", color: "border-purple-500/20", gradient: "from-purple-500/20 via-purple-500/5 to-transparent" },
  data: { label: "Data", icon: "📊", color: "border-emerald-500/20", gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent" },
  "interview-prep": { label: "Interview Prep", icon: "🎯", color: "border-amber-500/20", gradient: "from-amber-500/20 via-amber-500/5 to-transparent" },
  "technical-communication": { label: "Technical Communication", icon: "📝", color: "border-cyan-500/20", gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent" },
  negotiation: { label: "Negotiation", icon: "🤝", color: "border-pink-500/20", gradient: "from-pink-500/20 via-pink-500/5 to-transparent" },
  "stakeholder-management": { label: "Stakeholder Management", icon: "👥", color: "border-indigo-500/20", gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent" },
};

const MODE_ICONS: Record<string, { icon: string; label: string }> = {
  solo: { icon: "🧑‍💻", label: "Solo" },
  duel: { icon: "⚔️", label: "Duel" },
  peer: { icon: "👥", label: "Peer" },
  coop: { icon: "🤝", label: "Co-op" },
};

const ACCESS_STYLES: Record<string, { label: string; badge: string; text: string }> = {
  free: { label: "Gratis", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", text: "text-emerald-500" },
  giat: { label: "Giat", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", text: "text-amber-500" },
  premium: { label: "Premium", badge: "bg-purple-500/10 text-purple-500 border-purple-500/20", text: "text-purple-500" },
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const router = useRouter();
  const [items, setItems] = useState<LevelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribedPlans, setSubscribedPlans] = useState<string[]>([]);

  const meta = CATEGORY_META[category] || { label: category, icon: "📁", color: "border-border", gradient: "from-muted/20 to-transparent" };

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
        <div className="h-5 w-24 rounded-lg bg-muted/50 animate-pulse" />
        <div className="h-10 w-64 rounded-lg bg-muted/50 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 pb-8">
      <div className="max-w-3xl mx-auto w-full space-y-6 px-4 md:px-8 pt-4 md:pt-8">
        {/* Back + Header */}
        <div className="space-y-4">
          <button onClick={() => router.push("/kurikulum")} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
            Semua Kategori
          </button>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 flex items-center justify-center text-2xl">
              {meta.icon}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{meta.label}</h1>
              <p className="text-sm text-muted-foreground">{items.length} level tersedia</p>
            </div>
          </div>
        </div>

        {/* Level List */}
        <div className="relative space-y-4">
          {items.length === 0 && (
            <div className="text-center py-16 px-6 bg-gradient-to-b from-muted/20 to-background rounded-2xl border border-dashed border-border/50">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-sm text-muted-foreground">Belum ada materi untuk kategori ini.</p>
            </div>
          )}

          {items.map((item, idx) => {
            const locked = isLocked(item.access);
            const modeInfo = MODE_ICONS[item.mode] || { icon: "📄", label: item.mode };
            const accessStyle = ACCESS_STYLES[item.access] || ACCESS_STYLES.free;

            return (
              <div key={item.id} className="relative">
                {idx < items.length - 1 && (
                  <div className="absolute left-7 top-16 bottom-0 w-px bg-gradient-to-b from-border via-border/50 to-transparent" />
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
                  className={`group relative overflow-hidden flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                    locked
                      ? "border-border/30 bg-muted/10 opacity-60"
                      : "border-border/50 bg-gradient-to-b from-background to-muted/5 hover:from-muted/20 hover:to-muted/5 hover:border-primary/30"
                  }`}
                >
                  {!locked && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  )}

                  <div className={`relative shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold border transition-all duration-300 ${
                    locked
                      ? "bg-muted/20 text-muted-foreground border-border/20"
                      : "bg-gradient-to-br from-primary/10 to-primary/5 text-primary border-primary/20 group-hover:border-primary/40 group-hover:shadow-md group-hover:shadow-primary/5"
                  }`}>
                    {locked ? "🔒" : item.level_number}
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className={`text-sm md:text-base font-bold transition-colors ${locked ? "text-muted-foreground" : "group-hover:text-primary"}`}>
                        {item.title}
                      </h3>
                      {item.access !== 'free' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${accessStyle.badge}`}>
                          {accessStyle.label}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs md:text-sm line-clamp-2 ${locked ? "text-muted-foreground/50" : "text-muted-foreground/80"}`}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md">
                        <span>{modeInfo.icon}</span>
                        {modeInfo.label}
                      </span>
                      <span className={`text-[11px] font-medium ${accessStyle.text}`}>
                        {accessStyle.label}
                      </span>
                    </div>
                    {locked && (
                      <p className="text-[11px] text-muted-foreground/40 mt-2 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        Upgrade ke {item.access === "premium" ? "Premium" : "Giat"} untuk mengakses
                      </p>
                    )}
                  </div>

                  <div className={`relative shrink-0 self-center transition-all duration-300 ${
                    locked ? "text-muted-foreground/20" : "text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5"
                  }`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
