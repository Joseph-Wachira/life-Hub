"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGoalAction } from "@/lib/actions/goals";
import type { ActionResult } from "@/lib/actions/auth";
import { GOAL_CATEGORY_META, GOAL_CATEGORY_ORDER } from "./constants";
import { ColorPicker } from "./color-picker";
import type { GoalCategory } from "@prisma/client";

const DEFAULT_COLOR = "#6366f1";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create goal"}
    </Button>
  );
}

export function NewGoalDialog({ triggerLabel = "New goal" }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<GoalCategory>("PERSONAL");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createGoalAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      setOpen(false);
      setCategory("PERSONAL");
      setColor(DEFAULT_COLOR);
    }
  }, [state]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
            <DialogDescription>
              Set something you&apos;re working toward — you can add milestones after creating it.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-title">Title</Label>
              <Input id="goal-title" name="title" placeholder="e.g. Run a half marathon" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-description">Description</Label>
              <Textarea id="goal-description" name="description" placeholder="Optional details" rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="goal-category">Category</Label>
                <Select name="category" value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
                  <SelectTrigger id="goal-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORY_ORDER.map((c) => (
                      <SelectItem key={c} value={c}>
                        {GOAL_CATEGORY_META[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="goal-target-date">Target date</Label>
                <Input id="goal-target-date" name="targetDate" type="date" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Color</Label>
              <ColorPicker value={color} onChange={setColor} name="color" />
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
    </>
  );
}
