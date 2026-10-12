import {
  TrendingUp,
  TrendingDown,
  Gauge,
  GraduationCap,
  Target,
  Sparkles,
  Award,
  BookOpen,
  Clock,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  gauge: Gauge,
  graduation: GraduationCap,
  target: Target,
  sparkles: Sparkles,
  award: Award,
  book: BookOpen,
  clock: Clock,
  flame: Flame,
} as const;

export type StatCardProps = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: keyof typeof icons;
  progress?: number;
  badge?: string;
  accentColor?: "primary" | "cyan" | "violet" | "success" | "warning";
};

export function StatCard({
  label,
  value,
  delta,
  trend,
  icon,
  progress,
  badge,
  accentColor = "primary",
}: StatCardProps) {
  const Icon = icons[icon] || Gauge;
  const Trend = trend === "up" ? TrendingUp : TrendingDown;

  const accentBorderMap = {
    primary: "from-primary via-primary/60 to-transparent",
    cyan: "from-cyan via-cyan/60 to-transparent",
    violet: "from-violet via-violet/60 to-transparent",
    success: "from-success via-success/60 to-transparent",
    warning: "from-warning via-warning/60 to-transparent",
  };

  const iconBgMap = {
    primary: "bg-primary/10 text-primary border-primary/20",
    cyan: "bg-cyan/15 text-cyan border-cyan/25",
    violet: "bg-violet/15 text-violet border-violet/25",
    success: "bg-success/15 text-success border-success/25",
    warning: "bg-warning/15 text-warning border-warning/25",
  };

  return (
    <div className="card-surface group relative flex flex-col justify-between overflow-hidden p-5.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      {/* Top accent line */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          accentBorderMap[accentColor],
        )}
      />

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <span
            className={cn(
              "grid size-9.5 shrink-0 place-items-center rounded-xl border transition-transform duration-200 group-hover:scale-105",
              iconBgMap[accentColor],
            )}
          >
            <Icon className="size-4.5" />
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          <p className="font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {badge && (
            <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        {typeof progress === "number" && (
          <div className="mb-2.5 space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>Target Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold",
              trend === "up" ? "text-success" : "text-warning",
            )}
          >
            <Trend className="size-3.5" />
            <span>{delta}</span>
          </p>
          <span className="text-[11px] text-muted-foreground/80">vs prev cycle</span>
        </div>
      </div>
    </div>
  );
}
