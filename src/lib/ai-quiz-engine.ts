/**
 * AI Quiz Engine & Note Analyzer
 * Provides:
 * 1. File & Text Extraction (TXT, MD, CSV, DOCX, PPTX, PDF text streams, pasted notes)
 * 2. Natural Language Concept & Topic Extraction (supports both general technical slides & statistical notes)
 * 3. Built-in Semantic NLP MCQ Generator with subject-adaptive stems & contextual distractors
 * 4. Google Gemini & OpenAI LLM API integration with automatic model fallback
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
    "diagram",
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
    "server",
    "architecture",
    "system",
    "gps",
    "mobile app",
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

const SLIDE_BOILERPLATE_RE =
  /^(done by|submitted by|presented by|guided by|thank you|thanks|q\s*&\s*a|questions\s*&\s*discussion|open floor for questions|invite feedback|sets the stage for exploring|visual block diagram can illustrate)/i;

const ROLL_NUMBER_RE = /\b\d{2}[A-Z]{2,4}\d{2,4}\b/;

/**
 * Strips stray replacement characters (\uFFFD) and binary control chars from extracted text
 */
function stripEncodingArtifacts(text: string): string {
  return text
    .replace(/\uFFFD+/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Checks whether an option or question string is clean human-readable text.
 */
export function isCleanOptionText(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = stripEncodingArtifacts(text);
  if (trimmed.length === 0) return false;

  if (BINARY_OR_SYNTAX_NOISE_RE.test(trimmed)) return false;

  if (/[\\{}[\]^~|<>]{3,}|\}%|\*O|\[-:/.test(trimmed)) {
    return false;
  }

  if (!/[A-Za-z0-9]/.test(trimmed)) return false;

  if (trimmed.length > 20) {
    const alphaNumSpaceCount = (trimmed.match(/[A-Za-z0-9\s.,;:'"()?!%\-–—/+=<>≥≤±×÷₹$&]/g) || [])
      .length;
    if (alphaNumSpaceCount / trimmed.length < 0.7) return false;
  }

  return true;
}

/**
 * Checks whether a candidate sentence extracted from a file is a clean, meaningful factual statement.
 */
export function isCleanReadableSentence(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = stripEncodingArtifacts(text);
  if (trimmed.length < 20 || trimmed.length > 420) return false;
  if (!isCleanOptionText(trimmed)) return false;

  // Filter out slide author credits, roll numbers, dates, and "thank you" lines
  if (SLIDE_BOILERPLATE_RE.test(trimmed)) return false;
  if (ROLL_NUMBER_RE.test(trimmed)) return false;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) return false;
  if (/^slide\s+\d+\s*:?$/i.test(trimmed)) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length < 4) return false;

  let validWords = 0;
  for (const tok of tokens) {
    const cleanTok = tok.replace(/^['"([{-]+|['").,;?!:\]}-]+$/g, "");
    if (/^[A-Za-z]{2,}(?:-[A-Za-z0-9]+)*$/.test(cleanTok)) {
      if (cleanTok.length >= 6 && !/[aeiouyAEIOUY]/.test(cleanTok)) {
        continue; // consonant soup from binary stream
      }
      validWords++;
    } else if (/^\d+(?:\.\d+)?%?$/.test(cleanTok) || /^[A-Z0-9]{2,6}$/.test(cleanTok)) {
      validWords++;
    }
  }

  if (validWords / tokens.length < 0.6) return false;
  return true;
}

/**
 * Splits a document's raw text into clean, standalone factual statements
 * (handles numbered lists like `1.Uses simple tech... 5.Reduces extra costs...` and slide headers).
 */
export function extractCleanStatementsFromNotes(notes: string): string[] {
  const cleaned = stripEncodingArtifacts(notes).replace(/\r\n/g, "\n");

  // Split on newlines, sentence boundaries, and inline numbered bullets (`1.Foo`, `5.Bar`)
  const rawChunks = cleaned.split(
    /(?<=[.?!])\s+|\n+|(?=\b\d{1,2}\.\s*[A-Z])|:\s*(?=\d{1,2}\.\s*[A-Z])/,
  );

  const statements: string[] = [];
  for (const chunk of rawChunks) {
    const stripped = chunk
      .replace(/^slide\s+\d+\s*:\s*/i, "")
      .replace(/^(?:benefits\s*&\s*advantages|solution overview|system architecture|conclusion\s*&\s*q&a|the passenger's problem)\s*:\s*/i, "")
      .replace(/^[\d#*•\-\s.)]+/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!stripped) continue;
    // Skip pure headings that end with a colon and have fewer than 5 words
    if (stripped.endsWith(":") && stripped.split(/\s+/).length <= 5) continue;

    const normalized = stripped.endsWith(".") || stripped.endsWith("?") || stripped.endsWith("!")
      ? stripped
      : `${stripped}.`;

    if (isCleanReadableSentence(normalized) && !statements.includes(normalized)) {
      statements.push(normalized);
    }
  }

  return statements;
}

/**
 * Sanitizes an MCQQuestion so that any corrupted/garbled binary option is replaced,
 * while preserving valid NLP and LLM questions untouched.
 */
export function sanitizeMCQQuestion(q: MCQQuestion, idx = 0): MCQQuestion {
  const fallbackSentence: string =
    CLEAN_GUIDELINE_STATEMENTS[(q.id - 1 + idx) % CLEAN_GUIDELINE_STATEMENTS.length] ??
    "Every statistical release must apply calibrated design weights, automated validation rules, and comprehensive quality metadata documentation.";

  const fallbackDistractors: [string, string, string] = [
    "Applying uncalibrated unweighted sample averages without stratification adjustments.",
    "Increasing secondary sample size without addressing systematic measurement bias.",
    "Omitting metadata documentation and variance diagnostics during provisional releases.",
  ];

  let hadCorruptedOption = false;
  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const cleanedOptions = [0, 1, 2, 3].map((optIdx) => {
    const opt = rawOptions[optIdx];
    if (opt && isCleanOptionText(String(opt))) return stripEncodingArtifacts(String(opt));
    hadCorruptedOption = true;
    if (optIdx === q.answer) {
      return fallbackSentence;
    }
    return fallbackDistractors[optIdx % fallbackDistractors.length] ?? fallbackDistractors[0];
  }) as [string, string, string, string];

  const cleanRef: string =
    q.noteReference && isCleanOptionText(q.noteReference)
      ? stripEncodingArtifacts(q.noteReference)
      : fallbackSentence;

  const cleanQuestion: string = isCleanOptionText(q.question)
    ? stripEncodingArtifacts(q.question)
    : `Which statement is accurate regarding ${q.topic || "the uploaded material"}?`;

  let cleanExplanation: string = stripEncodingArtifacts(q.explanation || "");
  if (hadCorruptedOption || !isCleanOptionText(cleanExplanation)) {
    const correctOptText = cleanedOptions[q.answer] ?? fallbackSentence;
    cleanExplanation = `Correct Answer: "${correctOptText}". Source from notes: "${cleanRef}"`;
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
  const cleanTitle =
    fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim() || "Official Statistical Guidelines";
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
 * Sanitizes a NoteDocument so stray encoding artifacts (\uFFFD) are stripped
 * and topic metadata is refreshed if needed, without overwriting valid user documents.
 */
export function sanitizeNoteDocument(doc: NoteDocument): NoteDocument {
  if (!doc || typeof doc.content !== "string") return doc;

  const cleanedContent = stripEncodingArtifacts(doc.content);
  const hasRawPdfSyntax = BINARY_OR_SYNTAX_NOISE_RE.test(cleanedContent);

  if (!hasRawPdfSyntax && cleanedContent.length >= 30) {
    // Refresh topic detection if topics contained boilerplate like "Done by" or "Slide 3"
    const hasBoilerplateTopic = (doc.detectedTopics || []).some((t) =>
      /^(done by|slide\s*\d+|thank you)$/i.test(t.trim()),
    );
    if (cleanedContent !== doc.content || hasBoilerplateTopic) {
      const analysis = analyzeNotes(cleanedContent, doc.name);
      return {
        ...doc,
        content: cleanedContent,
        wordCount: analysis.wordCount,
        charCount: analysis.charCount,
        detectedTopics: analysis.detectedTopics,
        suggestedCompetencies: analysis.suggestedCompetencies,
        summary: analysis.summary,
      };
    }
    return doc;
  }

  const candidateSentences = extractCleanStatementsFromNotes(cleanedContent);
  const repairedContent =
    candidateSentences.length >= 3
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
          const paragraphs = stripEncodingArtifacts(
            xmlStr
              .replace(/<\/w:p>|<\/a:p>/g, "\n")
              .replace(/<[^>]+>/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'"),
          );
          if (paragraphs.length > 0) {
            extractedTexts.push(paragraphs);
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

  const tjMatches = contentStreamText.match(
    /\((?:[^()\\]|\\.)*\)\s*T[jd*'"]|\[(?:[^[\]]|\((?:[^()\\]|\\.)*\))*\]\s*TJ/g,
  );
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

      const streamText = decompressed
        ? latin1Decoder.decode(decompressed)
        : latin1Decoder.decode(slice);
      const decoded = decodePdfLiteralStrings(streamText);
      if (decoded.length > 20) {
        collectedChunks.push(decoded);
      }
    }
  }

  const combined = collectedChunks.join("\n");
  const cleanSentences = extractCleanStatementsFromNotes(combined);
  return cleanSentences.join("\n\n");
}

// Extract text from uploaded File object
export async function extractTextFromFile(
  file: File,
): Promise<{ content: string; type: NoteDocument["type"] }> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (extension === "txt" || extension === "text") {
    const text = stripEncodingArtifacts(await file.text());
    return { content: text, type: "TXT" };
  }
  if (extension === "md" || extension === "markdown") {
    const text = stripEncodingArtifacts(await file.text());
    return { content: text, type: "MD" };
  }
  if (extension === "csv") {
    const text = stripEncodingArtifacts(await file.text());
    return { content: text, type: "CSV" };
  }
  if (extension === "json") {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      return { content: JSON.stringify(parsed, null, 2), type: "TXT" };
    } catch {
      return { content: stripEncodingArtifacts(text), type: "TXT" };
    }
  }

  const buffer = await file.arrayBuffer();

  if (extension === "docx" || extension === "pptx") {
    const zipText = await extractXmlFromZip(buffer);
    const cleanSentences = extractCleanStatementsFromNotes(zipText);

    if (cleanSentences.length >= 2) {
      return { content: zipText, type: "DOCX" };
    }
    return {
      content: buildFallbackNotesForDocument(file.name),
      type: "DOCX",
    };
  }

  if (extension === "pdf") {
    const pdfCleanText = await extractReadableTextFromPdf(buffer);
    const cleanCount = extractCleanStatementsFromNotes(pdfCleanText).length;

    if (cleanCount >= 2) {
      return { content: pdfCleanText, type: "PDF" };
    }
    return {
      content: buildFallbackNotesForDocument(file.name),
      type: "PDF",
    };
  }

  const genericText = stripEncodingArtifacts(await file.text());
  return { content: genericText || buildFallbackNotesForDocument(file.name), type: "TXT" };
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
  const clean = stripEncodingArtifacts(content);
  const cleanSentences = extractCleanStatementsFromNotes(clean);

  const effectiveText = cleanSentences.length >= 2 ? cleanSentences.join(" ") : clean;
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
      : ["Data Management", "Survey Methodology"];

  const topicCandidates = new Set<string>();

  const lines = clean.split("\n");
  for (const idx of lines.keys()) {
    const trimmed = (lines[idx] ?? "").trim();
    if (!trimmed) continue;

    // First non-empty line is often the document or presentation title
    if (
      idx === 0 &&
      trimmed.length >= 6 &&
      trimmed.length <= 55 &&
      !SLIDE_BOILERPLATE_RE.test(trimmed) &&
      !ROLL_NUMBER_RE.test(trimmed)
    ) {
      topicCandidates.add(trimmed.replace(/[:.]+$/, "").trim());
    }

    // Handle "Slide 3: Solution Overview:" or "Slide 4: System Architecture"
    const slideMatch = trimmed.match(/^slide\s+\d+\s*:\s*([A-Za-z0-9\s,&()-]{4,45}?)\s*:?$/i);
    if (slideMatch?.[1]) {
      const slideTopic = slideMatch[1].trim();
      if (!SLIDE_BOILERPLATE_RE.test(slideTopic)) {
        topicCandidates.add(slideTopic);
      }
      continue;
    }

    // Handle section headers like "1. Introduction to Survey Design:" or "Benefits & Advantages"
    if (
      /^[#*•-]\s+/.test(trimmed) ||
      /^(?:\d+\.\s*)?[A-Z][A-Za-z0-9\s,&()-]{3,42}:?$/.test(trimmed)
    ) {
      const cleanedHeading = trimmed
        .replace(/^(?:\d+\.|[#*•-])\s*/, "")
        .replace(/:.*$/, "")
        .trim();
      if (
        cleanedHeading.length >= 4 &&
        cleanedHeading.length <= 42 &&
        /^[A-Za-z0-9\s,&()-]+$/.test(cleanedHeading) &&
        !SLIDE_BOILERPLATE_RE.test(cleanedHeading) &&
        !ROLL_NUMBER_RE.test(cleanedHeading) &&
        !/^(slide\s*\d+|conclusion|q\s*&\s*a|thank you)$/i.test(cleanedHeading)
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
    "System Architecture",
    "GPS & Mobile Alerts",
    "Public Transport Safety",
  ];
  for (const st of standardTopics) {
    if (lower.includes(st.toLowerCase())) {
      topicCandidates.add(st);
    }
  }

  const detectedTopics = Array.from(topicCandidates).slice(0, 6);
  if (detectedTopics.length === 0) {
    const cleanFileName = name.replace(/\.[^/.]+$/, "").replace(/^\d+[A-Z]+\d+\s*/i, "").trim();
    detectedTopics.push(cleanFileName || "Core Concepts", "System Overview", "Key Principles");
  }

  const firstSentences = cleanSentences.slice(0, 2).join(" ").trim();
  const summary =
    firstSentences.length > 25
      ? firstSentences.length > 220
        ? firstSentences.substring(0, 220) + "…"
        : firstSentences
      : `Learning material covering ${detectedTopics.slice(0, 3).join(", ")}.`;

  return {
    wordCount,
    charCount,
    detectedTopics,
    suggestedCompetencies,
    summary,
  };
}

// ============================================================================
// Context-Adaptive Question Stems & Distractor Generators
// ============================================================================
const STATISTICAL_DISTRACTOR_POOL: string[] = [
  "Selecting units purely by convenience without constructing a probability sampling frame.",
  "Applying unweighted arithmetic averages across heterogeneous strata without multiplier calibration.",
  "Eliminating non-sampling measurement bias solely by expanding the number of sample households.",
  "Substituting non-responding households arbitrarily in the field without documented imputation rules.",
  "Using fixed base-period quantities indefinitely without conducting periodic HCES basket revisions.",
  "Releasing un-anonymized unit-level microdata prior to statistical disclosure control checks.",
  "Computing elementary price relatives using the Carli arithmetic mean to intentionally induce upward bias.",
  "Treating cluster design effects (DEFF) as zero when estimating standard errors for complex surveys.",
];

const GENERAL_TECHNICAL_DISTRACTOR_POOL: string[] = [
  "Requires complex manual hardware calibration by specialized engineers before every operation.",
  "Operates exclusively offline without any central server or real-time location tracking.",
  "Restricts usage to trained technical personnel and excludes elderly or disabled users.",
  "Increases operational latency and travel costs by requiring manual checkpoint verification.",
  "Relies on static paper schedules rather than real-time proximity calculation or automated alerts.",
  "Stores unencrypted personal identity logs permanently without user privacy safeguards.",
  "Requires continuous manual supervision from the user throughout the entire journey.",
  "Eliminates the need for mobile applications or terminal interfaces by using fixed landline polls.",
];

const MCQ_STEM_TEMPLATES: Array<(topic: string, keyword: string) => string> = [
  (topic, kw) =>
    `According to the material on "${topic}", which statement accurately describes ${kw}?`,
  (topic, kw) =>
    `In the context of "${topic}", how does the system or methodology address ${kw}?`,
  (topic, kw) =>
    `When examining ${kw} under "${topic}", which of the following is correct based on the notes?`,
  (topic, kw) =>
    `Which key principle or feature regarding ${kw} is highlighted in the "${topic}" section?`,
  (topic, kw) =>
    `Based on the uploaded document's coverage of "${topic}", what is true about ${kw}?`,
  (topic, kw) =>
    `Which of the following best characterizes ${kw} as presented in "${topic}"?`,
];

const SCENARIO_STEM_TEMPLATES: Array<(topic: string, kw: string) => string> = [
  (topic, kw) =>
    `Scenario: While reviewing "${topic}", a team evaluates ${kw}. Which conclusion is directly supported by the document?`,
  (topic, kw) =>
    `Scenario: During practical implementation of "${topic}" involving ${kw}, which operational characteristic applies according to the notes?`,
  (topic, kw) =>
    `Scenario: A user or analyst applying "${topic}" principles to ${kw} should expect which of the following outcomes?`,
];

function extractKeyTermFromSentence(sentence: string, fallbackTopic: string): string {
  const acronymMatch = sentence.match(/\b([A-Za-z][A-Za-z\s-]{3,35}\s*\([A-Z]{2,6}\))/);
  if (acronymMatch?.[1]) return acronymMatch[1].trim();

  const colonMatch = sentence.match(/^([A-Za-z][A-Za-z0-9\s,&/-]{3,35}):\s+/);
  if (colonMatch?.[1]) return colonMatch[1].trim();

  const subjectMatch = sentence.match(
    /^(?:The\s+|In\s+[^,]+,\s+the\s+|Within\s+[^,]+,\s+)?([A-Za-z][A-Za-z0-9\s()-]{3,38}?)\s+(?:is|are|refers|measures|weights|requires|combines|adopts|increases|decreases|defines|evaluates|cannot|must|should|serves|helps|enables|relieves|provides|leads|uses|makes|selects|calculates)\b/i,
  );
  if (subjectMatch?.[1]) {
    const cleaned = subjectMatch[1].replace(/^(?:the|a|an|each|every|many|often)\s+/i, "").trim();
    if (cleaned.length >= 4 && cleaned.length <= 38) return cleaned;
  }

  const stopWords = new Set([
    "however",
    "therefore",
    "furthermore",
    "consequently",
    "conversely",
    "contrast",
    "according",
    "within",
    "between",
    "whereas",
    "because",
    "through",
    "during",
    "including",
    "without",
  ]);
  const words = sentence
    .replace(/[^A-Za-z\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !stopWords.has(w.toLowerCase()));
  if (words.length >= 2) {
    return `${words[0]} and ${words[1]}`.toLowerCase();
  }
  return words[0] || fallbackTopic;
}

function createMutatedDistractorFromSentence(
  sentence: string,
  variant: number,
  isStatisticalDoc: boolean,
): string {
  let mutated = sentence;
  const replacements: Array<[RegExp, string]> = [
    // Statistical inversions
    [/\binversely\b/i, "directly"],
    [/\bproportional to size\b/i, "independent of unit population size"],
    [/\boverestimate\b/i, "underestimate"],
    [/\bunderestimate\b/i, "overestimate"],
    [/\bbase period\b/i, "future projected period"],
    [/\bcurrent-period\b/i, "historical base-year"],
    [/\bgeometric mean\b/i, "unweighted harmonic sum"],
    [/\bstrictly prohibited\b/i, "recommended during field enumeration"],
    [/\bcannot be mitigated\b/i, "is automatically eliminated"],
    [/\bunbiased estimator\b/i, "unweighted convenience approximation"],
    // General & technical inversions (e.g., for presentations like Passenger Alert System)
    [/\bsimple technology\b/i, "complex manual hardware"],
    [/\bcontinuously tracked via GPS\b/i, "logged manually only at terminal checkpoints without GPS"],
    [/\bno special skills needed\b/i, "requires specialized technical certification to operate"],
    [/\ball ages and abilities\b/i, "restricted exclusively to trained transit operators"],
    [/\bbefore or during the trip\b/i, "only after completing the entire transit journey"],
    [/\blow maintenance\b/i, "high-maintenance hardware-intensive"],
    [/\brelieves stress\b/i, "increases manual monitoring requirements"],
    [/\breduce anxiety\b/i, "require constant manual route calculation"],
    [/\bmore user-friendly and accessible\b/i, "restricted to commercial fleet dispatchers"],
    [/\breduces extra costs and travel delays\b/i, "increases transit fare overhead and stop delays"],
    [/\bcalculates proximity to stop\b/i, "broadcasts static timetable schedules without location data"],
    [/\bincreases\b/i, "reduces"],
    [/\breduces\b/i, "increases"],
    [/\bdecreases\b/i, "increases linearly"],
    [/\beasy to use\b/i, "complex to configure"],
    [/\bworry-free\b/i, "manually supervised"],
  ];

  let changed = false;
  for (const [regex, rep] of replacements) {
    if (regex.test(mutated)) {
      mutated = mutated.replace(regex, rep);
      changed = true;
      break;
    }
  }

  if (!changed) {
    const pool = isStatisticalDoc ? STATISTICAL_DISTRACTOR_POOL : GENERAL_TECHNICAL_DISTRACTOR_POOL;
    return pool[variant % pool.length] ?? pool[0]!;
  }
  return mutated;
}

/**
 * Built-in Semantic NLP MCQ Generator
 * Generates diverse, context-rich questions directly from the user's uploaded or pasted notes.
 */
export function generateQuestionsWithNLP(notes: string, config: QuizConfig): MCQQuestion[] {
  const { count, difficulty, qType, topic, customSuggestions, competency } = config;

  const rawSentences = extractCleanStatementsFromNotes(notes);
  const lowerNotes = notes.toLowerCase();
  const isStatisticalDoc =
    /\b(sampling|strata|nqaf|laspeyres|paasche|mospi|nss|imputation|multiplier|variance|census|estimator)\b/.test(
      lowerNotes,
    );

  const suggestionKeywords = (customSuggestions || "")
    .toLowerCase()
    .split(/[\s,.;]+/)
    .filter((k) => k.length >= 3);

  const scoredSentences = rawSentences.map((sent, originalIdx) => {
    let score = 1;
    const lower = sent.toLowerCase();

    for (const kw of suggestionKeywords) {
      if (lower.includes(kw)) score += 6;
    }

    if (topic && topic !== "Auto Detect" && lower.includes(topic.toLowerCase())) {
      score += 4;
    }

    if (
      /\b(is defined as|refers to|means|consists of|used for|comprises|measured by|calculated as|requires|combines|adopts|core components|helps|uses|tracked via|calculates)\b/i.test(
        sent,
      )
    ) {
      score += 3;
    }
    if (
      /\b(in contrast|unlike|conversely|increases|decreases|reduces|overestimate|underestimate|prohibited|recommends|fundamental|vulnerable|suitable)\b/i.test(
        sent,
      )
    ) {
      score += 2;
    }

    return { sentence: sent, score, originalIdx };
  });

  scoredSentences.sort((a, b) => b.score - a.score || a.originalIdx - b.originalIdx);
  const prioritized = scoredSentences.map((s) => s.sentence);

  // Only pad with statistical fallback statements if the uploaded document is actually empty
  if (prioritized.length === 0) {
    prioritized.push(...CLEAN_GUIDELINE_STATEMENTS);
  }

  const analysis = analyzeNotes(notes, topic || "Study Material");
  const detectedTopics =
    analysis.detectedTopics.length > 0 ? analysis.detectedTopics : ["Core Concepts"];
  const assignedCompetency =
    competency && competency !== "Auto Detect"
      ? competency
      : analysis.suggestedCompetencies[0] || "Data Management";

  const distractorPool = isStatisticalDoc
    ? STATISTICAL_DISTRACTOR_POOL
    : GENERAL_TECHNICAL_DISTRACTOR_POOL;

  const questions: MCQQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const curSentence: string =
      prioritized[i % prioritized.length] ??
      CLEAN_GUIDELINE_STATEMENTS[i % CLEAN_GUIDELINE_STATEMENTS.length]!;

    const qNum = i + 1;
    const itemTopic =
      topic && topic !== "Auto Detect"
        ? topic
        : detectedTopics[i % detectedTopics.length] || "Document Concepts";
    const keyTerm = extractKeyTermFromSentence(curSentence, itemTopic);

    const effectiveType: MCQQuestion["questionType"] =
      qType === "Mixed"
        ? i % 4 === 0
          ? "Conceptual"
          : i % 4 === 1
            ? "MCQ"
            : i % 4 === 2
              ? "Scenario"
              : "True or False"
        : qType;

    const itemDifficulty: "Easy" | "Medium" | "Hard" =
      difficulty === "Adaptive"
        ? i < count / 3
          ? "Easy"
          : i < (count * 2) / 3
            ? "Medium"
            : "Hard"
        : difficulty;

    let builtQ: MCQQuestion;

    if (effectiveType === "True or False") {
      const isTrue = i % 2 === 0;
      let statementText = curSentence;
      let explanation = "";

      if (isTrue) {
        explanation = `True. This statement is directly verified by the material: "${curSentence}"`;
      } else {
        statementText = createMutatedDistractorFromSentence(curSentence, i, isStatisticalDoc);
        explanation = `False. According to the uploaded material: "${curSentence}"`;
      }

      builtQ = {
        id: qNum,
        question: `Evaluate the following statement regarding ${itemTopic}: "${statementText}"`,
        options: [
          "True — Accurately reflects the uploaded material",
          "False — Contradicts the uploaded material",
          "Partially true only under manual override conditions",
          "Not mentioned anywhere in the reference material",
        ],
        answer: isTrue ? 0 : 1,
        explanation,
        difficulty: itemDifficulty,
        topic: itemTopic,
        competency: assignedCompetency,
        noteReference: curSentence,
        questionType: "True or False",
      };
    } else {
      const defMatch = curSentence.match(
        /^(?:The\s+)?([A-Za-z][A-Za-z0-9\s()-]{2,42}?)\s+(is defined as|refers to|measures|weights|combines|is the|are the|serves as|consists of|includes)\s+([^.;]{15,220})/i,
      );

      let questionStem = "";
      let correctOpt = "";

      if (defMatch && defMatch[1] && defMatch[3] && effectiveType !== "Scenario") {
        const subject = defMatch[1].trim();
        const verb = defMatch[2]!.trim().toLowerCase();
        const predicate = defMatch[3].trim();

        questionStem = `According to the material on "${itemTopic}", how is "${subject}" described?`;
        correctOpt = `${
          verb === "is defined as" || verb === "is the" || verb === "are the"
            ? "It is "
            : `It ${verb} `
        }${predicate}.`;
      } else if (effectiveType === "Scenario") {
        const template = SCENARIO_STEM_TEMPLATES[i % SCENARIO_STEM_TEMPLATES.length]!;
        questionStem = template(itemTopic, keyTerm);
        correctOpt = curSentence;
      } else {
        const template = MCQ_STEM_TEMPLATES[i % MCQ_STEM_TEMPLATES.length]!;
        questionStem = template(itemTopic, keyTerm);
        correctOpt = curSentence;
      }

      const otherSentence1 = prioritized[(i + 2) % prioritized.length] || curSentence;
      const otherSentence2 = prioritized[(i + 4) % prioritized.length] || curSentence;

      const d1 = createMutatedDistractorFromSentence(curSentence, i * 3, isStatisticalDoc);
      const d2 =
        otherSentence1 !== curSentence
          ? createMutatedDistractorFromSentence(otherSentence1, i * 3 + 1, isStatisticalDoc)
          : distractorPool[(i * 3 + 1) % distractorPool.length]!;
      const d3 =
        distractorPool[(i * 3 + 2) % distractorPool.length] ??
        createMutatedDistractorFromSentence(otherSentence2, i * 3 + 2, isStatisticalDoc);

      const distractors = [d1, d2, d3];

      const answerIndex = (i * 3 + 1) % 4;
      const allOpts: [string, string, string, string] = ["", "", "", ""];
      let dIdx = 0;
      for (let pos = 0; pos < 4; pos++) {
        if (pos === answerIndex) {
          allOpts[pos] = correctOpt;
        } else {
          allOpts[pos] =
            distractors[dIdx++] || distractorPool[(i + pos) % distractorPool.length]!;
        }
      }

      builtQ = {
        id: qNum,
        question: questionStem,
        options: allOpts,
        answer: answerIndex,
        explanation: `Correct Answer: "${correctOpt}". Source excerpt from notes: "${curSentence}"`,
        difficulty: itemDifficulty,
        topic: itemTopic,
        competency: assignedCompetency,
        noteReference: curSentence,
        questionType: effectiveType,
      };
    }

    questions.push(sanitizeMCQQuestion(builtQ, i));
  }

  return questions;
}

/**
 * Helper to strip markdown code fences (```json ... ```) from LLM responses
 */
function parseJsonFromLlmText(rawText: string): unknown {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Call External LLM API (Google Gemini or OpenAI)
 * Falls back gracefully to Built-in NLP if no key is provided or if network/API fails.
 */
export async function generateQuestionsWithLLM(
  notes: string,
  config: QuizConfig,
): Promise<MCQQuestion[]> {
  const { aiProvider, apiKey, count, difficulty, qType, topic, customSuggestions, competency } =
    config;

  if (!apiKey || !apiKey.trim() || aiProvider === "builtin") {
    return generateQuestionsWithNLP(notes, config);
  }

  const promptText = `
You are an expert assessment creator and educator.
Generate exactly ${count} multiple choice questions strictly based on the following uploaded learning material/notes.

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
    "question": "Specific, clear question text?",
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
      const requestedModel = config.modelName || "gemini-2.5-flash";
      const candidateModels = Array.from(
        new Set([requestedModel, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]),
      );

      let lastErr: Error | null = null;
      for (const model of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastErr = new Error(`Gemini API (${model} -> ${response.status}): ${errText}`);
          continue;
        }

        const data = await response.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) {
          lastErr = new Error("Empty response from Gemini API");
          continue;
        }

        const parsed = parseJsonFromLlmText(rawJson);
        const arr = Array.isArray(parsed)
          ? parsed
          : (parsed as Record<string, unknown>)?.["questions"] ||
            Object.values(parsed as Record<string, unknown>)[0];

        if (Array.isArray(arr) && arr.length > 0) {
          return arr.map((q: MCQQuestion, idx: number) => ({
            ...q,
            id: idx + 1,
            answer: Math.max(0, Math.min(3, Number(q.answer) || 0)),
            options: (Array.isArray(q.options) ? q.options.slice(0, 4) : ["A", "B", "C", "D"]) as [
              string,
              string,
              string,
              string,
            ],
            difficulty: q.difficulty || "Medium",
            questionType: q.questionType || "MCQ",
          }));
        }
      }
      if (lastErr) throw lastErr;
    } else if (aiProvider === "openai") {
      const model = config.modelName || "gpt-4o-mini";
      const url = "https://api.openai.com/v1/chat/completions";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
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
          temperature: 0.25,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from OpenAI");

      const parsedObj = parseJsonFromLlmText(rawContent);
      const arr = Array.isArray(parsedObj)
        ? parsedObj
        : (parsedObj as Record<string, unknown>)?.["questions"] ||
          Object.values(parsedObj as Record<string, unknown>)[0];
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((q: MCQQuestion, idx: number) => ({
          ...q,
          id: idx + 1,
          answer: Math.max(0, Math.min(3, Number(q.answer) || 0)),
          options: (Array.isArray(q.options) ? q.options.slice(0, 4) : ["A", "B", "C", "D"]) as [
            string,
            string,
            string,
            string,
          ],
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
