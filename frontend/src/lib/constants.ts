// ELO rank thresholds — used on Profile page
export const ELO_RANKS = [
  { label: "Bronze",   min: 0,    max: 1199, color: "#cd7f32", bg: "bg-[#cd7f32]/10", border: "border-[#cd7f32]/30", text: "text-[#cd7f32]" },
  { label: "Silver",   min: 1200, max: 1399, color: "#94a3b8", bg: "bg-slate-500/10",  border: "border-slate-500/30",  text: "text-slate-400"  },
  { label: "Gold",     min: 1400, max: 1599, color: "#f59e0b", bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-400"  },
  { label: "Platinum", min: 1600, max: 1849, color: "#67e8f9", bg: "bg-cyan-400/10",   border: "border-cyan-400/30",   text: "text-cyan-400"   },
  { label: "Diamond",  min: 1850, max: Infinity, color: "#818cf8", bg: "bg-indigo-400/10", border: "border-indigo-400/30", text: "text-indigo-400" },
] as const;

export type RankTier = (typeof ELO_RANKS)[number];

export function getRank(elo: number): RankTier {
  return ELO_RANKS.find((r) => elo >= r.min && elo <= r.max) ?? ELO_RANKS[0];
}

// Human-readable skill category labels
export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN:            "System Design",
  TECHNICAL_COMMUNICATION:  "Technical Communication",
  DEBUGGING:                "Debugging",
  NEGOTIATION:              "Negotiation",
  STAKEHOLDER_MANAGEMENT:   "Stakeholder Management",
  MENTORING:                "Mentoring",
  INTERVIEW_PREP:           "Interview Prep",
};

export const MAX_ELO_DISPLAY = 2000; // cap for progress bar width

// Fallback curriculum shown when API returns no data
export const FALLBACK_CURRICULUM = [
  { id: "fc-1", title: "freeCodeCamp", description: "Platform belajar coding gratis dengan ribuan tutorial interaktif dan sertifikasi di berbagai bidang teknologi.", type: "course", category: "general", url: "https://www.freecodecamp.org/", author: "freeCodeCamp", icon: "🆓" },
  { id: "fc-2", title: "Harvard CS50", description: "Kursus ilmu komputer terbaik dari Harvard University — pengantar fundamental pemrograman dan computer science.", type: "course", category: "general", url: "https://cs50.harvard.edu/", author: "Harvard University", icon: "🎓" },
  { id: "fc-3", title: "MDN Web Docs", description: "Dokumentasi web terlengkap dari Mozilla — HTML, CSS, JavaScript, API Web, dan panduan belajar untuk semua level.", type: "blog", category: "frontend", url: "https://developer.mozilla.org/", author: "Mozilla", icon: "📖" },
  { id: "fc-4", title: "The Odin Project", description: "Kurikulum full-stack developer open-source yang mencakup frontend (React) dan backend (Node.js, Ruby on Rails).", type: "course", category: "fullstack", url: "https://www.theodinproject.com/", author: "The Odin Project", icon: "🌐" },
  { id: "fc-5", title: "Web Dev Simplified", description: "Channel YouTube yang menjelaskan konsep web development kompleks dengan visualisasi dan animasi yang mudah dipahami.", type: "video", category: "general", url: "https://www.youtube.com/@WebDevSimplified", author: "Kyle Cook", icon: "🎬" },
  { id: "fc-6", title: "Traversy Media", description: "Channel YouTube dengan ratusan tutorial coding — dari HTML/CSS dasar sampai full-stack dengan framework modern.", type: "video", category: "fullstack", url: "https://www.youtube.com/@TraversyMedia", author: "Brad Traversy", icon: "🎬" },
  { id: "fc-7", title: "Fireship", description: "Video singkat padat tentang teknologi terbaru, code concepts, dan framework review dengan gaya cepat nan menghibur.", type: "video", category: "general", url: "https://www.youtube.com/@Fireship", author: "Jeff Delaney", icon: "🔥" },
  { id: "fc-8", title: "Google WebDev", description: "Panduan resmi dari Google untuk membuat website modern yang cepat, accessible, dan mobile-friendly.", type: "blog", category: "frontend", url: "https://web.dev/", author: "Google", icon: "📖" },
  { id: "fc-9", title: "Refactoring Guru", description: "Katalog design pattern lengkap dengan contoh kode dalam berbagai bahasa pemrograman dan ilustrasi interaktif.", type: "blog", category: "architecture", url: "https://refactoring.guru/", author: "Refactoring Guru", icon: "📖" },
  { id: "fc-10", title: "Martin Fowler", description: "Blog dan artikel tentang arsitektur perangkat lunak, refactoring, dan praktik terbaik pengembangan dari pakar industri.", type: "blog", category: "architecture", url: "https://martinfowler.com/", author: "Martin Fowler", icon: "🏗️" },
  { id: "fc-11", title: "System Design Primer", description: "Repository GitHub yang mencakup fundamental system design — scalability, load balancing, caching, dan database design.", type: "blog", category: "architecture", url: "https://github.com/donnemartin/system-design-primer", author: "Donne Martin", icon: "🏗️" },
  { id: "fc-12", title: "Coding Interview University", description: "Kurikulum belajar multi-bulan untuk menjadi software engineer dengan mempelajari computer science secara terstruktur.", type: "course", category: "general", url: "https://github.com/jwasham/coding-interview-university", author: "John Washam", icon: "🎓" },
];

