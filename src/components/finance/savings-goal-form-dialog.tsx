"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { format } from "date-fns";
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
import { createSavingsGoalAction, updateSavingsGoalAction } from "@/lib/actions/finance";
import type { ActionResult } from "@/lib/actions/auth";

const SWATCHES = ["#22c55e", "#06b6d4", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"];

export interface SavingsGoalRecord {
  id: string;
  name: string;
  targetAmountCents: number;
  targetDate: string | Date | null;
  color: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function SavingsGoalFormDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: SavingsGoalRecord | null;
}) {
  const isEdit = Boolean(goal);
  const action = isEdit ? updateSavingsGoalAction : createSavingsGoalAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  const defaultTarget = goal ? (goal.targetAmountCents / 100).toFixed(2) : "";
  const defaultDate = goal?.targetDate ? format(new Date(goal.targetDate), "yyyy-MM-dd") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit savings goal" : "New savings goal"}</DialogTitle>
          <DialogDescription>Set something to save toward — an emergency fund, a trip, anything.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={goal!.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sg-name">Name</Label>
            <Input id="sg-name" name="name" defaultValue={goal?.name ?? ""} placeholder="e.g. Emergency fund" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sg-target">Target amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--subtle-foreground)]">$</span>
                <Input id="sg-target" name="targetAmount" inputMode="decimal" defaultValue={defaultTarget} placeholder="0.00" className="pl-6" required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sg-date">Target date</Label>
              <Input id="sg-date" name="targetDate" type="date" defaultValue={defaultDate} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((c) => (
                <label key={c}>
                  <input type="radio" name="color" value={c} defaultChecked={goal ? goal.color === c : c === SWATCHES[0]} className="peer sr-only" />
                  <span
                    className="block size-7 cursor-pointer rounded-full ring-offset-2 ring-offset-[var(--surface)] transition-shadow peer-checked:ring-2 peer-checked:ring-[var(--ring)]"
                    style={{ backgroundColor: c }}
                  />
                </label>
              ))}
            </div>
          </div>
          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <SubmitButton label={isEdit ? "Save changes" : "Create goal"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
