import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Landmark,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Award,
  ArrowRight,
  Clock,
  Users,
  Download,
  FileCheck,
  Building,
  Sparkles,
  Zap,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { StatusPill } from "@/components/common/PriorityBadge";
import {
  CoursePlayerDialog,
  CourseCertificateDialog,
} from "@/components/common/CourseModals";
import { Button } from "@/components/ui/button";
import {
  EnrolledCourse,
  useIgotSyncStore,
  useLearningStore,
  useUserStore,
} from "@/lib/quiz-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/igot")({
  head: () => ({
    meta: [
      { title: "iGOT Karmayogi Integration | StatLearn AI" },
      {
        name: "description",
        content:
          "Official integration workspace connecting StatLearn AI with iGOT Karmayogi for bi-directional competency synchronization, civil service credits, and verified certificates.",
      },
      { property: "og:title", content: "iGOT Karmayogi Hub | StatLearn AI" },
    ],
  }),
  component: IgotKarmayogiPage,
});

const MINISTRY_CATALOG = [
  {
    id: "igot-c1",
    title: "National Data Quality Assurance Framework (NQAF)",
    ministry: "Ministry of Statistics & Programme Implementation (MoSPI)",
    hours: "5h 30m",
    modules: 6,
    learners: "16K+",
    credits: 5,
    category: "Data Quality",
    status: "Enrolled (In Progress)",
    progress: 40,
    featured: true,
  },
  {
    id: "igot-c2",
    title: "Karmayogi Foundation: Ethics in Public Service",
    ministry: "Capacity Building Commission (CBC)",
    hours: "4h 00m",
    modules: 5,
    learners: "1.2 Lakh",
    credits: 4,
    category: "Governance & Ethics",
    status: "Certified",
    progress: 100,
    featured: false,
  },
  {
    id: "igot-c3",
    title: "Data-Driven Governance for Officials",
    ministry: "Ministry of Electronics & Information Technology (MeitY)",
    hours: "6h 15m",
    modules: 8,
    learners: "48K+",
    credits: 6,
    category: "Digital Governance",
    status: "Certified",
    progress: 100,
    featured: false,
  },
  {
    id: "igot-c4",
    title: "Digital Public Infrastructure & Statistical Registries",
    ministry: "NITI Aayog",
    hours: "3h 45m",
    modules: 4,
    learners: "22K+",
    credits: 3.5,
    category: "Data Infrastructure",
    status: "Available",
    progress: 0,
    featured: false,
  },
  {
    id: "igot-c5",
    title: "Civil Service Code & Administrative Law",
    ministry: "Department of Personnel & Training (DoPT)",
    hours: "7h 00m",
    modules: 9,
    learners: "85K+",
    credits: 7,
    category: "Public Administration",
    status: "Available",
    progress: 0,
    featured: false,
  },
];

function IgotKarmayogiPage() {
  const { syncRecords, isSyncing, triggerSync, totalHoursSynced, annualTarget } =
    useIgotSyncStore();
  const { userProfile } = useUserStore();
  const { enrollOrStartCourse, completeAllModules } = useLearningStore();

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [certificateCourse, setCertificateCourse] = useState<EnrolledCourse | null>(null);

  const filteredCatalog =
    selectedFilter === "All"
      ? MINISTRY_CATALOG
      : MINISTRY_CATALOG.filter((c) =>
          c.status.toLowerCase().includes(selectedFilter.toLowerCase()),
        );

  const handleSync = async () => {
    try {
      await triggerSync();
      toast.success("Synchronized successfully with iGOT Karmayogi API gateway (+2.0h verified).");
    } catch {
      toast.error("Failed to sync with iGOT portal.");
    }
  };

  const handleDownloadPassbook = () => {
    const content = `# Capacity Building Commission (CBC) · iGOT Karmayogi National Passbook\n\n- **Officer:** ${userProfile.name} (${userProfile.role})\n- **Cadre & ID:** ${userProfile.cadre} · ${userProfile.employeeId}\n- **Office:** ${userProfile.office}\n- **Annual Hours Synced:** ${totalHoursSynced}h / ${annualTarget}h\n- **Audit Code:** CBC-ISS-2026-9041\n\n## Verified Competency Ledger\n${syncRecords.map((r) => `- [${r.type.toUpperCase()}] **${r.courseTitle}** (${r.provider}) — ${r.hours} · ${r.status} (${r.syncedAt})`).join("\n")}\n`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CBC-iGOT-Passbook-${userProfile.employeeId.replace(/\//g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded verified CBC National Passbook ledger.");
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Mission Karmayogi · Digital Public Infrastructure"
        title="iGOT Karmayogi Integration Hub"
        subtitle="Bi-directional competency synchronization, civil service training credit ledger, and verified multi-ministry pathways."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPassbook}
              className="gap-1.5 text-xs"
            >
              <Download className="size-3.5" /> Download Passbook
            </Button>
            <Button
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-1.5 bg-gradient-brand text-white shadow-xs text-xs"
            >
              <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
              {isSyncing ? "Connecting GovNet…" : "Sync with iGOT Karmayogi"}
            </Button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 1. GATEWAY STATUS & OFFICER CAPACITY QUOTA                                */}
      {/* ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Gateway Status
            </span>
            <span className="size-2 rounded-full bg-success animate-pulse" />
          </div>
          <p className="mt-2 font-display text-xl font-bold text-foreground">API Gateway Active</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            GovNet Token:{" "}
            <span className="font-mono text-foreground font-semibold">DoPT/CBC/9821</span>
          </p>
        </div>

        <div className="card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Officer Identification
            </span>
            <ShieldCheck className="size-4 text-cyan" />
          </div>
          <p className="mt-2 font-display text-xl font-bold text-foreground">
            {userProfile.initials} · {userProfile.name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Cadre ID: <span className="text-foreground font-medium">{userProfile.employeeId}</span>
          </p>
        </div>

        <div className="card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Annual Training Quota
            </span>
            <Clock className="size-4 text-violet" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold text-foreground">{totalHoursSynced}h</p>
            <span className="text-xs text-muted-foreground">/ {annualTarget}h target</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-brand"
              style={{ width: `${Math.round((totalHoursSynced / annualTarget) * 100)}%` }}
            />
          </div>
        </div>

        <div className="card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Verified Passbook
            </span>
            <Award className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-xl font-bold text-foreground">3 Certifications</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Next milestone: <span className="text-success font-semibold">Senior Fellow Badge</span>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BI-DIRECTIONAL COMPETENCY LEDGER & SYNC FEED                           */}
      {/* ========================================================================= */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="Bi-Directional Competency Ledger"
            description="Automatic synchronization between StatLearn AI local assessments and the iGOT National Competency Registry"
            actions={
              <StatusPill tone="info">Latency: 14ms · Protocol: xAPI / SCORM 2004</StatusPill>
            }
          >
            <div className="space-y-3">
              {syncRecords.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold",
                        item.type === "inbound"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-cyan/15 text-cyan border border-cyan/25",
                      )}
                    >
                      {item.type === "inbound" ? "IN" : "OUT"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {item.courseTitle}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Authority: {item.provider} · Synchronized {item.syncedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {item.hours}
                    </span>
                    <StatusPill tone={item.status === "Certified" ? "success" : "info"}>
                      {item.status}
                    </StatusPill>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>
                Syncing guarantees credits are recognized for Departmental Promotion Committee (DPC)
                reviews.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                className="text-xs text-primary gap-1"
              >
                <RefreshCw className={cn("size-3", isSyncing && "animate-spin")} /> Force Resync
              </Button>
            </div>
          </SectionCard>
        </div>

        {/* National Passbook Badge Showcase */}
        <div>
          <SectionCard
            title="National Competency Passbook"
            description="DoPT & CBC Digital Verification"
          >
            <div className="space-y-3.5">
              <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success" />
                  <h4 className="font-semibold text-xs text-foreground">
                    CBC Verified Digital Credential
                  </h4>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  Competency score and 12 completed official courses have been verified by the
                  Capacity Building Commission (CBC) digital ledger.
                </p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground border-t border-success/20 pt-2">
                  <span>
                    Audit Code: <strong>CBC-ISS-2026-9041</strong>
                  </span>
                  <span className="text-success font-semibold">Compliant</span>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inbound Synchronized:</span>
                  <span className="font-semibold text-foreground">8 Courses (MeitY, CBC)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outbound Certified:</span>
                  <span className="font-semibold text-foreground">12 Assessments (StatLearn)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Audit Cycle:</span>
                  <span className="font-semibold text-foreground">30 Oct 2026</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => {
                  window.open("https://igotkarmayogi.gov.in", "_blank");
                }}
              >
                <ExternalLink className="size-3.5" /> Visit Official iGOT Portal
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VERIFIED MINISTRY COURSE CATALOGS                                      */}
      {/* ========================================================================= */}
      <SectionCard
        title="iGOT Karmayogi Ministry Course Catalog"
        description="Official courses recognized for Indian Statistical Service (ISS) professional development"
        actions={
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {["All", "Certified", "In Progress", "Available"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  selectedFilter === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCatalog.map((course) => (
            <div
              key={course.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {course.category}
                  </span>
                  <StatusPill
                    tone={
                      course.status.includes("Certified")
                        ? "success"
                        : course.status.includes("Progress")
                          ? "info"
                          : "neutral"
                    }
                  >
                    {course.status}
                  </StatusPill>
                </div>

                <h3 className="mt-3 font-display font-semibold text-sm leading-snug">
                  {course.title}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">{course.ministry}</p>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/80 pt-3">
                  <span>{course.hours}</span>
                  <span>{course.modules} Modules</span>
                  <span className="font-semibold text-foreground">+{course.credits} Credits</span>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant={course.status.includes("Certified") ? "outline" : "default"}
                  className="w-full gap-1.5 text-xs"
                  onClick={() => {
                    const enrolled = enrollOrStartCourse({
                      id: course.id,
                      title: course.title,
                      category: course.category,
                      provider: course.ministry,
                      duration: course.hours,
                    });
                    if (course.status.includes("Certified")) {
                      completeAllModules(enrolled.id);
                      setCertificateCourse({
                        ...enrolled,
                        status: "Completed",
                        progress: 100,
                        certificateId: `iGOT-CBC-2026-${course.id.toUpperCase()}`,
                        completedAt: "02 Sep 2026",
                      });
                    } else {
                      setActiveCourseId(enrolled.id);
                      toast.success(`Launched "${course.title}" on iGOT Karmayogi workspace.`);
                    }
                  }}
                >
                  {course.status.includes("Certified") ? (
                    <>
                      <FileCheck className="size-3.5 text-success" /> View Certificate
                    </>
                  ) : course.status.includes("Progress") ? (
                    <>
                      <BookOpen className="size-3.5" /> Resume Course
                    </>
                  ) : (
                    <>
                      <Zap className="size-3.5" /> Enroll on iGOT
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <CoursePlayerDialog
        courseId={activeCourseId}
        open={!!activeCourseId}
        onOpenChange={(open) => {
          if (!open) setActiveCourseId(null);
        }}
        onOpenCertificate={(completed) => setCertificateCourse(completed)}
      />

      <CourseCertificateDialog
        course={certificateCourse}
        open={!!certificateCourse}
        onOpenChange={(open) => {
          if (!open) setCertificateCourse(null);
        }}
      />
    </div>
  );
}

