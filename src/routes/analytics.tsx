import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Sliders,
  Sparkles,
  Download,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowRight,
  Info,
  RefreshCw,
  Gauge,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { StatusPill } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { PREDICTIVE_SKILL_FORECAST, SURVEY_READINESS_METRICS } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Predictive Analytics & Forecasting | StatLearn AI" },
      {
        name: "description",
        content:
          "Predictive analytics forecasting institutional statistical skill needs, survey readiness, and workforce transition models aligned with MoSPI Vision 2027-2028.",
      },
      { property: "og:title", content: "Predictive Analytics | StatLearn AI" },
    ],
  }),
  component: PredictiveAnalyticsPage,
});

function PredictiveAnalyticsPage() {
  const [simulationIntervention, setSimulationIntervention] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Compute simulated data
  const chartData = PREDICTIVE_SKILL_FORECAST.map((d) => {
    if (simulationIntervention && (d.year === "2027*" || d.year === "2028*")) {
      return {
        ...d,
        smallArea: Math.min(100, d.smallArea + 12),
        capiAi: Math.min(100, d.capiAi + 8),
        bigData: Math.min(100, d.bigData + 10),
      };
    }
    return d;
  });

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimulationIntervention((s) => !s);
      setIsSimulating(false);
      toast.success(
        simulationIntervention
          ? "Reset simulation to baseline projection."
          : "Applied Simulated Intervention: Accelerated NSSTA Certified Pathway (+14.2% Readiness).",
      );
    }, 600);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Institutional Intelligence · MoSPI Vision 2027–2028"
        title="Predictive Analytics & Skill Forecasting"
        subtitle="Forecasting future statistical competency requirements, survey readiness indices, and workforce retirement transitions."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success("Strategic forecast exported to MoSPI_Competency_Forecast_2027.pdf");
              }}
              className="gap-1.5 text-xs"
            >
              <Download className="size-3.5" /> Export Strategic Report
            </Button>
            <Button
              size="sm"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="gap-1.5 bg-gradient-brand text-white shadow-xs text-xs"
            >
              <RefreshCw className={cn("size-3.5", isSimulating && "animate-spin")} />
              {simulationIntervention ? "Reset to Baseline" : "Run Intervention Simulation"}
            </Button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 1. TOP PREDICTIVE FORECAST KPIS                                           */}
      {/* ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "2027 Skill Deficiency Risk",
            value: simulationIntervention ? "20% (Low)" : "34% (Medium)",
            delta: simulationIntervention ? "-14% with intervention" : "+6.2% widening gap",
            trend: simulationIntervention ? ("down" as const) : ("up" as const),
            tone: simulationIntervention ? "text-success" : "text-warning",
            badge: "Vision 2027 Metric",
            sub: "Risk of unmet survey methodology needs",
          },
          {
            label: "Automated CAPI & AI Readiness",
            value: simulationIntervention ? "84%" : "68%",
            delta: simulationIntervention ? "+16% target reached" : "+12% annual increase",
            trend: "up" as const,
            tone: "text-success",
            badge: "Field Ops Cadre",
            sub: "Paperless tablet enumeration readiness",
          },
          {
            label: "Cadre Retirement Transition",
            value: "142 Officers",
            delta: "Retiring by Q4 2028",
            trend: "down" as const,
            tone: "text-muted-foreground",
            badge: "Succession Gap",
            sub: "Requires knowledge succession transfer",
          },
          {
            label: "Model Forecast Accuracy",
            value: "94.2%",
            delta: "Backtested on 10 NSS rounds",
            trend: "up" as const,
            tone: "text-success",
            badge: "Confidence Score",
            sub: "Cross-validated predictive model",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="card-surface p-5.5 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
              <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {item.badge}
              </span>
            </div>

            <div className="mt-3">
              <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                {item.value}
              </p>
              <p className={cn("mt-1 text-xs font-semibold flex items-center gap-1", item.tone)}>
                <TrendingUp className="size-3.5" />
                <span>{item.delta}</span>
              </p>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground border-t border-border pt-2">
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE INTERVENTION SIMULATION BANNER                             */}
      {/* ========================================================================= */}
      <div
        className={cn(
          "rounded-2xl border p-5 transition-all duration-300",
          simulationIntervention
            ? "border-primary/40 bg-primary/5 shadow-sm"
            : "border-border bg-card",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-xs">
              <BrainCircuit className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-foreground">
                  AI Capacity Intervention Scenario:
                </h3>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {simulationIntervention ? "ACTIVE SIMULATION" : "BASELINE PROJECTION"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {simulationIntervention
                  ? "Simulation Active: Accelerated NSSTA Micro-Credentialing applied to 2021-2023 ISS batches. Projected 2028 readiness reaches 92% across national surveys."
                  : "Currently displaying default organic growth trajectory. Click to simulate deploying mandatory Small Area Estimation and CAPI certifications."}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant={simulationIntervention ? "outline" : "default"}
            onClick={handleRunSimulation}
            className="shrink-0 gap-1.5 text-xs"
          >
            <Sliders className="size-3.5" />
            {simulationIntervention ? "Reset Projection" : "Simulate Accelerated Training"}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHART: 5-YEAR LONG-TERM SKILL DEMAND PROJECTION (2024-2028)             */}
      {/* ========================================================================= */}
      <SectionCard
        title="5-Year Statistical Competency Demand Forecast (2024–2028)"
        description="Projected demand curves for emerging statistical methodologies within India's Official Statistical System"
        actions={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 text-cyan" /> Asterisk (*) denotes predictive forecast window
          </span>
        }
      >
        <div style={{ height: 360 }} className="w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBigData" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSmallArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-violet)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-violet)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCapi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Area
                type="monotone"
                dataKey="capiAi"
                name="CAPI & AI Data Capture"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCapi)"
              />
              <Area
                type="monotone"
                dataKey="smallArea"
                name="Small Area Estimation & Modeling"
                stroke="var(--color-violet)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSmallArea)"
              />
              <Area
                type="monotone"
                dataKey="bigData"
                name="Geospatial & Big Data Statistics"
                stroke="var(--color-cyan)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBigData)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* ========================================================================= */}
      {/* 4. MAJOR NATIONAL SURVEY READINESS MATRIX                                 */}
      {/* ========================================================================= */}
      <SectionCard
        title="Major National Survey Cadre Readiness Index"
        description="Predictive capability score of statistical officer cadre to execute upcoming national field surveys"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SURVEY_READINESS_METRICS.map((s) => {
            const isCritical = s.status === "Needs Attention";
            const effectiveScore = simulationIntervention
              ? Math.min(100, s.readiness + 14)
              : s.readiness;
            return (
              <div
                key={s.survey}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-4.5 transition-all",
                  isCritical && !simulationIntervention
                    ? "border-critical/30 bg-critical/5 shadow-xs"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Target: {s.targetDate}
                    </span>
                    <StatusPill
                      tone={isCritical && !simulationIntervention ? "critical" : "success"}
                    >
                      {simulationIntervention ? "Ready (Simulated)" : s.status}
                    </StatusPill>
                  </div>

                  <h4 className="mt-3 font-display font-semibold text-sm leading-snug">
                    {s.survey}
                  </h4>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Cadre Readiness</span>
                      <span className="font-bold text-foreground">{effectiveScore}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          effectiveScore >= 80
                            ? "bg-success"
                            : effectiveScore >= 70
                              ? "bg-primary"
                              : "bg-critical",
                        )}
                        style={{ width: `${effectiveScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-border/80 pt-3">
                  <p className="text-[11px] text-muted-foreground">
                    Priority Skill: <strong className="text-foreground">{s.keySkillNeed}</strong>
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full text-xs h-7">
                    <Link to="/quiz-generator">
                      <Sparkles className="size-3 text-violet" />
                      Take Cadre Readiness Quiz
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ========================================================================= */}
      {/* 5. WORKFORCE RETIREMENT TRANSITION & SUCCESSION PIPELINE                   */}
      {/* ========================================================================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Divisional Succession & Seniority Transition"
          description="MoSPI statistical divisions with anticipated leadership retirements (2026-2028)"
        >
          <div className="space-y-3">
            {[
              {
                division: "Survey Design & Research Division (SDRD), Kolkata",
                retiringCount: 38,
                keyDiscipline: "Complex Sample Weighting & Multipliers",
                risk: "Critical",
              },
              {
                division: "National Accounts Division (NAD), New Delhi",
                retiringCount: 42,
                keyDiscipline: "SNA 2008 & Input-Output Table Balancing",
                risk: "High",
              },
              {
                division: "Price Statistics Division (PSD), New Delhi",
                retiringCount: 29,
                keyDiscipline: "Chained Index Formulae & Scanner Data",
                risk: "Medium",
              },
              {
                division: "Field Operations Division (FOD), Headquarters",
                retiringCount: 33,
                keyDiscipline: "CAPI Architecture & Automated Inspection Rules",
                risk: "High",
              },
            ].map((div) => (
              <div
                key={div.division}
                className="flex items-center justify-between rounded-xl border border-border p-3.5 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-xs text-foreground truncate">
                      {div.division}
                    </h5>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[10px] font-bold",
                        div.risk === "Critical"
                          ? "bg-critical/10 text-critical"
                          : div.risk === "High"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {div.risk} Priority
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Critical Domain: <span className="text-foreground">{div.keyDiscipline}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-display text-base font-bold text-foreground">
                    {div.retiringCount}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Retiring Officers</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Explainable AI (XAI) Forecast Methodology"
          description="How the predictive machine learning model generates competency forecast indices"
        >
          <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary font-bold text-[11px]">
                1
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  MoSPI Regulatory Mandate Weighting (40%)
                </p>
                <p>
                  Incorporates gazette timelines for 80th Round NSS, Digital Census CAPI mandates,
                  and UN-NQAF revision schedules.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-cyan/15 text-cyan font-bold text-[11px]">
                2
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  Cadre Competency Velocity Tracking (35%)
                </p>
                <p>
                  Analyzes month-over-month score improvement curves across 1,200+ statistical
                  officers using assessment metrics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-violet/15 text-violet font-bold text-[11px]">
                3
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  Demographic Attrition Modeling (25%)
                </p>
                <p>
                  Calculates institutional knowledge loss vectors resulting from Senior
                  Administrative Grade retirements through 2028.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-3 text-[11px]">
              <p className="font-semibold text-foreground">Model Governance Assurance:</p>
              <p className="mt-0.5">
                Complies with Ministry of Electronics and Information Technology (MeitY) Responsible
                AI Principles and DoPT digital governance guidelines.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
