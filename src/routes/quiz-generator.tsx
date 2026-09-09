import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  UploadCloud,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  Target,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { AIInsightCard } from "@/components/common/AIInsightCard";
import { StatusPill } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { quizQuestions } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quiz-generator")({
  head: () => ({
    meta: [
      { title: "AI Quiz Generator | StatLearn AI" },
      {
        name: "description",
        content:
          "Upload statistical learning material and generate MCQ assessments with simulated AI question generation.",
      },
      { property: "og:title", content: "AI Quiz Generator | StatLearn AI" },
      {
        property: "og:description",
        content: "Generate assessments from PDF, DOCX, PPTX or TXT learning material.",
      },
    ],
  }),
  component: QuizGenerator,
});

type Stage = "configure" | "generating" | "quiz" | "result";

const countOptions = [10, 20, 30, 50];
const difficulties = ["Easy", "Medium", "Hard"];
const types = ["MCQ", "True or False", "Mixed"];
const topics = ["Auto Detect", "Sampling Methods", "Data Quality", "Index Numbers", "Governance"];

function QuizGenerator() {
  const [stage, setStage] = useState<Stage>("configure");
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [qType, setQType] = useState("MCQ");
  const [topic, setTopic] = useState("Auto Detect");

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [reveal, setReveal] = useState(false);

  function simulateUpload(name: string, size: string) {
    setFile({ name, size });
    setUploadPct(0);
    let pct = 0;
    const timer = setInterval(() => {
      pct += Math.random() * 22 + 8;
      if (pct >= 100) {
        pct = 100;
        clearInterval(timer);
      }
      setUploadPct(Math.round(pct));
    }, 240);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) simulateUpload(f.name, `${(f.size / 1024 / 1024).toFixed(1)} MB`);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) simulateUpload(f.name, `${(f.size / 1024 / 1024).toFixed(1)} MB`);
  }

  function generate() {
    setStage("generating");
    setIndex(0);
    setAnswers({});
    setReveal(false);
    setTimeout(() => setStage("quiz"), 2600);
  }

  const questions = quizQuestions;
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  const pct = Math.round((correct / questions.length) * 100);

  if (stage === "generating") {
    return (
      <>
        <PageHeader title="AI Quiz Generator" subtitle="Generating your assessment…" />
        <div className="card-surface flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-brand">
            <Loader2 className="size-6 animate-spin text-primary-foreground" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold">AI is reading your document</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Extracting key concepts, mapping to competencies and drafting {count} {difficulty.toLowerCase()}{" "}
              {qType} questions.
            </p>
          </div>
          <div className="mt-2 w-full max-w-md space-y-2 text-left">
            {["Parsing document structure", "Identifying statistical concepts", "Drafting questions", "Validating answer keys"].map(
              (s, i) => (
                <div key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className={cn("size-4", i < 3 ? "text-success" : "text-border")} />
                  {s}
                </div>
              ),
            )}
          </div>
        </div>
      </>
    );
  }

  if (stage === "quiz") {
    const q = questions[index];
    return (
      <>
        <PageHeader
          eyebrow={`Question ${index + 1} of ${questions.length}`}
          title="AI Generated Assessment"
          subtitle={`Source: ${file?.name ?? "NSS 79th Round – Concepts & Definitions.pdf"} · ${difficulty} · ${qType}`}
          actions={<StatusPill tone="info">Auto-saved</StatusPill>}
        />

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-brand transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>

        <SectionCard title={`Q${index + 1}`} description={q.question}>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              const isCorrect = reveal && i === q.answer;
              const isWrong = reveal && selected && i !== q.answer;
              return (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-primary bg-primary/5" : "border-border",
                    isCorrect && "border-success bg-success/10",
                    isWrong && "border-destructive bg-destructive/10",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-md border text-xs font-semibold",
                      selected ? "border-primary text-primary" : "border-border text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                  {isCorrect && <CheckCircle2 className="ml-auto size-4 text-success" />}
                </button>
              );
            })}
          </div>

          {reveal && (
            <AIInsightCard className="mt-4" title="Explanation" insight={q.explanation} />
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => {
                setIndex((i) => i - 1);
                setReveal(false);
              }}
              className="gap-1.5"
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button variant="secondary" onClick={() => setReveal((r) => !r)}>
              {reveal ? "Hide answer" : "Show answer"}
            </Button>
            {index < questions.length - 1 ? (
              <Button
                className="ml-auto gap-1.5"
                onClick={() => {
                  setIndex((i) => i + 1);
                  setReveal(false);
                }}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button className="ml-auto" onClick={() => setStage("result")}>
                Submit Quiz
              </Button>
            )}
          </div>
        </SectionCard>
      </>
    );
  }

  if (stage === "result") {
    return (
      <>
        <PageHeader
          eyebrow="Assessment complete"
          title="Quiz Result"
          subtitle="Your performance has been mapped to the MoSPI competency framework."
          actions={
            <Button className="gap-2" onClick={() => setStage("configure")}>
              <RotateCcw className="size-4" /> Generate another quiz
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Score", value: `${correct} / ${questions.length}`, icon: Target },
            { label: "Percentage", value: `${pct}%`, icon: Sparkles },
            { label: "Incorrect answers", value: `${questions.length - correct}`, icon: FileText },
            { label: "Time taken", value: "08m 42s", icon: Clock },
          ].map((s) => (
            <div key={s.label} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard title="Answer Review" description="Correct answers and explanations">
              <ul className="space-y-4">
                {questions.map((q, i) => {
                  const ok = answers[q.id] === q.answer;
                  return (
                    <li key={q.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start gap-2">
                        <StatusPill tone={ok ? "success" : "warning"}>
                          {ok ? "Correct" : "Review"}
                        </StatusPill>
                        <p className="text-sm font-medium">
                          Q{i + 1}. {q.question}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Correct answer: {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {q.explanation}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          </div>
          <div className="space-y-6">
            <AIInsightCard insight="You demonstrated strong understanding of sampling concepts. Consider revisiting estimation techniques and sampling error before attempting the advanced modelling assessment." />
            <SectionCard title="Competency Impact" description="Projected change from this assessment">
              <ul className="space-y-3 text-sm">
                {[
                  ["Survey Methodology", "+3.2%"],
                  ["Data Quality", "+1.4%"],
                  ["Statistical Methods", "+0.8%"],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-success">{v}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Assessment studio"
        title="AI Quiz Generator"
        subtitle="Upload official learning material and generate a competency-aligned assessment in seconds."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Upload Learning Material" description="PDF, DOCX, PPTX or TXT · up to 25 MB">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <input type="file" className="sr-only" onChange={onPick} accept=".pdf,.docx,.pptx,.txt" />
              <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <UploadCloud className="size-5" />
              </span>
              <p className="mt-4 text-sm font-medium">Drag and drop your file here</p>
              <p className="mt-1 text-xs text-muted-foreground">or click to browse from your device</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["PDF", "DOCX", "PPTX", "TXT"].map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </label>

            {file && (
              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <FileText className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <StatusPill tone={uploadPct === 100 ? "success" : "info"}>
                    {uploadPct === 100 ? "Ready for AI processing" : "Uploading"}
                  </StatusPill>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-brand transition-all"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
              </div>
            )}

            {!file && (
              <button
                onClick={() =>
                  simulateUpload("NSS 79th Round – Concepts & Definitions.pdf", "4.2 MB")
                }
                className="mt-4 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Use a sample document instead
              </button>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Configuration" description="Tune the generated assessment">
          <div className="space-y-5">
            <ConfigGroup label="Number of Questions">
              {countOptions.map((c) => (
                <Chip key={c} active={count === c} onClick={() => setCount(c)}>
                  {c}
                </Chip>
              ))}
            </ConfigGroup>
            <ConfigGroup label="Difficulty">
              {difficulties.map((d) => (
                <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                  {d}
                </Chip>
              ))}
            </ConfigGroup>
            <ConfigGroup label="Question Type">
              {types.map((t) => (
                <Chip key={t} active={qType === t} onClick={() => setQType(t)}>
                  {t}
                </Chip>
              ))}
            </ConfigGroup>
            <ConfigGroup label="Topic">
              {topics.map((t) => (
                <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
                  {t}
                </Chip>
              ))}
            </ConfigGroup>

            <Button className="w-full gap-2" disabled={!file || uploadPct < 100} onClick={generate}>
              <Sparkles className="size-4" /> Generate Quiz with AI
            </Button>
            {(!file || uploadPct < 100) && (
              <p className="text-center text-xs text-muted-foreground">
                Upload a document to enable generation.
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function ConfigGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
