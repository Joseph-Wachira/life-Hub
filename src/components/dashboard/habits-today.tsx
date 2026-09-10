"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { toggleHabitTodayAction } from "@/lib/actions/habits";
import { HABIT_ICONS } from "@/components/habits/constants";
import { cn } from "@/lib/utils";

export interface DashboardHabit {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetPerDay: number;
  doneToday: boolean;
}

export function HabitsToday({ habits }: { habits: DashboardHabit[] }) {
  const [state, setState] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  function handleToggle(habit: DashboardHabit) {
    const current = state[habit.id] ?? habit.doneToday;
    setState((prev) => ({ ...prev, [habit.id]: !current }));
    startTransition(async () => {
      const result = await toggleHabitTodayAction(habit.id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {habits.map((habit) => {
        const done = state[habit.id] ?? habit.doneToday;
        const Icon = HABIT_ICONS[habit.icon] ?? Check;
        return (
          <button
            key={habit.id}
            onClick={() => handleToggle(habit)}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-sunken)]"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                done ? "border-transparent text-white" : "border-[var(--border-strong)] text-[var(--muted-foreground)]"
              )}
              style={done ? { backgroundColor: habit.color } : undefined}
            >
              {done ? <Check className="size-4" /> : <Icon className="size-4" />}
            </span>
            <span className={cn("flex-1 text-sm", done && "text-[var(--subtle-foreground)] line-through")}>{habit.name}</span>
          </button>
        );
      })}
    </div>
  );
}
