import { TrendingUp, TrendingDown, Gauge, GraduationCap, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  gauge: Gauge,
  graduation: GraduationCap,
  target: Target,
  sparkles: Sparkles,
} as const;

export type StatCardProps = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: keyof typeof icons;
};

export function StatCard({ label, value, delta, trend, icon }: StatCardProps) {
  const Icon = icons[icon];
  const Trend = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <div className="card-surface group relative overflow-hidden p-5 transition-shadow hover:shadow-lift">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-brand opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{value}</p>
      <p
        className={cn(
          "mt-2 flex items-center gap-1.5 text-xs font-medium",
          trend === "up" ? "text-success" : "text-warning",
        )}
      >
        <Trend className="size-3.5" />
        <span>{delta}</span>
      </p>
    </div>
  );
}
