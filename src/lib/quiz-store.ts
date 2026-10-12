import { useState, useEffect } from "react";
import {
  NoteDocument,
  MCQQuestion,
  QuizResult,
  CompetencyDomain,
  analyzeNotes,
  sanitizeNoteDocument,
  sanitizeMCQQuestion,
} from "./ai-quiz-engine";
import {
  competencyRadar as initialRadar,
  skillGaps as initialSkillGaps,
  kpis as initialKpis,
  recommendations as initialRecommendations,
  user as initialUser,
} from "@/data/mock";

// Pre-loaded realistic official training notes
export const PRELOADED_NOTES: NoteDocument[] = [
  {
    id: "mat-nss-79",
    name: "NSS 79th Round – Survey Methodology & Concepts.txt",
    type: "TXT",
    size: "4.8 KB",
    uploadedAt: "02 Sep 2026",
    wordCount: 420,
    charCount: 2980,
    detectedTopics: [
      "Stratified Sampling",
      "First Stage Units",
      "Design Weights",
      "Sampling Error",
      "Multiplier Calculation",
    ],
    suggestedCompetencies: ["Survey Methodology", "Statistical Methods"],
    summary:
      "Comprehensive conceptual guidelines on multi-stage stratified sampling designs, first stage unit (FSU) selection, and household multipliers used across NSS rounds.",
    content: `National Sample Survey (NSS) 79th Round: Concepts, Definitions and Sampling Methodology

1. Introduction to Survey Design:
The survey adopts a stratified multi-stage design. The first stage units (FSU) are the census villages in rural areas and the Urban Frame Survey (UFS) blocks in urban areas. The ultimate stage units (USU) are the households in both sectors. For large FSUs, hamlet-group or sub-block formation is conducted to reduce listing burden while maintaining selection probabilities.

2. Stratification Strategy:
Within each district, two basic strata are formed: rural stratum comprising all rural areas of the district, and urban stratum comprising all urban areas. Stratification increases sampling precision by grouping homogeneous socio-economic units before selection. Within each stratum, FSUs are arranged in ascending order of population to ensure implicit stratification.

3. Selection of First Stage Units (FSUs):
FSUs are selected using Probability Proportional to Size with Replacement (PPSWR) or Circular Systematic Sampling (CSS), where size is the population according to the latest Population Census. Using PPSWR gives larger villages a proportionately higher probability of inclusion, which balances sample variance for aggregated totals.

4. Estimation Procedure and Multipliers:
The unbiased estimator of a population total requires the application of design weights. The design weight is the inverse of the inclusion probability of the sample unit. The multiplier combines the sampling weights of both stages: the FSU sampling weight and the household selection weight within the chosen hamlet-groups.

5. Sampling and Non-Sampling Errors:
Sampling error is inversely related to the square root of the effective sample size and is measured using standard errors and coefficients of variation (CV). In contrast, non-sampling errors arise from recall bias, non-response, measurement discrepancies, and data processing. Non-sampling errors cannot be mitigated simply by expanding sample size; they require rigorous field supervision, standardized questionnaires, and automated validation rules during data entry.
`,
  },
  {
    id: "mat-nqaf",
    name: "National Quality Assurance Framework (NQAF) Guidelines.txt",
    type: "TXT",
    size: "3.9 KB",
    uploadedAt: "31 Aug 2026",
    wordCount: 360,
    charCount: 2640,
    detectedTopics: [
      "Data Quality Framework",
      "Timeliness & Punctuality",
      "Imputation Rules",
      "Relevance",
      "Audit Standards",
    ],
    suggestedCompetencies: ["Data Quality", "Official Statistics Governance"],
    summary:
      "Official framework establishing quality assurance principles, validation rules, and imputation protocols across national statistical releases.",
    content: `National Quality Assurance Framework (NQAF) for Official Statistics

1. Purpose and Quality Dimensions:
The NQAF defines the quality benchmark for official statistics produced by line ministries and statistical agencies. Quality is evaluated across six core dimensions: Relevance, Accuracy and Reliability, Timeliness and Punctuality, Accessibility and Clarity, Coherence and Comparability, and Manageability.

2. Accuracy and Reliability:
Accuracy is defined as the degree of closeness of estimates to the unknown true population values. It covers both sampling error assessment and non-sampling error minimization. Editing rules must be applied systematically to detect outliers, invalid code combinations, and contradictory household responses.

3. Imputation Strategy:
When item non-response occurs, statistical agencies must implement scientifically validated imputation methods such as hot-deck imputation, donor matching, or mean imputation within strata. Arbitrary substitution of respondents in the field is strictly prohibited under NQAF guidelines.

4. Timeliness and Punctuality:
Timeliness refers to the lapse of time between data collection and final dissemination. Punctuality measures adherence to the pre-announced Advanced Release Calendar (ARC). Delays must be formally documented with causal explanations published alongside the delayed statistical release.

5. Quality Audit and Documentation:
Every statistical release must be accompanied by comprehensive quality metadata documentation. Quality audits must be performed periodically by independent peer review teams to ensure full alignment with UN Fundamental Principles of Official Statistics.
`,
  },
  {
    id: "mat-index-num",
    name: "Index Number Methodology – Price Statistics Notes.txt",
    type: "TXT",
    size: "3.4 KB",
    uploadedAt: "24 Aug 2026",
    wordCount: 310,
    charCount: 2210,
    detectedTopics: [
      "Index Numbers",
      "Laspeyres & Paasche",
      "Consumer Price Index",
      "Substitution Bias",
      "Base Year Revision",
    ],
    suggestedCompetencies: ["Statistical Methods", "Statistical Analysis"],
    summary:
      "Methodology of consumer and wholesale price indices, Laspeyres and Paasche index formulas, substitution bias, and geometric price aggregation.",
    content: `Index Number Theory and Price Statistics Compilation

1. Concept of Price Index Numbers:
A price index measures the relative change in the price level of a basket of consumer or industrial goods and services over time relative to a designated base period. In India, the Consumer Price Index (CPI) and Wholesale Price Index (WPI) serve as critical macro-economic indicators.

2. Laspeyres vs. Paasche Formulas:
The Laspeyres price index weights individual commodity prices using quantities consumed during the fixed base period. It tends to overestimate the true cost-of-living increase due to substitution bias, as consumers shift away from goods that experience high relative price increases. Conversely, the Paasche price index uses current-period quantities as weights, which tends to underestimate the increase in price levels. The Fisher Ideal Index is defined as the geometric mean of the Laspeyres and Paasche indices.

3. Elementary Aggregates:
At the lowest level of aggregation where quantity weights are unavailable, prices are combined using either the Carli index (arithmetic mean of price relatives), Dutot index (ratio of arithmetic mean prices), or Jevons index (geometric mean of price relatives). Modern international best practice strongly recommends the Jevons index because it satisfies the transitivity axiom and reduces upward index bias.

4. Base Year Revision:
To prevent obsolete consumption baskets from distorting inflation metrics, base periods must be updated every five to seven years based on recent Household Consumption Expenditure Survey (HCES) results.
`,
  },
];

export interface AppSettings {
  aiProvider: "builtin" | "gemini" | "openai";
  geminiApiKey: string;
  openaiApiKey: string;
  geminiModel: string;
  openaiModel: string;
  defaultQuestionCount: number;
  defaultDifficulty: "Easy" | "Medium" | "Hard" | "Adaptive";
  defaultQType: "MCQ" | "True or False" | "Conceptual" | "Scenario" | "Mixed";
  showAnswerInstantly: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: "builtin",
  geminiApiKey: "",
  openaiApiKey: "",
  geminiModel: "gemini-2.0-flash",
  openaiModel: "gpt-4o-mini",
  defaultQuestionCount: 10,
  defaultDifficulty: "Medium",
  defaultQType: "MCQ",
  showAnswerInstantly: false,
};

// Gamification Models
export interface OfficerBadge {
  id: string;
  title: string;
  description: string;
  category: "sampling" | "quality" | "governance" | "streak" | "merit";
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 to 100
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  cadre: string;
  division: string;
  score: number;
  xp: number;
  quizzesTaken: number;
  badge: string;
  initials: string;
  isCurrentUser?: boolean;
}

export const INITIAL_BADGES: OfficerBadge[] = [
  {
    id: "sampling_virtuoso",
    title: "Sampling Virtuoso",
    description:
      "Demonstrated mastery of multi-stage stratified sampling and multiplier weighting.",
    category: "sampling",
    iconName: "Target",
    unlocked: true,
    unlockedAt: "18 Aug 2026",
    progress: 100,
  },
  {
    id: "quality_guardian",
    title: "Quality Guardian",
    description:
      "Completed assessment on NQAF principles, edit rules, and non-sampling error control.",
    category: "quality",
    iconName: "ShieldCheck",
    unlocked: true,
    unlockedAt: "28 Aug 2026",
    progress: 100,
  },
  {
    id: "consistent_learner",
    title: "Daily Streak Champion",
    description: "Maintained a 5-day continuous statistical assessment and note review streak.",
    category: "streak",
    iconName: "Flame",
    unlocked: false,
    progress: 80,
  },
  {
    id: "knowledge_curator",
    title: "Knowledge Curator",
    description: "Uploaded, parsed, and synthesized 3 official guidelines into active assessments.",
    category: "merit",
    iconName: "BookOpen",
    unlocked: true,
    unlockedAt: "02 Sep 2026",
    progress: 100,
  },
  {
    id: "modelling_master",
    title: "Small Area Estimation Specialist",
    description: "Scored >85% in advanced model-based domain estimation techniques.",
    category: "sampling",
    iconName: "Sparkles",
    unlocked: false,
    progress: 64,
  },
  {
    id: "iss_cadre_leader",
    title: "ISS Cadre Honors",
    description: "Ranked among top 5% of officers in National Statistical Systems Academy.",
    category: "merit",
    iconName: "Award",
    unlocked: false,
    progress: 73,
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "Dr. Vikram Sethi",
    cadre: "ISS 2018 Batch",
    division: "Survey Design & Research Division (SDRD), Kolkata",
    score: 94,
    xp: 3840,
    quizzesTaken: 28,
    badge: "Master Demographer",
    initials: "VS",
  },
  {
    rank: 2,
    name: "Meera Krishnan",
    cadre: "ISS 2019 Batch",
    division: "National Accounts Division (NAD), New Delhi",
    score: 91,
    xp: 3520,
    quizzesTaken: 24,
    badge: "National Accounts Fellow",
    initials: "MK",
  },
  {
    rank: 3,
    name: "Rajeshwar Rao",
    cadre: "ISS 2020 Batch",
    division: "Price Statistics Division (PSD), New Delhi",
    score: 86,
    xp: 3100,
    quizzesTaken: 19,
    badge: "Index Number Expert",
    initials: "RR",
  },
  {
    rank: 4,
    name: "Ananya Sharma",
    cadre: "ISS 2021 Batch",
    division: "National Statistical Office (NSO), MoSPI",
    score: 78,
    xp: 2860,
    quizzesTaken: 12,
    badge: "Sampling Specialist",
    initials: "AS",
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: "Arjun Chakraborty",
    cadre: "ISS 2021 Batch",
    division: "Field Operations Division (FOD), Guwahati",
    score: 75,
    xp: 2640,
    quizzesTaken: 14,
    badge: "Field Operations Ace",
    initials: "AC",
  },
];

// Predictive Skill Demand Dataset for MoSPI 2025-2028
export const PREDICTIVE_SKILL_FORECAST = [
  { year: "2024", bigData: 18, smallArea: 28, capiAi: 45, quality: 60, governance: 70 },
  { year: "2025", bigData: 32, smallArea: 38, capiAi: 60, quality: 68, governance: 72 },
  { year: "2026", bigData: 46, smallArea: 48, capiAi: 72, quality: 75, governance: 74 },
  { year: "2027*", bigData: 68, smallArea: 68, capiAi: 85, quality: 84, governance: 80 },
  { year: "2028*", bigData: 84, smallArea: 86, capiAi: 95, quality: 92, governance: 88 },
];

export const SURVEY_READINESS_METRICS = [
  {
    survey: "NSS 80th Round (Service Sector & Household)",
    targetDate: "Q1 2027",
    readiness: 84,
    status: "On Track" as const,
    keySkillNeed: "Multi-stage PPS & Stratification",
    riskLevel: "Low",
  },
  {
    survey: "Annual Survey of Industries (ASI) 2027",
    targetDate: "Q2 2027",
    readiness: 91,
    status: "Ready" as const,
    keySkillNeed: "Enterprise Register & Imputation",
    riskLevel: "Low",
  },
  {
    survey: "Economic Census Modernization",
    targetDate: "Q3 2027",
    readiness: 64,
    status: "Needs Attention" as const,
    keySkillNeed: "Geospatial Tagging & CAPI Validation",
    riskLevel: "Critical",
  },
  {
    survey: "Household Consumption Expenditure Survey",
    targetDate: "Q4 2027",
    readiness: 78,
    status: "In Progress" as const,
    keySkillNeed: "Deflators & Price Relatives",
    riskLevel: "Medium",
  },
];

const STORAGE_KEYS = {
  MATERIALS: "statlearn_materials_v1",
  QUIZ_RESULTS: "statlearn_quiz_results_v1",
  RADAR: "statlearn_competency_radar_v1",
  SETTINGS: "statlearn_settings_v1",
  PENDING_DOC: "statlearn_pending_doc_v1",
  BADGES: "statlearn_badges_v1",
  OFFICER_XP: "statlearn_officer_xp_v1",
  IGOT_SYNC: "statlearn_igot_sync_v1",
  USER_PROFILE: "statlearn_user_profile_v1",
  NOTIFICATIONS: "statlearn_notifications_v1",
  LEARNING_COURSES: "statlearn_learning_courses_v1",
};

const STORAGE_EVENT = "statlearn-storage-sync";

// Safe localStorage getters/setters for SSR and browser
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }));
  } catch (err) {
    console.error(`Failed to store ${key}:`, err);
  }
}

function useSyncedState<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(() => getStored(key, fallback));

  useEffect(() => {
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<{ key: string }>;
      if (custom.detail?.key === key) {
        setState(getStored(key, fallback));
      }
    };
    window.addEventListener(STORAGE_EVENT, handleSync);
    return () => window.removeEventListener(STORAGE_EVENT, handleSync);
  }, [key]);

  const setSyncedState = (updater: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      setStored(key, next);
      return next;
    });
  };

  return [state, setSyncedState] as const;
}

// Global state hook for materials
export function useMaterialsStore() {
  const [rawMaterials, setMaterials] = useSyncedState<NoteDocument[]>(
    STORAGE_KEYS.MATERIALS,
    PRELOADED_NOTES,
  );

  const materials = rawMaterials.map((m) => sanitizeNoteDocument(m));

  const addMaterial = (mat: NoteDocument) => {
    const cleanMat = sanitizeNoteDocument(mat);
    setMaterials((prev) => [cleanMat, ...prev.filter((m) => m.id !== cleanMat.id)]);
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const resetMaterials = () => {
    setMaterials(PRELOADED_NOTES);
  };

  return { materials, addMaterial, removeMaterial, resetMaterials };
}

// Global state hook for quizzes & competency results
export function useQuizResultsStore() {
  const [rawResults, setResults] = useSyncedState<QuizResult[]>(STORAGE_KEYS.QUIZ_RESULTS, []);
  const [competencyRadar, setCompetencyRadar] = useSyncedState(STORAGE_KEYS.RADAR, initialRadar);

  const results = rawResults.map((r) => ({
    ...r,
    questions: (r.questions || []).map((q, idx) => sanitizeMCQQuestion(q, idx)),
  }));

  const recordQuizResult = (result: QuizResult) => {
    const cleanResult: QuizResult = {
      ...result,
      questions: (result.questions || []).map((q, idx) => sanitizeMCQQuestion(q, idx)),
    };
    setResults((prev) => [cleanResult, ...prev]);

    // Update competency scores based on performance
    const pct = result.percentage;
    setCompetencyRadar((prevRadar: Array<{ area: string; score: number; benchmark: number }>) => {
      return prevRadar.map((item) => {
        const impact = result.competencyImpact[item.area];
        if (impact !== undefined) {
          const delta = pct >= 70 ? Math.min(6, Math.max(1, Math.round(pct / 18))) : -1;
          const newScore = Math.max(20, Math.min(100, item.score + delta));
          return { ...item, score: newScore };
        }
        return item;
      });
    });
  };

  const clearHistory = () => {
    setResults([]);
    setCompetencyRadar(initialRadar);
  };

  return { results, recordQuizResult, competencyRadar, clearHistory };
}

// Gamification store hook
export function useGamificationStore() {
  const [badges, setBadges] = useSyncedState<OfficerBadge[]>(STORAGE_KEYS.BADGES, INITIAL_BADGES);
  const [xp, setXp] = useSyncedState<number>(STORAGE_KEYS.OFFICER_XP, 2860);

  const awardXp = (amount: number) => {
    setXp((prev) => prev + amount);
  };

  const unlockBadge = (badgeId: string) => {
    setBadges((prev) =>
      prev.map((b) =>
        b.id === badgeId
          ? {
              ...b,
              unlocked: true,
              progress: 100,
              unlockedAt: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            }
          : b,
      ),
    );
  };

  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const currentLevelProgress = Math.round(((xp % 1000) / 1000) * 100);

  return {
    badges,
    xp,
    level,
    nextLevelXp,
    currentLevelProgress,
    awardXp,
    unlockBadge,
    leaderboard: INITIAL_LEADERBOARD,
    streakDays: 5,
  };
}

// iGOT Karmayogi Sync store hook
export interface IgotSyncRecord {
  id: string;
  courseTitle: string;
  provider: string;
  hours: string;
  syncedAt: string;
  status: "Synced" | "Pending Verification" | "Certified";
  type: "inbound" | "outbound";
}

const INITIAL_SYNC_RECORDS: IgotSyncRecord[] = [
  {
    id: "sync-1",
    courseTitle: "Karmayogi Foundation: Ethics in Public Service",
    provider: "Capacity Building Commission (CBC)",
    hours: "4h",
    syncedAt: "Today, 11:20 AM",
    status: "Certified",
    type: "inbound",
  },
  {
    id: "sync-2",
    courseTitle: "National Data Quality Assurance Framework (NQAF)",
    provider: "MoSPI Official Portal",
    hours: "5h",
    syncedAt: "Yesterday, 04:15 PM",
    status: "Synced",
    type: "inbound",
  },
  {
    id: "sync-3",
    courseTitle: "Assessment: Survey Sampling & Multipliers (NSS 79th)",
    provider: "StatLearn AI Internal Engine",
    hours: "2.5h",
    syncedAt: "02 Sep 2026",
    status: "Certified",
    type: "outbound",
  },
];

export function useIgotSyncStore() {
  const [syncRecords, setSyncRecords] = useSyncedState<IgotSyncRecord[]>(
    STORAGE_KEYS.IGOT_SYNC,
    INITIAL_SYNC_RECORDS,
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerSync = async (): Promise<boolean> => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const newRecord: IgotSyncRecord = {
      id: `sync-${Date.now()}`,
      courseTitle: "Bi-Directional Competency Ledger Synchronized",
      provider: "DoPT GovNet API Gateway",
      hours: "+2.0h Credits",
      syncedAt: "Just now",
      status: "Certified",
      type: "outbound",
    };

    setSyncRecords((prev) => [newRecord, ...prev]);
    setIsSyncing(false);
    return true;
  };

  return {
    syncRecords,
    isSyncing,
    triggerSync,
    totalHoursSynced: 126 + (syncRecords.length - INITIAL_SYNC_RECORDS.length) * 2,
    annualTarget: 150,
  };
}

// Global state hook for Settings
export function useSettingsStore() {
  const [settings, setSettings] = useSyncedState<AppSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS,
  );

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return { settings, updateSettings, resetSettings };
}

// ============================================================================
// Officer Profile & Authentication Store
// ============================================================================
export interface OfficerProfile {
  name: string;
  role: string;
  cadre: string;
  office: string;
  employeeId: string;
  initials: string;
  email: string;
  batch: string;
}

export const DEMO_OFFICERS: OfficerProfile[] = [
  {
    name: "Ananya Sharma",
    role: "Statistical Officer",
    cadre: "Indian Statistical Service (ISS)",
    office: "National Statistical Office (NSO), MoSPI",
    employeeId: "MoSPI/ISS/20418",
    initials: "AS",
    email: "ananya.sharma@mospi.gov.in",
    batch: "ISS 2021 Batch",
  },
  {
    name: "Dr. Vikram Sethi",
    role: "Director (Survey Design)",
    cadre: "Indian Statistical Service (ISS)",
    office: "Survey Design & Research Division (SDRD), Kolkata",
    employeeId: "MoSPI/ISS/18104",
    initials: "VS",
    email: "vikram.sethi@mospi.gov.in",
    batch: "ISS 2018 Batch",
  },
  {
    name: "Meera Krishnan",
    role: "Joint Director (National Accounts)",
    cadre: "Indian Statistical Service (ISS)",
    office: "National Accounts Division (NAD), New Delhi",
    employeeId: "MoSPI/ISS/19211",
    initials: "MK",
    email: "meera.krishnan@mospi.gov.in",
    batch: "ISS 2019 Batch",
  },
];

export function useUserStore() {
  const [userProfile, setUserProfile] = useSyncedState<OfficerProfile>(
    STORAGE_KEYS.USER_PROFILE,
    DEMO_OFFICERS[0],
  );

  const updateProfile = (updates: Partial<OfficerProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      if (updates.name) {
        next.initials = updates.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || "")
          .join("");
      }
      return next;
    });
  };

  const resetProfile = () => {
    setUserProfile(DEMO_OFFICERS[0]);
  };

  return { userProfile, updateProfile, resetProfile, demoOfficers: DEMO_OFFICERS };
}

// ============================================================================
// Notifications Store
// ============================================================================
export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "recommendation" | "assessment" | "quiz" | "igot" | "milestone" | "system";
  unread: boolean;
  actionUrl: string;
  actionLabel: string;
  priority?: "Critical" | "High" | "Normal";
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "New AI Course Match (96% Profile Fit)",
    body: "Advanced Statistical Modelling on NSSTA matches your priority gap in Small Area Estimation & Regression Diagnostics.",
    time: "12 min ago",
    type: "recommendation",
    unread: true,
    actionUrl: "/recommendations",
    actionLabel: "View Recommended Course",
    priority: "High",
  },
  {
    id: "n2",
    title: "Q3 Competency Assessment Calibrated",
    body: "Your Q3 competency radar has been benchmarked against MoSPI Framework v3.2. Overall score: 78% (Level 3 · Proficient).",
    time: "2 hours ago",
    type: "assessment",
    unread: true,
    actionUrl: "/competencies",
    actionLabel: "Inspect Competency Radar",
    priority: "Normal",
  },
  {
    id: "n3",
    title: "AI Assessment Bank Ready: NSS 79th Round",
    body: "20 multi-stage sampling & multiplier questions synthesized from 'NSS 79th Round – Survey Methodology & Concepts.txt'.",
    time: "Yesterday",
    type: "quiz",
    unread: true,
    actionUrl: "/quiz-generator",
    actionLabel: "Launch Quiz Studio",
    priority: "High",
  },
  {
    id: "n4",
    title: "New iGOT Karmayogi Mandate Published",
    body: "MoSPI Capacity Building Unit published 'National Data Quality Assurance Framework (NQAF)' with 5.0 DPC verified credits.",
    time: "2 days ago",
    type: "igot",
    unread: false,
    actionUrl: "/igot",
    actionLabel: "Open iGOT Hub",
    priority: "Critical",
  },
  {
    id: "n5",
    title: "Annual ISS Training Milestone Reached",
    body: "Congratulations! You completed 12 courses and crossed 126 of 150 annual learning hours (84% of ISS Cadre target).",
    time: "4 days ago",
    type: "milestone",
    unread: false,
    actionUrl: "/learning",
    actionLabel: "View Certificates",
    priority: "Normal",
  },
  {
    id: "n6",
    title: "Vision 2027 Predictive Forecast Updated",
    body: "Divisional succession & CAPI survey readiness projections for NSS 80th Round have been refreshed.",
    time: "5 days ago",
    type: "system",
    unread: false,
    actionUrl: "/analytics",
    actionLabel: "Open Predictive Analytics",
    priority: "Normal",
  },
];

export function useNotificationsStore() {
  const [notifications, setNotifications] = useSyncedState<NotificationItem[]>(
    STORAGE_KEYS.NOTIFICATIONS,
    INITIAL_NOTIFICATIONS,
  );

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (
    item: Omit<NotificationItem, "id" | "time" | "unread"> & { time?: string },
  ) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      time: item.time || "Just now",
      unread: true,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  const resetNotifications = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    toggleRead,
    markAllAsRead,
    dismissNotification,
    addNotification,
    resetNotifications,
  };
}

// ============================================================================
// Learning Courses & Certificates Store
// ============================================================================
export interface CourseModuleItem {
  id: string;
  title: string;
  duration: string;
  summary: string;
  keyTakeaways: string[];
  completed: boolean;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  category: string;
  provider: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  progress: number;
  status: "In Progress" | "Completed" | "Not Started";
  lastAccessed: string;
  nextModule: string;
  certificateId?: string;
  completedAt?: string;
  credits: number;
  modules: CourseModuleItem[];
}

export const INITIAL_LEARNING_COURSES: EnrolledCourse[] = [
  {
    id: "l1",
    title: "Survey Sampling Techniques",
    category: "Survey Methodology",
    provider: "NSSTA, MoSPI",
    level: "Intermediate",
    duration: "10h 00m",
    progress: 50,
    status: "In Progress",
    lastAccessed: "Yesterday",
    nextModule: "Module 3 · PPS Sampling & Multipliers",
    credits: 6,
    modules: [
      {
        id: "l1-m1",
        title: "Module 1 · Stratified Multi-Stage Design Architecture",
        duration: "2h 15m",
        summary:
          "Formation of rural and urban strata across districts, implicit stratification by population size, and FSU selection frames.",
        keyTakeaways: [
          "Census villages serve as First Stage Units (FSUs) in rural strata",
          "Urban Frame Survey (UFS) blocks form urban FSUs",
          "Ordering FSUs by population ensures implicit stratification",
        ],
        completed: true,
      },
      {
        id: "l1-m2",
        title: "Module 2 · Hamlet-Group & Sub-Block Formation",
        duration: "2h 30m",
        summary:
          "Procedures for partitioning large villages/blocks into hamlet-groups (HGs) or sub-blocks (SBs) to control field listing workload.",
        keyTakeaways: [
          "Criterion D controls when hamlet-group formation is triggered",
          "Populous segment gets Segment 1 for focused representation",
          "Sub-block count enters the second-stage multiplier formula",
        ],
        completed: true,
      },
      {
        id: "l1-m3",
        title: "Module 3 · PPS Sampling & Multipliers",
        duration: "2h 45m",
        summary:
          "Probability Proportional to Size with Replacement (PPSWR), Circular Systematic Sampling (CSS), and unbiased Horvitz-Thompson estimators.",
        keyTakeaways: [
          "Design weight is the inverse of unit inclusion probability",
          "Combined household multiplier integrates FSU and USU selection weights",
          "Post-stratification calibration aligns sample totals to Census projections",
        ],
        completed: false,
      },
      {
        id: "l1-m4",
        title: "Module 4 · Variance Estimation & RSE Diagnostics",
        duration: "2h 30m",
        summary:
          "Sub-sample divergence estimation, Relative Standard Error (RSE) thresholds, and suppression rules for small domains.",
        keyTakeaways: [
          "RSE above 20% requires cautionary footnotes in NSS reports",
          "Replicated sub-samples enable rapid variance calculation",
          "Design effect (DEFF) quantifies clustering vs stratification trade-offs",
        ],
        completed: false,
      },
    ],
  },
  {
    id: "l2",
    title: "Official Statistics & Governance",
    category: "Policy & Governance",
    provider: "iGOT Karmayogi",
    level: "Intermediate",
    duration: "6h 45m",
    progress: 67,
    status: "In Progress",
    lastAccessed: "2 days ago",
    nextModule: "Module 3 · Dissemination & Microdata Anonymization",
    credits: 4,
    modules: [
      {
        id: "l2-m1",
        title: "Module 1 · Collection of Statistics Act & Legal Mandate",
        duration: "2h 00m",
        summary:
          "Statutory powers, respondent obligations, and legal safeguards governing statistical schedules in India.",
        keyTakeaways: [
          "Individual unit schedules are strictly confidential by statute",
          "Data collected cannot be used as evidence in legal or tax proceedings",
          "Nodal Statistical Officers coordinate cross-ministry data standards",
        ],
        completed: true,
      },
      {
        id: "l2-m2",
        title: "Module 2 · UN Fundamental Principles of Official Statistics",
        duration: "2h 15m",
        summary:
          "Professional independence, scientific methodology, impartial dissemination, and international comparability.",
        keyTakeaways: [
          "Principle 1 mandates relevance, impartiality, and equal access",
          "Principle 6 enforces strict microdata confidentiality",
          " National Statistical Commission (NSC) oversees technical integrity",
        ],
        completed: true,
      },
      {
        id: "l2-m3",
        title: "Module 3 · Dissemination & Microdata Anonymization",
        duration: "2h 30m",
        summary:
          "Statistical Disclosure Control (SDC), k-anonymity, top/bottom coding, and Advance Release Calendar (ARC) compliance.",
        keyTakeaways: [
          "Direct and indirect identifiers must be scrubbed before public release",
          "Top-coding protects extreme enterprise revenue or expenditure outliers",
          "Every release must publish DDI-compliant reference metadata",
        ],
        completed: false,
      },
    ],
  },
  {
    id: "l3",
    title: "Data Visualization for Statistical Reporting",
    category: "Data Visualization",
    provider: "NSSTA, MoSPI",
    level: "Advanced",
    duration: "5h 20m",
    progress: 75,
    status: "In Progress",
    lastAccessed: "Today",
    nextModule: "Module 4 · Accessible & Interactive Policy Dashboards",
    credits: 4,
    modules: [
      {
        id: "l3-m1",
        title: "Module 1 · Visual Encoding of Uncertainty & Confidence Intervals",
        duration: "1h 20m",
        summary:
          "Representing error bars, fan charts, and confidence bands in official macro-economic and survey publications.",
        keyTakeaways: [
          "Point estimates without error bars can mislead policy interpretation",
          "Fan charts effectively communicate forecast uncertainty over horizons",
          "Color-blind safe palettes are mandatory for MoSPI press notes",
        ],
        completed: true,
      },
      {
        id: "l3-m2",
        title: "Module 2 · Choropleth Maps & Small Area Spatial Visualization",
        duration: "1h 20m",
        summary:
          "Normalizing spatial indicators, quantile vs Jenks natural breaks, and avoiding area-size perceptual bias.",
        keyTakeaways: [
          "Never map raw counts on choropleths; always map rates or densities",
          "Highlight high-RSE districts with hatching or muted opacity",
          "Use official Survey of India administrative boundaries",
        ],
        completed: true,
      },
      {
        id: "l3-m3",
        title: "Module 3 · Time-Series & Index Decomposition Charts",
        duration: "1h 20m",
        summary:
          "Visualizing CPI/WPI inflation contributions, seasonal adjustment trends, and base-year rebasing splices.",
        keyTakeaways: [
          "Stacked bar/area charts reveal sectoral contribution to headline inflation",
          "Logarithmic scales clarify long-horizon exponential growth rates",
          "Annotate structural breaks and base-year revisions directly on the canvas",
        ],
        completed: true,
      },
      {
        id: "l3-m4",
        title: "Module 4 · Accessible & Interactive Policy Dashboards",
        duration: "1h 20m",
        summary:
          "Designing WCAG 2.1 AA compliant statistical portals and executive summary scorecards for eSankhyiki.",
        keyTakeaways: [
          "Maintain minimum 4.5:1 contrast ratio for all chart labels",
          "Provide downloadable CSV/Excel tables alongside every visual chart",
          "Lead with the statistical headline takeaway in chart titles",
        ],
        completed: false,
      },
    ],
  },
  {
    id: "l4",
    title: "Index Numbers & Price Statistics",
    category: "Statistical Analysis",
    provider: "NSSTA, MoSPI",
    level: "Advanced",
    duration: "8h 00m",
    progress: 100,
    status: "Completed",
    lastAccessed: "12 Aug 2026",
    nextModule: "Certificate issued",
    certificateId: "NSSTA-CERT-2026-8419",
    completedAt: "12 Aug 2026",
    credits: 5,
    modules: [
      {
        id: "l4-m1",
        title: "Module 1 · Laspeyres, Paasche & Fisher Ideal Indices",
        duration: "2h 40m",
        summary:
          "Fixed-basket vs current-weight indices, substitution bias, and superlative index number properties.",
        keyTakeaways: [
          "Laspeyres uses base-period quantities and exhibits upward substitution bias",
          "Paasche uses current-period quantities and understates cost-of-living increases",
          "Fisher Ideal Index is the geometric mean satisfying time-reversal and factor-reversal tests",
        ],
        completed: true,
      },
      {
        id: "l4-m2",
        title: "Module 2 · Elementary Aggregates: Carli, Dutot & Jevons",
        duration: "2h 40m",
        summary:
          "Unweighted lower-level price aggregation formulas and international CPI manual standards.",
        keyTakeaways: [
          "Jevons index (geometric mean of price relatives) is transitive and preferred",
          "Carli index suffers from upward bias and fails time reversal",
          "Dutot index is sensitive to price level heterogeneity within item strata",
        ],
        completed: true,
      },
      {
        id: "l4-m3",
        title: "Module 3 · Base Year Revision & Basket Weighting from HCES",
        duration: "2h 40m",
        summary:
          "Deriving plutocratic vs democratic expenditure weights from Household Consumption Expenditure Surveys.",
        keyTakeaways: [
          "Base year revisions every 5-7 years capture new consumer goods",
          "Chain-linking splices old and new index series smoothly",
          "Quality adjustment separates pure price change from specification upgrades",
        ],
        completed: true,
      },
    ],
  },
  {
    id: "l5",
    title: "National Accounts Fundamentals (SNA 2008)",
    category: "Statistical Analysis",
    provider: "NSSTA, MoSPI",
    level: "Intermediate",
    duration: "9h 30m",
    progress: 100,
    status: "Completed",
    lastAccessed: "28 Jul 2026",
    nextModule: "Certificate issued",
    certificateId: "NSSTA-CERT-2026-7902",
    completedAt: "28 Jul 2026",
    credits: 6,
    modules: [
      {
        id: "l5-m1",
        title: "Module 1 · Production, Income & Expenditure GDP Approaches",
        duration: "3h 10m",
        summary:
          "Gross Value Added (GVA) at basic prices, net taxes on products, and GDP at market prices.",
        keyTakeaways: [
          "GDP = GVA at basic prices + Product Taxes - Product Subsidies",
          "Double deflation deflates output and intermediate consumption separately",
          "Supply and Use Tables (SUT) reconcile commodity flows across institutional sectors",
        ],
        completed: true,
      },
      {
        id: "l5-m2",
        title: "Module 2 · Institutional Sectors & Sequence of Accounts",
        duration: "3h 10m",
        summary:
          "Non-financial corporations, financial corporations, general government, households, and NPISH accounts.",
        keyTakeaways: [
          "Current accounts track production, income generation, and disposable income",
          "Capital account measures Gross Fixed Capital Formation (GFCF)",
          "FISIM allocates indirect financial intermediation services across users",
        ],
        completed: true,
      },
      {
        id: "l5-m3",
        title: "Module 3 · Constant Price Estimation & Chain Volume Measures",
        duration: "3h 10m",
        summary:
          "Volume extrapolation, price deflation using WPI/CPI sub-indices, and quarterly GDP benchmarking.",
        keyTakeaways: [
          "Single indicator extrapolation is used only when double deflation data are sparse",
          "Denton proportional benchmarking aligns quarterly series to annual benchmarks",
          "Revision matrices track First, Second, and Third Revised Estimates",
        ],
        completed: true,
      },
    ],
  },
  {
    id: "l6",
    title: "Introduction to R & Reproducible Pipelines for Official Statistics",
    category: "Data Management",
    provider: "NSSTA, MoSPI",
    level: "Beginner",
    duration: "7h 30m",
    progress: 0,
    status: "Not Started",
    lastAccessed: "—",
    nextModule: "Module 1 · Survey Package & Complex Design Objects",
    credits: 5,
    modules: [
      {
        id: "l6-m1",
        title: "Module 1 · Survey Package & Complex Design Objects",
        duration: "2h 30m",
        summary:
          "Declaring stratified multi-stage survey designs in R using svydesign() with PSU, strata, and multiplier weights.",
        keyTakeaways: [
          "Specify ids, strata, and weights in svydesign() for accurate standard errors",
          "Use svymean() and svytotal() for domain-level weighted tabulation",
          "Handle lonely PSUs with survey.lonely.psu = 'adjust'",
        ],
        completed: false,
      },
      {
        id: "l6-m2",
        title: "Module 2 · Automated Edit Rules & Validation with validate",
        duration: "2h 30m",
        summary:
          "Encoding deterministic range, ratio, and cross-variable consistency edits on microdata frames.",
        keyTakeaways: [
          "Separate validation rules from data cleaning scripts for auditability",
          "Use simputation for hot-deck and k-NN donor imputation within strata",
          "Generate automated NQAF data quality audit logs",
        ],
        completed: false,
      },
      {
        id: "l6-m3",
        title: "Module 3 · Reproducible Quarto Statistical Publications",
        duration: "2h 30m",
        summary:
          "Automating press notes, statistical appendix tables, and parameterized state-level reports.",
        keyTakeaways: [
          "Eliminate manual copy-paste errors between estimation scripts and reports",
          "Version-control survey estimation pipelines with Git",
          "Export accessible HTML and PDF tables simultaneously",
        ],
        completed: false,
      },
    ],
  },
];

export function useLearningStore() {
  const [courses, setCourses] = useSyncedState<EnrolledCourse[]>(
    STORAGE_KEYS.LEARNING_COURSES,
    INITIAL_LEARNING_COURSES,
  );

  const enrollOrStartCourse = (courseInput: {
    id: string;
    title: string;
    category: string;
    provider: string;
    level?: "Beginner" | "Intermediate" | "Advanced";
    duration?: string;
  }): EnrolledCourse => {
    const existing = courses.find(
      (c) => c.id === courseInput.id || c.title.toLowerCase() === courseInput.title.toLowerCase(),
    );
    if (existing) {
      if (existing.status === "Not Started") {
        const updated: EnrolledCourse = {
          ...existing,
          status: "In Progress",
          progress: Math.max(existing.progress, 15),
          lastAccessed: "Just now",
        };
        setCourses((prev) => prev.map((c) => (c.id === existing.id ? updated : c)));
        return updated;
      }
      return existing;
    }

    const newCourse: EnrolledCourse = {
      id: courseInput.id,
      title: courseInput.title,
      category: courseInput.category,
      provider: courseInput.provider,
      level: courseInput.level || "Intermediate",
      duration: courseInput.duration || "6h 00m",
      progress: 25,
      status: "In Progress",
      lastAccessed: "Just now",
      nextModule: "Module 2 · Applied Methodology & Case Studies",
      credits: 5,
      modules: [
        {
          id: `${courseInput.id}-m1`,
          title: `Module 1 · Core Concepts of ${courseInput.title}`,
          duration: "2h 00m",
          summary: `Foundational frameworks, official MoSPI definitions, and regulatory standards for ${courseInput.category}.`,
          keyTakeaways: [
            `Aligned with MoSPI Competency Framework v3.2 for ${courseInput.category}`,
            "Standardizes definitions across central and state statistical agencies",
            "Establishes quality assurance checkpoints prior to estimation",
          ],
          completed: true,
        },
        {
          id: `${courseInput.id}-m2`,
          title: "Module 2 · Applied Methodology & Case Studies",
          duration: "2h 00m",
          summary:
            "Practical estimation procedures, empirical diagnostics, and real-world applications from NSS and National Accounts rounds.",
          keyTakeaways: [
            "Step-by-step calculation workflows for statistical officers",
            "Handling non-response, outliers, and frame coverage discrepancies",
            "Diagnostic validation before publication release",
          ],
          completed: false,
        },
        {
          id: `${courseInput.id}-m3`,
          title: "Module 3 · Quality Audit & Official Dissemination",
          duration: "2h 00m",
          summary:
            "NQAF compliance verification, metadata documentation, and final competency certification assessment.",
          keyTakeaways: [
            "Comprehensive quality reporting and RSE tabulation",
            "Compliance with UN Fundamental Principles of Official Statistics",
            "Issuance of verified iGOT / NSSTA completion credits",
          ],
          completed: false,
        },
      ],
    };

    setCourses((prev) => [newCourse, ...prev]);
    return newCourse;
  };

  const toggleCourseModule = (courseId: string, moduleId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const updatedModules = c.modules.map((m) =>
          m.id === moduleId ? { ...m, completed: !m.completed } : m,
        );
        const completedCount = updatedModules.filter((m) => m.completed).length;
        const progress = Math.round((completedCount / updatedModules.length) * 100);
        const isCompleted = progress === 100;
        const firstIncomplete = updatedModules.find((m) => !m.completed);

        return {
          ...c,
          modules: updatedModules,
          progress,
          status: isCompleted ? "Completed" : progress > 0 ? "In Progress" : "Not Started",
          lastAccessed: "Just now",
          nextModule: isCompleted
            ? "Certificate issued"
            : firstIncomplete?.title || "Final Assessment",
          certificateId: isCompleted
            ? c.certificateId || `NSSTA-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`
            : c.certificateId,
          completedAt: isCompleted
            ? c.completedAt ||
              new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : c.completedAt,
        };
      }),
    );
  };

  const completeAllModules = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => ({ ...m, completed: true })),
          progress: 100,
          status: "Completed",
          lastAccessed: "Just now",
          nextModule: "Certificate issued",
          certificateId:
            c.certificateId || `NSSTA-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          completedAt: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        };
      }),
    );
  };

  const resetLearning = () => {
    setCourses(INITIAL_LEARNING_COURSES);
  };

  return {
    courses,
    enrollOrStartCourse,
    toggleCourseModule,
    completeAllModules,
    resetLearning,
  };
}

// Helper to stage a document for Quiz Generator navigation
export function stageDocumentForQuiz(doc: NoteDocument | null) {
  if (typeof window === "undefined") return;
  if (!doc) {
    window.localStorage.removeItem(STORAGE_KEYS.PENDING_DOC);
  } else {
    setStored(STORAGE_KEYS.PENDING_DOC, doc);
  }
}

export function getStagedDocumentForQuiz(): NoteDocument | null {
  return getStored<NoteDocument | null>(STORAGE_KEYS.PENDING_DOC, null);
}

