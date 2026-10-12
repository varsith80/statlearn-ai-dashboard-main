import { useState } from "react";
import {
  MessageSquareText,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  BookOpen,
  ChevronDown,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "mentor";
  text: string;
  timestamp: string;
  citation?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "mentor",
    text: "Namaste Officer Sharma! I am your StatMentor AI assistant, trained on official MoSPI guidelines, NQAF frameworks, and NSSTA statistical methodology. How may I assist your capacity development today?",
    timestamp: "Just now",
  },
];

const PREDEFINED_QUESTIONS = [
  "Explain PPS Sampling vs Simple Random Sampling",
  "How are multipliers calculated in NSS 79th Round?",
  "What are the 6 core dimensions of NQAF?",
  "Why does the Laspeyres index exhibit substitution bias?",
];

const KNOWLEDGE_RESPONSES: Record<string, { answer: string; citation: string }> = {
  "Explain PPS Sampling vs Simple Random Sampling": {
    answer:
      "Probability Proportional to Size (PPS) gives larger First Stage Units (such as census villages with large populations) a proportionately higher probability of selection. In Simple Random Sampling (SRS), every unit has an equal probability regardless of size.\n\nIn official multi-stage household surveys (like NSS), PPS with Replacement (PPSWR) or Circular Systematic Sampling (CSS) balances sample variance for aggregated totals, ensuring that large villages are adequately represented without distorting design weights.",
    citation: "Source: NSS 79th Round – Concepts & Definitions, Section 3.2",
  },
  "How are multipliers calculated in NSS 79th Round?": {
    answer:
      "A multiplier (or sampling weight) is the inverse of the inclusion probability of the sample observation.\n\nIn the 2-stage stratified NSS design, the total multiplier combines:\n1. FSU sampling weight (inverse of village/UFS block selection probability)\n2. Hamlet-group / Sub-block multiplier (adjustment factor if large villages were partitioned)\n3. Ultimate Stage Unit (household) sampling weight within the chosen stratum.\n\nApplying this combined multiplier to sample household data yields the unbiased Horvitz-Thompson estimator of the national population total.",
    citation: "Source: MoSPI National Sample Survey Estimation Handbook, Chapter 4",
  },
  "What are the 6 core dimensions of NQAF?": {
    answer:
      "Under the National Quality Assurance Framework (NQAF), official data products are evaluated across six dimensions:\n1. Relevance: Meeting current and potential user policy needs.\n2. Accuracy & Reliability: Closeness of estimates to true values, controlling both sampling and non-sampling error.\n3. Timeliness & Punctuality: Minimal release lag and strict adherence to the Advanced Release Calendar (ARC).\n4. Accessibility & Clarity: Metadata availability and public microdata dissemination.\n5. Coherence & Comparability: Consistency over time, across regions, and between survey rounds.\n6. Manageability: Balancing operational burden with respondent confidentiality.",
    citation: "Source: National Quality Assurance Framework for Official Statistics (NQAF), MoSPI",
  },
  "Why does the Laspeyres index exhibit substitution bias?": {
    answer:
      "The Laspeyres price index measures price changes using a fixed consumption basket from the base period (weights $q_0$).\n\nWhen relative prices rise, consumers naturally substitute away from more expensive goods toward relatively cheaper alternatives. Because the Laspeyres index assumes fixed consumption weights ($q_0$), it fails to account for this consumer substitution, systematically overestimating the true increase in the cost of living. Conversely, the Paasche index uses current weights ($q_1$) and tends to underestimate inflation. The Fisher Ideal Index (geometric mean) minimizes this bias.",
    citation: "Source: Manual on Consumer Price Index Numbers, Price Statistics Division, MoSPI",
  },
};

export function StatMentorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (query?: string) => {
    const textToSend = query || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!query) setInputText("");
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      let matchedResponse = KNOWLEDGE_RESPONSES[textToSend];

      if (!matchedResponse) {
        // Semantic keyword matching
        const lower = textToSend.toLowerCase();
        if (lower.includes("pps") || lower.includes("sampling") || lower.includes("strata")) {
          matchedResponse = KNOWLEDGE_RESPONSES["Explain PPS Sampling vs Simple Random Sampling"];
        } else if (
          lower.includes("multiplier") ||
          lower.includes("weight") ||
          lower.includes("estimator")
        ) {
          matchedResponse =
            KNOWLEDGE_RESPONSES["How are multipliers calculated in NSS 79th Round?"];
        } else if (lower.includes("quality") || lower.includes("nqaf") || lower.includes("error")) {
          matchedResponse = KNOWLEDGE_RESPONSES["What are the 6 core dimensions of NQAF?"];
        } else if (
          lower.includes("index") ||
          lower.includes("laspeyres") ||
          lower.includes("price") ||
          lower.includes("paasche")
        ) {
          matchedResponse =
            KNOWLEDGE_RESPONSES["Why does the Laspeyres index exhibit substitution bias?"];
        } else {
          matchedResponse = {
            answer: `According to MoSPI official statistical manuals, "${textToSend}" directly impacts data reliability and official dissemination standards. For rigorous implementation, consult the NSSTA training modules on methodology and design weight verification.`,
            citation: "Source: Indian Statistical System Compendium & MoSPI Competency Guidelines",
          };
        }
      }

      const mentorMsg: ChatMessage = {
        id: `men-${Date.now()}`,
        sender: "mentor",
        text: matchedResponse.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citation: matchedResponse.citation,
      };

      setMessages((prev) => [...prev, mentorMsg]);
      setIsTyping(false);
    }, 750);
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
                  MoSPI Statistical Capacity Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="grid size-7 place-items-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border/80 bg-muted/40 p-2 text-xs no-scrollbar">
            {PREDEFINED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="shrink-0 rounded-full border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs leading-relaxed">
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
                      "max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs",
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
                <span className="animate-pulse">Consulting MoSPI guidelines…</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about sampling, NQAF, formulas…"
                className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="sm" className="h-8 shrink-0 gap-1 px-3 text-xs">
                <Send className="size-3" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
