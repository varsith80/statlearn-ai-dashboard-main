import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  Award,
  Clock,
  PlayCircle,
  Sparkles,
  FileCheck,
  RotateCcw,
  Search,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { StatusPill } from "@/components/common/PriorityBadge";
import {
  CoursePlayerDialog,
  CourseCertificateDialog,
} from "@/components/common/CourseModals";
import { Button } from "@/components/ui/button";
import { EnrolledCourse, useLearningStore } from "@/lib/quiz-store";
import { toast } from "sonner";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "My Learning | StatLearn AI" },
      {
        name: "description",
        content:
          "Track enrolled statistical training courses, interactive module progress, and verified NSSTA / iGOT completion certificates.",
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

const tabs = ["All", "In Progress", "Completed", "Not Started"] as const;

function MyLearning() {
  const { courses, enrollOrStartCourse, resetLearning } = useLearningStore();

  const [tab, setTab] = useState<(typeof tabs)[number]>("In Progress");
  const [search, setSearch] = useState("");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [certificateCourse, setCertificateCourse] = useState<EnrolledCourse | null>(null);

  const list = courses.filter((c) => {
    const matchesTab = tab === "All" ? true : c.status === tab;
    const matchesSearch =
      !search.trim() ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.provider.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const completedCourses = courses.filter((c) => c.status === "Completed");
  const inProgressCourses = courses.filter((c) => c.status === "In Progress");
  const totalCredits = completedCourses.reduce((acc, c) => acc + c.credits, 0);

  const summary = [
    { label: "Courses Enrolled", value: courses.length, icon: BookOpen },
    {
      label: "Completed & Certified",
      value: completedCourses.length,
      icon: Award,
    },
    { label: "Verified Credits Earned", value: `${totalCredits} Credits`, icon: Clock },
    { label: "Active In Progress", value: inProgressCourses.length, icon: PlayCircle },
  ];

  const handleCourseAction = (course: EnrolledCourse) => {
    if (course.status === "Completed") {
      setCertificateCourse(course);
      return;
    }
    if (course.status === "Not Started") {
      enrollOrStartCourse(course);
      toast.success(`Started "${course.title}". Module 1 unlocked.`);
    }
    setActiveCourseId(course.id);
  };

  return (
    <>
      <PageHeader
        eyebrow="Learning Workspace"
        title="My Learning & Certifications"
        subtitle="All training assigned to or selected by you across NSSTA and iGOT Karmayogi. Complete modules interactively to earn DPC credits and certificates."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetLearning();
                toast.success("Restored default course enrollments.");
              }}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="size-3.5" /> Reset Progress
            </Button>
            <Button asChild size="sm" className="gap-1.5 text-xs">
              <Link to="/recommendations">
                <Sparkles className="size-3.5" /> Browse AI Recommendations
              </Link>
            </Button>
          </div>
        }
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const count =
              t === "All" ? courses.length : courses.filter((c) => c.status === t).length;
            return (
              <Button
                key={t}
                size="sm"
                variant={tab === t ? "default" : "outline"}
                onClick={() => setTab(t)}
                className="gap-1.5"
              >
                <span>{t}</span>
                <span className="rounded-full bg-muted/60 px-1.5 py-0.2 text-[10px]">{count}</span>
              </Button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search enrolled courses..."
            className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      <SectionCard title={tab === "All" ? "All Enrolled Courses" : tab} description={`${list.length} courses`}>
        {list.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <p>Nothing here right now. Explore AI recommendations to enrol in a new course.</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/recommendations">Explore Recommended Courses</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{c.title}</h3>
                    <StatusPill tone={c.status === "Completed" ? "success" : "info"}>
                      {c.status}
                    </StatusPill>
                    <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {c.provider}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.category} · {c.duration} · +{c.credits} Credits · {c.nextModule} · Last
                    accessed {c.lastAccessed}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-brand transition-all duration-300"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums">{c.progress}%</span>
                    <span className="text-[11px] text-muted-foreground">
                      ({c.modules.filter((m) => m.completed).length}/{c.modules.length} modules)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  {c.status === "Completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveCourseId(c.id)}
                      className="text-xs"
                    >
                      Review Modules
                    </Button>
                  )}
                  <Button
                    variant={c.status === "Completed" ? "outline" : "default"}
                    className="gap-1.5 sm:w-44 text-xs"
                    onClick={() => handleCourseAction(c)}
                  >
                    {c.status === "Completed" ? (
                      <>
                        <FileCheck className="size-3.5 text-success" /> View Certificate
                      </>
                    ) : c.status === "Not Started" ? (
                      <>
                        <PlayCircle className="size-3.5" /> Start Course
                      </>
                    ) : (
                      <>
                        <BookOpen className="size-3.5" /> Resume Course
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Interactive Course Player Modal */}
      <CoursePlayerDialog
        courseId={activeCourseId}
        open={!!activeCourseId}
        onOpenChange={(open) => {
          if (!open) setActiveCourseId(null);
        }}
        onOpenCertificate={(completed) => setCertificateCourse(completed)}
      />

      {/* Official Certificate Viewer Modal */}
      <CourseCertificateDialog
        course={certificateCourse}
        open={!!certificateCourse}
        onOpenChange={(open) => {
          if (!open) setCertificateCourse(null);
        }}
      />
    </>
  );
}
