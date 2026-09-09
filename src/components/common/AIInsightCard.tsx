import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIInsightCard({
  title = "AI Learning Insight",
  insight,
  items,
  className,
}: {
  title?: string;
  insight?: string;
  items?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-gradient-ai p-4 shadow-card sm:p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-gradient-brand">
          <Sparkles className="size-4 text-primary-foreground" />
        </span>
        <p className="font-display text-sm font-semibold">{title}</p>
        <span className="ml-auto rounded-full border border-border bg-card/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          AI generated
        </span>
      </div>
      {insight && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{insight}</p>
      )}
      {items && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
