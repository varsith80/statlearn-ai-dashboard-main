import { Link } from "@tanstack/react-router";
import { Bell, HelpCircle, Menu, Search, ChevronDown, LogOut, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { notifications, user } from "@/data/mock";

export function Navbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onOpenMobileNav}
        className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </button>

      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search courses, skills, learning materials..."
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold">Notifications</p>
              <span className="text-xs text-muted-foreground">{unread} unread</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
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
                </div>
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
        >
          <HelpCircle className="size-[18px]" />
        </Link>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-primary-foreground">
                {user.initials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-medium leading-tight">{user.name}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">
                  {user.role}
                </span>
              </span>
              <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user.cadre}</p>
              <p className="text-xs font-normal text-muted-foreground">{user.office}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <User className="size-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="size-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login">
                <LogOut className="size-4" /> Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
