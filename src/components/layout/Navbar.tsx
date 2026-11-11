import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  HelpCircle,
  Menu,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Sparkles,
  BookOpen,
  FolderOpen,
  Radar,
  CheckCheck,
  X,
  Database,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  stageDocumentForQuiz,
  useDatabaseStatus,
  useLearningStore,
  useMaterialsStore,
  useNotificationsStore,
  useQuizResultsStore,
  useUserStore,
} from "@/lib/quiz-store";
import { navItems } from "./Sidebar";
import { toast } from "sonner";

export function Navbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const navigate = useNavigate();
  const { userProfile } = useUserStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore();
  const { courses } = useLearningStore();
  const { materials } = useMaterialsStore();
  const { competencyRadar } = useQuizResultsStore();
  const { stats: dbStats } = useDatabaseStatus();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matchedPages = q
    ? navItems.filter((item) => item.label.toLowerCase().includes(q))
    : [];
  const matchedCourses = q
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q),
      )
    : [];
  const matchedMaterials = q
    ? materials.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.detectedTopics.some((t) => t.toLowerCase().includes(q)),
      )
    : [];
  const matchedDomains = q
    ? competencyRadar.filter((d) => d.area.toLowerCase().includes(q))
    : [];

  const totalResults =
    matchedPages.length +
    matchedCourses.length +
    matchedMaterials.length +
    matchedDomains.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onOpenMobileNav}
        className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </button>

      {/* Interactive Global Search */}
      <div ref={searchContainerRef} className="relative min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onFocus={() => setSearchOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          placeholder="Search courses, skills, learning materials, pages..."
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSearchOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}

        {searchOpen && q.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-50 max-h-96 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl">
            {totalResults === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No matches found for "{query}". Try searching for "NSS", "NQAF", "Sampling", or
                "Quiz".
              </div>
            ) : (
              <div className="space-y-3">
                {matchedPages.length > 0 && (
                  <div>
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Workspace Pages
                    </p>
                    {matchedPages.map((p) => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.to}
                          onClick={() => {
                            setSearchOpen(false);
                            setQuery("");
                            navigate({ to: p.to });
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted"
                        >
                          <Icon className="size-4 text-primary" />
                          <span className="font-medium text-foreground">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {matchedCourses.length > 0 && (
                  <div>
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Training Courses
                    </p>
                    {matchedCourses.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                          navigate({ to: "/learning" });
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="size-3.5 shrink-0 text-cyan" />
                          <span className="truncate font-medium text-foreground">{c.title}</span>
                        </div>
                        <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                          {c.status} ({c.progress}%)
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedMaterials.length > 0 && (
                  <div>
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Study Notes & Reference Materials
                    </p>
                    {matchedMaterials.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-muted"
                      >
                        <button
                          onClick={() => {
                            setSearchOpen(false);
                            setQuery("");
                            navigate({ to: "/learning-materials" });
                          }}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left"
                        >
                          <FolderOpen className="size-3.5 shrink-0 text-primary" />
                          <span className="truncate font-medium text-foreground">{m.name}</span>
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 px-2 text-[10px] text-primary"
                          onClick={() => {
                            stageDocumentForQuiz(m);
                            setSearchOpen(false);
                            setQuery("");
                            navigate({ to: "/quiz-generator" });
                          }}
                        >
                          <Sparkles className="size-3 text-violet" /> Quiz
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {matchedDomains.length > 0 && (
                  <div>
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Competency Domains
                    </p>
                    {matchedDomains.map((d) => (
                      <button
                        key={d.area}
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                          navigate({ to: "/competencies" });
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Radar className="size-3.5 text-violet" />
                          <span className="font-medium text-foreground">{d.area}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-primary">
                          {d.score}% / {d.benchmark}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Link
          to="/settings"
          title="View Backend SQLite Database & SQL Console"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-400 mr-1"
        >
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="size-3" />
          <span>{dbStats?.connected ? "SQLite DB • Active" : "SQLite DB • Syncing"}</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold">Notifications</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      markAllAsRead();
                      toast.success("All notifications marked as read.");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <CheckCheck className="size-3" /> Read all
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 5).map((n) => (
                <Link
                  key={n.id}
                  to={n.actionUrl}
                  onClick={() => markAsRead(n.id)}
                  className="flex gap-3 border-b border-border/60 px-3 py-3 last:border-0 hover:bg-muted/60"
                >
                  <span
                    className={
                      "mt-1.5 size-1.5 shrink-0 rounded-full " +
                      (n.unread ? "bg-primary" : "bg-border")
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">{n.time}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-2">
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link to="/notifications">View all notifications</Link>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          to="/settings"
          className="hidden size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:grid"
          aria-label="Help and support"
          title="Settings & AI Configuration"
        >
          <HelpCircle className="size-[18px]" />
        </Link>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-primary-foreground">
                {userProfile.initials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-medium leading-tight">{userProfile.name}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">
                  {userProfile.role}
                </span>
              </span>
              <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{userProfile.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{userProfile.cadre}</p>
              <p className="text-xs font-normal text-muted-foreground">{userProfile.office}</p>
              <p className="mt-0.5 font-mono text-[10px] font-normal text-primary">
                ID: {userProfile.employeeId}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <User className="size-4" /> Officer Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="size-4" /> AI & App Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login">
                <LogOut className="size-4" /> Switch Officer / Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
