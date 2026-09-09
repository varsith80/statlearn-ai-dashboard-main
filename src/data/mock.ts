export type Priority = "Critical" | "High" | "Medium" | "Low";

export const user = {
  name: "Ananya Sharma",
  role: "Statistical Officer",
  cadre: "Indian Statistical Service (ISS)",
  office: "National Statistical Office, MoSPI",
  employeeId: "MoSPI/ISS/20418",
  initials: "AS",
};

export const kpis = [
  {
    id: "competency",
    label: "Overall Competency Score",
    value: "78%",
    delta: "+8.4% this month",
    trend: "up" as const,
    icon: "gauge",
  },
  {
    id: "progress",
    label: "Learning Progress",
    value: "64%",
    delta: "12 courses completed",
    trend: "up" as const,
    icon: "graduation",
  },
  {
    id: "gaps",
    label: "Skill Gaps Identified",
    value: "05",
    delta: "3 high priority",
    trend: "down" as const,
    icon: "target",
  },
  {
    id: "recos",
    label: "AI Recommendations",
    value: "08",
    delta: "Personalized for you",
    trend: "up" as const,
    icon: "sparkles",
  },
];

export const competencyRadar = [
  { area: "Statistical Analysis", score: 74, benchmark: 85 },
  { area: "Data Visualization", score: 88, benchmark: 80 },
  { area: "Data Quality", score: 58, benchmark: 85 },
  { area: "Statistical Methods", score: 66, benchmark: 88 },
  { area: "Data Management", score: 79, benchmark: 82 },
  { area: "Policy & Governance", score: 71, benchmark: 78 },
];

export const skillGaps = [
  {
    competency: "Statistical Modelling",
    current: "Intermediate",
    required: "Advanced",
    gap: 24,
    priority: "High" as Priority,
    action: "Start Training",
  },
  {
    competency: "Data Quality",
    current: "Basic",
    required: "Advanced",
    gap: 38,
    priority: "Critical" as Priority,
    action: "Start Training",
  },
  {
    competency: "Data Visualization",
    current: "Advanced",
    required: "Advanced",
    gap: 5,
    priority: "Low" as Priority,
    action: "Maintain",
  },
  {
    competency: "Survey Methodology",
    current: "Intermediate",
    required: "Advanced",
    gap: 21,
    priority: "Medium" as Priority,
    action: "View Course",
  },
  {
    competency: "Official Statistics Governance",
    current: "Intermediate",
    required: "Advanced",
    gap: 17,
    priority: "High" as Priority,
    action: "Start Training",
  },
];

export type Course = {
  id: string;
  title: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  match: number;
  progress: number;
  provider: string;
  modules: number;
  summary: string;
};

export const recommendations: Course[] = [
  {
    id: "c1",
    title: "Advanced Statistical Modelling",
    category: "Statistical Methods",
    level: "Advanced",
    duration: "12h 30m",
    match: 96,
    progress: 0,
    provider: "NSSTA, MoSPI",
    modules: 9,
    summary:
      "Regression diagnostics, time-series modelling and small-area estimation applied to official statistics.",
  },
  {
    id: "c2",
    title: "Data Quality Assurance",
    category: "Data Quality",
    level: "Intermediate",
    duration: "8h 15m",
    match: 93,
    progress: 15,
    provider: "iGOT Karmayogi",
    modules: 7,
    summary:
      "Edit rules, imputation strategy and the NQAF quality dimensions used across national surveys.",
  },
  {
    id: "c3",
    title: "Survey Sampling Techniques",
    category: "Survey Methodology",
    level: "Intermediate",
    duration: "10h 00m",
    match: 88,
    progress: 42,
    provider: "NSSTA, MoSPI",
    modules: 8,
    summary:
      "Stratified, multi-stage and PPS designs with weight computation for large household surveys.",
  },
  {
    id: "c4",
    title: "Official Statistics & Governance",
    category: "Policy & Governance",
    level: "Intermediate",
    duration: "6h 45m",
    match: 84,
    progress: 60,
    provider: "iGOT Karmayogi",
    modules: 6,
    summary:
      "Statistical legislation, UN Fundamental Principles and dissemination governance in India.",
  },
  {
    id: "c5",
    title: "Data Visualization for Statistical Reporting",
    category: "Data Visualization",
    level: "Advanced",
    duration: "5h 20m",
    match: 79,
    progress: 88,
    provider: "NSSTA, MoSPI",
    modules: 5,
    summary:
      "Designing accurate, accessible charts and dashboards for statistical releases and policy briefs.",
  },
];

export const myLearning = [
  {
    id: "l1",
    title: "Survey Sampling Techniques",
    category: "Survey Methodology",
    progress: 42,
    status: "In Progress",
    lastAccessed: "Yesterday",
    nextModule: "Module 4 · PPS Sampling",
  },
  {
    id: "l2",
    title: "Official Statistics & Governance",
    category: "Policy & Governance",
    progress: 60,
    status: "In Progress",
    lastAccessed: "2 days ago",
    nextModule: "Module 4 · Dissemination Standards",
  },
  {
    id: "l3",
    title: "Data Visualization for Statistical Reporting",
    category: "Data Visualization",
    progress: 88,
    status: "In Progress",
    lastAccessed: "Today",
    nextModule: "Module 5 · Accessible Charting",
  },
  {
    id: "l4",
    title: "Index Numbers & Price Statistics",
    category: "Statistical Analysis",
    progress: 100,
    status: "Completed",
    lastAccessed: "12 Aug 2026",
    nextModule: "Certificate issued",
  },
  {
    id: "l5",
    title: "National Accounts Fundamentals",
    category: "Statistical Analysis",
    progress: 100,
    status: "Completed",
    lastAccessed: "28 Jul 2026",
    nextModule: "Certificate issued",
  },
  {
    id: "l6",
    title: "Introduction to R for Official Statistics",
    category: "Data Management",
    progress: 0,
    status: "Not Started",
    lastAccessed: "—",
    nextModule: "Module 1 · Environment Setup",
  },
];

export const igotResources = [
  {
    id: "g1",
    title: "Karmayogi Foundation: Ethics in Public Service",
    ministry: "Capacity Building Commission",
    hours: "4h",
    learners: "1.2L",
    status: "Synced",
  },
  {
    id: "g2",
    title: "Data-Driven Governance for Officials",
    ministry: "MeitY",
    hours: "6h",
    learners: "48K",
    status: "Synced",
  },
  {
    id: "g3",
    title: "National Data Quality Assurance Framework",
    ministry: "MoSPI",
    hours: "5h",
    learners: "16K",
    status: "New",
  },
  {
    id: "g4",
    title: "Digital Public Infrastructure & Statistics",
    ministry: "NITI Aayog",
    hours: "3h",
    learners: "22K",
    status: "New",
  },
];

export const materials = [
  {
    id: "m1",
    name: "NSS 79th Round – Concepts & Definitions.pdf",
    type: "PDF",
    size: "4.2 MB",
    uploaded: "02 Sep 2026",
    status: "Processed",
    quizzes: 3,
  },
  {
    id: "m2",
    name: "Data Quality Assurance Framework.docx",
    type: "DOCX",
    size: "1.1 MB",
    uploaded: "31 Aug 2026",
    status: "Processed",
    quizzes: 2,
  },
  {
    id: "m3",
    name: "Sampling Methods – Training Deck.pptx",
    type: "PPTX",
    size: "8.7 MB",
    uploaded: "29 Aug 2026",
    status: "Processing",
    quizzes: 0,
  },
  {
    id: "m4",
    name: "Index Number Methodology Notes.txt",
    type: "TXT",
    size: "212 KB",
    uploaded: "24 Aug 2026",
    status: "Processed",
    quizzes: 1,
  },
  {
    id: "m5",
    name: "National Accounts Statistics 2026 – Summary.pdf",
    type: "PDF",
    size: "6.5 MB",
    uploaded: "18 Aug 2026",
    status: "Processed",
    quizzes: 4,
  },
];

export const quizQuestions = [
  {
    id: 1,
    question:
      "Which statistical method is most appropriate for estimating population characteristics from a sample?",
    options: [
      "Descriptive analysis",
      "Sampling estimation",
      "Data visualization",
      "Data cleaning",
    ],
    answer: 1,
    explanation:
      "Sampling estimation uses design weights and estimators to infer population parameters from sample observations, which is the basis of all large-scale official surveys.",
  },
  {
    id: 2,
    question:
      "In a stratified random sample, why are the population units grouped into strata before selection?",
    options: [
      "To reduce the cost of listing units",
      "To increase precision by grouping similar units",
      "To eliminate the need for weighting",
      "To guarantee a normal distribution of estimates",
    ],
    answer: 1,
    explanation:
      "Stratification groups homogeneous units so that within-stratum variance is small, which lowers the overall sampling variance of the estimator.",
  },
  {
    id: 3,
    question:
      "Which dimension of the National Quality Assurance Framework deals with the time lag between the reference period and data release?",
    options: ["Relevance", "Accuracy", "Timeliness and punctuality", "Coherence"],
    answer: 2,
    explanation:
      "Timeliness and punctuality measure how quickly statistics are released after the reference period and whether releases follow the announced calendar.",
  },
  {
    id: 4,
    question: "The sampling error of an estimate can be reduced most directly by:",
    options: [
      "Increasing the effective sample size",
      "Improving the questionnaire layout",
      "Adding more tabulation categories",
      "Publishing the data faster",
    ],
    answer: 0,
    explanation:
      "Sampling error is inversely related to the square root of the effective sample size, so a larger (or better-designed) sample reduces it.",
  },
  {
    id: 5,
    question:
      "Which index formula uses current-period quantities as weights in price index construction?",
    options: ["Laspeyres index", "Paasche index", "Fisher index", "Simple aggregative index"],
    answer: 1,
    explanation:
      "The Paasche index weights prices by current-period quantities, whereas Laspeyres uses base-period quantities.",
  },
  {
    id: 6,
    question: "Non-sampling error in a household survey is best controlled through:",
    options: [
      "A larger sample size",
      "Rigorous field supervision and edit checks",
      "Using a probability design",
      "Reporting confidence intervals",
    ],
    answer: 1,
    explanation:
      "Non-sampling errors arise from measurement, non-response and processing, so supervision, training and edit/imputation rules are the effective controls.",
  },
  {
    id: 7,
    question:
      "Under the UN Fundamental Principles of Official Statistics, individual data collected for statistical compilation must be:",
    options: [
      "Shared with all government departments",
      "Published in microdata form immediately",
      "Kept strictly confidential and used only for statistical purposes",
      "Retained for a maximum of one year",
    ],
    answer: 2,
    explanation:
      "Principle 6 requires strict confidentiality of individual data, which may be used only for statistical purposes.",
  },
  {
    id: 8,
    question: "Small-area estimation is typically required when:",
    options: [
      "The survey sample in a domain is too small for direct estimates",
      "The census is unavailable",
      "Data are collected on paper schedules",
      "The response rate exceeds 95%",
    ],
    answer: 0,
    explanation:
      "Model-based small-area estimation borrows strength from auxiliary data when direct domain estimates have unacceptably large variance.",
  },
  {
    id: 9,
    question: "Which chart type best communicates the composition of GDP by sector over time?",
    options: [
      "Scatter plot",
      "Stacked area chart",
      "Radar chart",
      "Box plot",
    ],
    answer: 1,
    explanation:
      "A stacked area chart shows both the total and each sector's contribution across a continuous time axis.",
  },
  {
    id: 10,
    question: "Metadata accompanying an official statistical release primarily helps users to:",
    options: [
      "Reduce the file size of the release",
      "Interpret concepts, coverage and methods correctly",
      "Bypass confidentiality rules",
      "Speed up data entry",
    ],
    answer: 1,
    explanation:
      "Reference metadata documents definitions, coverage, methodology and quality, enabling correct interpretation and comparability.",
  },
];

export const weeklyActivity = [
  { day: "Mon", hours: 1.5, quizzes: 1 },
  { day: "Tue", hours: 2.2, quizzes: 2 },
  { day: "Wed", hours: 0.8, quizzes: 0 },
  { day: "Thu", hours: 2.9, quizzes: 3 },
  { day: "Fri", hours: 1.9, quizzes: 1 },
  { day: "Sat", hours: 3.4, quizzes: 2 },
  { day: "Sun", hours: 1.1, quizzes: 1 },
];

export const competencyTimeline = [
  { month: "Apr", score: 58, quality: 40, modelling: 45 },
  { month: "May", score: 62, quality: 46, modelling: 49 },
  { month: "Jun", score: 66, quality: 50, modelling: 54 },
  { month: "Jul", score: 70, quality: 53, modelling: 58 },
  { month: "Aug", score: 74, quality: 55, modelling: 62 },
  { month: "Sep", score: 78, quality: 62, modelling: 66 },
];

export const quizPerformance = [
  { name: "Sampling", score: 88 },
  { name: "Modelling", score: 64 },
  { name: "Quality", score: 58 },
  { name: "Visualization", score: 92 },
  { name: "Governance", score: 76 },
];

export const completionSplit = [
  { name: "Completed", value: 12 },
  { name: "In Progress", value: 5 },
  { name: "Not Started", value: 3 },
];

export const notifications = [
  {
    id: "n1",
    title: "New course recommendation",
    body: "Advanced Statistical Modelling matches 96% of your competency profile.",
    time: "12 min ago",
    type: "recommendation",
    unread: true,
  },
  {
    id: "n2",
    title: "Competency assessment completed",
    body: "Your Q3 competency assessment has been scored. Overall score: 78%.",
    time: "2 hours ago",
    type: "assessment",
    unread: true,
  },
  {
    id: "n3",
    title: "Quiz generated successfully",
    body: "20 questions generated from 'NSS 79th Round – Concepts & Definitions.pdf'.",
    time: "Yesterday",
    type: "quiz",
    unread: true,
  },
  {
    id: "n4",
    title: "New iGOT learning resource available",
    body: "MoSPI published 'National Data Quality Assurance Framework' on iGOT Karmayogi.",
    time: "2 days ago",
    type: "igot",
    unread: false,
  },
  {
    id: "n5",
    title: "Learning milestone achieved",
    body: "You completed 12 courses and crossed 120 learning hours this year.",
    time: "4 days ago",
    type: "milestone",
    unread: false,
  },
];

export const aiInsights = [
  "Your competency in Data Quality improved by 12% this month.",
  "You are ready for advanced Statistical Modelling training.",
  "You have 3 high-priority competency gaps to close before Q4 review.",
];
