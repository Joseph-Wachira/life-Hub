"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateGoalAction } from "@/lib/actions/goals";
import type { ActionResult } from "@/lib/actions/auth";
import { GOAL_CATEGORY_META, GOAL_CATEGORY_ORDER } from "./constants";
import { ColorPicker } from "./color-picker";
import type { Goal, GoalCategory } from "@prisma/client";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function GoalEditForm({ goal }: { goal: Goal }) {
  const [category, setCategory] = useState<GoalCategory>(goal.category);
  const [color, setColor] = useState(goal.color);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(updateGoalAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      toast.success("Goal updated");
    } else if (state && "error" in state) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="goalId" value={goal.id} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" name="title" defaultValue={goal.title} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea id="edit-description" name="description" defaultValue={goal.description ?? ""} rows={3} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-category">Category</Label>
          <Select name="category" value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
            <SelectTrigger id="edit-category">
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
          <Label htmlFor="edit-target-date">Target date</Label>
          <Input
            id="edit-target-date"
            name="targetDate"
            type="date"
            defaultValue={toDateInputValue(goal.targetDate)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} name="color" />
      </div>
      <div>
        <SaveButton />
      </div>
    </form>
  );
}
