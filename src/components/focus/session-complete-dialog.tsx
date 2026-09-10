"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { logFocusSessionAction } from "@/lib/actions/focus";
import type { ActionResult } from "@/lib/actions/auth";
import type { FocusSessionTypeValue } from "@/lib/services/focus";
import { cn, pluralize } from "@/lib/utils";

export interface PendingFocusSession {
  type: FocusSessionTypeValue;
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: string; // ISO
  endedAt: string; // ISO
  taskId?: string;
  taskTitle?: string;
  interruptions: number;
  completedFully: boolean;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save session"}
    </Button>
  );
}

function SessionCompleteForm({
  pending,
  onSaved,
}: {
  pending: PendingFocusSession;
  onSaved: () => void;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(logFocusSessionAction, null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (state && "success" in state) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="type" value={pending.type} />
      <input type="hidden" name="plannedMinutes" value={pending.plannedMinutes} />
      <input type="hidden" name="actualMinutes" value={pending.actualMinutes} />
      <input type="hidden" name="startedAt" value={pending.startedAt} />
      <input type="hidden" name="endedAt" value={pending.endedAt} />
      <input type="hidden" name="taskId" value={pending.taskId ?? ""} />
      <input type="hidden" name="interruptions" value={pending.interruptions} />

      <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
        <Badge variant={pending.completedFully ? "success" : "secondary"}>
          {pending.completedFully ? "Completed" : "Stopped early"}
        </Badge>
        <span>{pending.actualMinutes} min focused</span>
        {pending.taskTitle && <span>· {pending.taskTitle}</span>}
        {pending.interruptions > 0 && (
          <span>
            · {pending.interruptions} {pluralize(pending.interruptions, "interruption")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>How focused did that feel?</Label>
        <input type="hidden" name="rating" value={rating || ""} />
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Session rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating((r) => (r === n ? 0 : n))}
              className="rounded-[var(--radius-sm)] p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Star
                className={cn(
                  "size-6",
                  n <= rating
                    ? "fill-[var(--warning)] text-[var(--warning)]"
                    : "text-[var(--border-strong)]"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="session-notes">Notes (optional)</Label>
        <Textarea
          id="session-notes"
          name="notes"
          placeholder="What did you get done?"
          maxLength={2000}
          rows={3}
        />
      </div>

      {state && "error" in state && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <DialogFooter>
        <SaveButton />
      </DialogFooter>
    </form>
  );
}

export function SessionCompleteDialog({
  pending,
  onSaved,
}: {
  pending: PendingFocusSession | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={pending != null} onOpenChange={() => {}}>
      <DialogContent
        hideClose
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Session complete</DialogTitle>
          <DialogDescription>
            Add an optional note and rating before it&apos;s saved to your history.
          </DialogDescription>
        </DialogHeader>
        {pending && (
          <SessionCompleteForm
            key={`${pending.startedAt}-${pending.endedAt}`}
            pending={pending}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
