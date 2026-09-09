import { cn } from "@/lib/utils";
import type { Priority } from "@/data/mock";

const styles: Record<Priority, string> = {
  Critical: "border-destructive/30 bg-destructive/10 text-destructive",
  High: "border-warning/35 bg-warning/12 text-warning",
  Medium: "border-primary/30 bg-primary/10 text-primary",
  Low: "border-success/30 bg-success/12 text-success",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[priority],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "info" | "warning";
}) {
  const tones = {
    neutral: "border-border bg-muted text-muted-foreground",
    success: "border-success/30 bg-success/12 text-success",
    info: "border-primary/25 bg-primary/10 text-primary",
    warning: "border-warning/35 bg-warning/12 text-warning",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
