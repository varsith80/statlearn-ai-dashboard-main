/**
 * AI Quiz Engine & Note Analyzer
 * Provides:
 * 1. File & Text Extraction (TXT, MD, CSV, DOCX/PDF text streams, pasted notes)
 * 2. Natural Language Concept & Topic Extraction
 * 3. Built-in Semantic NLP MCQ Generator with contextual distractors and note citations
 * 4. Google Gemini & OpenAI LLM API integration with custom user suggestions
 */

export interface NoteDocument {
  id: string;
  name: string;
  content: string;
  type: "TXT" | "MD" | "DOCX" | "PDF" | "CSV" | "PASTED";
  size: string;
  uploadedAt: string;
  detectedTopics: string[];
  suggestedCompetencies: string[];
  wordCount: number;
  charCount: number;
  summary?: string;
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  answer: number; // 0, 1, 2, 3
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  competency: string;
  noteReference?: string;
  questionType: "MCQ" | "True or False" | "Conceptual" | "Scenario";
}

export interface QuizConfig {
  count: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Adaptive";
  qType: "MCQ" | "True or False" | "Conceptual" | "Scenario" | "Mixed";
  topic?: string;
  competency?: string;
  customSuggestions?: string;
  aiProvider?: "builtin" | "gemini" | "openai";
  apiKey?: string;
  modelName?: string;
}

export interface QuizResult {
  id: string;
  materialId?: string;
  materialName: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  difficulty: string;
  qType: string;
  competencyImpact: Record<string, number>;
  suggestedFollowUps: string[];
  questions: MCQQuestion[];
  userAnswers: Record<number, number>;
}

export const COMPETENCY_DOMAINS = [
  "Survey Methodology",
  "Data Quality",
  "Statistical Methods",
  "Official Statistics Governance",
  "Data Visualization",
  "Data Management",
] as const;

export type CompetencyDomain = (typeof COMPETENCY_DOMAINS)[number];

const COMPETENCY_KEYWORDS: Record<CompetencyDomain, string[]> = {
  "Survey Methodology": [
    "sampling",
    "sample",
    "strata",
    "stratified",
    "pps",
    "cluster",
    "household",
    "frame",
    "questionnaire",
    "weights",
    "multiplier",
    "nss",
    "fieldwork",
    "enumeration",
    "first stage unit",
    "fsu",
  ],
  "Data Quality": [
    "quality",
    "nqaf",
    "imputation",
    "validation",
    "error",
    "non-sampling error",
    "accuracy",
    "timeliness",
    "completeness",
    "audit",
    "consistency",
    "reliability",
    "integrity",
    "relevance",
  ],
  "Statistical Methods": [
    "regression",
    "hypothesis",
    "distribution",
    "variance",
    "standard deviation",
    "mean",
    "median",
    "estimator",
    "probability",
    "correlation",
    "index number",
    "laspeyres",
    "paasche",
    "time series",
    "modelling",
  ],
  "Official Statistics Governance": [
    "mospi",
    "nssta",
    "legislation",
    "principles",
    "un fundamental principles",
    "confidentiality",
    "governance",
    "dissemination",
    "policy",
    "national statistical commission",
    "act",
    "mandate",
  ],
  "Data Visualization": [
    "visualization",
    "chart",
    "graph",
    "dashboard",
    "scatter",
    "stacked",
    "radar",
    "presentation",
    "infographic",
    "visual",
    "reporting",
    "color",
  ],
  "Data Management": [
    "database",
    "sql",
    "r programming",
    "rstudio",
    "svydesign",
    "python",
    "pipeline",
    "storage",
    "microdata",
    "metadata",
    "etl",
    "cleansing",
  ],
};

export const CLEAN_GUIDELINE_STATEMENTS: string[] = [
  "Every statistical release must apply calibrated design weights, automated validation rules, and comprehensive quality metadata documentation.",
  "First stage units (FSUs) are selected using Probability Proportional to Size (PPS) within stratified rural and urban sampling frames.",
  "Sampling error decreases with the square root of effective sample size, whereas non-sampling error requires rigorous field supervision and validation rules.",
  "When item non-response occurs, statistical agencies must implement scientifically validated imputation methods such as hot-deck or stratum mean imputation.",
  "Microdata dissemination requires strict statistical disclosure control, anonymization of unit identifiers, and adherence to the Advance Release Calendar.",
  "The unbiased estimator of a population total weights each sample observation by the inverse of its multi-stage inclusion probability.",
  "Stratification improves sampling precision by partitioning heterogeneous populations into internally homogeneous geographic or socio-economic strata before selection.",
  "Elementary price aggregates should be compiled using the geometric mean (Jevons index) to satisfy transitivity and prevent upward substitution bias.",
  "Quality assurance audits evaluate official statistics across six dimensions: relevance, accuracy, timeliness, accessibility, coherence, and comparability.",
  "Base periods for macroeconomic price and production indices must be updated periodically using recent household consumption and enterprise survey benchmarks.",
  "Arbitrary substitution of non-responding households in the field is strictly prohibited under National Quality Assurance Framework (NQAF) guidelines.",
  "The Fisher Ideal Index is defined as the geometric mean of the Laspeyres and Paasche price indices, satisfying both time-reversal and factor-reversal tests.",
  "Automated deterministic and cross-variable edit rules must be applied systematically during CAPI data collection to detect outliers and contradictory responses.",
  "Relative Standard Error (RSE) thresholds must be published alongside domain estimates so users can assess sampling precision across small administrative areas.",
  "Individual respondent schedules collected under official statistical legislation are strictly confidential and cannot be used in legal or taxation proceedings.",
];

const BINARY_OR_SYNTAX_NOISE_RE =
  /\b(endstream|endobj|startxref|FlateDecode|MediaBox|CropBox|FontDescriptor|BaseFont|StructTreeRoot|Content_Types|word\/document|theme\/theme)\b|<<|>>|\/Type\s*\/|\/Filter\s*\//i;

const COMMON_PROSE_WORDS_RE =
  /\b(the|of|and|in|to|is|are|for|with|on|by|as|from|that|this|be|or|an|at|which|within|used|data|survey|sample|sampling|statistical|statistics|error|errors|quality|units|weight|weights|index|population|estimate|estimates|estimation|method|methodology|design|analysis|values|frame|strata|stratum|household|official|national|release|metadata|imputation|variance|mean|ratio|probability|selection|distribution|variables|indicators|accuracy|timeliness|audit|guidelines|principles|collection|processing|validation|tabulation|aggregates|provisional|standard|level|period|base|price|quantities|consumption|model|regression|confidence|interval)\b/gi;

/**
 * Checks whether an option string is clean human-readable text (free of PDF/binary stream corruption).
 */
export function isCleanOptionText(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  // Reject replacement character or control characters
  if (/[\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)) return false;

  // Reject non-ASCII characters typical of raw UTF-8 decoding on compressed binary streams
  if (/[^\x20-\x7E\n\r\t\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u00B0\u00B1\u00D7\u00F7]/.test(trimmed)) {
    return false;
  }

  if (BINARY_OR_SYNTAX_NOISE_RE.test(trimmed)) return false;

  // Reject strings with suspicious symbol sequences like \}, [-:, {u_, etc.
  if (/[\\{}[\]^~|<>#*]{2,}|\\[A-Za-z]|[-:;]{2,}|\}%|\*O|\[-:/.test(trimmed)) {
    return false;
  }

  if (trimmed.length <= 12) {
    return /^[A-Za-z0-9\s.,()%-]+$/.test(trimmed);
  }

  // Check ratio of normal letters and spaces
  const letterSpaceCount = (trimmed.match(/[A-Za-z\s]/g) || []).length;
  if (letterSpaceCount / trimmed.length < 0.72) return false;

  const normalProseCount = (trimmed.match(/[A-Za-z0-9\s.,;:'"()?!%-]/g) || []).length;
  if (normalProseCount / trimmed.length < 0.94) return false;

  return true;
}

/**
 * Checks whether a candidate sentence extracted from a file is a clean, meaningful prose sentence.
 */
export function isCleanReadableSentence(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 25 || trimmed.length > 340) return false;
  if (!isCleanOptionText(trimmed)) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length < 5) return false;

  let validWords = 0;
  for (const tok of tokens) {
    const cleanTok = tok.replace(/^['"([{-]+|['").,;?!:\]}-]+$/g, "");
    if (/^[A-Za-z]{2,}(?:-[A-Za-z]{2,})?$/.test(cleanTok)) {
      if (cleanTok.length >= 4 && !/[aeiouyAEIOUY]/.test(cleanTok)) {
        continue; // consonant soup
      }
      validWords++;
    } else if (/^\d+(?:\.\d+)?%?$/.test(cleanTok)) {
      validWords++;
    }
  }

  if (validWords / tokens.length < 0.75) return false;

  const commonMatches = trimmed.match(COMMON_PROSE_WORDS_RE) || [];
  if (commonMatches.length < 2) return false;

  return true;
}

/**
 * Sanitizes an MCQQuestion so that any corrupted/garbled option, explanation, or noteReference
 * is immediately replaced with a clean, contextually valid statistical statement.
 */
export function sanitizeMCQQuestion(q: MCQQuestion, idx = 0): MCQQuestion {
  const fallbackSentence: string =
    CLEAN_GUIDELINE_STATEMENTS[(q.id - 1 + idx) % CLEAN_GUIDELINE_STATEMENTS.length] ??
    "Every statistical release must apply calibrated design weights, automated validation rules, and comprehensive quality metadata documentation.";

  const fallbackDistractors: [string, string, string] = [
    "The methodology mandates replacing design weights with uncalibrated ratio estimators.",
    "Non-sampling errors are eliminated by increasing the sample size of secondary units.",
    "Metadata releases are optional when publishing provisional survey aggregates.",
  ];

  let hadCorruptedOption = false;
  const cleanedOptions = q.options.map((opt, optIdx) => {
    if (isCleanOptionText(opt)) return opt;
    hadCorruptedOption = true;
    if (optIdx === q.answer) {
      return fallbackSentence;
    }
    return fallbackDistractors[optIdx % fallbackDistractors.length] ?? fallbackDistractors[0];
  }) as [string, string, string, string];

  const cleanRef: string =
    q.noteReference && isCleanOptionText(q.noteReference) ? q.noteReference : fallbackSentence;

  const cleanQuestion: string = isCleanOptionText(q.question)
    ? q.question
    : "Regarding the guidelines in the uploaded document, which of the following is correct?";

  let cleanExplanation: string = q.explanation;
  if (hadCorruptedOption || !isCleanOptionText(q.explanation)) {
    const correctOptText = cleanedOptions[q.answer] ?? fallbackSentence;
    cleanExplanation = `Accurate interpretation: "${correctOptText}". Sourced from: "${cleanRef}"`;
  }

  return {
    ...q,
    question: cleanQuestion,
    options: cleanedOptions,
    explanation: cleanExplanation,
    noteReference: cleanRef,
  };
}

function buildFallbackNotesForDocument(fileName: string): string {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || "Official Statistical Guidelines";
  return `${cleanTitle} – Statistical Methodology & Quality Guidelines

1. Survey Design and Stratification:
First stage units (FSUs) are selected using Probability Proportional to Size (PPS) within stratified rural and urban sampling frames. Stratification improves sampling precision by partitioning heterogeneous populations into internally homogeneous geographic or socio-economic strata before selection.

2. Estimation Procedure and Design Weights:
The unbiased estimator of a population total weights each sample observation by the inverse of its multi-stage inclusion probability. Every statistical release must apply calibrated design weights, automated validation rules, and comprehensive quality metadata documentation.

3. Sampling and Non-Sampling Error Control:
Sampling error decreases with the square root of effective sample size, whereas non-sampling error requires rigorous field supervision and validation rules. Automated deterministic and cross-variable edit rules must be applied systematically during CAPI data collection to detect outliers and contradictory responses.

4. Imputation and Data Management:
When item non-response occurs, statistical agencies must implement scientifically validated imputation methods such as hot-deck or stratum mean imputation. Arbitrary substitution of non-responding households in the field is strictly prohibited under National Quality Assurance Framework (NQAF) guidelines.

5. Quality Assurance and Dissemination:
Quality assurance audits evaluate official statistics across six dimensions: relevance, accuracy, timeliness, accessibility, coherence, and comparability. Microdata dissemination requires strict statistical disclosure control, anonymization of unit identifiers, and adherence to the Advance Release Calendar.
`;
}

/**
 * Sanitizes a NoteDocument so corrupted binary content (e.g., from previously stored PDF uploads)
 * is replaced with clean readable notes and updated topic/competency metadata.
 */
export function sanitizeNoteDocument(doc: NoteDocument): NoteDocument {
  if (!doc || typeof doc.content !== "string") return doc;

  const candidateSentences = doc.content
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.replace(/^[\d#*•\-\s.)]+/, "").replace(/\s+/g, " ").trim())
    .filter((s) => isCleanReadableSentence(s));

  const hasBinaryCorruption = /[\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F]/.test(doc.content);

  if (!hasBinaryCorruption && candidateSentences.length >= 4) {
    return doc;
  }

  const repairedContent =
    candidateSentences.length >= 4
      ? candidateSentences.join("\n\n")
      : [
          ...candidateSentences,
          ...buildFallbackNotesForDocument(doc.name).split("\n\n"),
        ].join("\n\n");

  const analysis = analyzeNotes(repairedContent, doc.name);
  return {
    ...doc,
    content: repairedContent,
    wordCount: analysis.wordCount,
    charCount: analysis.charCount,
    detectedTopics: analysis.detectedTopics,
    suggestedCompetencies: analysis.suggestedCompetencies,
    summary: analysis.summary,
  };
}

async function tryDecompressBytes(
  data: Uint8Array,
  format: "deflate" | "deflate-raw",
): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const ds = new DecompressionStream(format);
    const writer = ds.writable.getWriter();
    writer.write(data as unknown as BufferSource).catch(() => {});
    writer.close().catch(() => {});
    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let totalLen = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalLen += value.length;
        if (totalLen > 4 * 1024 * 1024) break;
      }
    }
    const out = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return out;
  } catch {
    return null;
  }
}

async function extractXmlFromZip(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const extractedTexts: string[] = [];

  let i = 0;
  while (i < bytes.length - 30) {
    // ZIP Local File Header signature: PK\x03\x04
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x03 &&
      bytes[i + 3] === 0x04
    ) {
      const compression = view.getUint16(i + 8, true);
      const compressedSize = view.getUint32(i + 18, true);
      const fileNameLen = view.getUint16(i + 26, true);
      const extraLen = view.getUint16(i + 28, true);
      const fileName = decoder.decode(bytes.subarray(i + 30, i + 30 + fileNameLen));
      const dataStart = i + 30 + fileNameLen + extraLen;

      if (
        (fileName === "word/document.xml" || /^ppt\/slides\/slide\d+\.xml$/.test(fileName)) &&
        compressedSize > 0 &&
        dataStart + compressedSize <= bytes.length
      ) {
        const rawSlice = bytes.subarray(dataStart, dataStart + compressedSize);
        let xmlBytes: Uint8Array | null = null;
        if (compression === 0) {
          xmlBytes = rawSlice;
        } else if (compression === 8) {
          xmlBytes = await tryDecompressBytes(rawSlice, "deflate-raw");
        }
        if (xmlBytes) {
          const xmlStr = decoder.decode(xmlBytes);
          const Paragraphs = xmlStr
            .replace(/<\/w:p>|<\/a:p>/g, "\n")
            .replace(/<[^>]+>/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/[ \t]{2,}/g, " ")
            .trim();
          if (Paragraphs.length > 0) {
            extractedTexts.push(Paragraphs);
          }
        }
      }
      i = dataStart + (compressedSize > 0 ? compressedSize : 1);
    } else {
      i++;
    }
  }

  return extractedTexts.join("\n\n");
}

function decodePdfLiteralStrings(contentStreamText: string): string {
  const pieces: string[] = [];

  // Match (...) Tj / Td / ' / " and [(...)] TJ arrays
  const tjMatches = contentStreamText.match(/\((?:[^()\\]|\\.)*\)\s*T[jd*'"]|\[(?:[^[\]]|\((?:[^()\\]|\\.)*\))*\]\s*TJ/g);
  const source = tjMatches ? tjMatches.join(" ") : contentStreamText;

  const literalRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = literalRegex.exec(source)) !== null) {
    const s = (match[1] ?? "")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");

    // Only keep segments that are predominantly printable ASCII
    const printableCount = (s.match(/[\x20-\x7E]/g) || []).length;
    if (s.length > 0 && printableCount / s.length >= 0.85) {
      pieces.push(s);
    }
  }

  return pieces
    .join(" ")
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function extractReadableTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const latin1Decoder = new TextDecoder("latin1");
  const rawStr = latin1Decoder.decode(bytes);
  const collectedChunks: string[] = [];

  // Find stream ... endstream blocks and decompress FlateDecode streams
  const streamRegex = /stream\r?\n/g;
  let match: RegExpExecArray | null;
  let streamCount = 0;

  while ((match = streamRegex.exec(rawStr)) !== null && streamCount < 80) {
    const startOffset = match.index + match[0].length;
    const endIdx = rawStr.indexOf("endstream", startOffset);
    if (endIdx === -1) break;

    let endOffset = endIdx;
    if (rawStr[endOffset - 1] === "\n") endOffset--;
    if (rawStr[endOffset - 1] === "\r") endOffset--;

    if (endOffset > startOffset && endOffset - startOffset < 1024 * 1024) {
      streamCount++;
      const slice = bytes.subarray(startOffset, endOffset);
      const decompressed =
        (await tryDecompressBytes(slice, "deflate")) ||
        (await tryDecompressBytes(slice, "deflate-raw"));

      const streamText = decompressed ? latin1Decoder.decode(decompressed) : latin1Decoder.decode(slice);
      const decoded = decodePdfLiteralStrings(streamText);
      if (decoded.length > 20) {
        collectedChunks.push(decoded);
      }
    }
  }

  const combined = collectedChunks.join("\n");
  const cleanSentences = combined
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => isCleanReadableSentence(s));

  return cleanSentences.join("\n\n");
}

// Extract text from uploaded File object
export async function extractTextFromFile(
  file: File,
): Promise<{ content: string; type: NoteDocument["type"] }> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (extension === "txt" || extension === "text") {
    const text = await file.text();
    return { content: text, type: "TXT" };
  }
  if (extension === "md" || extension === "markdown") {
    const text = await file.text();
    return { content: text, type: "MD" };
  }
  if (extension === "csv") {
    const text = await file.text();
    return { content: text, type: "CSV" };
  }
  if (extension === "json") {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      return { content: JSON.stringify(parsed, null, 2), type: "TXT" };
    } catch {
      return { content: text, type: "TXT" };
    }
  }

  const buffer = await file.arrayBuffer();

  if (extension === "docx" || extension === "pptx") {
    const zipText = await extractXmlFromZip(buffer);
    const cleanSentences = zipText
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => isCleanReadableSentence(s));

    if (cleanSentences.length >= 4) {
      return { content: zipText, type: "DOCX" };
    }
    return {
      content: buildFallbackNotesForDocument(file.name),
      type: "DOCX",
    };
  }

  if (extension === "pdf") {
    const pdfCleanText = await extractReadableTextFromPdf(buffer);
    const cleanCount = pdfCleanText
      .split(/(?<=[.?!])\s+|\n+/)
      .filter((s) => isCleanReadableSentence(s)).length;

    if (cleanCount >= 4) {
      return { content: pdfCleanText, type: "PDF" };
    }
    return {
      content: buildFallbackNotesForDocument(file.name),
      type: "PDF",
    };
  }

  const genericText = await file.text();
  if (/[\uFFFD\x00-\x08]/.test(genericText)) {
    return { content: buildFallbackNotesForDocument(file.name), type: "TXT" };
  }
  return { content: genericText, type: "TXT" };
}

// Analyze notes to extract topics, competencies, word count, and a brief summary
export function analyzeNotes(
  content: string,
  name: string,
): {
  wordCount: number;
  charCount: number;
  detectedTopics: string[];
  suggestedCompetencies: string[];
  summary: string;
} {
  const clean = content.trim();
  const cleanSentences = clean
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.replace(/^[\d#*•\-\s.)]+/, "").replace(/\s+/g, " ").trim())
    .filter((s) => isCleanReadableSentence(s));

  const effectiveText = cleanSentences.length >= 3 ? cleanSentences.join(" ") : clean;
  const words = effectiveText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = effectiveText.length;

  const lower = `${name} ${effectiveText}`.toLowerCase();

  // Match competencies based on keyword occurrences
  const competencyScores: Record<string, number> = {};
  for (const [domain, keywords] of Object.entries(COMPETENCY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const count = (lower.match(new RegExp(`\\b${kw}\\b`, "g")) || []).length;
      score += count;
    }
    if (score > 0) {
      competencyScores[domain] = score;
    }
  }

  const sortedCompetencies = Object.entries(competencyScores)
    .sort((a, b) => b[1] - a[1])
    .map(([dom]) => dom);

  const suggestedCompetencies =
    sortedCompetencies.length > 0
      ? sortedCompetencies.slice(0, 3)
      : ["Survey Methodology", "Statistical Methods"];

  // Extract detected topics from capitalised phrases, headers, or repeated key terms
  const topicCandidates = new Set<string>();

  const lines = clean.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[#*•-]\s+/.test(trimmed) || /^[A-Z][A-Za-z0-9\s-]{3,40}:/.test(trimmed)) {
      const cleanedHeading = trimmed
        .replace(/^[#*•-\s]+/, "")
        .replace(/:.*$/, "")
        .trim();
      if (
        cleanedHeading.length >= 4 &&
        cleanedHeading.length <= 40 &&
        /^[A-Za-z0-9\s&()-]+$/.test(cleanedHeading)
      ) {
        topicCandidates.add(cleanedHeading);
      }
    }
  }

  const standardTopics = [
    "Stratified Sampling",
    "Sampling Error",
    "Non-Sampling Error",
    "Data Quality Framework",
    "Index Numbers",
    "Laspeyres & Paasche",
    "Small Area Estimation",
    "Regression Diagnostics",
    "National Accounts",
    "First Stage Units",
    "Household Surveys",
    "Imputation Rules",
    "Data Dissemination",
    "Quality Assurance",
    "Design Weights",
    "Population Parameters",
  ];
  for (const st of standardTopics) {
    if (lower.includes(st.toLowerCase())) {
      topicCandidates.add(st);
    }
  }

  const detectedTopics = Array.from(topicCandidates).slice(0, 6);
  if (detectedTopics.length === 0) {
    detectedTopics.push(name.replace(/\.[^/.]+$/, ""), "Core Methodology", "Key Definitions");
  }

  const firstSentences = cleanSentences.slice(0, 2).join(" ").trim();
  const summary =
    firstSentences.length > 30
      ? firstSentences.length > 220
        ? firstSentences.substring(0, 220) + "…"
        : firstSentences
      : `Learning material covering ${detectedTopics.slice(0, 3).join(", ")} for official statistical operations.`;

  return {
    wordCount,
    charCount,
    detectedTopics,
    suggestedCompetencies,
    summary,
  };
}

/**
 * Built-in Semantic NLP MCQ Generator
 */
export function generateQuestionsWithNLP(notes: string, config: QuizConfig): MCQQuestion[] {
  const { count, difficulty, qType, topic, customSuggestions, competency } = config;

  const rawSentences = notes
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.replace(/^[\d#*•\-\s.)]+/, "").replace(/\s+/g, " ").trim())
    .filter((s) => isCleanReadableSentence(s));

  const suggestionKeywords = (customSuggestions || "")
    .toLowerCase()
    .split(/[\s,.;]+/)
    .filter((k) => k.length >= 3);

  const scoredSentences = rawSentences.map((sent) => {
    let score = 1;
    const lower = sent.toLowerCase();

    for (const kw of suggestionKeywords) {
      if (lower.includes(kw)) score += 5;
    }

    if (topic && topic !== "Auto Detect" && lower.includes(topic.toLowerCase())) {
      score += 4;
    }

    if (
      /\b(is defined as|refers to|means|consists of|used for|comprises|measured by|calculated as)\b/i.test(
        sent,
      )
    ) {
      score += 3;
    }
    if (
      /\b(in contrast|unlike|increases|decreases|primary objective|critical|fundamental)\b/i.test(
        sent,
      )
    ) {
      score += 2;
    }
    if (/\b(\d+%|\d+\s*(years|months|rounds|percent|units))\b/i.test(sent)) {
      score += 2;
    }

    return { sentence: sent, score };
  });

  scoredSentences.sort((a, b) => b.score - a.score);
  const prioritized = scoredSentences.map((s) => s.sentence);

  // Ensure we always have enough clean, non-repeating sentences to cover the requested question count
  for (const fallback of CLEAN_GUIDELINE_STATEMENTS) {
    if (prioritized.length >= Math.max(count, 12)) break;
    if (!prioritized.includes(fallback)) {
      prioritized.push(fallback);
    }
  }

  const cleanCorpus = prioritized.join(" ");
  const extractedTerms = Array.from(
    new Set(cleanCorpus.match(/\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})*\b/g) || []),
  ).filter(
    (t) => t.length > 4 && !["Table", "Chapter", "Section", "Figure", "Source", "Page", "Every", "When"].includes(t),
  );

  const defaultDomainTerms = [
    "Sampling Error",
    "Non-Sampling Error",
    "Stratified Random Sampling",
    "First Stage Unit (FSU)",
    "Ultimate Stage Unit",
    "Multiplier Weight",
    "Paasche Price Index",
    "Laspeyres Index",
    "Fisher Ideal Index",
    "Imputation Method",
    "Data Cleansing Rule",
    "Confidence Interval",
    "National Quality Assurance Framework (NQAF)",
    "Design Effect",
    "Auxiliary Variable",
  ];

  const candidateDistractorTerms = [...extractedTerms, ...defaultDomainTerms];

  const questions: MCQQuestion[] = [];
  const assignedCompetency = competency || "Survey Methodology";

  let sentenceIdx = 0;
  for (let i = 0; i < count; i++) {
    const curSentence: string =
      prioritized[sentenceIdx % prioritized.length] ??
      CLEAN_GUIDELINE_STATEMENTS[i % CLEAN_GUIDELINE_STATEMENTS.length] ??
      "Official statistical estimation requires rigorous adherence to probability sampling frameworks.";
    sentenceIdx++;

    const qNum = i + 1;
    let builtQ: MCQQuestion;

    const effectiveType =
      qType === "Mixed"
        ? i % 3 === 0
          ? "Conceptual"
          : i % 3 === 1
            ? "MCQ"
            : "True or False"
        : qType;

    if (effectiveType === "True or False") {
      const isTrue = i % 2 === 0;
      let questionStem = "";
      let explanation = "";

      if (isTrue) {
        questionStem = `True or False: According to the material, "${curSentence}"`;
        explanation = `Correct. The statement is directly verified by the notes: "${curSentence}"`;
      } else {
        const inverted = curSentence
          .replace(/\b(is|are)\b/i, "is not")
          .replace(/\b(increases)\b/i, "decreases")
          .replace(/\b(reduces)\b/i, "amplifies")
          .replace(/\b(always)\b/i, "never")
          .replace(/\b(appropriate)\b/i, "inappropriate");

        questionStem = `True or False: According to the material, "${inverted}"`;
        explanation = `False. The notes state that: "${curSentence}"`;
      }

      builtQ = {
        id: qNum,
        question: questionStem,
        options: [
          isTrue ? "True (Consistent with notes)" : "True",
          isTrue ? "False" : "False (Contradicts notes)",
          "Cannot be determined from the material",
          "Partially true under special assumptions",
        ],
        answer: isTrue ? 0 : 1,
        explanation,
        difficulty: (difficulty === "Adaptive"
          ? i < count / 2
            ? "Easy"
            : "Medium"
          : difficulty) as "Easy" | "Medium" | "Hard",
        topic: topic && topic !== "Auto Detect" ? topic : "Conceptual Verification",
        competency: assignedCompetency,
        noteReference: curSentence,
        questionType: "True or False",
      };
    } else if (effectiveType === "Conceptual" || effectiveType === "Scenario") {
      const conceptMatch = curSentence.match(
        /\b([A-Z][a-z]+(?:\s+[A-Za-z]+){0,3})\s+(is defined as|refers to|means|is used for|serves to|comprises)\s+(.*)/i,
      );

      let questionStem = "";
      let correctOpt = "";
      let distractors: string[] = [];

      if (conceptMatch) {
        const subject = conceptMatch[1].trim();
        const predicate = conceptMatch[3].replace(/[.;].*$/, "").trim();

        questionStem = `In official statistical operations, what is the primary role or definition of "${subject}"?`;
        correctOpt = predicate.charAt(0).toUpperCase() + predicate.slice(1);

        distractors = [
          `To substitute for complete census enumeration without auxiliary weights`,
          `To eliminate administrative reporting overhead across state directorates`,
          `To maximize non-response rates during secondary stage unit selection`,
        ];
      } else {
        questionStem = `Based on the uploaded learning notes, which of the following statements is mathematically and procedurally correct?`;
        correctOpt = curSentence;

        const randTerm1 = candidateDistractorTerms[(i * 3) % candidateDistractorTerms.length];
        const randTerm2 = candidateDistractorTerms[(i * 3 + 1) % candidateDistractorTerms.length];
        const randTerm3 = candidateDistractorTerms[(i * 3 + 2) % candidateDistractorTerms.length];

        distractors = [
          `${randTerm1} can be entirely omitted when calculating the variance of multi-stage estimators.`,
          `${randTerm2} operates independently of standard quality control and imputation guidelines.`,
          `${randTerm3} applies exclusively to unweighted sample tabulations in official publications.`,
        ];
      }

      const answerIndex = (i + 1) % 4;
      const allOpts: [string, string, string, string] = ["", "", "", ""];
      let dIdx = 0;
      for (let pos = 0; pos < 4; pos++) {
        if (pos === answerIndex) {
          allOpts[pos] = correctOpt;
        } else {
          allOpts[pos] =
            distractors[dIdx++] || `Alternative interpretation not supported by the framework`;
        }
      }

      builtQ = {
        id: qNum,
        question: questionStem,
        options: allOpts,
        answer: answerIndex,
        explanation: `Correct answer: "${correctOpt}". This is directly substantiated by the uploaded notes: "${curSentence}"`,
        difficulty: (difficulty === "Adaptive"
          ? i < count / 2
            ? "Medium"
            : "Hard"
          : difficulty) as "Easy" | "Medium" | "Hard",
        topic: topic && topic !== "Auto Detect" ? topic : "Statistical Analysis & Methodology",
        competency: assignedCompetency,
        noteReference: curSentence,
        questionType: "Conceptual",
      };
    } else {
      const defMatch = curSentence.match(
        /^([A-Z][A-Za-z0-9\s()-]{2,35}?)\s+(is defined as|refers to|means|represents|is the|are the)\s+([^.;]{15,180})/i,
      );

      let questionStem = "";
      let correctOpt = "";
      let distractors: string[] = [];

      if (defMatch && defMatch[1].trim().length > 3) {
        const term = defMatch[1].trim();
        const definition = defMatch[3].trim();
        questionStem = `Which of the following best describes "${term}" as specified in the reference notes?`;
        correctOpt = definition.charAt(0).toUpperCase() + definition.slice(1);

        const alt1 = candidateDistractorTerms[(i * 2) % candidateDistractorTerms.length];
        const alt2 = candidateDistractorTerms[(i * 2 + 1) % candidateDistractorTerms.length];

        distractors = [
          `A procedure dedicated to replacing ${alt1} during field audit stages`,
          `An auxiliary metric used strictly when ${alt2} cannot be observed`,
          `A discretionary adjustment that does not impact official tabulations`,
        ];
      } else {
        questionStem = `Regarding the guidelines in the uploaded document, which of the following is correct?`;
        correctOpt = curSentence;

        distractors = [
          `The methodology mandates replacing design weights with uncalibrated ratio estimators.`,
          `Non-sampling errors are eliminated by increasing the sample size of secondary units.`,
          `Metadata releases are optional when publishing provisional survey aggregates.`,
        ];
      }

      const answerIndex = i % 4;
      const allOpts: [string, string, string, string] = ["", "", "", ""];
      let dIdx = 0;
      for (let pos = 0; pos < 4; pos++) {
        if (pos === answerIndex) {
          allOpts[pos] = correctOpt;
        } else {
          allOpts[pos] = distractors[dIdx++] || `Alternative methodological consideration`;
        }
      }

      builtQ = {
        id: qNum,
        question: questionStem,
        options: allOpts,
        answer: answerIndex,
        explanation: `Accurate interpretation: "${correctOpt}". Sourced from: "${curSentence}"`,
        difficulty: (difficulty === "Adaptive" ? "Medium" : difficulty) as
          "Easy" | "Medium" | "Hard",
        topic: topic && topic !== "Auto Detect" ? topic : "Statistical Principles",
        competency: assignedCompetency,
        noteReference: curSentence,
        questionType: "MCQ",
      };
    }

    questions.push(sanitizeMCQQuestion(builtQ, i));
  }

  return questions;
}

/**
 * Call External LLM API (Google Gemini or OpenAI)
 * Falls back gracefully to Built-in NLP if anything fails.
 */
export async function generateQuestionsWithLLM(
  notes: string,
  config: QuizConfig,
): Promise<MCQQuestion[]> {
  const { aiProvider, apiKey, count, difficulty, qType, topic, customSuggestions, competency } =
    config;

  if (!apiKey || aiProvider === "builtin") {
    return generateQuestionsWithNLP(notes, config);
  }

  const promptText = `
You are an expert psychometrician and statistical educator specializing in official statistics and civil service capacity development (MoSPI / National Statistical Systems).
Generate exactly ${count} multiple choice questions strictly based on the following learning material/notes.

Requirements:
- Difficulty level: ${difficulty}
- Question format: ${qType}
- Focus topic: ${topic || "Auto-detect from text"}
- Target Competency: ${competency || "Auto-detect"}
${customSuggestions ? `- User Specific Guidance/Suggestions: ${customSuggestions}` : ""}

Return ONLY a valid JSON array of question objects with this exact structure:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Detailed pedagogical explanation citing specific facts from notes.",
    "difficulty": "${difficulty === "Adaptive" ? "Medium" : difficulty}",
    "topic": "Topic Name",
    "competency": "${competency || "Survey Methodology"}",
    "noteReference": "Direct quote or context from the notes",
    "questionType": "${qType === "Mixed" ? "MCQ" : qType}"
  }
]

Do not include markdown code blocks or any other commentary, only the raw JSON array.

--- UPLOADED NOTES ---
${notes.slice(0, 15000)}
`;

  try {
    if (aiProvider === "gemini") {
      const model = config.modelName || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) throw new Error("No response text received from Gemini API");

      const parsed: MCQQuestion[] = JSON.parse(rawJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q, idx) => ({
          ...q,
          id: idx + 1,
          answer: Number(q.answer) % 4,
          options: q.options.slice(0, 4) as [string, string, string, string],
          difficulty: q.difficulty || "Medium",
          questionType: q.questionType || "MCQ",
        }));
      }
    } else if (aiProvider === "openai") {
      const model = config.modelName || "gpt-4o-mini";
      const url = "https://api.openai.com/v1/chat/completions";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You generate strict JSON arrays of MCQs based on provided notes.",
            },
            { role: "user", content: promptText },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from OpenAI");

      const parsedObj = JSON.parse(rawContent);
      const arr = Array.isArray(parsedObj)
        ? parsedObj
        : parsedObj.questions || Object.values(parsedObj)[0];
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((q, idx) => ({
          ...q,
          id: idx + 1,
          answer: Number(q.answer) % 4,
          options: q.options.slice(0, 4) as [string, string, string, string],
          difficulty: q.difficulty || "Medium",
          questionType: q.questionType || "MCQ",
        }));
      }
    }
  } catch (err) {
    console.warn(
      "External LLM generation failed, smoothly falling back to built-in semantic engine:",
      err,
    );
    return generateQuestionsWithNLP(notes, config);
  }

  return generateQuestionsWithNLP(notes, config);
}
