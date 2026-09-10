"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SETTINGS_NAV_ITEM } from "@/lib/constants/nav";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--brand-muted)] text-[var(--brand)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-2">
        <Link
          href={SETTINGS_NAV_ITEM.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(SETTINGS_NAV_ITEM.href)
              ? "bg-[var(--brand-muted)] text-[var(--brand)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]"
          )}
        >
          <SETTINGS_NAV_ITEM.icon className="size-4 shrink-0" />
          {SETTINGS_NAV_ITEM.label}
        </Link>
      </div>
    </nav>
  );
}
