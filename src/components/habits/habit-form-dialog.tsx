"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHabitAction, updateHabitAction } from "@/lib/actions/habits";
import type { ActionResult } from "@/lib/actions/auth";
import { DAY_LABELS, HABIT_COLOR_SWATCHES, HABIT_ICONS, HABIT_ICON_KEYS } from "./constants";
import { cn } from "@/lib/utils";

export interface HabitRecord {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetPerDay: number;
  daysOfWeekJson: string;
  reminderTime: string | null;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function HabitFormDialog({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: HabitRecord | null;
}) {
  const isEdit = Boolean(habit);
  const action = isEdit ? updateHabitAction : createHabitAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [icon, setIcon] = useState(habit?.icon ?? HABIT_ICON_KEYS[0]);
  const [color, setColor] = useState(habit?.color ?? HABIT_COLOR_SWATCHES[0]);
  const [days, setDays] = useState<number[]>(habit ? JSON.parse(habit.daysOfWeekJson) : [0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    if (open) {
      setIcon(habit?.icon ?? HABIT_ICON_KEYS[0]);
      setColor(habit?.color ?? HABIT_COLOR_SWATCHES[0]);
      setDays(habit ? JSON.parse(habit.daysOfWeekJson) : [0, 1, 2, 3, 4, 5, 6]);
    }
  }, [open, habit]);

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>Small, repeatable actions build the biggest streaks.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={habit!.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="habit-name">Name</Label>
            <Input id="habit-name" name="name" defaultValue={habit?.name ?? ""} placeholder="e.g. Drink water" required autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_ICON_KEYS.map((key) => {
                const Icon = HABIT_ICONS[key];
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setIcon(key)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-[var(--radius-md)] border transition-colors",
                      icon === key ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="icon" value={icon} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLOR_SWATCHES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn("size-7 rounded-full ring-offset-2 ring-offset-[var(--surface)] transition-shadow", color === c && "ring-2 ring-[var(--ring)]")}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <input type="hidden" name="color" value={color} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="habit-target">Times per day</Label>
              <Input id="habit-target" name="targetPerDay" type="number" min={1} max={20} defaultValue={habit?.targetPerDay ?? 1} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="habit-reminder">Reminder time</Label>
              <Input id="habit-reminder" name="reminderTime" type="time" defaultValue={habit?.reminderTime ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Repeats on</Label>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((label, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    days.includes(i) ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted-foreground)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {days.map((d) => (
              <input key={d} type="hidden" name="daysOfWeek" value={d} />
            ))}
          </div>

          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <SubmitButton label={isEdit ? "Save changes" : "Create habit"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
