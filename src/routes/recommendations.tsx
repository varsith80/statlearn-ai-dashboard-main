import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { RecommendationCard } from "@/components/common/RecommendationCard";
import { AIInsightCard } from "@/components/common/AIInsightCard";
import { Button } from "@/components/ui/button";
import { recommendations } from "@/data/mock";

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

const filters = ["All", "Statistical Methods", "Data Quality", "Survey Methodology", "Policy & Governance", "Data Visualization"];

function Recommendations() {
  const [active, setActive] = useState("All");
  const list = active === "All" ? recommendations : recommendations.filter((c) => c.category === active);

  return (
    <>
      <PageHeader
        eyebrow="Personalized pathway"
        title="Personalized Learning Recommendations"
        subtitle="Recommended by AI based on your competency profile, completed courses and Statistical Officer role requirements."
      />

      <AIInsightCard
        title="Why these courses"
        insight="Closing your Data Quality (38%) and Statistical Modelling (24%) gaps has the highest projected impact — an estimated +11 points on your overall competency score within one quarter."
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
            <Sparkles className="size-3.5 text-violet" /> Ranked by AI match score
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
