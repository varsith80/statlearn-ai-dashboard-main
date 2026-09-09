import { createFileRoute } from "@tanstack/react-router";
import { Download, RefreshCw } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { CompetencyChart } from "@/components/common/CompetencyChart";
import { SkillGapTable } from "@/components/common/SkillGapTable";
import { AIInsightCard } from "@/components/common/AIInsightCard";
import { Button } from "@/components/ui/button";
import { competencyRadar } from "@/data/mock";

export const Route = createFileRoute("/competencies")({
  head: () => ({
    meta: [
      { title: "Competency Analysis | StatLearn AI" },
      {
        name: "description",
        content:
          "AI competency gap analysis against the MoSPI competency framework for statistical officers.",
      },
      { property: "og:title", content: "Competency Analysis | StatLearn AI" },
      {
        property: "og:description",
        content: "Assess statistical competencies and identify prioritized skill gaps with AI.",
      },
    ],
  }),
  component: Competencies,
});

function Competencies() {
  return (
    <>
      <PageHeader
        eyebrow="Competency Framework v3.2"
        title="Competency Analysis"
        subtitle="Your assessed proficiency across six statistical competency domains, benchmarked against the Statistical Officer role profile."
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="size-4" /> Export report
            </Button>
            <Button className="gap-2">
              <RefreshCw className="size-4" /> Re-run AI assessment
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Competency Profile" description="Your score vs role benchmark">
            <CompetencyChart height={380} />
          </SectionCard>
        </div>
        <div className="space-y-6">
          <SectionCard title="Domain Breakdown" description="Proficiency by competency area">
            <ul className="space-y-4">
              {competencyRadar.map((c) => (
                <li key={c.area}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.area}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {c.score}
                      <span className="text-xs"> / {c.benchmark}</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={
                        "h-full rounded-full " +
                        (c.score >= c.benchmark ? "bg-success" : "bg-gradient-brand")
                      }
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
          <AIInsightCard
            insight="Your strongest area is Data Visualization. Advanced Statistical Modelling and Data Quality require further development to meet the Advanced benchmark before the Q4 review."
          />
        </div>
      </div>

      <SectionCard
        title="AI-Identified Competency Gaps"
        description="Ranked by impact on your role requirements"
        padded={false}
      >
        <SkillGapTable />
      </SectionCard>
    </>
  );
}
