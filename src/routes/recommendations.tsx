import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, BrainCircuit } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { RecommendationCard } from "@/components/common/RecommendationCard";
import { AIInsightCard } from "@/components/common/AIInsightCard";
import { Button } from "@/components/ui/button";
import { recommendations } from "@/data/mock";
import { useQuizResultsStore } from "@/lib/quiz-store";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "AI Training Recommendations | StatLearn AI" },
      {
        name: "description",
        content:
          "Personalized course recommendations generated from your statistical competency profile and role requirements.",
      },
      { property: "og:title", content: "AI Training Recommendations | StatLearn AI" },
      {
        property: "og:description",
        content: "Personalized training pathways for statistical officers, ranked by AI match.",
      },
    ],
  }),
  component: Recommendations,
});

const filters = [
  "All",
  "Statistical Methods",
  "Data Quality",
  "Survey Methodology",
  "Policy & Governance",
  "Data Visualization",
];

function Recommendations() {
  const { results } = useQuizResultsStore();
  const [active, setActive] = useState("All");

  const latestQuiz = results[0];

  // Dynamic ranking: if latest quiz had a low score on a competency, boost courses matching that competency
  const dynamicRecommendations = [...recommendations].sort((a, b) => {
    if (latestQuiz && latestQuiz.percentage < 75) {
      const isTargetA = Object.keys(latestQuiz.competencyImpact).includes(a.category);
      const isTargetB = Object.keys(latestQuiz.competencyImpact).includes(b.category);
      if (isTargetA && !isTargetB) return -1;
      if (!isTargetA && isTargetB) return 1;
    }
    return b.match - a.match;
  });

  const list =
    active === "All"
      ? dynamicRecommendations
      : dynamicRecommendations.filter((c) => c.category === active);

  const dynamicInsight = latestQuiz
    ? `Based on your recent assessment on "${latestQuiz.materialName}" (${latestQuiz.percentage}% score), the AI has updated your training priorities, placing higher emphasis on ${Object.keys(latestQuiz.competencyImpact).join(" and ")}.`
    : "Closing your Data Quality (38%) and Statistical Modelling (24%) gaps has the highest projected impact — an estimated +11 points on your overall competency score within one quarter.";

  return (
    <>
      <PageHeader
        eyebrow="Personalized Pathway"
        title="Personalized Learning Recommendations"
        subtitle="Recommended by AI based on your competency profile, completed quiz assessments, and Statistical Officer role requirements."
      />

      <AIInsightCard
        title={latestQuiz ? "AI Assessment-Driven Recommendation" : "Why these courses"}
        insight={dynamicInsight}
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={active === f ? "default" : "outline"}
            onClick={() => setActive(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <SectionCard
        title="Recommended Courses"
        description={`${list.length} courses matched to your profile`}
        actions={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-violet" /> Ranked by AI match & assessment history
          </span>
        }
      >
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No recommendations in this category yet. The AI assistant refreshes suggestions after
            each assessment.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <RecommendationCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
