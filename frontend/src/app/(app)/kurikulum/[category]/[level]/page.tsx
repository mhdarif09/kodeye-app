"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { MatchmakingModal } from "@/components/lobby/MatchmakingModal";
import { Button } from "@/components/ui/Button";
import { CodeQuestionEditor } from "@/components/quiz/CodeQuestionEditor";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  code?: string;
  language?: string;
}

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
  quiz_questions?: QuizQuestion[] | string | null;
}

const MODE_ICONS: Record<string, { icon: string; label: string; action: string }> = {
  solo: { icon: "🧑‍💻", label: "Mulai Latihan AI", action: "solo" },
  duel: { icon: "⚔️", label: "Cari Lawan Duel", action: "duel" },
  peer: { icon: "👥", label: "Mulai Peer Review", action: "peer" },
  coop: { icon: "🤝", label: "Cari Partner Co-op", action: "coop" },
};

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

const CATEGORY_TO_SKILL: Record<string, string> = {
  "system-design": "architecture",
  debugging: "debugging",
  "interview-prep": "interview-prep",
  "technical-communication": "technical-communication",
  negotiation: "negotiation",
  "stakeholder-management": "stakeholder-management",
};

export default function LevelReaderPage() {
  const { category, level } = useParams<{ category: string; level: string }>();
  const router = useRouter();
  const [item, setItem] = useState<LevelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [matchModal, setMatchModal] = useState(false);
  const [matchMode, setMatchMode] = useState<"duel" | "coop" | "ai">("duel");
  const [aiScenarioId, setAiScenarioId] = useState<string | undefined>();
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResults, setQuizResults] = useState<{ correct: boolean; correctIndex: number }[] | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const levelNum = parseInt(level, 10);

  useEffect(() => {
    if (!category || !level) return;

    api.get("/api/admin/curriculum/public")
      .then((res) => {
        const all: LevelDetail[] = res.data?.data ?? [];
        const match = all.find((i) => i.category === category && i.level_number === levelNum);
        if (!match) {
          toast.error("Materi tidak ditemukan");
          router.push(`/kurikulum/${category}`);
          return;
        }

        api.get(`/api/curriculum/${match.id}`)
          .then((detailRes) => {
            const data = detailRes.data.data;
            setItem(data);
            const raw = data.quiz_questions;
            if (raw) {
              try {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                setQuizQuestions(Array.isArray(parsed) ? parsed : []);
                setQuizAnswers(new Array(Array.isArray(parsed) ? parsed.length : 0).fill(-1));
              } catch {
                setQuizQuestions([]);
              }
            }
          })
          .catch((err) => {
            if (err.response?.status === 403) {
              setLocked(true);
              setItem(match);
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

  const handleAction = async () => {
    if (!item) return;
    const mode = item.mode;

    if (mode === "solo") {
      setMatchMode("ai");
      setAiScenarioId(item.id);
      setMatchModal(true);
    } else if (mode === "duel" || mode === "coop") {
      setMatchMode(mode);
      setShowActions(true);
    }
  };

  const handleCreateInvite = async () => {
    if (!item) return;
    setInviteLoading(true);
    try {
      const res = await api.post("/api/sessions/create-invite", { mode: item.mode, scenarioId: item.id });
      const link = res.data.data.inviteLink;
      await navigator.clipboard.writeText(link);
      toast.success("Link undangan disalin!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal membuat undangan");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!item || submittingQuiz) return;
    setSubmittingQuiz(true);
    try {
      const res = await api.post(`/api/curriculum/${item.id}/submit-quiz`, { answers: quizAnswers });
      const { results, passed, score } = res.data.data;
      setQuizResults(results);
      setQuizSubmitted(true);
      if (passed) {
        toast.success(`🎉 Lulus! Skor: ${score}/${results.length}`);
      } else {
        toast.error(`Skor: ${score}/${results.length}. Coba lagi!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirim jawaban");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleRetryQuiz = () => {
    setQuizAnswers(new Array(quizQuestions.length).fill(-1));
    setQuizResults(null);
    setQuizSubmitted(false);
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-4">
        <div className="h-5 w-24 rounded-lg bg-muted/50 animate-pulse" />
        <div className="h-8 w-64 rounded-lg bg-muted/50 animate-pulse" />
        <div className="h-4 w-full rounded bg-muted/30 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-muted/30 animate-pulse" />
        <div className="h-96 rounded-xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (!item) return null;

  const modeAction = MODE_ICONS[item.mode] || MODE_ICONS.solo;
  const catName = CATEGORY_LABELS[category] || category;

  return (
    <div className="flex-1 overflow-auto pb-8">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Back */}
        <button
          onClick={() => router.push(`/kurikulum/${category}`)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
          {catName}
        </button>

        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/[0.02] to-transparent border border-border/50 p-5 md:p-7">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="bg-muted/50 px-2 py-0.5 rounded-md font-medium">{catName}</span>
              <span className="text-border">·</span>
              <span className="bg-muted/50 px-2 py-0.5 rounded-md font-medium">Level {item.level_number}</span>
              {item.mode !== "solo" && (
                <>
                  <span className="text-border">·</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    item.mode === "duel"
                      ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                      : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  }`}>
                    {item.mode === "duel" ? "⚔️ Duel" : "🤝 Co-op"}
                  </span>
                </>
              )}
              {item.access !== "free" && (
                <>
                  <span className="text-border">·</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    item.access === "premium"
                      ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                    {item.access === "premium" ? "Premium" : "Giat"}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-xl md:text-3xl font-bold tracking-tight leading-tight">{item.title}</h1>

            {item.author && (
              <p className="text-sm text-muted-foreground/70 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {item.author}
              </p>
            )}

            {!locked && (
              <div className="space-y-3">
                {item.mode === "solo" ? (
                  <button
                    onClick={handleAction}
                    disabled={actionLoading}
                    className="inline-flex h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-sm font-bold hover:opacity-90 transition-all duration-300 items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    <span>{actionLoading ? "⏳" : modeAction.icon}</span>
                    {actionLoading ? "Memulai..." : modeAction.label}
                  </button>
                ) : !showActions ? (
                  <button
                    onClick={() => setShowActions(true)}
                    className="inline-flex h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-sm font-bold hover:opacity-90 transition-all items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <span>{modeAction.icon}</span>
                    {modeAction.label}
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setMatchModal(true); }}
                      className="inline-flex h-10 px-5 rounded-xl bg-muted/50 border border-border text-sm font-medium hover:bg-muted/80 transition-all items-center gap-2"
                    >
                      🎲 Cari Lawan Acak
                    </button>
                    <button
                      onClick={handleCreateInvite}
                      disabled={inviteLoading}
                      className="inline-flex h-10 px-5 rounded-xl bg-muted/50 border border-border text-sm font-medium hover:bg-muted/80 transition-all items-center gap-2 disabled:opacity-50"
                    >
                      <span>{inviteLoading ? "⏳" : "🔗"}</span>
                      {inviteLoading ? "Membuat..." : "Undang Teman"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground/90 prose-strong:text-foreground prose-code:text-primary prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-a:text-primary prose-li:text-muted-foreground/90 prose-img:rounded-lg prose-img:max-w-full break-words overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {item.content || item.description || ""}
            </ReactMarkdown>
          </div>

          {locked && (
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background via-background/90 to-transparent flex items-end justify-center pb-10">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl mx-auto">
                  🔒
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {item.access === "premium"
                    ? "Level ini hanya untuk member Premium"
                    : "Level ini hanya untuk member Giat"}
                </p>
                <button
                  onClick={() => router.push("/langganan")}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Lihat Plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quiz */}
        {!locked && quizQuestions.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Kuis Pemahaman</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Jawab pertanyaan berikut untuk menyelesaikan level ini
                </p>
              </div>
              {quizSubmitted && (
                <Button variant="ghost" size="sm" onClick={handleRetryQuiz}>
                  Ulangi
                </Button>
              )}
            </div>

            {quizQuestions.map((q, qIdx) => {
              const result = quizResults?.[qIdx];
              const isCorrect = result?.correct;
              const selected = quizAnswers[qIdx];

              return (
                <div key={qIdx} className="rounded-xl border border-border/50 bg-muted/10 p-4 md:p-5 space-y-4">
                  <p className="text-sm font-medium leading-relaxed">
                    {qIdx + 1}. {q.question}
                  </p>

                  {q.code && (
                    <CodeQuestionEditor
                      value={q.code}
                      onChange={() => {}}
                      language={q.language || "javascript"}
                      readOnly
                    />
                  )}

                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      let classes = "w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-all";
                      if (quizSubmitted) {
                        if (oIdx === result?.correctIndex) {
                          classes += " border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400";
                        } else if (oIdx === selected && !isCorrect) {
                          classes += " border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400";
                        } else {
                          classes += " border-border/30 text-muted-foreground/50";
                        }
                      } else {
                        classes += selected === oIdx
                          ? " border-primary bg-primary/10 text-primary"
                          : " border-border/30 hover:border-border/60 hover:bg-muted/20 cursor-pointer";
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={quizSubmitted}
                          onClick={() => {
                            if (quizSubmitted) return;
                            const next = [...quizAnswers];
                            next[qIdx] = oIdx;
                            setQuizAnswers(next);
                          }}
                          className={classes}
                        >
                          <span className="inline-block w-5 h-5 rounded-full border border-current text-[11px] font-bold text-center leading-5 mr-2 flex-shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
                      isCorrect
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
                      {isCorrect ? "✅ Jawaban benar" : "❌ Jawaban salah"}
                    </div>
                  )}
                </div>
              );
            })}

            {!quizSubmitted && quizAnswers.some((a) => a >= 0) && (
              <Button
                onClick={handleSubmitQuiz}
                isLoading={submittingQuiz}
                className="w-full"
                size="lg"
              >
                Kumpulkan Jawaban
              </Button>
            )}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <div>
            {levelNum > 1 ? (
              <Link
                href={`/kurikulum/${category}/${levelNum - 1}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
                Level Sebelumnya
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
                Level Sebelumnya
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }, (_, i) => i + 1).map((l) => (
              <Link
                key={l}
                href={`/kurikulum/${category}/${l}`}
                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                  l === levelNum
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>

          <div>
            {levelNum < 5 ? (
              <Link
                href={`/kurikulum/${category}/${levelNum + 1}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                Level Selanjutnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground/20">
                Level Selanjutnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </span>
            )}
          </div>
        </div>
      </div>

      <MatchmakingModal
        isOpen={matchModal}
        onClose={() => { setMatchModal(false); setAiScenarioId(undefined); }}
        initialMode={matchMode}
        initialCategory={CATEGORY_TO_SKILL[category] || undefined}
        aiScenarioId={aiScenarioId}
      />
    </div>
  );
}
