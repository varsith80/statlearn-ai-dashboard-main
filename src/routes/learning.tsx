import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Award, Clock, PlayCircle } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { StatusPill } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { myLearning } from "@/data/mock";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "My Learning | StatLearn AI" },
      {
        name: "description",
        content:
          "Track enrolled statistical training courses, module progress and completion certificates.",
      },
      { property: "og:title", content: "My Learning | StatLearn AI" },
      {
        property: "og:description",
        content: "Your enrolled courses and progress across official statistics training.",
      },
    ],
  }),
  component: MyLearning,
});

const tabs = ["In Progress", "Completed", "Not Started"] as const;

function MyLearning() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("In Progress");
  const list = myLearning.filter((c) => c.status === tab);

  const summary = [
    { label: "Courses enrolled", value: myLearning.length, icon: BookOpen },
    { label: "Completed", value: myLearning.filter((c) => c.status === "Completed").length, icon: Award },
    { label: "Learning hours", value: "126h", icon: Clock },
    { label: "Active this week", value: 3, icon: PlayCircle },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Learning workspace"
        title="My Learning"
        subtitle="All training assigned to or selected by you across NSSTA and iGOT Karmayogi."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="card-surface flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              <s.icon className="size-[18px]" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      <SectionCard title={tab} description={`${list.length} courses`}>
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nothing here right now. Explore AI recommendations to enrol in a new course.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{c.title}</h3>
                    <StatusPill tone={c.status === "Completed" ? "success" : "info"}>
                      {c.status}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.category} · {c.nextModule} · Last accessed {c.lastAccessed}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-brand"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums">{c.progress}%</span>
                  </div>
                </div>
                <Button variant={c.status === "Completed" ? "outline" : "default"} className="sm:w-40">
                  {c.status === "Completed"
                    ? "View certificate"
                    : c.status === "Not Started"
                      ? "Start course"
                      : "Resume"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  );
}
