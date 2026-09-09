import { Clock, Layers, Sparkles, PlayCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Course } from "@/data/mock";

export function RecommendationCard({ course }: { course: Course }) {
  return (
    <article className="card-surface flex h-full flex-col p-5 transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {course.category}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-violet/30 bg-violet/10 px-2 py-0.5 text-[11px] font-semibold text-violet">
          <Sparkles className="size-3" />
          {course.match}% match
        </span>
      </div>

      <h3 className="mt-3 font-display text-base font-semibold leading-snug">{course.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {course.summary}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3.5" />
          <span>{course.level}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          <span>{course.duration}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <PlayCircle className="size-3.5" />
          <span>{course.modules} modules</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Building2 className="size-3.5" />
          <span className="truncate">{course.provider}</span>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums">{course.progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-brand"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      <Button className="mt-5 w-full">
        {course.progress > 0 ? "Continue Learning" : "Start Learning"}
      </Button>
    </article>
  );
}
