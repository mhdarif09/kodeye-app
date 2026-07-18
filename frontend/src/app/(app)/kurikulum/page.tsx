"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const CATEGORIES = [
  { slug: "engineering", label: "Engineering", icon: "⚙️", color: "from-blue-500/20 to-blue-600/10" },
  { slug: "debugging", label: "Debugging", icon: "🐛", color: "from-red-500/20 to-red-600/10" },
  { slug: "system-design", label: "System Design", icon: "🏗️", color: "from-purple-500/20 to-purple-600/10" },
  { slug: "data", label: "Data", icon: "📊", color: "from-green-500/20 to-green-600/10" },
  { slug: "interview-prep", label: "Interview Prep", icon: "🎯", color: "from-yellow-500/20 to-yellow-600/10" },
  { slug: "technical-communication", label: "Technical Communication", icon: "📝", color: "from-cyan-500/20 to-cyan-600/10" },
  { slug: "negotiation", label: "Negotiation", icon: "🤝", color: "from-orange-500/20 to-orange-600/10" },
  { slug: "stakeholder-management", label: "Stakeholder Management", icon: "👥", color: "from-pink-500/20 to-pink-600/10" },
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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
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
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">📖 Kurikulum Belajar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pilih kategori untuk memulai perjalanan belajarmu
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => {
          const total = counts[cat.slug] || 0;
          const done = progress[cat.slug] || 0;
          const isAvailable = total > 0;

          return (
            <Link
              key={cat.slug}
              href={isAvailable ? `/kurikulum/${cat.slug}` : "#"}
              className={`relative overflow-hidden rounded-xl border border-border p-5 transition-all group ${
                isAvailable
                  ? "hover:border-primary/40 hover:bg-muted/30 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-50`} />
              <div className="relative z-10">
                <span className="text-3xl">{cat.icon}</span>
                <h3 className="text-base font-semibold mt-2">{cat.label}</h3>
                {isAvailable && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {done}/{total} level selesai
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
