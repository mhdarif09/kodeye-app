"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

const CATEGORIES = [
  { slug: "engineering", label: "Engineering", icon: "⚙️", gradient: "from-blue-500/20 via-blue-500/5 to-transparent", border: "border-blue-500/20", hoverBorder: "hover:border-blue-500/40", glow: "bg-blue-500/10" },
  { slug: "debugging", label: "Debugging", icon: "🐛", gradient: "from-red-500/20 via-red-500/5 to-transparent", border: "border-red-500/20", hoverBorder: "hover:border-red-500/40", glow: "bg-red-500/10" },
  { slug: "system-design", label: "System Design", icon: "🏗️", gradient: "from-purple-500/20 via-purple-500/5 to-transparent", border: "border-purple-500/20", hoverBorder: "hover:border-purple-500/40", glow: "bg-purple-500/10" },
  { slug: "data", label: "Data", icon: "📊", gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent", border: "border-emerald-500/20", hoverBorder: "hover:border-emerald-500/40", glow: "bg-emerald-500/10" },
  { slug: "interview-prep", label: "Interview Prep", icon: "🎯", gradient: "from-amber-500/20 via-amber-500/5 to-transparent", border: "border-amber-500/20", hoverBorder: "hover:border-amber-500/40", glow: "bg-amber-500/10" },
  { slug: "technical-communication", label: "Technical Comm.", icon: "📝", gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent", border: "border-cyan-500/20", hoverBorder: "hover:border-cyan-500/40", glow: "bg-cyan-500/10" },
  { slug: "negotiation", label: "Negotiation", icon: "🤝", gradient: "from-pink-500/20 via-pink-500/5 to-transparent", border: "border-pink-500/20", hoverBorder: "hover:border-pink-500/40", glow: "bg-pink-500/10" },
  { slug: "stakeholder-management", label: "Stakeholder Mgmt", icon: "👥", gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent", border: "border-indigo-500/20", hoverBorder: "hover:border-indigo-500/40", glow: "bg-indigo-500/10" },
];

interface CurriculumItem {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  url: string;
  level_number: number;
  mode: string;
  access: string;
  is_published: number;
}

export default function KurikulumPage() {
  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/curriculum/public").then((res) => {
        setItems(res.data?.data ?? []);
      }),
      api.get("/api/curriculum/progress/list").then((res) => {
        const prog: Record<string, number> = {};
        (res.data?.data ?? []).forEach((p: any) => {
          const cat = items.find(i => i.id === p.curriculum_id)?.category;
          if (cat) prog[cat] = (prog[cat] || 0) + 1;
        });
        setProgress(prog);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const counts: Record<string, number> = {};
  items.forEach((i) => {
    if (i.category) counts[i.category] = (counts[i.category] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="h-8 w-56 rounded-lg bg-muted/50 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-8">
      <div className="max-w-6xl mx-auto w-full space-y-6 px-4 md:px-8 pt-4 md:pt-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border border-border/50 p-5 md:p-7">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📖</span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Kurikulum Belajar</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Pilih kategori untuk memulai perjalanan belajarmu
            </p>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const total = counts[cat.slug] || 0;
            const done = progress[cat.slug] || 0;
            const isAvailable = total > 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <Link
                key={cat.slug}
                href={isAvailable ? `/kurikulum/${cat.slug}` : "#"}
                className={`group relative overflow-hidden rounded-2xl border ${cat.border} ${cat.hoverBorder} transition-all duration-300 ${
                  isAvailable ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

                <div className="relative p-5 flex flex-col h-full">
                  <span className="text-3xl md:text-4xl mb-3 block">{cat.icon}</span>
                  <h3 className="text-sm md:text-base font-bold group-hover:text-primary transition-colors">
                    {cat.label}
                  </h3>

                  {isAvailable ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {done}/{total} level
                        </span>
                        <span className="font-medium text-foreground/80">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 mt-2">Segera hadir</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
