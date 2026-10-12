import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CircleCheck,
  Landmark,
  Sparkles,
  FolderOpen,
  ShieldCheck,
  TrendingUp,
  Activity,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  FileQuestion,
  ChevronRight,
  ExternalLink,
  Flame,
  BrainCircuit,
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
} from "recharts";
import { StatCard } from "@/components/common/StatCard";
import { AIInsightCard } from "@/components/common/AIInsightCard";
import { SectionCard } from "@/components/common/PageHeader";
import { SkillGapTable } from "@/components/common/SkillGapTable";
import { CompetencyChart } from "@/components/common/CompetencyChart";
import { RecommendationCard } from "@/components/common/RecommendationCard";
import { StatusPill } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import {
  kpis as defaultKpis,
  recommendations,
  igotResources,
  competencyTimeline,
  quizPerformance,
} from "@/data/mock";
import {
  useQuizResultsStore,
  useMaterialsStore,
  useGamificationStore,
  useUserStore,
  stageDocumentForQuiz,
} from "@/lib/quiz-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const { competencyRadar, results } = useQuizResultsStore();
  const { materials } = useMaterialsStore();
  const { badges, leaderboard, xp, level, awardXp } = useGamificationStore();
  const { userProfile } = useUserStore();

  const [activeChartTab, setActiveChartTab] = useState<"radar" | "growth" | "domains">("radar");

  // Daily challenge state
  const [selectedChallengeAnswer, setSelectedChallengeAnswer] = useState<number | null>(null);
  const [showChallengeExplanation, setShowChallengeExplanation] = useState(false);

  // Compute live overall score from radar
  const averageScore = Math.round(
    competencyRadar.reduce((acc, curr) => acc + curr.score, 0) / competencyRadar.length,
  );

  const latestQuiz = results[0];

  // Daily quick challenge question
  const dailyChallenge = {
    question:
      "In stratified multi-stage sampling (NSS design), why are sample units ordered by population prior to selection?",
    options: [
      "To completely eliminate non-sampling reporting error",
      "To ensure implicit stratification within each primary stratum",
      "To bypass the calculation of design multipliers",
      "To convert household units into census villages",
    ],
    answer: 1,
    explanation:
      "Arranging First Stage Units (FSUs) by population size prior to circular systematic selection provides implicit stratification, ensuring balanced representation across population sizes without increasing stratum partitions.",
    source: "NSS 79th Round – Survey Methodology",
  };

  const dynamicKpis = [
    {
      id: "competency",
      label: "Overall Competency Score",
      value: `${averageScore}%`,
      delta: latestQuiz
        ? `+${latestQuiz.percentage >= 70 ? "3.2" : "1.0"}% from assessment`
        : "+8.4% this cycle",
      trend: "up" as const,
      icon: "gauge" as const,
      progress: averageScore,
      badge: "Level 3 · Proficient",
      accentColor: "primary" as const,
    },
    {
      id: "quizzes",
      label: "Assessments Completed",
      value: `${results.length} Tests`,
      delta: `${materials.length} reference documents`,
      trend: "up" as const,
      icon: "target" as const,
      progress: Math.min(results.length * 20, 100),
      badge: results.length > 0 ? "Active Learner" : "Ready to Start",
      accentColor: "cyan" as const,
    },
    {
      id: "learning_hours",
      label: "Annual Training Hours",
      value: "126h / 150h",
      delta: "12 courses completed",
      trend: "up" as const,
      icon: "clock" as const,
      progress: 84,
      badge: "84% of ISS Target",
      accentColor: "violet" as const,
    },
    {
      id: "gaps",
      label: "Priority Skill Gaps",
      value: "05 Gaps",
      delta: "2 Critical, 3 High Priority",
      trend: "down" as const,
      icon: "flame" as const,
      progress: 60,
      badge: "Action Required",
      accentColor: "warning" as const,
    },
  ];

  const dynamicInsights = [
    latestQuiz
      ? `Recent assessment on "${latestQuiz.materialName}" scored ${latestQuiz.percentage}%. Target competency impact updated.`
      : "Data Quality and Statistical Modelling gaps require priority remediation prior to the Q4 review.",
    `Your personal library has ${materials.length} study documents analyzed and ready for AI MCQ generation.`,
    "MoSPI official curriculum benchmark: 82% target required for Senior Statistical Officer promotion track.",
  ];

  return (
    <div className="space-y-7">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HERO BANNER: MoSPI & ISS Officer Profile                     */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-navy p-6 text-sidebar-foreground shadow-lg sm:p-8">
        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-96 rounded-full bg-cyan/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-96 rounded-full bg-violet/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            {/* Status pills row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent/70 px-3 py-1 text-xs font-semibold text-sidebar-foreground">
                <span className="size-2 rounded-full bg-success animate-pulse" />
                MoSPI Framework v3.2 Active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-1 text-[11px] text-sidebar-foreground/75">
                <ShieldCheck className="size-3.5 text-cyan" />
                Cadre: {userProfile.cadre}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-1 text-[11px] text-sidebar-foreground/75">
                ID: {userProfile.employeeId}
              </span>
            </div>

            {/* Officer Greeting & Office */}
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-white">
                Welcome back, {userProfile.name} 👋
              </h1>
              <p className="mt-1 text-sm text-sidebar-foreground/80">
                {userProfile.role} · {userProfile.office}
              </p>
            </div>

            <p className="max-w-2xl text-xs leading-relaxed text-sidebar-foreground/70 sm:text-sm">
              Your competency profile is synced with the National Quality Assurance Framework
              (NQAF). Generate customized assessments from official notes or browse training
              pathways.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="gap-2 bg-gradient-brand text-white shadow-md hover:opacity-95"
            >
              <Link to="/quiz-generator">
                <Sparkles className="size-4" /> AI Quiz Generator
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="gap-2 border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            >
              <Link to="/learning-materials">
                <FolderOpen className="size-4" /> Notes Library ({materials.length})
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI CARDS                                                    */}
      {/* ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dynamicKpis.map((k) => (
          <StatCard
            key={k.id}
            label={k.label}
            value={k.value}
            delta={k.delta}
            trend={k.trend}
            icon={k.icon}
            progress={k.progress}
            badge={k.badge}
            accentColor={k.accentColor}
          />
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. MULTI-TAB COMPETENCY ANALYSIS & AI EXECUTIVE BRIEFING                  */}
      {/* ========================================================================= */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left 2 Cols: Main Competency Interactive Chart */}
        <div className="xl:col-span-2">
          <SectionCard
            title="Competency Intelligence Matrix"
            description="Continuous assessment against MoSPI role benchmarks for Statistical Officers"
            actions={
              <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
                <button
                  onClick={() => setActiveChartTab("radar")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                    activeChartTab === "radar"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Radar Profile
                </button>
                <button
                  onClick={() => setActiveChartTab("growth")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                    activeChartTab === "growth"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Growth Trend
                </button>
                <button
                  onClick={() => setActiveChartTab("domains")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                    activeChartTab === "domains"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Proficiency Bars
                </button>
              </div>
            }
          >
            {activeChartTab === "radar" && (
              <div>
                <CompetencyChart data={competencyRadar} height={340} />
                <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded bg-chart-1" />
                    <span>Your Current Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded bg-chart-3/40" />
                    <span>Role Target Benchmark</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <span>Average Proficiency:</span>
                    <span className="font-bold text-primary">{averageScore}%</span>
                  </div>
                </div>
              </div>
            )}

            {activeChartTab === "growth" && (
              <div className="space-y-2">
                <div style={{ height: 320 }} className="w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={competencyTimeline}>
                      <defs>
                        <linearGradient id="scoreGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[30, 100]}
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
                      <Area
                        type="monotone"
                        dataKey="score"
                        name="Overall Competency"
                        stroke="var(--color-primary)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#scoreGrowth)"
                      />
                      <Area
                        type="monotone"
                        dataKey="quality"
                        name="Data Quality"
                        stroke="var(--color-cyan)"
                        strokeWidth={1.5}
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Continuous score progression over the last 6 assessment months (Apr – Sep 2026).
                </p>
              </div>
            )}

            {activeChartTab === "domains" && (
              <div className="space-y-2">
                <div style={{ height: 320 }} className="w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quizPerformance}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
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
                      <Bar
                        dataKey="score"
                        name="Mastery %"
                        fill="var(--color-chart-1)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Assessment mastery scores by specialized statistical module.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Column: AI Executive Briefing & Government Learning Sync */}
        <div className="space-y-6">
          <AIInsightCard title="AI Executive Diagnostic" items={dynamicInsights} />

          <SectionCard
            title="iGOT Karmayogi Portal"
            description="Integrated Civil Service Learning Network"
            actions={
              <StatusPill tone="success">
                <CircleCheck className="size-3.5" /> API Active
              </StatusPill>
            }
          >
            <ul className="space-y-3">
              {igotResources.slice(0, 3).map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-lg border border-border/70 p-2.5 transition-colors hover:bg-muted/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Landmark className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.ministry} · {r.hours} · {r.learners} enrolled
                    </p>
                  </div>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full text-xs">
              <Link to="/igot">Open iGOT Karmayogi Workspace</Link>
            </Button>
          </SectionCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DAILY STATISTICAL CHALLENGE & RECENT ACTIVITY                          */}
      {/* ========================================================================= */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Micro-Assessment Widget */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Daily Statistical Challenge"
            description={`Curated from official notes: "${dailyChallenge.source}"`}
            actions={
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                <Flame className="size-3.5" /> Daily Streak: 4 Days
              </span>
            }
          >
            <div className="space-y-4">
              <p className="font-display text-sm font-semibold sm:text-base leading-relaxed text-foreground">
                {dailyChallenge.question}
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {dailyChallenge.options.map((opt, idx) => {
                  const isSelected = selectedChallengeAnswer === idx;
                  const isCorrect = showChallengeExplanation && idx === dailyChallenge.answer;
                  const isWrong =
                    showChallengeExplanation && isSelected && idx !== dailyChallenge.answer;

                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (!showChallengeExplanation && idx === dailyChallenge.answer) {
                          awardXp(25);
                          toast.success("Correct answer! +25 Capacity XP awarded.");
                        }
                        setSelectedChallengeAnswer(idx);
                        setShowChallengeExplanation(true);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs transition-all",
                        "hover:border-primary/50 hover:bg-muted/40",
                        isSelected &&
                          !showChallengeExplanation &&
                          "border-primary bg-primary/5 font-medium",
                        isCorrect && "border-success bg-success/10 font-medium text-success",
                        isWrong && "border-destructive bg-destructive/10 text-destructive",
                        !isSelected && !isCorrect && "border-border text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-md border text-[11px] font-bold",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {showChallengeExplanation && (
                <div className="mt-3 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <CheckCircle2 className="size-4 text-success" />
                    Official Rationale:
                  </div>
                  <p className="mt-1 text-muted-foreground">{dailyChallenge.explanation}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  Want more questions on this topic?
                </span>
                <Button asChild size="sm" className="gap-1.5 text-xs">
                  <Link to="/quiz-generator">
                    <Sparkles className="size-3.5" /> Launch Full AI Assessment
                  </Link>
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Quick Launchpad & Note Shortcuts */}
        <div>
          <SectionCard
            title="Assessment Studio Shortcuts"
            description="Generate quizzes directly from library"
          >
            <div className="space-y-2.5">
              {materials.slice(0, 3).map((mat) => (
                <div
                  key={mat.id}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {mat.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {mat.wordCount} words · {mat.suggestedCompetencies[0] || "Methodology"}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => stageDocumentForQuiz(mat)}
                  >
                    <Link to="/quiz-generator">
                      <Sparkles className="size-3 text-violet" />
                      Test
                    </Link>
                  </Button>
                </div>
              ))}

              <Button asChild variant="secondary" className="w-full gap-2 text-xs">
                <Link to="/learning-materials">
                  <FolderOpen className="size-3.5" /> Manage All {materials.length} Materials
                </Link>
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. AI-IDENTIFIED COMPETENCY GAPS MATRIX                                    */}
      {/* ========================================================================= */}
      <SectionCard
        title="Official Competency Gaps & Action Pathways"
        description="Prioritized deficiency analysis benchmarked against the MoSPI Statistical Officer role specification"
        padded={false}
        actions={
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/competencies">Detailed Radar Breakdown</Link>
          </Button>
        }
      >
        <SkillGapTable />
      </SectionCard>

      {/* ========================================================================= */}
      {/* 6. PERSONALIZED TRAINING RECOMMENDATIONS                                  */}
      {/* ========================================================================= */}
      <SectionCard
        title="Personalized Learning Pathways"
        description="Tailored training pathways calibrated from your assessment scores and priority skill gaps"
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-violet" /> Ranked by AI competency match
            </span>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/recommendations">View All Courses</Link>
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.slice(0, 3).map((c) => (
            <RecommendationCard key={c.id} course={c} />
          ))}
        </div>
      </SectionCard>

      {/* ========================================================================= */}
      {/* 7. GAMIFICATION & ISS CADRE HONOR ROLL                                    */}
      {/* ========================================================================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Officer Badges & Milestone Achievements */}
        <SectionCard
          title="Officer Competency Badges"
          description={`Level ${level} Statistical Specialist · ${xp} Capacity XP earned towards DPC Cadre Review`}
          actions={
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {badges.filter((b) => b.unlocked).length} of {badges.length} Badges Unlocked
            </span>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-3.5 transition-all",
                  b.unlocked
                    ? "border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs"
                    : "border-border/70 bg-card/50 opacity-70",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-lg text-xs font-bold",
                        b.unlocked
                          ? "bg-gradient-brand text-white shadow-xs"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Award className="size-4" />
                    </span>
                    {b.unlocked ? (
                      <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {b.progress}% Complete
                      </span>
                    )}
                  </div>

                  <h4 className="mt-2.5 font-display font-bold text-xs text-foreground">
                    {b.title}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                    {b.description}
                  </p>
                </div>

                <div className="mt-3 border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
                  {b.unlocked ? (
                    <span>Earned: {b.unlockedAt}</span>
                  ) : (
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${b.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ISS Peer Cadre Leaderboard */}
        <SectionCard
          title="Indian Statistical Service (ISS) Cadre Leaderboard"
          description="Peer capacity ranking across MoSPI divisions (NSO, SDRD, NAD, PSD, FOD)"
          actions={<span className="text-xs text-muted-foreground">Updated Cycle: Q3 2026</span>}
        >
          <div className="space-y-2.5">
            {leaderboard.map((officer) => (
              <div
                key={officer.rank}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-colors",
                  officer.isCurrentUser
                    ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40 font-semibold"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                      officer.rank === 1
                        ? "bg-amber-400 text-amber-950 font-black"
                        : officer.rank === 2
                          ? "bg-slate-300 text-slate-800"
                          : officer.rank === 3
                            ? "bg-amber-600 text-white"
                            : "bg-muted text-muted-foreground",
                    )}
                  >
                    {officer.rank}
                  </span>

                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground text-xs font-bold">
                    {officer.initials}
                  </span>

                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-bold text-foreground">{officer.name}</p>
                      {officer.isCurrentUser && (
                        <span className="rounded bg-primary text-primary-foreground px-1 py-0.2 text-[9px] font-extrabold uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[10px] text-muted-foreground">{officer.division}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-display text-xs font-bold text-foreground">
                    {officer.xp} XP
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {officer.quizzesTaken} Quizzes · {officer.score}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
