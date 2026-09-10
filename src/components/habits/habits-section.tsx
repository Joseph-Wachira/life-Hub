"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HabitCard } from "./habit-card";
import { HabitFormDialog, type HabitRecord } from "./habit-form-dialog";

interface HabitLogLite {
  habitId: string;
  date: string | Date;
  completedCount: number;
}

export function HabitsSection({ habits, logs }: { habits: HabitRecord[]; logs: HabitLogLite[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Habits</h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No habits yet"
          description="Add a habit — drink water, meditate, read — and start building your streak."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New habit
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} logs={logs.filter((l) => l.habitId === habit.id)} />
          ))}
        </div>
      )}

      <HabitFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
