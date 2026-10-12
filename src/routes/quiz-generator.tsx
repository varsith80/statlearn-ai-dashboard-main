import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  Target,
  BookOpen,
  Download,
  AlertCircle,
  Cpu,
  Bookmark,
  Sliders,
  FileEdit,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { AIInsightCard } from "@/components/common/AIInsightCard";
import { StatusPill } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NoteDocument,
  MCQQuestion,
  QuizConfig,
  QuizResult,
  extractTextFromFile,
  analyzeNotes,
  generateQuestionsWithLLM,
  sanitizeMCQQuestion,
  sanitizeNoteDocument,
  COMPETENCY_DOMAINS,
} from "@/lib/ai-quiz-engine";
import {
  useMaterialsStore,
  useQuizResultsStore,
  useSettingsStore,
  getStagedDocumentForQuiz,
  stageDocumentForQuiz,
  PRELOADED_NOTES,
} from "@/lib/quiz-store";
import { toast } from "sonner";

export const Route = createFileRoute("/quiz-generator")({
  head: () => ({
    meta: [
      { title: "AI Quiz Generator | StatLearn AI" },
      {
        name: "description",
        content:
          "Upload your notes, configure custom AI suggestions, and generate real MCQ assessments mapped to statistical competencies.",
      },
      { property: "og:title", content: "AI Quiz Generator | StatLearn AI" },
      {
        property: "og:description",
        content:
          "Generate authentic MCQs from uploaded notes, lecture materials, and study summaries.",
      },
    ],
  }),
  component: QuizGenerator,
});

type Stage = "configure" | "generating" | "quiz" | "result";
type IngestionMode = "upload" | "paste" | "preloaded";

const countOptions = [5, 10, 15, 20, 25];
const difficulties: QuizConfig["difficulty"][] = ["Easy", "Medium", "Hard", "Adaptive"];
const questionTypes: QuizConfig["qType"][] = [
  "MCQ",
  "Conceptual",
  "True or False",
  "Scenario",
  "Mixed",
];

function QuizGenerator() {
  const { addMaterial } = useMaterialsStore();
  const { recordQuizResult } = useQuizResultsStore();
  const { settings } = useSettingsStore();

  const [stage, setStage] = useState<Stage>("configure");
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>("upload");

  // Document state
  const [activeDoc, setActiveDoc] = useState<NoteDocument | null>(null);
  const [pastedTitle, setPastedTitle] = useState("Custom Lecture Notes");
  const [pastedText, setPastedText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [readingFile, setReadingFile] = useState(false);

  // Configuration state
  const [count, setCount] = useState(settings.defaultQuestionCount || 10);
  const [difficulty, setDifficulty] = useState<QuizConfig["difficulty"]>(
    settings.defaultDifficulty || "Medium",
  );
  const [qType, setQType] = useState<QuizConfig["qType"]>(settings.defaultQType || "MCQ");
  const [targetCompetency, setTargetCompetency] = useState("Auto Detect");
  const [customSuggestions, setCustomSuggestions] = useState("");
  const [aiProvider, setAiProvider] = useState<"builtin" | "gemini" | "openai">(
    settings.aiProvider || "builtin",
  );

  // Quiz running state
  const [generatingStep, setGeneratingStep] = useState(0);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [reveal, setReveal] = useState(settings.showAnswerInstantly);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Result state
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "flagged">("all");

  // Check if a document was staged from Learning Materials
  useEffect(() => {
    const staged = getStagedDocumentForQuiz();
    if (staged) {
      setActiveDoc(sanitizeNoteDocument(staged));
      stageDocumentForQuiz(null); // Clear staged doc
      toast.success(`Loaded "${staged.name}" for assessment generation.`);
    } else if (!activeDoc && PRELOADED_NOTES.length > 0) {
      // Default to first preloaded note if none selected
      setActiveDoc(PRELOADED_NOTES[0]);
    }
  }, []);

  // Timer during active quiz
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (stage === "quiz") {
      timer = setInterval(() => {
        setSecondsElapsed((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage]);

  // Handle file drop / upload
  async function handleFileSelect(file: File) {
    try {
      setReadingFile(true);
      const { content, type } = await extractTextFromFile(file);
      const analysis = analyzeNotes(content, file.name);

      const newDoc: NoteDocument = {
        id: `mat-${Date.now()}`,
        name: file.name,
        content,
        type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        wordCount: analysis.wordCount,
        charCount: analysis.charCount,
        detectedTopics: analysis.detectedTopics,
        suggestedCompetencies: analysis.suggestedCompetencies,
        summary: analysis.summary,
      };

      setActiveDoc(newDoc);
      addMaterial(newDoc);
      toast.success(`Extracted ${analysis.wordCount} words from ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error(
        "Failed to read file. Please ensure it is a valid text, markdown, docx, or pdf file.",
      );
    } finally {
      setReadingFile(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }

  // Handle pasted text submission
  function handleApplyPastedNotes() {
    if (!pastedText.trim()) {
      toast.error("Please paste or write your notes first.");
      return;
    }

    const analysis = analyzeNotes(pastedText, pastedTitle);
    const newDoc: NoteDocument = {
      id: `mat-${Date.now()}`,
      name: pastedTitle.trim() || "Custom Notes",
      content: pastedText,
      type: "PASTED",
      size: `${(pastedText.length / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      wordCount: analysis.wordCount,
      charCount: analysis.charCount,
      detectedTopics: analysis.detectedTopics,
      suggestedCompetencies: analysis.suggestedCompetencies,
      summary: analysis.summary,
    };

    setActiveDoc(newDoc);
    addMaterial(newDoc);
    toast.success(`Notes applied (${analysis.wordCount} words analyzed).`);
  }

  // Generate quiz
  async function handleStartGeneration() {
    if (!activeDoc || !activeDoc.content.trim()) {
      toast.error("Please upload or select notes before generating questions.");
      return;
    }

    const cleanDoc = sanitizeNoteDocument(activeDoc);
    if (cleanDoc !== activeDoc) {
      setActiveDoc(cleanDoc);
    }

    setStage("generating");
    setGeneratingStep(0);
    setAnswers({});
    setFlagged({});
    setCurrentIndex(0);
    setSecondsElapsed(0);
    setReveal(settings.showAnswerInstantly);

    // Progress animation
    const stepInterval = setInterval(() => {
      setGeneratingStep((s) => Math.min(s + 1, 3));
    }, 600);

    try {
      const apiKey = aiProvider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey;
      const modelName = aiProvider === "gemini" ? settings.geminiModel : settings.openaiModel;

      const generated = await generateQuestionsWithLLM(cleanDoc.content, {
        count,
        difficulty,
        qType,
        topic: cleanDoc.detectedTopics[0] || "General Concepts",
        competency:
          targetCompetency === "Auto Detect"
            ? cleanDoc.suggestedCompetencies[0]
            : targetCompetency,
        customSuggestions,
        aiProvider,
        apiKey,
        modelName,
      });

      clearInterval(stepInterval);
      setGeneratingStep(4);
      setQuestions(generated.map((q, idx) => sanitizeMCQQuestion(q, idx)));

      setTimeout(() => {
        setStage("quiz");
        toast.success(`Generated ${generated.length} MCQs from "${activeDoc.name}"`);
      }, 500);
    } catch (err) {
      console.error(err);
      clearInterval(stepInterval);
      toast.error("Error generating assessment. Please try again.");
      setStage("configure");
    }
  }

  // Submit quiz & calculate diagnostics
  function handleSubmitQuiz() {
    if (!activeDoc || questions.length === 0) return;

    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) {
        correctCount++;
      }
    });

    const pct = Math.round((correctCount / questions.length) * 100);
    const targetComp =
      targetCompetency === "Auto Detect"
        ? activeDoc.suggestedCompetencies[0] || "Survey Methodology"
        : targetCompetency;

    const competencyImpact: Record<string, number> = {
      [targetComp]: pct >= 80 ? 4.2 : pct >= 60 ? 2.5 : 0.8,
      "Data Quality": pct >= 70 ? 1.5 : 0.5,
    };

    // Construct tailored suggestions
    const wrongQuestions = questions.filter((q) => answers[q.id] !== q.answer);
    const followUps = [
      wrongQuestions.length > 0
        ? `Review the key concepts for "${wrongQuestions[0].topic}": ${wrongQuestions[0].noteReference?.slice(0, 100) || "See note excerpt"}`
        : "Excellent mastery! You scored 100% on this assessment.",
      `Reinforce ${targetComp} competencies through linked NSSTA coursework.`,
      `Generate an adaptive quiz focusing on edge cases in "${activeDoc.name}".`,
    ];

    const resultRecord: QuizResult = {
      id: `res-${Date.now()}`,
      materialId: activeDoc.id,
      materialName: activeDoc.name,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      percentage: pct,
      timeSpentSeconds: secondsElapsed,
      completedAt: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      difficulty,
      qType,
      competencyImpact,
      suggestedFollowUps: followUps,
      questions,
      userAnswers: answers,
    };

    setLastResult(resultRecord);
    recordQuizResult(resultRecord);
    setStage("result");
    toast.success(`Quiz completed! Score: ${pct}%`);
  }

  // Export questions to file
  function handleExportQuiz(format: "txt" | "json" | "md") {
    if (!lastResult && questions.length === 0) return;
    const qList = lastResult ? lastResult.questions : questions;
    let content = "";
    let mimeType = "text/plain";
    const extension = format;

    if (format === "json") {
      content = JSON.stringify(qList, null, 2);
      mimeType = "application/json";
    } else if (format === "md") {
      content = `# AI Generated Assessment: ${activeDoc?.name || "Statistical Assessment"}\n\n`;
      content += `*Generated by StatLearn AI · ${difficulty} Difficulty · ${qType}*\n\n---\n\n`;
      qList.forEach((q, idx) => {
        content += `### Q${idx + 1}. ${q.question}\n\n`;
        q.options.forEach((opt, oIdx) => {
          content += `- **${String.fromCharCode(65 + oIdx)}.** ${opt}\n`;
        });
        content += `\n**Correct Answer:** ${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}\n\n`;
        content += `**Explanation:** ${q.explanation}\n\n`;
        if (q.noteReference) {
          content += `> **Source Note Reference:** ${q.noteReference}\n\n`;
        }
        content += `---\n\n`;
      });
      mimeType = "text/markdown";
    } else {
      content = `AI Generated Assessment: ${activeDoc?.name || "Official Statistics"}\n\n`;
      qList.forEach((q, idx) => {
        content += `Q${idx + 1}: ${q.question}\n`;
        q.options.forEach((opt, oIdx) => {
          content += `  ${String.fromCharCode(65 + oIdx)}. ${opt}\n`;
        });
        content += `  Correct: ${String.fromCharCode(65 + q.answer)}\n`;
        content += `  Explanation: ${q.explanation}\n\n`;
      });
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StatLearn-Quiz-${activeDoc?.name.replace(/\.[^/.]+$/, "") || "Assessment"}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported quiz as .${format}`);
  }

  // Formatting seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ----------------------------------------------------
  // RENDER: GENERATING STAGE
  // ----------------------------------------------------
  if (stage === "generating") {
    const generationSteps = [
      "Parsing document structure & segmenting key concepts",
      "Analyzing terminology & mapping to MoSPI Competencies",
      `Synthesizing ${count} questions matching user suggestions`,
      "Formulating pedagogical distractors & verifying answer keys",
    ];

    return (
      <>
        <PageHeader
          title="AI Quiz Generator"
          subtitle="Synthesizing assessment from your uploaded material…"
        />
        <div className="card-surface flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-gradient-brand shadow-lg">
            <Loader2 className="size-8 animate-spin text-primary-foreground" />
          </span>
          <div className="max-w-md">
            <p className="font-display text-xl font-semibold">
              AI is analyzing "{activeDoc?.name}"
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Extracting statistical concepts and drafting {count} {difficulty.toLowerCase()}{" "}
              {qType} questions.
            </p>
            {customSuggestions && (
              <p className="mt-2 rounded-lg bg-primary/5 p-2 text-xs italic text-primary">
                "{customSuggestions}"
              </p>
            )}
          </div>
          <div className="mt-4 w-full max-w-md space-y-3 text-left">
            {generationSteps.map((step, idx) => {
              const done = idx < generatingStep;
              const current = idx === generatingStep;
              return (
                <div
                  key={step}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-sm transition-all",
                    done
                      ? "border-success/30 bg-success/5 text-success"
                      : current
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "border-border text-muted-foreground opacity-60",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : current ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <div className="size-4 shrink-0 rounded-full border border-border" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // ----------------------------------------------------
  // RENDER: ACTIVE QUIZ STAGE
  // ----------------------------------------------------
  if (stage === "quiz" && questions.length > 0) {
    const q = sanitizeMCQQuestion(questions[currentIndex], currentIndex);
    const isAnswered = answers[q.id] !== undefined;
    const isFlagged = !!flagged[q.id];
    const totalAnswered = Object.keys(answers).length;

    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{q.topic}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs font-medium text-accent-foreground">{q.difficulty}</span>
            </div>
            <h1 className="mt-1 font-display text-xl font-semibold tracking-tight">
              Assessment: {activeDoc?.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium tabular-nums">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>
            <Button
              variant={isFlagged ? "default" : "outline"}
              size="sm"
              onClick={() => setFlagged((f) => ({ ...f, [q.id]: !f[q.id] }))}
              className="gap-1.5"
            >
              <Bookmark className="size-3.5" /> {isFlagged ? "Flagged" : "Flag for review"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to exit? Your current progress will be lost.",
                  )
                ) {
                  setStage("configure");
                }
              }}
            >
              Exit
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-brand transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question & Options Area */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <SectionCard
              title={`Question ${currentIndex + 1}`}
              description={q.competency}
              actions={
                <span className="text-xs font-medium text-muted-foreground">
                  {totalAnswered} of {questions.length} answered
                </span>
              }
            >
              <p className="text-base font-medium leading-relaxed sm:text-lg">{q.question}</p>

              <div className="mt-6 space-y-3">
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === i;
                  const isCorrect = reveal && i === q.answer;
                  const isWrong = reveal && selected && i !== q.answer;

                  return (
                    <button
                      key={opt + i}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-xl border p-4 text-left text-sm transition-all",
                        "hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected && !reveal && "border-primary bg-primary/5 font-medium shadow-sm",
                        isCorrect &&
                          "border-success bg-success/10 font-medium text-success dark:bg-success/20",
                        isWrong &&
                          "border-destructive bg-destructive/10 text-destructive dark:bg-destructive/20",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold transition-colors",
                          selected &&
                            !reveal &&
                            "border-primary bg-primary text-primary-foreground",
                          isCorrect && "border-success bg-success text-success-foreground",
                          isWrong &&
                            "border-destructive bg-destructive text-destructive-foreground",
                          !selected && !isCorrect && "border-border text-muted-foreground",
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 leading-normal">{opt}</span>
                      {isCorrect && <CheckCircle2 className="size-4 shrink-0 text-success" />}
                      {isWrong && <XCircle className="size-4 shrink-0 text-destructive" />}
                    </button>
                  );
                })}
              </div>

              {/* Real-time explanation & note citation if revealed */}
              {reveal && (
                <div className="mt-6 space-y-3">
                  <AIInsightCard title="AI Pedagogical Explanation" insight={q.explanation} />
                  {q.noteReference && (
                    <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Reference from your notes:</p>
                      <blockquote className="mt-1 italic border-l-2 border-primary/50 pl-2.5">
                        "{q.noteReference}"
                      </blockquote>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Toolbar */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setCurrentIndex((i) => i - 1);
                    if (!settings.showAnswerInstantly) setReveal(false);
                  }}
                  className="gap-1.5"
                >
                  <ChevronLeft className="size-4" /> Previous
                </Button>

                <Button variant="secondary" size="sm" onClick={() => setReveal((r) => !r)}>
                  {reveal ? "Hide explanation" : "Check answer"}
                </Button>

                {currentIndex < questions.length - 1 ? (
                  <Button
                    className="gap-1.5"
                    onClick={() => {
                      setCurrentIndex((i) => i + 1);
                      if (!settings.showAnswerInstantly) setReveal(false);
                    }}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    className="gap-1.5 bg-success hover:bg-success/90"
                    onClick={handleSubmitQuiz}
                  >
                    Submit Assessment <CheckCircle2 className="size-4" />
                  </Button>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Question Palette Sidebar */}
          <div>
            <SectionCard
              title="Questions"
              description={`${totalAnswered} of ${questions.length} answered`}
            >
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 lg:grid-cols-4">
                {questions.map((item, idx) => {
                  const answered = answers[item.id] !== undefined;
                  const isCur = currentIndex === idx;
                  const isFlag = !!flagged[item.id];

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        if (!settings.showAnswerInstantly) setReveal(false);
                      }}
                      className={cn(
                        "relative flex size-10 items-center justify-center rounded-lg border text-xs font-medium transition-all",
                        isCur &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background font-bold",
                        answered
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {idx + 1}
                      {isFlag && (
                        <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded bg-primary/20 border border-primary" /> Answered
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded bg-card border border-border" /> Unanswered
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500" /> Flagged for review
                </div>
              </div>

              <Button variant="default" className="mt-6 w-full" onClick={handleSubmitQuiz}>
                Finish & Submit
              </Button>
            </SectionCard>
          </div>
        </div>
      </>
    );
  }

  // ----------------------------------------------------
  // RENDER: RESULT & DIAGNOSTICS STAGE
  // ----------------------------------------------------
  if (stage === "result" && lastResult) {
    const qList = lastResult.questions.map((q, idx) => sanitizeMCQQuestion(q, idx));
    const filteredQuestions = qList.filter((q) => {
      if (reviewFilter === "wrong") return lastResult.userAnswers[q.id] !== q.answer;
      if (reviewFilter === "flagged") return !!flagged[q.id];
      return true;
    });

    return (
      <>
        <PageHeader
          eyebrow="Assessment Complete"
          title="Assessment Performance & Diagnostics"
          subtitle={`Evaluated against the MoSPI competency framework for "${lastResult.materialName}".`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleExportQuiz("md")}
              >
                <Download className="size-3.5" /> Export Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleExportQuiz("json")}
              >
                <Download className="size-3.5" /> Export JSON
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setStage("configure")}>
                <RotateCcw className="size-4" /> New Assessment
              </Button>
            </div>
          }
        />

        {/* Score KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Score</p>
              <Target className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {lastResult.correctAnswers} / {lastResult.totalQuestions}
            </p>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <Sparkles className="size-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{lastResult.percentage}%</p>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <Clock className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {formatTime(lastResult.timeSpentSeconds)}
            </p>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Difficulty Level</p>
              <Sliders className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{lastResult.difficulty}</p>
          </div>
        </div>

        {/* Diagnostics & Review */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard
              title="Answer Review"
              description="Detailed solutions, pedagogical rationale, and citations from your notes"
              actions={
                <div className="flex gap-1 rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setReviewFilter("all")}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      reviewFilter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    All ({qList.length})
                  </button>
                  <button
                    onClick={() => setReviewFilter("wrong")}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      reviewFilter === "wrong"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    Mistakes (
                    {qList.filter((q) => lastResult.userAnswers[q.id] !== q.answer).length})
                  </button>
                  <button
                    onClick={() => setReviewFilter("flagged")}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      reviewFilter === "flagged"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    Flagged ({Object.values(flagged).filter(Boolean).length})
                  </button>
                </div>
              }
            >
              {filteredQuestions.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 size-8 text-success" />
                  No questions in this filter view.
                </div>
              ) : (
                <ul className="space-y-4">
                  {filteredQuestions.map((q, i) => {
                    const userAns = lastResult.userAnswers[q.id];
                    const isOk = userAns === q.answer;
                    return (
                      <li key={q.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <StatusPill tone={isOk ? "success" : "warning"}>
                              {isOk ? "Correct" : "Needs Review"}
                            </StatusPill>
                            <p className="text-sm font-semibold">
                              Q{q.id}. {q.question}
                            </p>
                          </div>
                          {flagged[q.id] && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                              Flagged
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-1.5 pl-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const selected = userAns === oIdx;
                            const isCorrectOpt = q.answer === oIdx;

                            return (
                              <div
                                key={opt + oIdx}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
                                  isCorrectOpt && "bg-success/10 font-medium text-success",
                                  selected &&
                                    !isCorrectOpt &&
                                    "bg-destructive/10 font-medium text-destructive",
                                  !selected && !isCorrectOpt && "text-muted-foreground",
                                )}
                              >
                                <span className="font-semibold">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <span>{opt}</span>
                                {isCorrectOpt && (
                                  <span className="ml-auto text-[10px] font-bold uppercase">
                                    (Correct Answer)
                                  </span>
                                )}
                                {selected && !isCorrectOpt && (
                                  <span className="ml-auto text-[10px] font-bold uppercase">
                                    (Your Choice)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                          <strong className="text-foreground">Explanation:</strong> {q.explanation}
                        </p>

                        {q.noteReference && (
                          <blockquote className="mt-2 rounded-lg bg-muted/40 p-2.5 text-[11px] italic text-muted-foreground">
                            <strong>Note Citation:</strong> "{q.noteReference}"
                          </blockquote>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <AIInsightCard
              title="AI Learning Recommendations"
              items={lastResult.suggestedFollowUps}
            />

            <SectionCard
              title="Competency Growth"
              description="Calculated impact from this session"
            >
              <ul className="space-y-3 text-sm">
                {Object.entries(lastResult.competencyImpact).map(([comp, val]) => (
                  <li key={comp} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{comp}</span>
                    <span className="font-medium text-success">+{val}%</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" className="mt-4 w-full text-xs">
                <Link to="/competencies">View Competency Radar</Link>
              </Button>
            </SectionCard>

            <SectionCard title="Next Steps" description="Continue training">
              <div className="space-y-2">
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => {
                    setStage("configure");
                    setCustomSuggestions(
                      "Generate questions testing the concepts missed in the previous quiz.",
                    );
                  }}
                >
                  <Sparkles className="size-4 text-violet" />
                  Target missed concepts
                </Button>
                <Button asChild className="w-full justify-start gap-2" variant="outline">
                  <Link to="/recommendations">
                    <BookOpen className="size-4 text-primary" />
                    Recommended Courses
                  </Link>
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      </>
    );
  }

  // ----------------------------------------------------
  // RENDER: CONFIGURE & INGESTION STAGE (DEFAULT)
  // ----------------------------------------------------
  return (
    <>
      <PageHeader
        eyebrow="Assessment Studio"
        title="AI Quiz Generator"
        subtitle="Upload your notes or paste study material to generate competency-aligned assessments with custom AI suggestions."
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/learning-materials">
              <FolderOpen className="size-4" /> Browse Saved Notes
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Note Ingestion */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Upload or Provide Learning Material"
            description="Support for PDF, DOCX, TXT, Markdown, or raw pasted study notes"
            actions={
              <div className="flex gap-1 rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setIngestionMode("upload")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    ingestionMode === "upload"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  File Upload
                </button>
                <button
                  onClick={() => setIngestionMode("paste")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    ingestionMode === "paste"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  Paste Notes
                </button>
                <button
                  onClick={() => setIngestionMode("preloaded")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    ingestionMode === "preloaded"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  Official Notes
                </button>
              </div>
            }
          >
            {ingestionMode === "upload" && (
              <div>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                    dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                    readingFile && "opacity-50 pointer-events-none",
                  )}
                >
                  <input
                    type="file"
                    className="sr-only"
                    onChange={onPick}
                    accept=".pdf,.docx,.pptx,.txt,.md,.json,.csv"
                  />
                  <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                    {readingFile ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <UploadCloud className="size-6" />
                    )}
                  </span>
                  <p className="mt-3 text-sm font-medium">
                    {readingFile
                      ? "Extracting document content…"
                      : "Drag and drop your study material here"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    or click to browse from your device (PDF, DOCX, TXT, MD)
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {["PDF", "DOCX", "TXT", "MARKDOWN", "CSV"].map((ext) => (
                      <span
                        key={ext}
                        className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {ext}
                      </span>
                    ))}
                  </div>
                </label>
              </div>
            )}

            {ingestionMode === "paste" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Document / Topic Title
                  </label>
                  <input
                    type="text"
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                    placeholder="e.g. Sampling Error & Estimation Lecture Notes"
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Paste Lecture Notes, Definitions, or Article Text
                  </label>
                  <textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste the text of your notes here... The AI will extract concepts, definitions, and formulas directly from this text."
                    className="mt-1 w-full rounded-lg border border-border bg-card p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <Button size="sm" onClick={handleApplyPastedNotes} className="gap-2">
                  <FileEdit className="size-4" /> Load Pasted Notes for Assessment
                </Button>
              </div>
            )}

            {ingestionMode === "preloaded" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Select one of the official statistical reference notes to generate an assessment
                  immediately:
                </p>
                <div className="grid gap-2 sm:grid-cols-1">
                  {PRELOADED_NOTES.map((note) => {
                    const isSelected = activeDoc?.id === note.id;
                    return (
                      <button
                        key={note.id}
                        onClick={() => {
                          setActiveDoc(note);
                          toast.success(`Selected "${note.name}"`);
                        }}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                          <BookOpen className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-semibold">{note.name}</p>
                            {isSelected && <StatusPill tone="success">Active</StatusPill>}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {note.summary}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {note.detectedTopics.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Document Analysis Card */}
            {activeDoc && (
              <div className="mt-5 rounded-xl border border-border bg-card/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <FileText className="size-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">{activeDoc.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {activeDoc.wordCount} words · {activeDoc.size} · Uploaded{" "}
                        {activeDoc.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <StatusPill tone="success">Ready for Generation</StatusPill>
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Detected Topics in Note:
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {activeDoc.detectedTopics.map((top) => (
                      <span
                        key={top}
                        className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs text-primary font-medium"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Suggested Competency:{" "}
                    <strong>{activeDoc.suggestedCompetencies.join(", ")}</strong>
                  </span>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Column: AI Configuration & Custom Suggestions */}
        <div>
          <SectionCard
            title="AI Generation Settings"
            description="Customize model, count & suggestions"
          >
            <div className="space-y-5">
              {/* Question Count */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Number of Questions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {countOptions.map((c) => (
                    <Chip key={c} active={count === c} onClick={() => setCount(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Difficulty Level
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {difficulties.map((d) => (
                    <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                      {d}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Question Format */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Question Format
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {questionTypes.map((t) => (
                    <Chip key={t} active={qType === t} onClick={() => setQType(t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Competency Domain */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  MoSPI Competency Target
                </p>
                <select
                  value={targetCompetency}
                  onChange={(e) => setTargetCompetency(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                >
                  <option value="Auto Detect">Auto-Detect from Notes</option>
                  {COMPETENCY_DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom AI Suggestions & Guidance */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Custom AI Suggestions
                  </p>
                  <span className="text-[10px] text-primary">Optional prompt</span>
                </div>
                <textarea
                  rows={3}
                  value={customSuggestions}
                  onChange={(e) => setCustomSuggestions(e.target.value)}
                  placeholder="e.g. Focus on sampling error vs non-sampling error; test definition of FSU; generate tricky distractors..."
                  className="w-full rounded-lg border border-border bg-card p-2.5 text-xs focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  AI will prioritize your suggestions when formulating stems and options.
                </p>
              </div>

              {/* AI Engine Selection */}
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Cpu className="size-3.5 text-primary" /> AI Engine
                  </span>
                  <Link to="/settings" className="text-[11px] text-primary hover:underline">
                    Settings
                  </Link>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => setAiProvider("builtin")}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-center text-xs font-medium transition-colors",
                      aiProvider === "builtin"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    Built-in NLP
                  </button>
                  <button
                    onClick={() => setAiProvider("gemini")}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-center text-xs font-medium transition-colors",
                      aiProvider === "gemini"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    Gemini API
                  </button>
                  <button
                    onClick={() => setAiProvider("openai")}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-center text-xs font-medium transition-colors",
                      aiProvider === "openai"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    OpenAI API
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                className="w-full gap-2 py-5 text-sm font-semibold shadow-md"
                disabled={!activeDoc}
                onClick={handleStartGeneration}
              >
                <Sparkles className="size-4" /> Generate Assessment with AI
              </Button>

              {!activeDoc && (
                <p className="text-center text-xs text-muted-foreground">
                  Select or upload learning material to generate questions.
                </p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
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
          ? "border-primary bg-primary text-primary-foreground font-semibold"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
