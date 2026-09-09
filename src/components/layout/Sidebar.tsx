import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  Radar,
  Sparkles,
  FileQuestion,
  FolderOpen,
  BarChart3,
  Landmark,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/learning", label: "My Learning", icon: BookOpen },
  { to: "/competencies", label: "Competency Analysis", icon: Radar },
  { to: "/recommendations", label: "AI Training Recommendations", icon: Sparkles },
  { to: "/quiz-generator", label: "AI Quiz Generator", icon: FileQuestion },
  { to: "/learning-materials", label: "Learning Materials", icon: FolderOpen },
  { to: "/analytics", label: "Progress & Analytics", icon: BarChart3 },
  { to: "/igot", label: "iGOT Karmayogi", icon: Landmark },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

export function SidebarContent({ collapsed, onToggle, onNavigate }: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col bg-gradient-navy text-sidebar-foreground">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-brand">
          <ShieldCheck className="size-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold tracking-tight">
              StatLearn AI
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">
              Statistical Capacity Building
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
            Workspace
          </p>
        )}
        {navItems.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                collapsed && "justify-center px-2",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-cyan)]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active && "text-cyan")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-3 rounded-lg bg-sidebar-accent/60 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-cyan opacity-70" />
              </span>
              <p className="text-xs font-medium">AI Assistant Active</p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/60">
              Competency models synced with MoSPI framework v3.2
            </p>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
