import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Settings as SettingsIcon,
  Cpu,
  KeyRound,
  Sliders,
  Database,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Terminal,
  Play,
  RefreshCw,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  useSettingsStore,
  useQuizResultsStore,
  useMaterialsStore,
  useUserStore,
  useLearningStore,
  useNotificationsStore,
  useDatabaseStatus,
  AppSettings,
} from "@/lib/quiz-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | StatLearn AI" },
      {
        name: "description",
        content: "Configure AI providers, API keys, assessment preferences, and data management.",
      },
      { property: "og:title", content: "Settings | StatLearn AI" },
    ],
  }),
  component: SettingsPage,
});

const PRESET_SQL_QUERIES = [
  {
    label: "Officers",
    sql: "SELECT employee_id, name, role, batch, xp, is_active FROM officers;",
  },
  {
    label: "Competencies",
    sql: "SELECT area, score, benchmark, (benchmark - score) AS gap FROM competencies;",
  },
  {
    label: "Courses",
    sql: "SELECT id, title, category, progress, status, credits FROM courses;",
  },
  {
    label: "Study Notes",
    sql: "SELECT id, name, type, size, word_count, uploaded_at FROM materials;",
  },
  {
    label: "Quiz Results",
    sql: "SELECT id, material_name, percentage, difficulty, completed_at FROM quiz_results;",
  },
];

function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { clearHistory, results } = useQuizResultsStore();
  const { resetMaterials, materials } = useMaterialsStore();
  const { userProfile, updateProfile, resetProfile } = useUserStore();
  const { resetLearning, courses } = useLearningStore();
  const { resetNotifications } = useNotificationsStore();
  const {
    stats: dbStats,
    loading: dbLoading,
    refreshStats,
    runSqlQuery,
    resetSqliteDb,
  } = useDatabaseStatus();

  const [sqlInput, setSqlInput] = useState(
    PRESET_SQL_QUERIES[0]?.sql ?? "SELECT * FROM officers;",
  );
  const [sqlResult, setSqlResult] = useState<{
    columns: string[];
    rows: Array<Record<string, unknown>>;
    rowCount: number;
    executionMs: number;
  } | null>(null);
  const [sqlRunning, setSqlRunning] = useState(false);

  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileRole, setProfileRole] = useState(userProfile.role);
  const [profileCadre, setProfileCadre] = useState(userProfile.cadre);
  const [profileOffice, setProfileOffice] = useState(userProfile.office);
  const [profileId, setProfileId] = useState(userProfile.employeeId);

  async function handleExecuteSql(customSql?: string) {
    const queryToRun = customSql ?? sqlInput;
    if (customSql) setSqlInput(customSql);
    setSqlRunning(true);
    try {
      const res = await runSqlQuery(queryToRun);
      setSqlResult(res);
      toast.success(`Executed SQL query (${res.rowCount} rows in ${res.executionMs}ms)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSqlRunning(false);
    }
  }

  function handleSaveProfile() {
    if (!profileName.trim()) {
      toast.error("Officer name cannot be empty.");
      return;
    }
    updateProfile({
      name: profileName.trim(),
      role: profileRole.trim(),
      cadre: profileCadre.trim(),
      office: profileOffice.trim(),
      employeeId: profileId.trim(),
    });
    toast.success("Officer profile and cadre details updated.");
  }

  // Save API keys
  function handleSaveKeys() {
    const cleanGemini = geminiKey.trim();
    const cleanOpenai = openaiKey.trim();
    const nextProvider =
      settings.aiProvider === "builtin"
        ? cleanGemini
          ? "gemini"
          : cleanOpenai
            ? "openai"
            : "builtin"
        : settings.aiProvider;

    updateSettings({
      geminiApiKey: cleanGemini,
      openaiApiKey: cleanOpenai,
      aiProvider: nextProvider,
    });
    toast.success(`AI credentials saved (Active engine: ${nextProvider.toUpperCase()}).`);
  }

  // Test Gemini API connection across modern Gemini Flash models
  async function testGemini() {
    const cleanKey = geminiKey.trim();
    if (!cleanKey) {
      toast.error("Please enter a Google Gemini API key first.");
      return;
    }
    setTestingConnection(true);
    try {
      const candidateModels = Array.from(
        new Set([
          settings.geminiModel || "gemini-2.5-flash",
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-flash",
        ]),
      );

      let workingModel: string | null = null;
      let lastStatus = 0;

      for (const model of candidateModels) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Return valid JSON: {"status": "ok"}' }] }],
            }),
          },
        );
        lastStatus = res.status;
        if (res.ok) {
          workingModel = model;
          break;
        }
      }

      if (workingModel) {
        updateSettings({
          geminiApiKey: cleanKey,
          geminiModel: workingModel,
          aiProvider: "gemini",
        });
        toast.success(`Gemini API connected (${workingModel}) and saved as active AI engine!`);
      } else {
        toast.error(`Gemini API error (${lastStatus}): Please check that your API key is valid.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Connection failed: ${msg}`);
    } finally {
      setTestingConnection(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Officer Profile & Application Settings"
        subtitle="Manage your MoSPI officer profile, AI question generation providers, API credentials, assessment defaults, and local data."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Officer Profile, AI Engine & Defaults */}
        <div className="lg:col-span-2 space-y-6">
          {/* Officer Profile Section */}
          <SectionCard
            title="MoSPI Officer Profile & Cadre Identification"
            description="Used across competency dossiers, iGOT Karmayogi passbooks, and NSSTA certificates"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Officer Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Service Cadre</label>
                <input
                  type="text"
                  value={profileCadre}
                  onChange={(e) => setProfileCadre(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Employee / Cadre ID
                </label>
                <input
                  type="text"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Division / Office
                </label>
                <input
                  type="text"
                  value={profileOffice}
                  onChange={(e) => setProfileOffice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={handleSaveProfile} className="gap-1.5 text-xs">
                Save Officer Profile
              </Button>
            </div>
          </SectionCard>

          {/* AI Provider Section */}
          <SectionCard
            title="AI Engine Configuration"
            description="Choose between the built-in zero-config semantic NLP engine or external LLMs"
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    id: "builtin" as const,
                    title: "Built-in Semantic NLP",
                    badge: "Recommended",
                    desc: "Runs instantly in-browser. Zero setup, works offline, extracts concepts & builds pedagogical distractors.",
                  },
                  {
                    id: "gemini" as const,
                    title: "Google Gemini API",
                    badge: "External LLM",
                    desc: "Powered by Gemini 2.0 / 1.5 Flash. Requires a Google AI API key.",
                  },
                  {
                    id: "openai" as const,
                    title: "OpenAI API",
                    badge: "External LLM",
                    desc: "Powered by GPT-4o-mini / GPT-3.5. Requires an OpenAI API key.",
                  },
                ].map((item) => {
                  const isSelected = settings.aiProvider === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSettings({ aiProvider: item.id });
                        toast.success(`Active AI provider set to ${item.title}`);
                      }}
                      className={cn(
                        "flex flex-col justify-between rounded-xl border p-4 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-primary">{item.badge}</span>
                          {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                        </div>
                        <h4 className="mt-2 font-display font-semibold text-sm">{item.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* API Key Inputs */}
              <div className="mt-6 rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <KeyRound className="size-4 text-primary" />
                  API Credentials (Stored Locally & Securely)
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span>Google Gemini API Key</span>
                      <span className="text-[11px] text-muted-foreground">
                        Used when Gemini is selected
                      </span>
                    </label>
                    <div className="relative mt-1 flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showGeminiKey ? "text" : "password"}
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey((s) => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showGeminiKey ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testGemini}
                        disabled={testingConnection}
                        className="text-xs"
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span>OpenAI API Key</span>
                      <span className="text-[11px] text-muted-foreground">
                        Used when OpenAI is selected
                      </span>
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showOpenaiKey ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenaiKey((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showOpenaiKey ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button size="sm" onClick={handleSaveKeys} className="gap-1.5 text-xs">
                      Save API Credentials
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Assessment Defaults */}
          <SectionCard
            title="Assessment Defaults"
            description="Default settings applied when initiating a new quiz session"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Default Number of Questions
                </label>
                <select
                  value={settings.defaultQuestionCount}
                  onChange={(e) => updateSettings({ defaultQuestionCount: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                >
                  {[5, 10, 15, 20, 25].map((n) => (
                    <option key={n} value={n}>
                      {n} Questions
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Default Difficulty
                </label>
                <select
                  value={settings.defaultDifficulty}
                  onChange={(e) =>
                    updateSettings({
                      defaultDifficulty: e.target.value as AppSettings["defaultDifficulty"],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                >
                  {["Easy", "Medium", "Hard", "Adaptive"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Default Format
                </label>
                <select
                  value={settings.defaultQType}
                  onChange={(e) =>
                    updateSettings({
                      defaultQType: e.target.value as AppSettings["defaultQType"],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                >
                  {["MCQ", "Conceptual", "True or False", "Scenario", "Mixed"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-xs font-semibold">Instant Feedback</p>
                  <p className="text-[11px] text-muted-foreground">
                    Show explanation immediately upon choice
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showAnswerInstantly}
                  onChange={(e) => updateSettings({ showAnswerInstantly: e.target.checked })}
                  className="size-4 rounded border-border accent-primary"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column: SQLite Database Telemetry & Reset */}
        <div className="space-y-6">
          <SectionCard
            title="SQLite Relational Database"
            description="Live backend persistence (database/statlearn.db)"
            actions={
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-[11px]"
                onClick={() => void refreshStats()}
                disabled={dbLoading}
              >
                <RefreshCw className={cn("size-3", dbLoading && "animate-spin")} />
                Refresh
              </Button>
            }
          >
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Database className="size-4 text-emerald-500" />
                  <span>{dbStats?.connected ? "Connected to SQLite 3" : "Connecting..."}</span>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  WAL Mode
                </span>
              </div>
              <p className="text-[11px]">
                All officer profiles, competency scores, enrolled courses, study notes, and quiz
                attempts are automatically persisted in real relational SQL tables inside{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
                  database/statlearn.db
                </code>
                .
              </p>
              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>officers (table):</span>
                  <strong className="font-mono text-foreground">
                    {dbStats?.tables.officers ?? 3} rows
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>competencies (table):</span>
                  <strong className="font-mono text-foreground">
                    {dbStats?.tables.competencies ?? 6} rows
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>courses (table):</span>
                  <strong className="font-mono text-foreground">
                    {dbStats?.tables.courses ?? courses.length} rows
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>materials (table):</span>
                  <strong className="font-mono text-foreground">
                    {dbStats?.tables.materials ?? materials.length} rows
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>quiz_results (table):</span>
                  <strong className="font-mono text-foreground">
                    {dbStats?.tables.quiz_results ?? results.length} rows
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>badges &amp; igot_sync_logs:</span>
                  <strong className="font-mono text-foreground">
                    {(dbStats?.tables.badges ?? 6) + (dbStats?.tables.igot_sync_logs ?? 3)} rows
                  </strong>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Data Management" description="Reset history or restore defaults">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => {
                  if (
                    window.confirm("Clear all quiz completion history and reset competency scores?")
                  ) {
                    clearHistory();
                    toast.success("Assessment history cleared in SQLite database.");
                  }
                }}
              >
                <Database className="size-3.5 text-muted-foreground" />
                Clear Quiz History
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => {
                  if (window.confirm("Restore official sample notes library?")) {
                    resetMaterials();
                    toast.success("Materials restored in SQLite database.");
                  }
                }}
              >
                <RotateCcw className="size-3.5 text-muted-foreground" />
                Restore Official Notes
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start gap-2 text-xs"
                onClick={async () => {
                  if (
                    window.confirm(
                      "Reset all SQLite database tables, settings, materials, courses, notifications, and quiz data to factory defaults?",
                    )
                  ) {
                    try {
                      await resetSqliteDb();
                    } catch {
                      resetSettings();
                      clearHistory();
                      resetMaterials();
                      resetLearning();
                      resetNotifications();
                      resetProfile();
                    }
                    toast.success("SQLite database and workspace reset to factory defaults.");
                  }
                }}
              >
                <AlertCircle className="size-3.5" />
                Reset Everything (Re-seed SQLite DB)
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Interactive SQL Query Explorer */}
      <div className="mt-6">
        <SectionCard
          title="Live SQLite Query Console (Backend API: POST /api/sql)"
          description="Execute real-time SQL SELECT queries directly against database/statlearn.db"
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_SQL_QUERIES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => void handleExecuteSql(preset.sql)}
                  className="rounded-md border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-primary/10 hover:border-primary/40"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Terminal className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleExecuteSql();
                  }}
                  placeholder="SELECT * FROM officers;"
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 font-mono text-xs outline-none focus:border-primary"
                />
              </div>
              <Button
                onClick={() => void handleExecuteSql()}
                disabled={sqlRunning}
                className="gap-1.5"
              >
                <Play className="size-3.5" />
                {sqlRunning ? "Running SQL..." : "Run SQL Query"}
              </Button>
            </div>

            {sqlResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Returned <strong>{sqlResult.rowCount}</strong> row(s) from{" "}
                    <code>database/statlearn.db</code>
                  </span>
                  <span>Execution time: {sqlResult.executionMs} ms</span>
                </div>
                <div className="max-h-72 overflow-auto rounded-lg border border-border">
                  {sqlResult.rows.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Query executed successfully (0 rows returned).
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-muted/60 font-mono text-[11px] text-muted-foreground">
                        <tr>
                          {sqlResult.columns.map((col) => (
                            <th key={col} className="px-3 py-2 font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono text-[11px]">
                        {sqlResult.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            {sqlResult.columns.map((col) => {
                              const val = row[col];
                              const display =
                                val === null || val === undefined
                                  ? "NULL"
                                  : typeof val === "object"
                                    ? JSON.stringify(val)
                                    : String(val);
                              return (
                                <td
                                  key={col}
                                  className="max-w-xs truncate px-3 py-2 text-foreground"
                                  title={display}
                                >
                                  {display}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
