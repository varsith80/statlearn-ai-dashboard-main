import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  FileQuestion,
  Landmark,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Award,
  ArrowRight,
  MailOpen,
  Mail,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { StatusPill } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { NotificationItem, useNotificationsStore } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications & Alerts | StatLearn AI" },
      {
        name: "description",
        content:
          "Real-time alerts for AI competency assessments, personalized NSSTA course recommendations, and iGOT Karmayogi credit synchronization.",
      },
      { property: "og:title", content: "Notifications & Alerts | StatLearn AI" },
    ],
  }),
  component: NotificationsPage,
});

const FILTER_TABS = [
  { id: "all", label: "All Alerts" },
  { id: "unread", label: "Unread Only" },
  { id: "assessment", label: "Assessments & Quizzes" },
  { id: "recommendation", label: "Courses & Pathways" },
  { id: "igot", label: "iGOT & Governance" },
] as const;

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    toggleRead,
    markAllAsRead,
    dismissNotification,
    addNotification,
    resetNotifications,
  } = useNotificationsStore();

  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]["id"]>("all");
  const [search, setSearch] = useState("");

  const filtered = notifications.filter((n) => {
    const matchesSearch =
      !search.trim() ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "unread") return n.unread;
    if (activeTab === "assessment") return n.type === "assessment" || n.type === "quiz";
    if (activeTab === "recommendation")
      return n.type === "recommendation" || n.type === "milestone";
    if (activeTab === "igot") return n.type === "igot" || n.type === "system";
    return true;
  });

  const getIconForType = (type: NotificationItem["type"]) => {
    switch (type) {
      case "recommendation":
        return Sparkles;
      case "quiz":
        return FileQuestion;
      case "assessment":
        return TrendingUp;
      case "igot":
        return Landmark;
      case "milestone":
        return Award;
      default:
        return BellRing;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alert Center · MoSPI Cadre Communications"
        title="Notifications & System Advisories"
        subtitle="Stay updated on AI competency evaluations, newly assigned NSSTA training modules, and iGOT Karmayogi credit sync events."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                addNotification({
                  title: "AI Competency Diagnostic Refreshed",
                  body: "Live synchronization with MoSPI Framework v3.2 completed. 2 priority skill gaps highlighted for Q4 DPC review.",
                  type: "assessment",
                  actionUrl: "/competencies",
                  actionLabel: "View Competency Matrix",
                  priority: "High",
                });
                toast.success("Dispatched live competency advisory alert.");
              }}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="size-3.5 text-violet" /> Simulate Live Alert
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetNotifications();
                toast.success("Restored default notifications.");
              }}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>
            <Button
              size="sm"
              disabled={unreadCount === 0}
              onClick={() => {
                markAllAsRead();
                toast.success("Marked all notifications as read.");
              }}
              className="gap-1.5 text-xs"
            >
              <CheckCheck className="size-3.5" /> Mark All Read ({unreadCount})
            </Button>
          </div>
        }
      />

      {/* Summary KPI Bar */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Unread Advisories",
            value: unreadCount,
            sub: unreadCount > 0 ? "Action recommended" : "All caught up",
            icon: BellRing,
          },
          {
            label: "Total Notifications",
            value: notifications.length,
            sub: "Active in inbox",
            icon: Bell,
          },
          {
            label: "Assessment Alerts",
            value: notifications.filter((n) => n.type === "assessment" || n.type === "quiz").length,
            sub: "Quiz & radar updates",
            icon: FileQuestion,
          },
          {
            label: "iGOT & Course Syncs",
            value: notifications.filter((n) => n.type === "igot" || n.type === "recommendation")
              .length,
            sub: "GovNet & NSSTA updates",
            icon: Landmark,
          },
        ].map((stat) => (
          <div key={stat.label} className="card-surface flex items-center gap-3.5 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <stat.icon className="size-5" />
            </span>
            <div>
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs font-medium text-foreground/80">{stat.label}</p>
              <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={activeTab === t.id ? "default" : "outline"}
              onClick={() => setActiveTab(t.id)}
              className="h-8 text-xs"
            >
              {t.label}
              {t.id === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[10px]">
                  {unreadCount}
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter notifications..."
            className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Notifications Feed */}
      <SectionCard
        title="Notification Feed"
        description={`Showing ${filtered.length} of ${notifications.length} advisories`}
      >
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto mb-2.5 size-9 text-success" />
            <p className="text-sm font-semibold text-foreground">No notifications match this view</p>
            <p className="mt-1 text-xs">
              Try switching tabs or click "Reset" to restore the default feed.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((n) => {
              const Icon = getIconForType(n.type);
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex flex-col justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center",
                    n.unread
                      ? "border-primary/35 bg-primary/5 shadow-xs"
                      : "border-border bg-card hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <span
                      className={cn(
                        "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                        n.unread
                          ? "bg-gradient-brand text-white shadow-xs"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                        {n.unread && <StatusPill tone="info">New</StatusPill>}
                        {n.priority === "Critical" && (
                          <StatusPill tone="critical">Mandatory</StatusPill>
                        )}
                        <span className="text-[11px] text-muted-foreground">· {n.time}</span>
                      </div>

                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      asChild
                      size="sm"
                      variant={n.unread ? "default" : "outline"}
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => markAsRead(n.id)}
                    >
                      <Link to={n.actionUrl}>
                        {n.actionLabel}
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toggleRead(n.id);
                        toast.success(n.unread ? "Marked as read." : "Marked as unread.");
                      }}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      title={n.unread ? "Mark as read" : "Mark as unread"}
                    >
                      {n.unread ? <MailOpen className="size-3.5" /> : <Mail className="size-3.5" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        dismissNotification(n.id);
                        toast.success("Notification dismissed.");
                      }}
                      className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                      title="Dismiss notification"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
