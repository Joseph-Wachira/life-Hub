"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const FINANCE_TABS = [
  { href: "/finance", label: "Overview" },
  { href: "/finance/transactions", label: "Transactions" },
  { href: "/finance/budgets", label: "Budgets" },
  { href: "/finance/bills", label: "Bills" },
  { href: "/finance/savings", label: "Savings" },
  { href: "/finance/categories", label: "Categories" },
] as const;

export function FinanceSubnav() {
  const pathname = usePathname();

  return (
    <nav className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-[var(--border)] px-4 sm:px-6 lg:px-8">
      {FINANCE_TABS.map((tab) => {
        const active = tab.href === "/finance" ? pathname === "/finance" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
              active ? "text-[var(--brand)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--brand)]" />}
          </Link>
        );
      })}
    </nav>
  );
}
