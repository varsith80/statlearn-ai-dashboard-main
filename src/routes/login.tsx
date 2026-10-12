import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Landmark,
  Sparkles,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_OFFICERS, OfficerProfile, useUserStore } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Officer Sign In | StatLearn AI — MoSPI Statistical Capacity Portal" },
      {
        name: "description",
        content:
          "Official authentication gateway for Indian Statistical Service (ISS) and MoSPI officers via Jan Parichay & iGOT Karmayogi SSO.",
      },
      { property: "og:title", content: "Officer Sign In | StatLearn AI" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { userProfile, updateProfile } = useUserStore();

  const [authMode, setAuthMode] = useState<"credentials" | "sso">("credentials");
  const [employeeId, setEmployeeId] = useState(userProfile.employeeId);
  const [email, setEmail] = useState(userProfile.email);
  const [password, setPassword] = useState("MoSPI@2026#ISS");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("849201");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim() || !password.trim()) {
      toast.error("Please enter your MoSPI Employee ID and password.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const matched = DEMO_OFFICERS.find(
        (o) =>
          o.employeeId.toLowerCase() === employeeId.trim().toLowerCase() ||
          o.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (matched) {
        updateProfile(matched);
      } else {
        updateProfile({
          employeeId: employeeId.trim(),
          email: email.trim() || "officer@mospi.gov.in",
        });
      }
      setIsSubmitting(false);
      toast.success(`Authenticated via MoSPI Directory. Welcome, ${matched?.name || userProfile.name}!`);
      navigate({ to: "/" });
    }, 500);
  };

  const handleQuickOfficerLogin = (officer: OfficerProfile) => {
    updateProfile(officer);
    toast.success(`Signed in as ${officer.name} (${officer.role})`);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background">
      {/* Left Hero Panel: MoSPI & StatLearn AI Branding */}
      <div className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between overflow-hidden bg-gradient-navy p-10 text-sidebar-foreground">
        <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-cyan/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 size-96 rounded-full bg-violet/15 blur-3xl" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand shadow-md">
              <ShieldCheck className="size-5 text-white" />
            </div>
            <div>
              <p className="font-display text-base font-bold tracking-tight text-white">
                StatLearn AI
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                Ministry of Statistics & Programme Implementation (MoSPI)
              </p>
            </div>
          </div>
          <span className="rounded-full border border-sidebar-border bg-sidebar-accent/70 px-3 py-1 text-xs font-semibold text-cyan">
            NQAF Framework v3.2
          </span>
        </div>

        {/* Center Value Proposition */}
        <div className="relative z-10 my-auto max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/60 px-3.5 py-1.5 text-xs font-medium text-sidebar-foreground">
            <Sparkles className="size-3.5 text-cyan" />
            <span>AI-Powered Statistical Capacity Building Platform</span>
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            Competency Intelligence & Adaptive Assessment for Official Statistics
          </h1>

          <p className="text-sm leading-relaxed text-sidebar-foreground/80">
            Designed for the Indian Statistical Service (ISS) and National Statistical Office (NSO)
            to benchmark domain proficiency, synthesize assessments from official guidelines, and
            synchronize verified training credits with iGOT Karmayogi.
          </p>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {[
              {
                title: "6 Core Statistical Domains",
                desc: "Calibrated against MoSPI & UN-NQAF role benchmarks",
              },
              {
                title: "AI Assessment Studio",
                desc: "Instant MCQ synthesis from NSS & CPI reference notes",
              },
              {
                title: "iGOT Karmayogi Ledger",
                desc: "Bi-directional xAPI / SCORM credit synchronization",
              },
              {
                title: "Vision 2027 Forecasting",
                desc: "Predictive survey readiness & cadre succession modeling",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CheckCircle2 className="size-4 text-cyan shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="mt-1 text-[11px] text-sidebar-foreground/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Compliance Note */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-sidebar-border pt-6 text-xs text-sidebar-foreground/60">
          <span>National Statistical Systems Training Academy (NSSTA)</span>
          <span>Secured via NIC Parichay / GovNet SSO</span>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:col-span-6 xl:col-span-5">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-lg bg-gradient-brand">
                <ShieldCheck className="size-5 text-white" />
              </div>
              <div>
                <p className="font-display text-sm font-bold">StatLearn AI</p>
                <p className="text-[11px] text-muted-foreground">MoSPI Capacity Building</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/">Back to Dashboard</Link>
            </Button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Officer Authentication Gateway
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
              Sign in to your workspace
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Authenticate using your MoSPI Employee ID, Jan Parichay SSO, or select a demo ISS
              officer profile below.
            </p>
          </div>

          {/* Auth Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setAuthMode("credentials")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                authMode === "credentials"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <KeyRound className="size-3.5" /> Employee Credentials
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("sso")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                authMode === "sso"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Landmark className="size-3.5" /> Jan Parichay / iGOT SSO
            </button>
          </div>

          {authMode === "credentials" ? (
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  MoSPI Employee / Cadre ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. MoSPI/ISS/20418"
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Official Gov.in Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mospi.gov.in"
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 pr-9 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 bg-gradient-brand text-white py-5 text-sm font-semibold shadow-md"
              >
                <Lock className="size-4" />
                {isSubmitting ? "Verifying Credentials…" : "Sign In to StatLearn AI"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Landmark className="size-4 text-primary" />
                  NIC Jan Parichay & iGOT Karmayogi Single Sign-On
                </p>
                <p className="mt-1 text-muted-foreground">
                  Your GovNet session token is pre-verified for biometric / OTP two-factor
                  authentication.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  GovNet Token / Parichay ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  6-Digit Sandes / Mobile OTP
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono tracking-widest focus:border-primary focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 bg-gradient-brand text-white py-5 text-sm font-semibold shadow-md"
              >
                <ShieldCheck className="size-4" />
                {isSubmitting ? "Connecting GovNet…" : "Verify OTP & Launch Workspace"}
              </Button>
            </form>
          )}

          {/* Quick Demo Officer Switcher */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Demo Officer Switcher (1-Click Sign In)
              </span>
              <UserCheck className="size-4 text-primary" />
            </div>

            <div className="space-y-2">
              {DEMO_OFFICERS.map((officer) => {
                const isCurrent = officer.employeeId === userProfile.employeeId;
                return (
                  <button
                    key={officer.employeeId}
                    type="button"
                    onClick={() => handleQuickOfficerLogin(officer)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all",
                      isCurrent
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white">
                        {officer.initials}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold text-foreground">
                            {officer.name}
                          </p>
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                            {officer.batch}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {officer.role} · {officer.office}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-primary ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
