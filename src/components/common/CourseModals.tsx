import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  Layers,
  PlayCircle,
  Printer,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/common/PriorityBadge";
import {
  EnrolledCourse,
  PRELOADED_NOTES,
  stageDocumentForQuiz,
  useGamificationStore,
  useLearningStore,
  useUserStore,
} from "@/lib/quiz-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CoursePlayerDialog({
  courseId,
  open,
  onOpenChange,
  onOpenCertificate,
}: {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCertificate?: (course: EnrolledCourse) => void;
}) {
  const navigate = useNavigate();
  const { courses, toggleCourseModule, completeAllModules } = useLearningStore();
  const { awardXp } = useGamificationStore();
  const course = courses.find((c) => c.id === courseId) || null;
  const [activeModIdx, setActiveModIdx] = useState(0);

  if (!course) return null;

  const currentModule = course.modules[activeModIdx] || course.modules[0];

  const handleToggleModule = (modId: string, currentlyCompleted: boolean) => {
    toggleCourseModule(course.id, modId);
    if (!currentlyCompleted) {
      awardXp(50);
      toast.success("Module completed! +50 Capacity XP awarded.");
    }
  };

  const handleCompleteCourse = () => {
    completeAllModules(course.id);
    awardXp(150);
    toast.success(`Congratulations! Completed "${course.title}" (+150 XP & Certificate Issued).`);
  };

  const handleAssessTopic = () => {
    // Pick matching preloaded note based on category
    const matchNote =
      PRELOADED_NOTES.find((n) =>
        n.suggestedCompetencies.some((comp) =>
          comp.toLowerCase().includes(course.category.toLowerCase().split(" ")[0] || ""),
        ),
      ) || PRELOADED_NOTES[0];
    stageDocumentForQuiz(matchNote);
    onOpenChange(false);
    navigate({ to: "/quiz-generator" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              {course.provider}
            </span>
            <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {course.category}
            </span>
            <StatusPill tone={course.status === "Completed" ? "success" : "info"}>
              {course.status} ({course.progress}%)
            </StatusPill>
          </div>
          <DialogTitle className="mt-1.5 font-display text-lg sm:text-xl">
            {course.title}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {course.duration}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Layers className="size-3.5" /> {course.level} Level
            </span>
            <span>·</span>
            <span className="font-semibold text-foreground">+{course.credits} DPC Credits</span>
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Overall Course Completion</span>
            <span className="font-bold tabular-nums text-primary">{course.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-brand transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        {/* Main Split Layout: Module List + Active Lesson Content */}
        <div className="mt-2 grid flex-1 gap-4 overflow-y-auto md:grid-cols-5 pr-1">
          {/* Left: Syllabus Modules */}
          <div className="space-y-2 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Course Syllabus ({course.modules.length} Modules)
            </p>
            {course.modules.map((mod, idx) => {
              const isSelected = idx === activeModIdx;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModIdx(idx)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-xs transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border bg-card hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                      mod.completed
                        ? "bg-success text-white"
                        : isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {mod.completed ? "✓" : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-foreground">{mod.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{mod.duration}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Active Module Lesson View */}
          {currentModule && (
            <div className="flex flex-col justify-between rounded-xl border border-border bg-muted/20 p-4 md:col-span-3">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Active Module {activeModIdx + 1} of {course.modules.length}
                    </span>
                    <h4 className="mt-0.5 font-display text-sm font-bold text-foreground">
                      {currentModule.title}
                    </h4>
                  </div>
                  <span className="shrink-0 rounded bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
                    {currentModule.duration}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground">Executive Summary</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {currentModule.summary}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-3.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <BookOpen className="size-3.5 text-primary" />
                    Key Methodological Takeaways (MoSPI / NSSTA Standard)
                  </p>
                  <ul className="mt-2.5 space-y-2 text-xs text-muted-foreground">
                    {currentModule.keyTakeaways.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <Button
                  size="sm"
                  variant={currentModule.completed ? "outline" : "default"}
                  onClick={() => handleToggleModule(currentModule.id, currentModule.completed)}
                  className="gap-1.5 text-xs"
                >
                  <CheckCircle2 className="size-3.5" />
                  {currentModule.completed
                    ? "Completed (Click to Undo)"
                    : "Mark Module Complete (+50 XP)"}
                </Button>

                {activeModIdx < course.modules.length - 1 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setActiveModIdx((i) => i + 1)}
                    className="text-xs"
                  >
                    Next Module →
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAssessTopic}
            className="gap-1.5 text-xs"
          >
            <Sparkles className="size-3.5 text-violet" /> Practice AI Quiz on Topic
          </Button>

          <div className="flex flex-wrap gap-2">
            {course.status === "Completed" && onOpenCertificate ? (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenCertificate(course);
                }}
                className="gap-1.5 bg-success text-white hover:bg-success/90 text-xs"
              >
                <FileCheck className="size-3.5" /> View Official Certificate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCompleteCourse}
                className="gap-1.5 text-xs"
              >
                <Award className="size-3.5 text-primary" /> Complete All & Issue Certificate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CourseCertificateDialog({
  course,
  open,
  onOpenChange,
}: {
  course: EnrolledCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { userProfile } = useUserStore();

  if (!course) return null;

  const certId = course.certificateId || "NSSTA-CERT-2026-8419";
  const dateStr = course.completedAt || "12 Oct 2026";

  const handleDownloadCertificate = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate of Completion - ${course.title}</title>
  <style>
    body { font-family: 'Georgia', serif; background: #f1f5f9; padding: 40px; text-align: center; }
    .cert { max-width: 800px; margin: 0 auto; background: #fff; border: 8px double #0f172a; padding: 48px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .eyebrow { font-family: sans-serif; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #0284c7; font-weight: bold; }
    h1 { font-size: 32px; color: #0f172a; margin: 12px 0 8px; }
    .sub { font-family: sans-serif; font-size: 14px; color: #64748b; }
    .name { font-size: 28px; font-weight: bold; color: #0f172a; margin: 24px 0 8px; border-bottom: 2px solid #e2e8f0; display: inline-block; padding: 0 24px 6px; }
    .course { font-size: 22px; color: #0284c7; font-weight: bold; margin: 16px 0; }
    .meta { margin-top: 36px; display: flex; justify-content: space-between; font-family: sans-serif; font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="eyebrow">Government of India · Ministry of Statistics & Programme Implementation</div>
    <h1>CERTIFICATE OF COMPETENCY COMPLETION</h1>
    <div class="sub">National Statistical Systems Training Academy (NSSTA) & iGOT Karmayogi</div>
    <p style="margin-top:28px; color:#475569;">This is to certify that</p>
    <div class="name">${userProfile.name}</div>
    <div class="sub">${userProfile.role} · ${userProfile.cadre} (${userProfile.employeeId})</div>
    <p style="margin-top:24px; color:#475569;">has successfully completed the accredited statistical capacity building program</p>
    <div class="course">${course.title}</div>
    <div class="sub">Domain: ${course.category} · Duration: ${course.duration} · Credits Earned: +${course.credits} DPC Credits</div>
    <div class="meta">
      <div><strong>Certificate ID:</strong> ${certId}</div>
      <div><strong>Date Issued:</strong> ${dateStr}</div>
      <div><strong>Authority:</strong> ${course.provider}</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MoSPI-Certificate-${course.title.replace(/[^a-zA-Z0-9]/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded official certificate (${certId})`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            Verified Competency Certificate
          </DialogTitle>
          <DialogDescription>
            Official digital credential synced with DoPT / iGOT Karmayogi National Passbook
          </DialogDescription>
        </DialogHeader>

        {/* Certificate Visual Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 text-center shadow-md sm:p-8">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-gradient-brand text-white shadow-sm">
            <ShieldCheck className="size-6" />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Ministry of Statistics & Programme Implementation · NSSTA
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Certificate of Completion
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">This credentials that</p>

          <p className="mt-2 font-display text-xl font-bold text-foreground underline decoration-primary/40 underline-offset-8">
            {userProfile.name}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {userProfile.role} · {userProfile.cadre} · ID: {userProfile.employeeId}
          </p>

          <p className="mt-4 text-xs text-muted-foreground">
            has demonstrated proficiency and completed the course
          </p>
          <h3 className="mt-1 font-display text-base font-bold text-primary sm:text-lg">
            {course.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {course.category} · {course.duration} · +{course.credits} Verified Credits
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border/80 pt-4 text-left text-[11px]">
            <div>
              <span className="block text-muted-foreground">Certificate ID</span>
              <strong className="font-mono text-foreground">{certId}</strong>
            </div>
            <div>
              <span className="block text-muted-foreground">Issuing Authority</span>
              <strong className="text-foreground">{course.provider}</strong>
            </div>
            <div className="text-right">
              <span className="block text-muted-foreground">Date Verified</span>
              <strong className="text-success">{dateStr}</strong>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs"
          >
            <Printer className="size-3.5" /> Print Credential
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button size="sm" onClick={handleDownloadCertificate} className="gap-1.5 text-xs">
              <Download className="size-3.5" /> Download Certificate
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
