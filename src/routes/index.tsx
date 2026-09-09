import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck, Landmark, RefreshCw, Sparkles } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { AIInsightCard } from "@/components/common/AIInsightCard";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { SkillGapTable } from "@/components/common/SkillGapTable";
import { CompetencyChart } from "@/components/common/CompetencyChart";
import { RecommendationCard } from "@/components/common/RecommendationCard";
import { StatusPill } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { kpis, recommendations, igotResources, user, aiInsights } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | StatLearn AI — Competency Development for Official Statistics" },
      {
        name: "description",
        content:
          "StatLearn AI dashboard: competency score, AI-identified skill gaps and personalized training for India's Official Statistical System.",
      },
      { property: "og:title", content: "StatLearn AI — Competency Development Dashboard" },
      {
        property: "og:description",
        content:
          "AI-powered competency gap identification and personalized training for statistical officers.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            AI Learning Assistant • Active
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">
            Good Morning, {user.role} 👋
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Continue your learning journey and strengthen your statistical competencies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="size-4" /> Re-run assessment
          </Button>
          <Button asChild className="gap-2">
            <Link to="/recommendations">
              View AI plan <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <StatCard
            key={k.id}
            label={k.label}
            value={k.value}
            delta={k.delta}
            trend={k.trend}
            icon={k.icon as "gauge"}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="Competency Profile"
            description="Assessed against the MoSPI competency framework for Statistical Officers"
            actions={<StatusPill tone="info">Assessment cycle Q3 2026</StatusPill>}
          >
            <CompetencyChart />
            <AIInsightCard
              className="mt-4"
              insight="Your strongest area is Data Visualization. Advanced Statistical Modelling and Data Quality require further development."
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <AIInsightCard title="AI Insights" items={aiInsights} />
          <SectionCard
            title="iGOT Karmayogi"
            description="Government learning ecosystem"
            actions={
              <StatusPill tone="success">
                <CircleCheck className="size-3.5" /> Connected
              </StatusPill>
            }
          >
            <ul className="space-y-3">
              {igotResources.slice(0, 3).map((r) => (
                <li key={r.id} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Landmark className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.ministry} · {r.hours}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Button asChild variant="secondary" className="mt-4 w-full">
              <Link to="/igot">Open iGOT workspace</Link>
            </Button>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="AI-Identified Competency Gaps"
        description="Derived from assessment scores, course history and role requirements"
        padded={false}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/competencies">Full analysis</Link>
          </Button>
        }
      >
        <SkillGapTable />
      </SectionCard>

      <SectionCard
        title="Personalized Learning Recommendations"
        description="Recommended by AI based on your competency profile"
        actions={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-violet" /> Updated 12 min ago
          </span>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.slice(0, 3).map((c) => (
            <RecommendationCard key={c.id} course={c} />
          ))}
        </div>
      </SectionCard>
    </>
  );
}
