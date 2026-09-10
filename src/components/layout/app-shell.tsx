"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import type { Workspace } from "@prisma/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { NotificationsMenu } from "./notifications-menu";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { WorkspaceProvider } from "@/components/workspace/workspace-context";
import { MOBILE_NAV_ITEMS } from "@/lib/constants/nav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  workspace: Workspace;
  workspaces: Workspace[];
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function AppShell({ children, workspace, workspaces, user }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <WorkspaceProvider value={{ workspace, workspaces }}>
      <div className="flex min-h-screen bg-[var(--background)]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:flex">
          <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-1 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-[var(--brand-foreground)]">
              <Sparkles className="size-4" />
            </span>
            Life Hub
          </Link>
          <div className="mb-4">
            <WorkspaceSwitcher />
          </div>
          <SidebarNav />
          <div className="mt-4 border-t border-[var(--border)] pt-3">
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 backdrop-blur-sm lg:justify-end">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-4">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-[var(--brand-foreground)]">
                      <Sparkles className="size-4" />
                    </span>
                    Life Hub
                  </SheetTitle>
                </SheetHeader>
                <div className="my-4">
                  <WorkspaceSwitcher />
                </div>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
                <div className="mt-4 border-t border-[var(--border)] pt-3">
                  <UserMenu name={user.name} email={user.email} image={user.image} />
                </div>
              </SheetContent>
            </Sheet>

            <span className="flex-1 truncate text-sm font-medium lg:hidden">{workspace.name}</span>

            <NotificationsMenu />
          </header>

          <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm lg:hidden">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
                  active ? "text-[var(--brand)]" : "text-[var(--muted-foreground)]"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </WorkspaceProvider>
  );
}
