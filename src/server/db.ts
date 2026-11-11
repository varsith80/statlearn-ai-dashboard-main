import { competencyRadar as initialRadar } from "@/data/mock";
import type { NoteDocument, QuizResult } from "@/lib/ai-quiz-engine";
import {
  PRELOADED_NOTES,
  INITIAL_BADGES,
  INITIAL_LEARNING_COURSES,
  INITIAL_NOTIFICATIONS,
  DEMO_OFFICERS,
  type OfficerBadge,
  type EnrolledCourse,
  type NotificationItem,
  type OfficerProfile,
  type IgotSyncRecord,
  type AppSettings,
} from "@/lib/quiz-store";

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

type SqlRow = Record<string, unknown>;

type SqliteStatement = {
  run: (...params: unknown[]) => unknown;
  get: (...params: unknown[]) => SqlRow | undefined;
  all: (...params: unknown[]) => SqlRow[];
};

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
};

let dbInstance: SqliteDatabase | null = null;
let dbFilePath = "database/statlearn.db";
let initPromise: Promise<SqliteDatabase | null> | null = null;

async function getDb(): Promise<SqliteDatabase | null> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const sqliteMod = await import(/* @vite-ignore */ "node:sqlite");
      const fsMod = await import(/* @vite-ignore */ "node:fs");
      const pathMod = await import(/* @vite-ignore */ "node:path");

      const dbDir = pathMod.resolve(process.cwd(), "database");
      if (!fsMod.existsSync(dbDir)) {
        fsMod.mkdirSync(dbDir, { recursive: true });
      }
      const fullPath = pathMod.join(dbDir, "statlearn.db");
      dbFilePath = fullPath;

      const DatabaseSync = sqliteMod.DatabaseSync;
      const db = new DatabaseSync(fullPath) as SqliteDatabase;

      initializeSchemaAndSeed(db);
      dbInstance = db;
      return db;
    } catch (err) {
      console.warn("SQLite initialization skipped or unavailable in this runtime:", err);
      return null;
    }
  })();

  return initPromise;
}

function initializeSchemaAndSeed(db: SqliteDatabase) {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS officers (
      employee_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      cadre TEXT NOT NULL,
      office TEXT NOT NULL,
      initials TEXT NOT NULL,
      email TEXT NOT NULL,
      batch TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 2860,
      streak_days INTEGER NOT NULL DEFAULT 5,
      is_active INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area TEXT UNIQUE NOT NULL,
      score INTEGER NOT NULL,
      benchmark INTEGER NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      provider TEXT NOT NULL,
      level TEXT NOT NULL,
      duration TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Not Started',
      last_accessed TEXT NOT NULL DEFAULT '—',
      next_module TEXT NOT NULL,
      certificate_id TEXT,
      completed_at TEXT,
      credits INTEGER NOT NULL DEFAULT 4,
      modules_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      char_count INTEGER NOT NULL DEFAULT 0,
      detected_topics_json TEXT NOT NULL,
      suggested_competencies_json TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      material_id TEXT,
      material_name TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      time_spent_seconds INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      q_type TEXT NOT NULL,
      competency_impact_json TEXT NOT NULL,
      ai_feedback TEXT NOT NULL,
      questions_json TEXT NOT NULL,
      user_answers_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      unlocked INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT,
      progress INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS igot_sync_logs (
      id TEXT PRIMARY KEY,
      course_title TEXT NOT NULL,
      provider TEXT NOT NULL,
      hours TEXT NOT NULL,
      synced_at TEXT NOT NULL,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL,
      unread INTEGER NOT NULL DEFAULT 1,
      action_url TEXT NOT NULL,
      action_label TEXT NOT NULL,
      priority TEXT DEFAULT 'Normal',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      ai_provider TEXT NOT NULL DEFAULT 'builtin',
      gemini_api_key TEXT NOT NULL DEFAULT '',
      openai_api_key TEXT NOT NULL DEFAULT '',
      gemini_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
      openai_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
      default_question_count INTEGER NOT NULL DEFAULT 10,
      default_difficulty TEXT NOT NULL DEFAULT 'Medium',
      default_q_type TEXT NOT NULL DEFAULT 'MCQ',
      show_answer_instantly INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const officerCount = Number(
    db.prepare("SELECT COUNT(*) as c FROM officers").get()?.["c"] ?? 0,
  );
  if (officerCount === 0) {
    seedDatabase(db);
  }
}

function seedDatabase(db: SqliteDatabase) {
  // 1. Seed Officers
  const insertOfficer = db.prepare(`
    INSERT OR REPLACE INTO officers (
      employee_id, name, role, cadre, office, initials, email, batch, xp, streak_days, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  DEMO_OFFICERS.forEach((off, idx) => {
    insertOfficer.run(
      off.employeeId,
      off.name,
      off.role,
      off.cadre,
      off.office,
      off.initials,
      off.email,
      off.batch,
      idx === 0 ? 2860 : idx === 1 ? 3840 : 3520,
      5,
      idx === 0 ? 1 : 0,
    );
  });

  // 2. Seed Competencies
  const insertComp = db.prepare(`
    INSERT OR REPLACE INTO competencies (area, score, benchmark)
    VALUES (?, ?, ?)
  `);
  for (const item of initialRadar) {
    insertComp.run(item.area, item.score, item.benchmark);
  }

  // 3. Seed Courses
  const insertCourse = db.prepare(`
    INSERT OR REPLACE INTO courses (
      id, title, category, provider, level, duration, progress, status,
      last_accessed, next_module, certificate_id, completed_at, credits, modules_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of INITIAL_LEARNING_COURSES) {
    insertCourse.run(
      c.id,
      c.title,
      c.category,
      c.provider,
      c.level,
      c.duration,
      c.progress,
      c.status,
      c.lastAccessed,
      c.nextModule,
      c.certificateId ?? null,
      c.completedAt ?? null,
      c.credits,
      JSON.stringify(c.modules),
    );
  }

  // 4. Seed Materials
  const insertMat = db.prepare(`
    INSERT OR REPLACE INTO materials (
      id, name, type, size, uploaded_at, word_count, char_count,
      detected_topics_json, suggested_competencies_json, summary, content
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of PRELOADED_NOTES) {
    insertMat.run(
      m.id,
      m.name,
      m.type,
      m.size,
      m.uploadedAt,
      m.wordCount,
      m.charCount,
      JSON.stringify(m.detectedTopics),
      JSON.stringify(m.suggestedCompetencies),
      m.summary ?? "",
      m.content,
    );
  }

  // 5. Seed Badges
  const insertBadge = db.prepare(`
    INSERT OR REPLACE INTO badges (
      id, title, description, category, icon_name, unlocked, unlocked_at, progress
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of INITIAL_BADGES) {
    insertBadge.run(
      b.id,
      b.title,
      b.description,
      b.category,
      b.iconName,
      b.unlocked ? 1 : 0,
      b.unlockedAt ?? null,
      b.progress,
    );
  }

  // 6. Seed iGOT Sync Records
  const insertSync = db.prepare(`
    INSERT OR REPLACE INTO igot_sync_logs (
      id, course_title, provider, hours, synced_at, status, type
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of INITIAL_SYNC_RECORDS) {
    insertSync.run(s.id, s.courseTitle, s.provider, s.hours, s.syncedAt, s.status, s.type);
  }

  // 7. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT OR REPLACE INTO notifications (
      id, title, body, time, type, unread, action_url, action_label, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const n of INITIAL_NOTIFICATIONS) {
    insertNotif.run(
      n.id,
      n.title,
      n.body,
      n.time,
      n.type,
      n.unread ? 1 : 0,
      n.actionUrl,
      n.actionLabel,
      n.priority ?? "Normal",
    );
  }

  // 8. Seed Settings
  db.prepare(`
    INSERT OR REPLACE INTO app_settings (
      id, ai_provider, gemini_api_key, openai_api_key, gemini_model, openai_model,
      default_question_count, default_difficulty, default_q_type, show_answer_instantly
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    DEFAULT_SETTINGS.aiProvider,
    DEFAULT_SETTINGS.geminiApiKey,
    DEFAULT_SETTINGS.openaiApiKey,
    DEFAULT_SETTINGS.geminiModel,
    DEFAULT_SETTINGS.openaiModel,
    DEFAULT_SETTINGS.defaultQuestionCount,
    DEFAULT_SETTINGS.defaultDifficulty,
    DEFAULT_SETTINGS.defaultQType,
    DEFAULT_SETTINGS.showAnswerInstantly ? 1 : 0,
  );
}

export interface DatabaseStats {
  connected: boolean;
  engine: string;
  dbPath: string;
  tables: {
    officers: number;
    competencies: number;
    courses: number;
    materials: number;
    quiz_results: number;
    badges: number;
    igot_sync_logs: number;
    notifications: number;
    app_settings: number;
  };
  lastQueriedAt: string;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const db = await getDb();
  if (!db) {
    return {
      connected: false,
      engine: "In-Memory Fallback",
      dbPath: "memory",
      tables: {
        officers: DEMO_OFFICERS.length,
        competencies: initialRadar.length,
        courses: INITIAL_LEARNING_COURSES.length,
        materials: PRELOADED_NOTES.length,
        quiz_results: 0,
        badges: INITIAL_BADGES.length,
        igot_sync_logs: INITIAL_SYNC_RECORDS.length,
        notifications: INITIAL_NOTIFICATIONS.length,
        app_settings: 1,
      },
      lastQueriedAt: new Date().toISOString(),
    };
  }

  const count = (table: string) =>
    Number(db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get()?.["c"] ?? 0);

  return {
    connected: true,
    engine: "SQLite 3 (node:sqlite • WAL Mode)",
    dbPath: dbFilePath,
    tables: {
      officers: count("officers"),
      competencies: count("competencies"),
      courses: count("courses"),
      materials: count("materials"),
      quiz_results: count("quiz_results"),
      badges: count("badges"),
      igot_sync_logs: count("igot_sync_logs"),
      notifications: count("notifications"),
      app_settings: count("app_settings"),
    },
    lastQueriedAt: new Date().toISOString(),
  };
}

export async function getBootstrapState() {
  const db = await getDb();
  const stats = await getDatabaseStats();
  if (!db) {
    return { stats, data: null };
  }

  // 1. Active Officer Profile & XP
  const activeOfficerRow =
    db.prepare("SELECT * FROM officers WHERE is_active = 1 LIMIT 1").get() ??
    db.prepare("SELECT * FROM officers LIMIT 1").get();

  const userProfile: OfficerProfile = activeOfficerRow
    ? {
        employeeId: String(activeOfficerRow["employee_id"]),
        name: String(activeOfficerRow["name"]),
        role: String(activeOfficerRow["role"]),
        cadre: String(activeOfficerRow["cadre"]),
        office: String(activeOfficerRow["office"]),
        initials: String(activeOfficerRow["initials"]),
        email: String(activeOfficerRow["email"]),
        batch: String(activeOfficerRow["batch"]),
      }
    : DEMO_OFFICERS[0]!;

  const officerXp = activeOfficerRow ? Number(activeOfficerRow["xp"] ?? 2860) : 2860;

  // 2. Competency Radar
  const compRows = db
    .prepare("SELECT area, score, benchmark FROM competencies ORDER BY id ASC")
    .all();
  const competencyRadar =
    compRows.length > 0
      ? compRows.map((r) => ({
          area: String(r["area"]),
          score: Number(r["score"]),
          benchmark: Number(r["benchmark"]),
        }))
      : initialRadar;

  // 3. Courses
  const courseRows = db.prepare("SELECT * FROM courses").all();
  const courses: EnrolledCourse[] = courseRows.map((r) => {
    const base: EnrolledCourse = {
      id: String(r["id"]),
      title: String(r["title"]),
      category: String(r["category"]),
      provider: String(r["provider"]),
      level: String(r["level"]) as EnrolledCourse["level"],
      duration: String(r["duration"]),
      progress: Number(r["progress"]),
      status: String(r["status"]) as EnrolledCourse["status"],
      lastAccessed: String(r["last_accessed"]),
      nextModule: String(r["next_module"]),
      credits: Number(r["credits"]),
      modules: JSON.parse(String(r["modules_json"] || "[]")),
    };
    if (r["certificate_id"]) base.certificateId = String(r["certificate_id"]);
    if (r["completed_at"]) base.completedAt = String(r["completed_at"]);
    return base;
  });

  // 4. Materials
  const matRows = db.prepare("SELECT * FROM materials ORDER BY rowid ASC").all();
  const materials: NoteDocument[] = matRows.map((r) => {
    const doc: NoteDocument = {
      id: String(r["id"]),
      name: String(r["name"]),
      type: String(r["type"]) as NoteDocument["type"],
      size: String(r["size"]),
      uploadedAt: String(r["uploaded_at"]),
      wordCount: Number(r["word_count"]),
      charCount: Number(r["char_count"]),
      detectedTopics: JSON.parse(String(r["detected_topics_json"] || "[]")),
      suggestedCompetencies: JSON.parse(String(r["suggested_competencies_json"] || "[]")),
      content: String(r["content"]),
    };
    if (r["summary"]) doc.summary = String(r["summary"]);
    return doc;
  });

  // 5. Quiz Results
  const quizRows = db.prepare("SELECT * FROM quiz_results ORDER BY rowid DESC").all();
  const quizResults: QuizResult[] = quizRows.map((r) => {
    let suggestedFollowUps: string[] = [];
    try {
      const parsed = JSON.parse(String(r["ai_feedback"] || "[]"));
      if (Array.isArray(parsed)) suggestedFollowUps = parsed;
    } catch {
      if (r["ai_feedback"]) suggestedFollowUps = [String(r["ai_feedback"])];
    }

    const res: QuizResult = {
      id: String(r["id"]),
      materialName: String(r["material_name"]),
      totalQuestions: Number(r["total_questions"]),
      correctAnswers: Number(r["correct_answers"]),
      percentage: Number(r["percentage"]),
      timeSpentSeconds: Number(r["time_spent_seconds"]),
      completedAt: String(r["completed_at"]),
      difficulty: String(r["difficulty"]),
      qType: String(r["q_type"]),
      competencyImpact: JSON.parse(String(r["competency_impact_json"] || "{}")),
      suggestedFollowUps,
      questions: JSON.parse(String(r["questions_json"] || "[]")),
      userAnswers: JSON.parse(String(r["user_answers_json"] || "{}")),
    };
    if (r["material_id"]) res.materialId = String(r["material_id"]);
    return res;
  });

  // 6. Badges
  const badgeRows = db.prepare("SELECT * FROM badges").all();
  const badges: OfficerBadge[] = badgeRows.map((r) => {
    const b: OfficerBadge = {
      id: String(r["id"]),
      title: String(r["title"]),
      description: String(r["description"]),
      category: String(r["category"]) as OfficerBadge["category"],
      iconName: String(r["icon_name"]),
      unlocked: Boolean(r["unlocked"]),
      progress: Number(r["progress"]),
    };
    if (r["unlocked_at"]) b.unlockedAt = String(r["unlocked_at"]);
    return b;
  });

  // 7. iGOT Sync Logs
  const syncRows = db.prepare("SELECT * FROM igot_sync_logs ORDER BY rowid ASC").all();
  const igotSync: IgotSyncRecord[] = syncRows.map((r) => ({
    id: String(r["id"]),
    courseTitle: String(r["course_title"]),
    provider: String(r["provider"]),
    hours: String(r["hours"]),
    syncedAt: String(r["synced_at"]),
    status: String(r["status"]) as IgotSyncRecord["status"],
    type: String(r["type"]) as IgotSyncRecord["type"],
  }));

  // 8. Notifications
  const notifRows = db.prepare("SELECT * FROM notifications ORDER BY rowid ASC").all();
  const notifications: NotificationItem[] = notifRows.map((r) => {
    const n: NotificationItem = {
      id: String(r["id"]),
      title: String(r["title"]),
      body: String(r["body"]),
      time: String(r["time"]),
      type: String(r["type"]) as NotificationItem["type"],
      unread: Boolean(r["unread"]),
      actionUrl: String(r["action_url"]),
      actionLabel: String(r["action_label"]),
    };
    if (r["priority"]) {
      n.priority = String(r["priority"]) as NonNullable<NotificationItem["priority"]>;
    }
    return n;
  });

  // 9. Settings
  const settingsRow = db.prepare("SELECT * FROM app_settings WHERE id = 1").get();
  const settings: AppSettings = settingsRow
    ? {
        aiProvider: String(settingsRow["ai_provider"]) as AppSettings["aiProvider"],
        geminiApiKey: String(settingsRow["gemini_api_key"]),
        openaiApiKey: String(settingsRow["openai_api_key"]),
        geminiModel: String(settingsRow["gemini_model"]),
        openaiModel: String(settingsRow["openai_model"]),
        defaultQuestionCount: Number(settingsRow["default_question_count"]),
        defaultDifficulty: String(
          settingsRow["default_difficulty"],
        ) as AppSettings["defaultDifficulty"],
        defaultQType: String(settingsRow["default_q_type"]) as AppSettings["defaultQType"],
        showAnswerInstantly: Boolean(settingsRow["show_answer_instantly"]),
      }
    : DEFAULT_SETTINGS;

  return {
    stats,
    data: {
      userProfile,
      officerXp,
      competencyRadar,
      courses,
      materials,
      quizResults,
      badges,
      igotSync,
      notifications,
      settings,
    },
  };
}

export async function syncStoreKeyToDb(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  if (!db) return;

  switch (key) {
    case "statlearn_user_profile_v1": {
      const p = value as OfficerProfile;
      if (!p || !p.employeeId) break;
      db.exec("UPDATE officers SET is_active = 0");
      const existing = db
        .prepare("SELECT xp, streak_days FROM officers WHERE employee_id = ?")
        .get(p.employeeId);
      const xp = existing ? Number(existing["xp"]) : 2860;
      const streak = existing ? Number(existing["streak_days"]) : 5;
      db.prepare(`
        INSERT OR REPLACE INTO officers (
          employee_id, name, role, cadre, office, initials, email, batch, xp, streak_days, is_active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(
        p.employeeId,
        p.name,
        p.role,
        p.cadre,
        p.office,
        p.initials,
        p.email || "officer@mospi.gov.in",
        p.batch || "ISS Cadre",
        xp,
        streak,
      );
      break;
    }

    case "statlearn_officer_xp_v1": {
      const xp = Number(value) || 2860;
      db.prepare(
        "UPDATE officers SET xp = ?, updated_at = CURRENT_TIMESTAMP WHERE is_active = 1",
      ).run(xp);
      break;
    }

    case "statlearn_competency_radar_v1": {
      const radar = value as Array<{ area: string; score: number; benchmark: number }>;
      if (!Array.isArray(radar)) break;
      const stmt = db.prepare(`
        INSERT INTO competencies (area, score, benchmark, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(area) DO UPDATE SET
          score = excluded.score,
          benchmark = excluded.benchmark,
          updated_at = CURRENT_TIMESTAMP
      `);
      for (const item of radar) {
        stmt.run(item.area, item.score, item.benchmark);
      }
      break;
    }

    case "statlearn_materials_v1": {
      const materials = value as NoteDocument[];
      if (!Array.isArray(materials)) break;
      db.exec("DELETE FROM materials");
      const insertMat = db.prepare(`
        INSERT INTO materials (
          id, name, type, size, uploaded_at, word_count, char_count,
          detected_topics_json, suggested_competencies_json, summary, content
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const m of materials) {
        insertMat.run(
          m.id,
          m.name,
          m.type,
          m.size,
          m.uploadedAt,
          m.wordCount,
          m.charCount,
          JSON.stringify(m.detectedTopics || []),
          JSON.stringify(m.suggestedCompetencies || []),
          m.summary ?? "",
          m.content,
        );
      }
      break;
    }

    case "statlearn_quiz_results_v1": {
      const results = value as QuizResult[];
      if (!Array.isArray(results)) break;
      db.exec("DELETE FROM quiz_results");
      const insertQuiz = db.prepare(`
        INSERT INTO quiz_results (
          id, material_id, material_name, total_questions, correct_answers,
          percentage, time_spent_seconds, completed_at, difficulty, q_type,
          competency_impact_json, ai_feedback, questions_json, user_answers_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of [...results].reverse()) {
        insertQuiz.run(
          r.id,
          r.materialId ?? null,
          r.materialName,
          r.totalQuestions,
          r.correctAnswers,
          r.percentage,
          r.timeSpentSeconds,
          r.completedAt,
          r.difficulty,
          r.qType,
          JSON.stringify(r.competencyImpact || {}),
          JSON.stringify(r.suggestedFollowUps || []),
          JSON.stringify(r.questions || []),
          JSON.stringify(r.userAnswers || {}),
        );
      }
      break;
    }

    case "statlearn_badges_v1": {
      const badges = value as OfficerBadge[];
      if (!Array.isArray(badges)) break;
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO badges (
          id, title, description, category, icon_name, unlocked, unlocked_at, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const b of badges) {
        stmt.run(
          b.id,
          b.title,
          b.description,
          b.category,
          b.iconName,
          b.unlocked ? 1 : 0,
          b.unlockedAt ?? null,
          b.progress,
        );
      }
      break;
    }

    case "statlearn_igot_sync_v1": {
      const records = value as IgotSyncRecord[];
      if (!Array.isArray(records)) break;
      db.exec("DELETE FROM igot_sync_logs");
      const stmt = db.prepare(`
        INSERT INTO igot_sync_logs (
          id, course_title, provider, hours, synced_at, status, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const s of [...records].reverse()) {
        stmt.run(s.id, s.courseTitle, s.provider, s.hours, s.syncedAt, s.status, s.type);
      }
      break;
    }

    case "statlearn_notifications_v1": {
      const notifications = value as NotificationItem[];
      if (!Array.isArray(notifications)) break;
      db.exec("DELETE FROM notifications");
      const stmt = db.prepare(`
        INSERT INTO notifications (
          id, title, body, time, type, unread, action_url, action_label, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const n of notifications) {
        stmt.run(
          n.id,
          n.title,
          n.body,
          n.time,
          n.type,
          n.unread ? 1 : 0,
          n.actionUrl,
          n.actionLabel,
          n.priority ?? "Normal",
        );
      }
      break;
    }

    case "statlearn_learning_courses_v1": {
      const courses = value as EnrolledCourse[];
      if (!Array.isArray(courses)) break;
      db.exec("DELETE FROM courses");
      const stmt = db.prepare(`
        INSERT INTO courses (
          id, title, category, provider, level, duration, progress, status,
          last_accessed, next_module, certificate_id, completed_at, credits, modules_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      for (const c of courses) {
        stmt.run(
          c.id,
          c.title,
          c.category,
          c.provider,
          c.level,
          c.duration,
          c.progress,
          c.status,
          c.lastAccessed,
          c.nextModule,
          c.certificateId ?? null,
          c.completedAt ?? null,
          c.credits,
          JSON.stringify(c.modules || []),
        );
      }
      break;
    }

    case "statlearn_settings_v1": {
      const s = value as AppSettings;
      if (!s) break;
      db.prepare(`
        INSERT OR REPLACE INTO app_settings (
          id, ai_provider, gemini_api_key, openai_api_key, gemini_model, openai_model,
          default_question_count, default_difficulty, default_q_type, show_answer_instantly, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        s.aiProvider,
        s.geminiApiKey,
        s.openaiApiKey,
        s.geminiModel,
        s.openaiModel,
        s.defaultQuestionCount,
        s.defaultDifficulty,
        s.defaultQType,
        s.showAnswerInstantly ? 1 : 0,
      );
      break;
    }
  }
}

export async function executeReadOnlyQuery(sqlQuery: string): Promise<{
  columns: string[];
  rows: SqlRow[];
  rowCount: number;
  executionMs: number;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("SQLite database is not available in this runtime.");
  }

  const trimmed = sqlQuery.trim();
  const normalized = trimmed.toUpperCase();
  if (!normalized.startsWith("SELECT") && !normalized.startsWith("PRAGMA")) {
    throw new Error("Only read-only SELECT or PRAGMA queries are permitted in the SQL Explorer.");
  }

  const start = performance.now();
  const rows = db.prepare(trimmed).all();
  const executionMs = Math.round((performance.now() - start) * 100) / 100;
  const firstRow = rows[0];
  const columns = firstRow ? Object.keys(firstRow) : [];

  return {
    columns,
    rows,
    rowCount: rows.length,
    executionMs,
  };
}

export async function resetSqliteDatabase(): Promise<DatabaseStats> {
  const db = await getDb();
  if (db) {
    db.exec(`
      DELETE FROM officers;
      DELETE FROM competencies;
      DELETE FROM courses;
      DELETE FROM materials;
      DELETE FROM quiz_results;
      DELETE FROM badges;
      DELETE FROM igot_sync_logs;
      DELETE FROM notifications;
      DELETE FROM app_settings;
    `);
    seedDatabase(db);
  }
  return getDatabaseStats();
}
