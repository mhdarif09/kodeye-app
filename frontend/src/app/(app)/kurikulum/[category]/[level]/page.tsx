"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface LevelDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string | null;
  content: string | null;
  category: string;
  level_number: number;
  mode: string;
  access: string;
  author: string | null;
}

const MODE_ICONS: Record<string, { icon: string; label: string }> = {
  solo: { icon: "🧑‍💻", label: "Mulai Latihan AI" },
  duel: { icon: "⚔️", label: "Cari Lawan Duel" },
  peer: { icon: "👥", label: "Mulai Peer Review" },
  coop: { icon: "🤝", label: "Cari Partner Co-op" },
};

const ACTIONS = ["engineering", "debugging", "system-design", "data", "interview-prep", "technical-communication", "negotiation", "stakeholder-management"];

const CATEGORY_LABELS: Record<string, string> = {
  engineering: "Engineering",
  debugging: "Debugging",
  "system-design": "System Design",
  data: "Data",
  "interview-prep": "Interview Prep",
  "technical-communication": "Technical Communication",
  negotiation: "Negotiation",
  "stakeholder-management": "Stakeholder Management",
};

export default function LevelReaderPage() {
  const { category, level } = useParams<{ category: string; level: string }>();
  const router = useRouter();
  const [item, setItem] = useState<LevelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  const levelNum = parseInt(level, 10);

  useEffect(() => {
    if (!category || !level) return;

    // Fetch all items in this category, find the one with matching level
    api.get("/api/admin/curriculum/public")
      .then((res) => {
        const all: LevelDetail[] = res.data?.data ?? [];
        const match = all.find((i) => i.category === category && i.level_number === levelNum);
        if (!match) {
          toast.error("Materi tidak ditemukan");
          router.push(`/kurikulum/${category}`);
          return;
        }

        // Try to fetch full content (might be gated)
        api.get(`/api/curriculum/${match.id}`)
          .then((detailRes) => {
            setItem(detailRes.data.data);
          })
          .catch((err) => {
            if (err.response?.status === 403) {
              setLocked(true);
              setItem(match); // partial content from public endpoint
            } else {
              toast.error("Gagal memuat materi");
              router.push(`/kurikulum/${category}`);
            }
          })
          .finally(() => setLoading(false));
      })
      .catch(() => {
        toast.error("Gagal memuat daftar materi");
        router.push("/kurikulum");
      });
  }, [category, level]);

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-4">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-10 w-72 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!item) return null;

  const modeAction = MODE_ICONS[item.mode] || MODE_ICONS.solo;
  const catName = CATEGORY_LABELS[category] || category;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
        <button onClick={() => router.push(`/kurikulum/${category}`)} className="text-xs text-muted-foreground hover:text-foreground mb-2 block">
          &larr; {catName}
        </button>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{catName}</span>
            <span>·</span>
            <span>Level {item.level_number}</span>
            {item.access !== "free" && (
              <>
                <span>·</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  item.access === "premium" ? "bg-purple-500/10 text-purple-500" : "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {item.access === "premium" ? "Premium" : "Giat"}
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{item.title}</h1>

          {item.author && (
            <p className="text-sm text-muted-foreground">— {item.author}</p>
          )}

          {/* Action button */}
          {item.url && !locked && (
            <Link
              href={item.url}
              target={item.url.startsWith("http") ? "_blank" : undefined}
              rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors items-center gap-2"
            >
              <span>{modeAction.icon}</span>
              {modeAction.label}
            </Link>
          )}
        </div>

        {/* Content */}
        <div className={`relative ${locked ? "" : ""}`}>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {item.content || item.description || ""}
            </ReactMarkdown>
          </div>

          {locked && (
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-10">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  {item.access === "premium"
                    ? "Level ini hanya untuk member Premium"
                    : "Level ini hanya untuk member Giat"}
                </p>
                <button
                  onClick={() => router.push("/langganan")}
                  className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Lihat Plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <div>
            {levelNum > 1 ? (
              <Link
                href={`/kurikulum/${category}/${levelNum - 1}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
                Level Sebelumnya
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted-foreground/30">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
                Level Sebelumnya
              </span>
            )}
          </div>
          <div>
            {levelNum < 5 ? (
              <Link
                href={`/kurikulum/${category}/${levelNum + 1}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Level Selanjutnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted-foreground/30">
                Level Selanjutnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
