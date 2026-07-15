"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface CurriculumItem {
  id: string;
  title: string;
  description: string;
  type: "blog" | "video" | "course";
  url: string;
  category: string | null;
  author: string | null;
}

const FALLBACK: CurriculumItem[] = [
  { id: "1", title: "freeCodeCamp", description: "Ratusan video coding gratis dari pemula sampai mahir", type: "video", url: "https://www.youtube.com/c/Freecodecamp", category: "general", author: "freeCodeCamp" },
  { id: "2", title: "Harvard CS50", description: "Kuliah Computer Science Harvard — gratis", type: "course", url: "https://www.youtube.com/c/cs50", category: "general", author: "Harvard" },
  { id: "3", title: "Web Dev Simplified", description: "Tutorial web development singkat & padat", type: "video", url: "https://www.youtube.com/c/WebDevSimplified", category: "frontend", author: "Kyle" },
  { id: "4", title: "The Odin Project", description: "Kurikulum full-stack gratis & open source", type: "course", url: "https://www.theodinproject.com/", category: "fullstack", author: null },
  { id: "5", title: "MDN Web Docs", description: "Dokumentasi web terlengkap dari Mozilla", type: "blog", url: "https://developer.mozilla.org/en-US/", category: "general", author: "Mozilla" },
  { id: "6", title: "System Design Interview", description: "Video system design walkthrough gratis", type: "video", url: "https://www.youtube.com/watch?v=UzLhG7qBmhA", category: "architecture", author: null },
  { id: "7", title: "Decomplex", description: "Explanasi konsep coding secara visual", type: "video", url: "https://www.youtube.com/c/Decomplexify", category: "general", author: null },
  { id: "8", title: "Big O Cheatsheet", description: "Referensi kompleksitas algoritma", type: "blog", url: "https://www.bigocheatsheet.com/", category: "algorithms", author: null },
  { id: "9", title: "How to Ask Good Questions", description: "Panduan Stack Overflow untuk bertanya teknis", type: "blog", url: "https://stackoverflow.com/help/how-to-ask", category: "communication", author: "Stack Overflow" },
  { id: "10", title: "Martin Fowler — Bliki", description: "Artikel arsitektur & refactoring dari Martin Fowler", type: "blog", url: "https://martinfowler.com/bliki/", category: "architecture", author: "Martin Fowler" },
  { id: "11", title: "SQL Tutorial (freeCodeCamp)", description: "Belajar SQL dari dasar", type: "video", url: "https://www.youtube.com/watch?v=HXV3zeQKqGY", category: "data", author: "freeCodeCamp" },
  { id: "12", title: "Google Engineering Practices", description: "Panduan code review & best practices dari Google", type: "blog", url: "https://google.github.io/eng-practices/", category: "engineering", author: "Google" },
];

const CATEGORIES = [
  { key: "all", label: "Semua" },
  { key: "general", label: "Umum" },
  { key: "frontend", label: "Frontend" },
  { key: "fullstack", label: "Full Stack" },
  { key: "architecture", label: "Arsitektur" },
  { key: "algorithms", label: "Algoritma" },
  { key: "data", label: "Data" },
  { key: "engineering", label: "Engineering" },
  { key: "communication", label: "Komunikasi" },
];

export default function CurriculumPage() {
  const router = useRouter();
  const [items, setItems] = useState<CurriculumItem[]>(FALLBACK);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "blog" | "course">("all");

  useEffect(() => {
    api.get("/api/admin/curriculum/public").then((res) => {
      const data = res.data?.data ?? [];
      if (data.length > 0) setItems(data);
    }).catch(() => {});
  }, []);

  const filtered = items.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-xs text-muted-foreground hover:text-foreground mb-2 block">&larr; Kembali</button>
          <h1 className="text-2xl font-bold tracking-tight">📖 Kurikulum Belajar</h1>
          <p className="text-sm text-muted-foreground mt-1">Koleksi sumber belajar open source & gratis untuk developer</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              filter === cat.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/40"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 pb-2">
        {(["all", "video", "blog", "course"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 text-[10px] rounded-md border transition-colors uppercase tracking-wider font-medium ${
              typeFilter === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/40 text-muted-foreground"
            }`}
          >
            {t === "all" ? "Semua" : t === "video" ? "🎬 Video" : t === "blog" ? "📄 Artikel" : "🎓 Kursus"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => (
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

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Tidak ada sumber belajar untuk filter ini.</p>
        </div>
      )}
    </div>
  );
}
