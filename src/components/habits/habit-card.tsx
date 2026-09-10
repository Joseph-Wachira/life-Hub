"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Flame, MoreHorizontal, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { computeStreaks } from "@/lib/streaks";
import { cn } from "@/lib/utils";
import { archiveHabitAction, deleteHabitAction, toggleHabitTodayAction } from "@/lib/actions/habits";
import { HABIT_ICONS } from "./constants";
import { HabitFormDialog, type HabitRecord } from "./habit-form-dialog";

interface HabitLogLite {
  date: string | Date;
  completedCount: number;
}

export function HabitCard({ habit, logs }: { habit: HabitRecord; logs: HabitLogLite[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticLoggedToday, setOptimisticLoggedToday] = useState<boolean | null>(null);

  const daysOfWeek: number[] = JSON.parse(habit.daysOfWeekJson);
  const today = new Date();
  const todayKey = today.toDateString();

  const todayLog = logs.find((l) => new Date(l.date).toDateString() === todayKey);
  const loggedToday = optimisticLoggedToday ?? (todayLog ? todayLog.completedCount >= habit.targetPerDay : false);

  const { current } = useMemo(
    () => computeStreaks(logs.map((l) => new Date(l.date)), daysOfWeek, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs]
  );

  const last14 = useMemo(() => {
    const days: { date: Date; active: boolean; logged: boolean }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const active = daysOfWeek.includes(d.getDay());
      const logged = logs.some((l) => new Date(l.date).toDateString() === d.toDateString());
      days.push({ date: d, active, logged });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs]);

  const Icon = HABIT_ICONS[habit.icon] ?? Flame;

  function handleToggle() {
    setOptimisticLoggedToday(!loggedToday);
    startTransition(async () => {
      const result = await toggleHabitTodayAction(habit.id);
      if (result && "error" in result) toast.error(result.error);
      setOptimisticLoggedToday(null);
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveHabitAction(habit.id);
      if (result && "error" in result) toast.error(result.error);
      else toast.success("Habit archived");
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${habit.name}"? This removes all its history.`)) return;
    startTransition(async () => {
      const result = await deleteHabitAction(habit.id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            loggedToday ? "border-transparent text-white" : "border-[var(--border-strong)] text-[var(--muted-foreground)]"
          )}
          style={loggedToday ? { backgroundColor: habit.color } : undefined}
          aria-label={loggedToday ? "Mark not done" : "Mark done"}
        >
          {loggedToday ? <Check className="size-5" /> : <Icon className="size-5" />}
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{habit.name}</span>
          <span className="flex items-center gap-1 text-xs text-[var(--subtle-foreground)]">
            <Flame className="size-3" style={{ color: current > 0 ? habit.color : undefined }} />
            {current} day{current === 1 ? "" : "s"} streak
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Habit actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={handleArchive}>Archive</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1">
        {last14.map((day, i) => (
          <span
            key={i}
            title={day.date.toLocaleDateString()}
            className={cn("h-4 flex-1 rounded-sm", !day.active && "opacity-20")}
            style={{ backgroundColor: day.logged ? habit.color : "var(--surface-sunken)" }}
          />
        ))}
      </div>

      <HabitFormDialog open={editOpen} onOpenChange={setEditOpen} habit={habit} />
    </div>
  );
}
