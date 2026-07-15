"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CircularScore, CriteriaBar } from "@/components/debrief/ScoreDisplay";
import { formatDuration, formatCategory } from "@/lib/utils";

interface AiFeedback {
  score: number;
  criteria?: Record<string, number>;
  detectedSkills?: string[];
  improvements?: string[];
  secretObjectiveMet?: boolean;
  summary?: string;
}

interface ResourceLink {
  title: string;
  url: string;
}

interface PeerRating {
  rating: number;
  positive_feedback?: string;
  improvement_feedback?: string;
  created_at: string;
}

export interface DebriefContentData {
  sessionId: string;
  scenarioTitle: string;
  mode: string;
  category: string;
  difficulty: string;
  startedAt: string;
  endedAt: string;
  myRole?: string;
  myScore: number | null;
  myFeedback: AiFeedback | null;
  aiCriteria?: Record<string, number | string> | null;
  resourceLinks: ResourceLink[] | null;
  peerRatings: PeerRating[];
}

// formatDuration and formatCategory imported from @/lib/utils

function AIScoreSection({ feedback, score }: { feedback: AiFeedback; score: number }) {
  const criteriaEntries = Object.entries(feedback.criteria ?? {});

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4">
        <CircularScore score={score} />
        {feedback.summary && (
          <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed italic">
            &ldquo;{feedback.summary}&rdquo;
          </p>
        )}
        {feedback.secretObjectiveMet && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold">
            🏆 Secret Objective Tercapai! <span className="text-xs opacity-70">+10</span>
          </div>
        )}
      </div>

      {criteriaEntries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Breakdown Kriteria</h3>
          <div className="space-y-3">
            {criteriaEntries.map(([name, val]) => (
              <CriteriaBar key={name} name={name} score={typeof val === "number" ? val : Number(val)} />
            ))}
          </div>
        </div>
      )}

      {feedback.detectedSkills && feedback.detectedSkills.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skill Terdeteksi</h3>
          <div className="flex flex-wrap gap-2">
            {feedback.detectedSkills.map((skill) => (
              <Badge key={skill} variant="success" className="text-xs">
                ✓ {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {feedback.improvements && feedback.improvements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Area Peningkatan</h3>
          <ul className="space-y-2">
            {feedback.improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface DebriefContentProps {
  data: DebriefContentData;
}

export function DebriefContent({ data }: DebriefContentProps) {
  const isScored = data.myScore !== null && data.myScore !== undefined;
  const score = data.myScore ?? 0;
  const resourceLinks: ResourceLink[] = Array.isArray(data.resourceLinks) ? data.resourceLinks : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Hasil Sesi</p>
        <h1 className="text-2xl font-bold tracking-tight">{data.scenarioTitle}</h1>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Badge variant="secondary" className="capitalize">
            {data.mode === "duel" ? "⚔️ Duel" : "🤝 Co-op"}
          </Badge>
          <Badge variant="outline" className="capitalize">{formatCategory(data.category)}</Badge>
          <Badge
            variant={
              data.difficulty === "beginner"
                ? "success"
                : data.difficulty === "intermediate"
                  ? "warning"
                  : "destructive"
            }
            className="capitalize"
          >
            {data.difficulty}
          </Badge>
          {data.startedAt && data.endedAt && (
            <Badge variant="secondary">⏱ {formatDuration(data.startedAt, data.endedAt)}</Badge>
          )}
        </div>
      </div>

      {/* AI Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Penilaian AI</CardTitle>
        </CardHeader>
        <CardContent>
          {!isScored ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Belum ada penilaian untuk sesi ini.
            </div>
          ) : (
            <AIScoreSection feedback={data.myFeedback ?? { score }} score={score} />
          )}
        </CardContent>
      </Card>

      {/* Resource Links */}
      {resourceLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📚 Materi Terkait</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resourceLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-md border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-foreground">{link.title}</span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    >
                      <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Peer Ratings (read-only) */}
      {data.peerRatings && data.peerRatings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⭐ Rating dari Partner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.peerRatings.map((r, i) => (
              <div key={i} className="space-y-2 p-3 rounded-md bg-muted/30 border border-border">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      width="18" height="18" viewBox="0 0 24 24"
                      fill={star <= r.rating ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={star <= r.rating ? "text-amber-400" : "text-muted-foreground/30"}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                {r.positive_feedback && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Positif: </span>{r.positive_feedback}
                  </p>
                )}
                {r.improvement_feedback && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Perbaikan: </span>{r.improvement_feedback}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
