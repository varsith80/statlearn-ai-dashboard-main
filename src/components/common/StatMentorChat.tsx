import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Sparkles,
  Bot,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useUserStore,
  useQuizResultsStore,
  useMaterialsStore,
  useLearningStore,
  useSettingsStore,
} from "@/lib/quiz-store";

interface ChatMessage {
  id: string;
  sender: "user" | "mentor";
  text: string;
  timestamp: string;
  citation?: string;
}

const PREDEFINED_QUESTIONS = [
  "What are my priority skill gaps & recommended courses?",
  "Explain PPS Sampling vs Simple Random Sampling",
  "How are multipliers calculated in NSS 79th Round?",
  "What are the 6 core dimensions of NQAF?",
  "Why does the Laspeyres index exhibit substitution bias?",
  "Explain GDP approaches & Double Deflation (SNA 2008)",
];

interface KnowledgeTopic {
  keywords: string[];
  answer: string;
  citation: string;
}

const MOSPI_KNOWLEDGE_BASE: KnowledgeTopic[] = [
  {
    keywords: ["pps", "ppswr", "simple random", "srs", "inclusion probability", "probability proportional"],
    answer:
      "Probability Proportional to Size (PPS) gives larger First Stage Units (such as census villages with larger populations) a proportionately higher probability of selection ($p_i \\propto Z_i$). In Simple Random Sampling (SRS), every unit has an equal selection probability regardless of size.\n\nIn official multi-stage household surveys (like NSS), PPS with Replacement (PPSWR) or Circular Systematic Sampling (CSS) reduces sample variance for aggregated totals while ensuring large population centers are properly represented.",
    citation: "Source: NSS 79th Round – Concepts, Definitions & Sampling Methodology, Section 3",
  },
  {
    keywords: ["multiplier", "weight", "design weight", "horvitz", "estimation procedure", "fsu weight"],
    answer:
      "A multiplier (sampling weight) is the inverse of the overall inclusion probability of a sample unit ($w_i = 1 / \\pi_i$).\n\nIn the 2-stage stratified NSS design, the household multiplier combines:\n1. First Stage Unit (FSU) weight — inverse of village/UFS block selection probability.\n2. Hamlet-group / Sub-block factor ($D$) — accounts for large village partitioning.\n3. Second Stage Stratum (SSS) household selection ratio ($N_{ij} / n_{ij}$).\n\nApplying these weights yields the unbiased Horvitz-Thompson estimator of population totals.",
    citation: "Source: MoSPI National Sample Survey Estimation Handbook, Section 4",
  },
  {
    keywords: ["nqaf", "6 core", "six core", "quality dimension", "quality assurance", "timeliness", "punctuality", "relevance", "coherence"],
    answer:
      "Under the National Quality Assurance Framework (NQAF), official statistics are evaluated across 6 core dimensions:\n1. Relevance — Meeting user and policy requirements.\n2. Accuracy & Reliability — Closeness of estimates to true population values (minimizing sampling & non-sampling errors).\n3. Timeliness & Punctuality — Minimal lag and adherence to the Advance Release Calendar (ARC).\n4. Accessibility & Clarity — Clear metadata, visualizations, and microdata access.\n5. Coherence & Comparability — Consistency across surveys, regions, and time.\n6. Manageability — Respondent burden control and statutory confidentiality.",
    citation: "Source: National Quality Assurance Framework (NQAF) Guidelines, MoSPI",
  },
  {
    keywords: ["laspeyres", "paasche", "fisher", "jevons", "carli", "dutot", "substitution bias", "price index", "cpi", "wpi", "base year"],
    answer:
      "Price Index Methodology in Official Statistics:\n• Laspeyres Index: Uses fixed base-period quantities ($q_0$) as weights. It exhibits upward substitution bias because it does not reflect consumers switching away from goods that become relatively expensive.\n• Paasche Index: Uses current-period quantities ($q_t$) and tends to understate cost-of-living increases.\n• Fisher Ideal Index: The geometric mean $\\sqrt{L \\times P}$, satisfying both time-reversal and factor-reversal tests.\n• Jevons Index: Geometric mean of price relatives used for unweighted elementary aggregates (preferred over Carli to avoid upward bias).\n• Base Year Revision: Conducted every 5–7 years using Household Consumption Expenditure Survey (HCES) weights.",
    citation: "Source: Index Number Theory & CPI/WPI Compilation Manual, PSD, MoSPI",
  },
  {
    keywords: ["gdp", "gva", "national accounts", "sna", "double deflation", "fisim", "sut", "supply and use"],
    answer:
      "Under SNA 2008 (National Accounts):\n• GDP at Market Prices = Gross Value Added (GVA) at Basic Prices + Product Taxes − Product Subsidies.\n• Three Approaches: Production (Output minus Intermediate Consumption), Income (Compensation of Employees + Operating Surplus + Mixed Income), and Expenditure ($C + I + G + (X - M)$).\n• Double Deflation: Output and intermediate consumption are deflated separately using appropriate price indices to derive real Constant-Price GVA.\n• Supply and Use Tables (SUT): Reconcile commodity-level supply and demand across institutional sectors.",
    citation: "Source: National Accounts Fundamentals (SNA 2008), NAD, MoSPI",
  },
  {
    keywords: ["imputation", "non-response", "missing data", "hot-deck", "hot deck", "donor", "substitution"],
    answer:
      "Handling Item Non-Response under NQAF:\n• Scientifically validated imputation methods—such as Hot-Deck donor matching, k-NN imputation, or stratum-level mean/ratio imputation—must be applied during data processing.\n• Arbitrary substitution of non-responding households in the field is strictly prohibited by NQAF guidelines, as it introduces severe selection bias.\n• All imputed values must be flagged in microdata metadata logs.",
    citation: "Source: NQAF Section 3 – Imputation Strategy & Edit Rules",
  },
  {
    keywords: ["sampling error", "non-sampling", "nonsampling", "rse", "relative standard error", "cv", "variance", "deff", "design effect"],
    answer:
      "Sampling vs. Non-Sampling Errors:\n• Sampling Error arises from observing a sample rather than the full population. It decreases with $\\sqrt{n}$ and is quantified via Standard Error (SE) and Relative Standard Error (RSE / CV). Estimates with RSE > 20% require cautionary footnotes.\n• Non-Sampling Error stems from recall bias, coverage gaps, and measurement errors. Expanding sample size does NOT reduce non-sampling error—it requires CAPI validation rules and field supervision.\n• Design Effect ($DEFF$): Ratio of complex survey variance to SRS variance of the same size.",
    citation: "Source: NSS Survey Methodology & Variance Diagnostics Manual",
  },
  {
    keywords: ["small area", "sae", "fay-herriot", "domain estimation", "district level"],
    answer:
      "Small Area Estimation (SAE) combines direct survey estimates with auxiliary census or administrative covariates using shrinkage models (such as the Fay-Herriot area-level model).\n\nWhen sample sizes within individual districts or sub-strata are too small to yield acceptable direct RSE (<20%), SAE 'borrows strength' across related areas to produce reliable district-level official indicators.",
    citation: "Source: Advanced Statistical Modelling – Small Area Estimation Module, NSSTA",
  },
  {
    keywords: ["strata", "stratification", "fsu", "usu", "hamlet", "sub-block", "multi-stage", "ufs"],
    answer:
      "Stratified Multi-Stage Survey Architecture:\n• First Stage Units (FSUs): Census villages in rural sectors and Urban Frame Survey (UFS) blocks in urban sectors.\n• Ultimate Stage Units (USUs): Households or enterprises selected within FSUs.\n• Stratification: Grouping homogeneous units into rural/urban district strata prior to selection increases precision.\n• Hamlet-Group / Sub-Block Formation: Large FSUs exceeding population threshold $D$ are partitioned into segments to control field listing workload.",
    citation: "Source: NSS 79th Round – Survey Design & Stratification Strategy",
  },
  {
    keywords: ["confidentiality", "anonymization", "microdata", "collection of statistics act", "sdc", "k-anonymity", "top-coding", "governance", "un fundamental"],
    answer:
      "Official Statistics Governance & Microdata Confidentiality:\n• Under the Collection of Statistics Act and UN Fundamental Principle 6, individual respondent schedules are strictly confidential and cannot be used in legal or taxation proceedings.\n• Before public microdata release, Statistical Disclosure Control (SDC) must be applied: scrubbing direct identifiers, enforcing $k$-anonymity, and top/bottom-coding extreme outliers.",
    citation: "Source: Official Statistics & Governance Module, MoSPI / iGOT Karmayogi",
  },
  {
    keywords: ["r programming", "svydesign", "quarto", "reproducible", "pipeline", "validate", "capi"],
    answer:
      "Reproducible Pipelines in R for Official Statistics:\n• Complex survey designs are declared using `svydesign(ids = ~fsu_id, strata = ~stratum_id, weights = ~multiplier, data = df)` from the `survey` package.\n• Use `svymean()` and `svytotal()` for weighted domain estimates with Taylor-linearized or replicate-weight standard errors.\n• Deterministic range and cross-variable edit rules are encoded using the `validate` package, and reports are automated via Quarto.",
    citation: "Source: Introduction to R & Reproducible Pipelines for Official Statistics, NSSTA",
  },
  {
    keywords: ["igot", "karmayogi", "cbc", "dpc", "credits", "certificate"],
    answer:
      "StatLearn AI integrates bi-directionally with the iGOT Karmayogi ecosystem (Capacity Building Commission / DoPT):\n• Completed NSSTA and iGOT courses automatically sync learning hours toward your 150-hour annual ISS cadre training target.\n• You can trigger a live ledger sync anytime from the iGOT Karmayogi page.",
    citation: "Source: iGOT Karmayogi Integration Hub",
  },
];

export function StatMentorChat() {
  const { userProfile } = useUserStore();
  const { competencyRadar, results } = useQuizResultsStore();
  const { materials } = useMaterialsStore();
  const { courses } = useLearningStore();
  const { settings } = useSettingsStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "msg-1",
      sender: "mentor",
      text: `Namaste ${userProfile.name}! I am your StatMentor AI assistant. You can ask me about your competency gaps, uploaded study notes, NSS sampling methodology, NQAF quality dimensions, price indices, or National Accounts.`,
      timestamp: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  function generateSmartBuiltInResponse(query: string): { answer: string; citation: string } {
    const lower = query.toLowerCase().trim();

    // 1. Greetings & general help
    if (/^(hi|hello|hey|namaste|good morning|good afternoon|help|who are you)\b/.test(lower)) {
      const avgScore = Math.round(
        competencyRadar.reduce((acc, c) => acc + c.score, 0) / (competencyRadar.length || 1),
      );
      return {
        answer: `Namaste ${userProfile.name} (${userProfile.role})! Your current overall competency score is ${avgScore}% across ${competencyRadar.length} MoSPI domains.\n\nHere is what I can help you with right now:\n• Analyze your priority skill gaps & recommend training courses\n• Search and summarize your ${materials.length} uploaded study notes\n• Answer technical questions on PPS sampling, multipliers, NQAF, Laspeyres/Paasche indices, SNA 2008 GDP, or R survey pipelines.`,
        citation: `Active Profile: ${userProfile.employeeId} • ${userProfile.office}`,
      };
    }

    // 2. Personal Competency Gaps, Scores, or Course Recommendations
    if (
      /\b(my gap|skill gap|my score|my competency|what should i study|recommend|weak|priority|my progress|my course|dashboard)\b/.test(
        lower,
      )
    ) {
      const sortedByGap = [...competencyRadar]
        .map((c) => ({ ...c, gap: c.benchmark - c.score }))
        .sort((a, b) => b.gap - a.gap);
      const topGaps = sortedByGap.slice(0, 3);
      const strongest = [...competencyRadar].sort((a, b) => b.score - a.score)[0];
      const inProgressCourses = courses.filter((c) => c.status === "In Progress");

      return {
        answer:
          `Based on your live competency profile (${userProfile.name}):\n\n` +
          `1. Priority Competency Gaps:\n` +
          topGaps
            .map(
              (g, i) =>
                `   ${i + 1}. ${g.area}: ${g.score}% (Benchmark: ${g.benchmark}% → Gap: ${Math.max(0, g.gap)}%)`,
            )
            .join("\n") +
          `\n\n2. Strongest Area: ${strongest?.area || "Data Visualization"} (${strongest?.score || 88}%)\n` +
          `3. Recommended Next Action: Focus on "${inProgressCourses[0]?.title || "Data Quality Assurance"}" and take an adaptive assessment in the AI Quiz Generator (${results.length} quizzes completed so far).`,
        citation: "Source: Live SQLite Competency Profile & MoSPI Framework v3.2",
      };
    }

    // 3. Summarize or query uploaded notes
    if (/\b(summarize|my notes|uploaded|documents|materials|library)\b/.test(lower)) {
      const docList = materials
        .slice(0, 5)
        .map(
          (m, idx) =>
            `${idx + 1}. ${m.name} (${m.wordCount} words) — Topics: ${m.detectedTopics.slice(0, 3).join(", ")}`,
        )
        .join("\n");
      return {
        answer: `You currently have ${materials.length} study documents in your library:\n\n${docList}\n\nAsk me about any specific topic in these notes, or head to the AI Quiz Generator to create custom MCQs from them!`,
        citation: "Source: Uploaded Learning Materials Library (SQLite DB)",
      };
    }

    // 4. Match against comprehensive MoSPI Knowledge Base
    let bestTopic: KnowledgeTopic | null = null;
    let bestScore = 0;
    for (const topic of MOSPI_KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of topic.keywords) {
        if (lower.includes(kw)) {
          score += kw.includes(" ") ? 3 : 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestTopic = topic;
      }
    }
    if (bestTopic && bestScore >= 2) {
      return { answer: bestTopic.answer, citation: bestTopic.citation };
    }

    // 5. Semantic search across the user's actual uploaded study notes!
    const queryWords = lower
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !["what", "how", "why", "explain", "tell", "about", "the", "and", "for", "with", "from"].includes(w));

    if (queryWords.length > 0) {
      let bestSentences: Array<{ sentence: string; docName: string; hits: number }> = [];
      for (const doc of materials) {
        const sentences = doc.content
          .split(/(?<=[.?!])\s+|\n+/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 25);
        for (const s of sentences) {
          const sLower = s.toLowerCase();
          let hits = 0;
          for (const qw of queryWords) {
            if (sLower.includes(qw)) hits++;
          }
          if (hits > 0) {
            bestSentences.push({ sentence: s, docName: doc.name, hits });
          }
        }
      }

      bestSentences.sort((a, b) => b.hits - a.hits);
      if (bestSentences.length > 0 && bestSentences[0]!.hits >= 1) {
        const topMatches = bestSentences.slice(0, 3);
        const combined = topMatches.map((m) => `• ${m.sentence}`).join("\n\n");
        return {
          answer: `Here is what your uploaded study notes state regarding "${query}":\n\n${combined}`,
          citation: `Source: ${topMatches[0]!.docName}`,
        };
      }
    }

    // 6. Helpful fallback with actionable guidance
    return {
      answer:
        `In official statistical operations under MoSPI, "${query}" relates to survey methodology, estimation accuracy, and quality assurance standards.\n\n` +
        `Try asking me about:\n` +
        `• "What are my priority skill gaps?"\n` +
        `• "Explain PPS sampling vs Simple Random Sampling"\n` +
        `• "How are multipliers calculated in NSS?"\n` +
        `• "What are the 6 dimensions of NQAF?"\n` +
        `• "Explain Laspeyres vs Paasche price indices"\n` +
        `• "Explain GDP & Double Deflation in SNA 2008"`,
      citation: "Source: StatMentor AI • MoSPI Capacity Building Assistant",
    };
  }

  async function callExternalLlmIfConfigured(query: string): Promise<{
    answer: string;
    citation: string;
  } | null> {
    const provider = settings.aiProvider;
    if (provider === "builtin") return null;

    const apiKey =
      provider === "gemini" ? settings.geminiApiKey?.trim() : settings.openaiApiKey?.trim();
    if (!apiKey) return null;

    const radarSummary = competencyRadar
      .map((c) => `${c.area}: ${c.score}% (Benchmark ${c.benchmark}%)`)
      .join(", ");
    const notesContext = materials
      .slice(0, 3)
      .map((m) => `[${m.name}]: ${m.summary || m.content.slice(0, 600)}`)
      .join("\n");

    const systemPrompt = `You are StatMentor AI, an expert statistical mentor for India's Ministry of Statistics and Programme Implementation (MoSPI) and National Statistical Systems Training Academy (NSSTA).
Current Officer: ${userProfile.name} (${userProfile.role}, ${userProfile.office}).
Live Competency Scores: ${radarSummary}.
Uploaded Study Materials Context:
${notesContext}

Provide a clear, accurate, concise response (under 180 words) grounded in official statistics, sampling theory, NQAF, price statistics, or National Accounts.`;

    try {
      if (provider === "gemini") {
        const models = Array.from(
          new Set([
            settings.geminiModel || "gemini-2.5-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
          ]),
        );
        for (const model of models) {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: `${systemPrompt}\n\nOfficer Question: ${query}` }],
                  },
                ],
                generationConfig: { temperature: 0.3 },
              }),
            },
          );
          if (!res.ok) continue;
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              answer: text.trim(),
              citation: `Generated by Google Gemini (${model}) • MoSPI Context`,
            };
          }
        }
      } else if (provider === "openai") {
        const model = settings.openaiModel || "gpt-4o-mini";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: 0.3,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return {
              answer: text.trim(),
              citation: `Generated by OpenAI (${model}) • MoSPI Context`,
            };
          }
        }
      }
    } catch (err) {
      console.warn("StatMentor external LLM fallback:", err);
    }
    return null;
  }

  const handleSend = async (query?: string) => {
    const textToSend = (query ?? inputText).trim();
    if (!textToSend || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!query) setInputText("");
    setIsTyping(true);

    const llmReply = await callExternalLlmIfConfigured(textToSend);
    if (llmReply) {
      setMessages((prev) => [
        ...prev,
        {
          id: `men-${Date.now()}`,
          sender: "mentor",
          text: llmReply.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          citation: llmReply.citation,
        },
      ]);
      setIsTyping(false);
      return;
    }

    setTimeout(() => {
      const reply = generateSmartBuiltInResponse(textToSend);
      const mentorMsg: ChatMessage = {
        id: `men-${Date.now()}`,
        sender: "mentor",
        text: reply.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citation: reply.citation,
      };
      setMessages((prev) => [...prev, mentorMsg]);
      setIsTyping(false);
    }, 350);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full border border-primary/30 bg-gradient-brand px-4 py-3 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
          aria-label="Open StatMentor AI"
        >
          <span className="grid size-6 place-items-center rounded-full bg-white/20">
            <Sparkles className="size-3.5 text-white" />
          </span>
          <span className="text-xs font-bold tracking-wide">StatMentor AI</span>
          <span className="size-2 rounded-full bg-success animate-pulse" />
        </button>
      )}

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-navy px-4 py-3 text-sidebar-foreground">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-brand text-white">
                <Bot className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-xs font-bold text-white">StatMentor AI</h3>
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                </div>
                <p className="text-[10px] text-sidebar-foreground/75">
                  {settings.aiProvider === "builtin"
                    ? "Built-in Statistical NLP + Notes Search"
                    : `Connected: ${settings.aiProvider.toUpperCase()}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: `msg-${Date.now()}`,
                      sender: "mentor",
                      text: `Chat cleared. How can I help you with your statistical competencies or study notes, ${userProfile.name}?`,
                      timestamp: "Just now",
                    },
                  ])
                }
                title="Clear conversation"
                className="grid size-7 place-items-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Trash2 className="size-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="grid size-7 place-items-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border/80 bg-muted/40 p-2 text-xs no-scrollbar">
            {PREDEFINED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => void handleSend(q)}
                className="shrink-0 rounded-full border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4 text-xs leading-relaxed"
          >
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser && (
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground text-[10px]">
                      <Bot className="size-3.5" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[84%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs",
                      isUser
                        ? "rounded-tr-none bg-primary text-primary-foreground font-medium"
                        : "rounded-tl-none border border-border bg-card text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.citation && (
                      <div className="mt-2 border-t border-border/60 pt-1.5 text-[10px] italic text-muted-foreground">
                        {m.citation}
                      </div>
                    )}
                    <span className="mt-1 block text-right text-[9px] opacity-60">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="grid size-6 place-items-center rounded-md bg-accent text-[10px]">
                  <Bot className="size-3.5" />
                </span>
                <span className="animate-pulse">Analyzing statistical guidelines & notes…</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about your gaps, notes, sampling, NQAF…"
                className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isTyping || !inputText.trim()}
                className="h-8 shrink-0 gap-1 px-3 text-xs"
              >
                <Send className="size-3" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
