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

function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { clearHistory, results } = useQuizResultsStore();
  const { resetMaterials, materials } = useMaterialsStore();
  const { userProfile, updateProfile, resetProfile } = useUserStore();
  const { resetLearning, courses } = useLearningStore();
  const { resetNotifications } = useNotificationsStore();

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
    updateSettings({
      geminiApiKey: geminiKey.trim(),
      openaiApiKey: openaiKey.trim(),
    });
    toast.success("AI API configuration saved successfully.");
  }

  // Test Gemini API connection
  async function testGemini() {
    if (!geminiKey.trim()) {
      toast.error("Please enter a Google Gemini API key first.");
      return;
    }
    setTestingConnection(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel}:generateContent?key=${geminiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Return valid JSON: {"status": "ok"}' }] }],
          }),
        },
      );
      if (res.ok) {
        toast.success("Gemini API connection test passed!");
      } else {
        await res.text();
        toast.error(`Gemini API error (${res.status}): Key may be invalid.`);
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

        {/* Right Column: Local Data & Reset */}
        <div className="space-y-6">
          <SectionCard
            title="Local Storage & Privacy"
            description="All notes and keys remain on your device"
          >
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Shield className="size-4 text-success" />
                Data Privacy Guarantee
              </div>
              <p>
                Uploaded documents, custom study notes, and generated question sets are processed in
                your browser and stored in your local storage. No document data is sent to third
                parties unless you explicitly provide an external LLM API key.
              </p>
              <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Saved Documents:</span>
                  <strong className="text-foreground">{materials.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Completed Quizzes:</span>
                  <strong className="text-foreground">{results.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Enrolled Courses:</span>
                  <strong className="text-foreground">{courses.length}</strong>
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
                    toast.success("Assessment history cleared.");
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
                    toast.success("Materials restored.");
                  }
                }}
              >
                <RotateCcw className="size-3.5 text-muted-foreground" />
                Restore Official Notes
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset all settings, materials, courses, notifications, and quiz data to factory defaults?",
                    )
                  ) {
                    resetSettings();
                    clearHistory();
                    resetMaterials();
                    resetLearning();
                    resetNotifications();
                    resetProfile();
                    toast.success("All workspace data reset to factory defaults.");
                  }
                }}
              >
                <AlertCircle className="size-3.5" />
                Reset Everything
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
