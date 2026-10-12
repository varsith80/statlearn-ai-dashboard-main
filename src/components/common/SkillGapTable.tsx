import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Filter, ShieldAlert } from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";
import { Button } from "@/components/ui/button";
import { skillGaps as defaultSkillGaps, Priority } from "@/data/mock";
import { PRELOADED_NOTES, stageDocumentForQuiz } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";

export function SkillGapTable({ rows = defaultSkillGaps }: { rows?: typeof defaultSkillGaps }) {
  const [filter, setFilter] = useState<"All" | Priority>("All");

  const filtered = filter === "All" ? rows : rows.filter((r) => r.priority === filter);

  const priorityCounts = {
    Critical: rows.filter((r) => r.priority === "Critical").length,
    High: rows.filter((r) => r.priority === "High").length,
    Medium: rows.filter((r) => r.priority === "Medium").length,
    Low: rows.filter((r) => r.priority === "Low").length,
  };

  return (
    <div className="w-full">
      {/* Priority Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 bg-muted/20">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Filter className="size-3.5" />
          <span>Filter Priority:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["All", "Critical", "High", "Medium", "Low"] as const).map((p) => {
            const isSelected = filter === p;
            const count = p === "All" ? rows.length : priorityCounts[p];
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <span>{p}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-left">
              {[
                "Competency Domain",
                "Current Level",
                "Target Level",
                "Deficiency Gap",
                "Priority Level",
                "Action Pathway",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((row) => (
              <tr key={row.competency} className="group transition-colors hover:bg-muted/40">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {row.competency}
                    </span>
                    {row.priority === "Critical" && (
                      <span className="flex items-center gap-1 rounded bg-critical/10 px-1.5 py-0.5 text-[10px] font-bold text-critical">
                        <ShieldAlert className="size-3" /> Urgent
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-md border border-border/70 bg-card px-2 py-0.5 text-xs text-muted-foreground font-medium">
                    {row.current}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs text-primary font-semibold">
                    {row.required}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          row.gap >= 30
                            ? "bg-critical"
                            : row.gap >= 20
                              ? "bg-warning"
                              : "bg-success",
                        )}
                        style={{ width: `${Math.min(row.gap * 2.2, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {row.gap}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <PriorityBadge priority={row.priority} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant={row.action === "Start Training" ? "default" : "outline"}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                    >
                      <Link to="/recommendations">
                        {row.action}
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-primary hover:bg-primary/10"
                      title="Generate assessment targeting this gap"
                      onClick={() => {
                        const matchedNote =
                          PRELOADED_NOTES.find((n) =>
                            n.suggestedCompetencies.some((c) =>
                              row.competency
                                .toLowerCase()
                                .includes(c.toLowerCase().split(" ")[0] || ""),
                            ),
                          ) || PRELOADED_NOTES[0];
                        stageDocumentForQuiz(matchedNote);
                      }}
                    >
                      <Link to="/quiz-generator">
                        <Sparkles className="size-3 text-violet" />
                        Assess
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

