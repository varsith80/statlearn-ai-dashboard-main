import { ArrowRight } from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";
import { Button } from "@/components/ui/button";
import { skillGaps } from "@/data/mock";

export function SkillGapTable({ rows = skillGaps }: { rows?: typeof skillGaps }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {[
              "Competency",
              "Current Level",
              "Required Level",
              "Gap",
              "Priority",
              "Recommended Action",
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
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.competency}
              className="border-b border-border/70 last:border-0 transition-colors hover:bg-muted/50"
            >
              <td className="px-5 py-4 font-medium">{row.competency}</td>
              <td className="px-5 py-4 text-muted-foreground">{row.current}</td>
              <td className="px-5 py-4 text-muted-foreground">{row.required}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-brand"
                      style={{ width: `${Math.min(row.gap * 2, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums">{row.gap}%</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <PriorityBadge priority={row.priority} />
              </td>
              <td className="px-5 py-4">
                <Button
                  variant={row.action === "Start Training" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                >
                  {row.action}
                  <ArrowRight className="size-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
