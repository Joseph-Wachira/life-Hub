"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CalendarClock, CheckCheck, Wallet, Flame, Target, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { listNotificationsAction, markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@prisma/client";

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  EVENT_REMINDER: CalendarClock,
  TASK_DUE: CheckCheck,
  BILL_DUE: Wallet,
  HABIT_REMINDER: Flame,
  GOAL_MILESTONE: Target,
  SYSTEM: Info,
};

export function NotificationsMenu() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotificationsAction(),
    refetchInterval: 60_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  async function handleRead(id: string) {
    await markNotificationReadAction(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function handleReadAll() {
    await markAllNotificationsReadAction();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-[var(--danger)]" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={handleReadAll}
              className="text-xs font-medium text-[var(--brand)] hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <BellOff className="size-5 text-[var(--subtle-foreground)]" />
            <p className="text-xs text-[var(--muted-foreground)]">You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type];
              return (
                <DropdownMenuItem
                  key={n.id}
                  onSelect={() => !n.isRead && handleRead(n.id)}
                  className={cn("items-start gap-2.5 py-2", !n.isRead && "bg-[var(--brand-muted)]/40")}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-[var(--brand)]" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{n.title}</span>
                    {n.body && (
                      <span className="line-clamp-2 text-xs text-[var(--muted-foreground)]">{n.body}</span>
                    )}
                    <span className="text-xs text-[var(--subtle-foreground)]">
                      {formatDateTime(n.scheduledFor)}
                    </span>
                  </span>
                  {!n.isRead && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--brand)]" />}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
