"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface LearningResourcesProps {
  category: string;
  difficulty: string;
}

const RESOURCES_BY_CATEGORY: Record<string, { title: string; url: string; type: "video" | "article" | "course"; desc: string }[]> = {
  debugging: [
    { title: "freeCodeCamp Debugging Tutorial", url: "https://www.freecodecamp.org/news/tag/debugging/", type: "article", desc: "Kumpulan artikel debugging dari freeCodeCamp" },
    { title: "Chrome DevTools Debugging Guide", url: "https://developer.chrome.com/docs/devtools/javascript/", type: "article", desc: "Cara debug JavaScript di browser" },
    { title: "Node.js Debugging Guide", url: "https://nodejs.org/en/docs/guides/debugging-getting-started/", type: "article", desc: "Debugging aplikasi Node.js" },
    { title: "Rubber Duck Debugging", url: "https://rubberduckdebugging.com/", type: "article", desc: "Teknik debugging dengan menjelaskan kode ke bebek karet" },
  ],
  "technical-communication": [
    { title: "How to Ask Good Technical Questions", url: "https://stackoverflow.com/help/how-to-ask", type: "article", desc: "Panduan Stack Overflow untuk bertanya" },
    { title: "Non-Violent Communication in Tech", url: "https://www.freecodecamp.org/news/non-violent-communication-for-engineers/", type: "article", desc: "Komunikasi efektif untuk engineer" },
    { title: "Remote Communication Best Practices", url: "https://www.notion.so/blog/remote-communication", type: "article", desc: "Tips komunikasi remote" },
    { title: "The Art of Code Review", url: "https://google.github.io/eng-practices/review/reviewer/", type: "article", desc: "Panduan code review dari Google" },
  ],
  architecture: [
    { title: "System Design Fundamentals (freeCodeCamp)", url: "https://www.youtube.com/watch?v=o7BGd7K8MYQ", type: "video", desc: "Video gratis 2 jam tentang system design" },
    { title: "Martin Fowler - Microservices", url: "https://martinfowler.com/articles/microservices.html", type: "article", desc: "Artikel klasik tentang microservices" },
    { title: "DDD Bounded Context", url: "https://martinfowler.com/bliki/BoundedContext.html", type: "article", desc: "Domain-Driven Design fundamentals" },
    { title: "Strangler Fig Pattern", url: "https://martinfowler.com/bliki/StranglerFigApplication.html", type: "article", desc: "Pattern untuk refactor legacy system" },
  ],
  "interview-prep": [
    { title: "freeCodeCamp Coding Interview Prep", url: "https://www.freecodecamp.org/learn/coding-interview-prep/", type: "course", desc: "Kursus gratis persiapan interview" },
    { title: "System Design Interview (YouTube)", url: "https://www.youtube.com/watch?v=UzLhG7qBmhA", type: "video", desc: "System design interview walkthrough" },
    { title: "Big O Cheatsheet", url: "https://www.bigocheatsheet.com/", type: "article", desc: "Referensi kompleksitas algoritma" },
    { title: "STAR Method for Interviews", url: "https://www.themuse.com/advice/star-interview-method", type: "article", desc: "Cara menjawab behavioral questions" },
  ],
  negotiation: [
    { title: "BATNA Negotiation Framework", url: "https://www.pon.harvard.edu/daily/batna/", type: "article", desc: "Framework negosiasi dari Harvard" },
    { title: "Salary Negotiation Guide", url: "https://www.levels.fyi/blog/salary-negotiation.html", type: "article", desc: "Panduan negosiasi gaji untuk engineer" },
  ],
  "stakeholder-management": [
    { title: "Managing Up Guide (Atlassian)", url: "https://www.atlassian.com/work-management/project-management/managing-up", type: "article", desc: "Komunikasi dengan stakeholder" },
    { title: "How to Estimate Projects", url: "https://basecamp.com/shapeup", type: "article", desc: "Cara estimasi proyek realistis" },
  ],
  "career-growth": [
    { title: "Engineering Career Ladders", url: "https://www.progression.fyi/", type: "article", desc: "Referensi jenjang karir engineer" },
    { title: "HBR - How to Ask for a Promotion", url: "https://hbr.org/2018/01/how-to-ask-for-a-promotion", type: "article", desc: "Cara minta promosi secara profesional" },
    { title: "freeCodeCamp Career Advice", url: "https://www.freecodecamp.org/news/tag/career/", type: "article", desc: "Kumpulan artikel karir untuk developer" },
  ],
};

const GENERAL_RESOURCES = [
  { title: "The Odin Project - Full Stack Curriculum", url: "https://www.theodinproject.com/", type: "course" as const, desc: "Kurikulum full-stack gratis & open source" },
  { title: "freeCodeCamp YouTube", url: "https://www.youtube.com/c/Freecodecamp", type: "video" as const, desc: "Ratusan video coding gratis" },
  { title: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/", type: "article" as const, desc: "Dokumentasi web terbaik dari Mozilla" },
  { title: "Harvard CS50 (YouTube)", url: "https://www.youtube.com/c/cs50", type: "video" as const, desc: "Kuliah computer science Harvard gratis" },
  { title: "Web Dev Simplified (YouTube)", url: "https://www.youtube.com/c/WebDevSimplified", type: "video" as const, desc: "Tutorial web development singkat & padat" },
  { title: "Decomplex (YouTube)", url: "https://www.youtube.com/c/Decomplexify", type: "video" as const, desc: "Explanasi konsep coding visual" },
];

export function LearningResources({ category, difficulty }: LearningResourcesProps) {
  const categoryResources = RESOURCES_BY_CATEGORY[category] ?? [];
  const allResources = difficulty === "beginner"
    ? [...categoryResources, ...GENERAL_RESOURCES]
    : categoryResources;

  if (allResources.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📖 Belajar Lebih Lanjut</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sumber belajar gratis &amp; open source untuk mengembangkan skill kamu
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryResources.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Rekomendasi untuk kategori ini
            </p>
            <ul className="space-y-2">
              {categoryResources.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                  >
                    <span className="text-lg shrink-0 mt-0.5">
                      {link.type === "video" ? "🎬" : link.type === "course" ? "🎓" : "📄"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-foreground truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
                    </div>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1"
                    >
                      <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {difficulty === "beginner" && categoryResources.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Sumber Umum untuk Pemula
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GENERAL_RESOURCES.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-md border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group text-sm"
                >
                  <span className="text-base shrink-0">
                    {link.type === "video" ? "🎬" : link.type === "course" ? "🎓" : "📄"}
                  </span>
                  <span className="truncate group-hover:text-foreground">{link.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {difficulty === "beginner" && categoryResources.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GENERAL_RESOURCES.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-md border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group text-sm"
              >
                <span className="text-base shrink-0">
                  {link.type === "video" ? "🎬" : link.type === "course" ? "🎓" : "📄"}
                </span>
                <span className="truncate group-hover:text-foreground">{link.title}</span>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
