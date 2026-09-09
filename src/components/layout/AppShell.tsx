import { useState, type ReactNode } from "react";
import { SidebarContent } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]",
        )}
      >
        <Navbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">{children}</div>
        </main>
        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground lg:px-8">
          StatLearn AI · Ministry of Statistics and Programme Implementation · Demo environment with
          simulated data
        </footer>
      </div>
    </div>
  );
}
