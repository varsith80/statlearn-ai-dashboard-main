import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Sparkles } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { CompetencyChart } from "@/components/common/CompetencyChart";
import { SkillGapTable } from "@/components/common/SkillGapTable";
import { AIInsightCard } from "@/components/common/AIInsightCard";
import { Button } from "@/components/ui/button";
import { useQuizResultsStore, useUserStore } from "@/lib/quiz-store";
import { toast } from "sonner";

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
  const { competencyRadar, results } = useQuizResultsStore();
  const { userProfile } = useUserStore();
  const latestQuiz = results[0];

  const insightText = latestQuiz
    ? `Your latest assessment on "${latestQuiz.materialName}" scored ${latestQuiz.percentage}%. The AI has calibrated your competency radar. Keep practicing in your priority gap domains to reach Advanced certification.`
    : "Your strongest area is Data Visualization. Advanced Statistical Modelling and Data Quality require further development to meet the Advanced benchmark before the Q4 review.";

  const handleExportReport = () => {
    const avg = Math.round(
      competencyRadar.reduce((acc, c) => acc + c.score, 0) / competencyRadar.length,
    );
    const report = `# MoSPI Competency Framework v3.2 — Officer Assessment Dossier\n\n- **Officer:** ${userProfile.name} (${userProfile.role})\n- **Cadre & Employee ID:** ${userProfile.cadre} · ${userProfile.employeeId}\n- **Division:** ${userProfile.office}\n- **Overall Proficiency Index:** ${avg}%\n- **Assessments Completed:** ${results.length}\n\n## Domain Breakdown vs Role Benchmark\n${competencyRadar.map((c) => `- **${c.area}**: ${c.score}% (Role Benchmark: ${c.benchmark}%, Delta: ${c.score - c.benchmark >= 0 ? "+" : ""}${c.score - c.benchmark}%)`).join("\n")}\n\n## AI Executive Diagnostic\n${insightText}\n`;

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MoSPI-Competency-Report-${userProfile.employeeId.replace(/\//g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported official MoSPI Competency Dossier.");
  };

  return (
    <>
      <PageHeader
        eyebrow="Competency Framework v3.2"
        title="Competency Analysis"
        subtitle="Your assessed proficiency across six statistical competency domains, updated dynamically as you complete AI assessments."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportReport} className="gap-2">
              <Download className="size-4" /> Export Dossier
            </Button>
            <Button asChild className="gap-2">
              <Link to="/quiz-generator">
                <Sparkles className="size-4" /> Start AI Assessment
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Competency Profile" description="Your score vs role benchmark">
            <CompetencyChart height={380} data={competencyRadar} />
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
          <AIInsightCard insight={insightText} />
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
