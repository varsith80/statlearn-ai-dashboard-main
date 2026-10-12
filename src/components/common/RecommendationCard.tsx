import { useState } from "react";
import {
  Clock,
  Layers,
  Sparkles,
  PlayCircle,
  Building2,
  BrainCircuit,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CoursePlayerDialog,
  CourseCertificateDialog,
} from "@/components/common/CourseModals";
import type { Course } from "@/data/mock";
import { EnrolledCourse, useLearningStore } from "@/lib/quiz-store";
import { toast } from "sonner";

export function RecommendationCard({ course }: { course: Course }) {
  const { courses, enrollOrStartCourse } = useLearningStore();
  const [showXai, setShowXai] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [certificateCourse, setCertificateCourse] = useState<EnrolledCourse | null>(null);

  const enrolledMatch = courses.find(
    (c) => c.id === course.id || c.title.toLowerCase() === course.title.toLowerCase(),
  );
  const liveProgress = enrolledMatch ? enrolledMatch.progress : course.progress;
  const isCompleted = enrolledMatch?.status === "Completed";

  const handleLaunchCourse = () => {
    const enrolled = enrollOrStartCourse({
      id: course.id,
      title: course.title,
      category: course.category,
      provider: course.provider,
      level: course.level,
      duration: course.duration,
    });
    if (enrolled.status === "Completed") {
      setCertificateCourse(enrolled);
      return;
    }
    setActiveCourseId(enrolled.id);
    toast.success(`Opened "${course.title}" interactive learning workspace.`);
  };

  return (
    <>
      <article className="card-surface flex h-full flex-col justify-between p-5 transition-all hover:shadow-lift">
        <div>
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {course.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-violet/30 bg-violet/10 px-2 py-0.5 text-[11px] font-semibold text-violet">
              <Sparkles className="size-3" />
              {course.match}% match
            </span>
          </div>

          <h3 className="mt-3 font-display text-base font-semibold leading-snug">{course.title}</h3>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {course.summary}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5" />
              <span>{course.level}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <PlayCircle className="size-3.5" />
              <span>{course.modules} modules</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              <span className="truncate">{course.provider}</span>
            </div>
          </dl>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium tabular-nums">{liveProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all duration-300"
                style={{ width: `${liveProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t border-border pt-4">
          <Button
            variant={isCompleted ? "outline" : "default"}
            className="w-full text-xs h-9 gap-1.5"
            onClick={handleLaunchCourse}
          >
            {isCompleted ? (
              <>
                <FileCheck className="size-3.5 text-success" /> View Certificate
              </>
            ) : liveProgress > 0 ? (
              "Continue Learning"
            ) : (
              "Start Learning"
            )}
          </Button>

          {/* Explainable AI (XAI) Trigger */}
          <Dialog open={showXai} onOpenChange={setShowXai}>
            <DialogTrigger asChild>
              <button className="flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold text-primary hover:underline py-1">
                <BrainCircuit className="size-3 text-violet" />
                Explain AI Recommendation
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BrainCircuit className="size-5 text-violet" />
                  Explainable AI (XAI) Rationale
                </DialogTitle>
                <DialogDescription>
                  Algorithmic feature attribution for "{course.title}" ({course.match}% Match)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 text-xs">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Algorithmic Confidence:</span>
                    <span className="font-bold text-primary">96.8%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Recommendation synthesized by MoSPI Competency Optimization Engine v3.2
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-2">
                    Feature Importance Breakdown:
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Competency Deficiency Gap in " + course.category,
                        weight: "40%",
                        bar: 40,
                      },
                      {
                        label: "MoSPI Senior Statistical Officer Promotion Benchmark",
                        weight: "35%",
                        bar: 35,
                      },
                      {
                        label: "Upcoming National Survey Mandate (NSS 80th)",
                        weight: "25%",
                        bar: 25,
                      },
                    ].map((feat) => (
                      <div key={feat.label} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">{feat.label}</span>
                          <span className="font-bold text-foreground">{feat.weight}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-brand"
                            style={{ width: `${feat.bar * 2.5}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <TrendingUp className="size-3.5 text-success" />
                    Projected Competency Gain:
                  </div>
                  <p className="text-muted-foreground">
                    Completing this <strong>{course.duration}</strong> course is projected to raise
                    your {course.category} score by <strong>+12.4 points</strong>, advancing you to
                    Advanced Cadre standing.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button size="sm" onClick={() => setShowXai(false)}>
                  Close Explanation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </article>

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
    </>
  );
}
