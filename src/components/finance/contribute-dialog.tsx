"use client";

import { useActionState, useEffect } from "react";
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
import { contributeSavingsGoalAction } from "@/lib/actions/finance";
import type { ActionResult } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add contribution"}
    </Button>
  );
}

export function ContributeDialog({
  open,
  onOpenChange,
  goalId,
  goalName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string | null;
  goalName?: string;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(contributeSavingsGoalAction, null);

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to {goalName ?? "savings goal"}</DialogTitle>
          <DialogDescription>Log a contribution toward this goal.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={goalId ?? ""} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contribute-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--subtle-foreground)]">$</span>
              <Input id="contribute-amount" name="amount" inputMode="decimal" placeholder="0.00" className="pl-6" required autoFocus />
            </div>
          </div>
          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
