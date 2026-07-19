"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface BriefingPanelProps {
  role: string;
  scenarioTitle: string;
  briefing: string;
  mode: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  role_a: "Peran A",
  role_b: "Peran B",
};

export function BriefingPanel({
  role,
  scenarioTitle,
  briefing,
  mode,
  isCollapsed = false,
  onToggle,
}: BriefingPanelProps) {
  return (
    <div className={cn(
      "flex flex-col border-r border-border bg-background/60 backdrop-blur transition-all duration-300",
      isCollapsed ? "w-12" : "w-80"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border min-h-[57px]">
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant={mode === "duel" ? "destructive" : "info"} className="shrink-0 text-[10px]">
              {mode === "duel" ? "⚔️ Duel" : "🤝 Co-op"}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground truncate">{ROLE_LABELS[role] ?? role}</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
          title={isCollapsed ? "Expand briefing" : "Collapse briefing"}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={cn("transition-transform duration-300", isCollapsed ? "rotate-180" : "")}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Scenario title */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Skenario</p>
            <h3 className="text-sm font-semibold leading-snug">{scenarioTitle}</h3>
          </div>

          {/* Briefing */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Briefing Peran Anda</p>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-secondary/30 rounded-md p-3 border border-border">
              {briefing}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground italic pt-2">
            * Jangan bocorkan detail briefing kamu ke lawan!
          </p>
        </div>
      )}

      {isCollapsed && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-muted-foreground text-xs [writing-mode:vertical-lr] rotate-180 tracking-widest uppercase">
            Briefing
          </span>
        </div>
      )}
    </div>
  );
}
